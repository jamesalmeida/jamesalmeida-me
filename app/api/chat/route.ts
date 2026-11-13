import { convertToModelMessages, stepCountIs, streamText, type SystemModelMessage, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import { resolveAdminModel } from "@/lib/admin-cookie";
import { rejectBots } from "@/lib/bot-protection";
import { parseId, parseVisitContext } from "@/lib/analytics";
import { blockedChatResponse } from "@/lib/blocked-chat";
import { chatTools } from "@/lib/chat-tools";
import { parseClientIp } from "@/lib/client-ip";
import { jobCardPromptNote, type JobCard } from "@/lib/job-card";
import { updateJobCard } from "@/lib/job-card.server";
import {
  BLOCKED_REPLY,
  closedMessageId,
  intentNudge,
  offerFromReply,
  screenForStore,
  threadIsClosed,
  type OfferHistory,
} from "@/lib/jev-decision";
import { completedTurn, hasReply, stoppedTurn, type TurnResult } from "@/lib/turn-result";
import { scoreConversationQuality, screenVisitorTurn } from "@/lib/jev.server";
import { getModelOption, MODEL_COOKIE_NAME } from "@/lib/models";
import { createModel } from "@/lib/models.server";
import {
  chatGlobalLimiter,
  chatIpLimiter,
  checkRateLimits,
  getClientIp,
  rateLimitedResponse,
} from "@/lib/rate-limit";
import { payloadTooLargeResponse, readBodyWithLimit } from "@/lib/request-body";
import { sanitizeMessages } from "@/lib/sanitize-messages";
import { isStoreConfigured, storeApi, storeMutationQuietly, storeQuery } from "@/lib/store.server";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200 * 1024;

export async function POST(req: Request) {
  const clientIp = getClientIp(req.headers);
  const limit = checkRateLimits([
    [chatIpLimiter, clientIp],
    [chatGlobalLimiter, "global"],
  ]);
  if (!limit.ok) return rateLimitedResponse(limit.retryAfterSeconds);

  const botResponse = await rejectBots();
  if (botResponse) return botResponse;

  const bodyResult = await readBodyWithLimit(req, MAX_BODY_BYTES);
  if (!bodyResult.ok) return payloadTooLargeResponse();

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const fields = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const messages = sanitizeMessages(fields.messages);
  if (messages.length === 0 || !messages.some((message) => message.role === "user")) {
    return Response.json({ error: "A user message is required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const modelId = resolveAdminModel(cookieStore.get(MODEL_COOKIE_NAME)?.value);

  // Jev screens the turn before the reply model. No key skips it. A chat that was
  // already blocked stays closed, and does not call Jev or the reply model again.
  const conversationId = parseId(fields.conversationId);
  const transcriptClosed = threadIsClosed(messages);
  const stored = await readChatState(transcriptClosed ? undefined : conversationId);
  const chatClosed = transcriptClosed || stored.blocked;
  const decision = chatClosed ? null : await screenVisitorTurn(messages, stored);
  const refusing = chatClosed || decision?.action === "block";
  const screen = screenForStore(decision, {
    chatClosed,
    clientIp: refusing ? parseClientIp(clientIp) : undefined,
  });
  const userText = messageText(messages[messages.length - 1]);
  let userRecorded = false;
  // Called once, whichever comes first: the first finished step (so a card's offer
  // can be recorded while it is on screen) or the end of the response.
  const recordUserOnce = () => {
    if (!conversationId || userRecorded) return Promise.resolve();
    userRecorded = true;
    return storeMutationQuietly(storeApi.chats.recordUserMessage, {
      conversationId,
      visitId: parseId(fields.visitId),
      context: parseVisitContext(fields.context),
      model: modelId,
      text: userText,
      ...(screen ? { screen } : {}),
    });
  };

  if (refusing) {
    // Write the block before the response, so a follow-up turn already sees it.
    if (conversationId) {
      await recordUserOnce();
      await storeMutationQuietly(storeApi.chats.recordReply, {
        conversationId,
        text: BLOCKED_REPLY,
        tools: [],
      });
    }
    return blockedChatResponse(BLOCKED_REPLY, closedMessageId());
  }

  const model = createModel(modelId);
  const modelOption = getModelOption(modelId);

  // The system prompt is static, so let Anthropic cache it. OpenAI caches
  // long prefixes automatically and ignores this. The job card and a Jev nudge
  // are separate system messages, so the cached prefix stays stable.
  const system: SystemModelMessage = {
    role: "system",
    content: getSystemPrompt(),
    ...(modelOption.provider === "Anthropic"
      ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }
      : {}),
  };
  const nudgeKind = decision?.nudge;
  const nudge = nudgeKind === "book" || nudgeKind === "email" ? intentNudge(nudgeKind) : null;
  const cardNote = jobCardPromptNote(stored.jobCard);
  const turnNotes = [cardNote, nudge].flatMap((content) => (content ? [{ role: "system" as const, content }] : []));

  // Steps that finished before the visitor pressed Stop. `result.steps` rejects
  // when the run is aborted, so these are the only record of what was shown.
  let abortedSteps: Parameters<typeof stoppedTurn>[0] | undefined;

  const result = streamText({
    model,
    messages: [system, ...turnNotes, ...convertToModelMessages(messages)],
    tools: chatTools,
    stopWhen: stepCountIs(3),
    maxOutputTokens: 800,
    // Stop actually stops the model. Without this it ran to the end, and the route
    // stored a reply and an offer the visitor never saw.
    abortSignal: req.signal,
    onAbort: ({ steps }) => {
      abortedSteps = steps;
    },
    // A card is visible as soon as its step finishes. Record the offer then, so the
    // visitor's answer has an offer to land on before the reply ends.
    onStepFinish: async (step) => {
      if (!conversationId) return;
      await recordUserOnce();
      const offer = offerFromReply(step.toolCalls, decision);
      if (!offer) return;
      await storeMutationQuietly(storeApi.chats.recordOffer, { conversationId, offer });
    },
    // Only the first step is forced, so the model can still write the reply after the card.
    ...(decision?.forceTool
      ? {
          prepareStep: ({ stepNumber }: { stepNumber: number }) =>
            stepNumber === 0 ? { toolChoice: "required" as const } : { toolChoice: "auto" as const },
        }
      : {}),
  });

  // The transcript (kept 90 days, see convex/), stored after the response so the
  // reply never waits on it. conversationId is the id of the chat's first message.
  if (conversationId) {
    after(async () => {
      await recordUserOnce();
      let turn: TurnResult;
      try {
        turn = completedTurn(await result.steps, decision);
      } catch {
        turn = req.signal.aborted
          ? stoppedTurn(abortedSteps ?? [], decision)
          : { kind: "failed" };
      }
      await recordTurn(turn, messages, stored.jobCard, conversationId);
    });
  }

  return result.toUIMessageStreamResponse();
}

// One place decides what a turn writes. A failed turn stores only the visitor's
// message (recorded above). A stopped turn stores the steps that finished, including
// a card that really was shown, but is not scored or used to update the job card.
async function recordTurn(
  turn: TurnResult,
  messages: readonly UIMessage[],
  previousJobCard: JobCard | null,
  conversationId: string,
) {
  if (turn.kind === "refused" || turn.kind === "failed") return;
  if (!hasReply(turn)) return;
  await storeMutationQuietly(storeApi.chats.recordReply, {
    conversationId,
    text: turn.text,
    tools: turn.tools,
  });
  if (turn.kind !== "completed") return;
  // After the reply is stored, side by side because they share maxDuration.
  // Neither runs on the request path.
  await Promise.all([
    storeQuality(messages, { text: turn.text, tools: turn.tools }, conversationId),
    storeJobCard(messages, { text: turn.text }, previousJobCard, conversationId),
  ]);
}

type ChatState = { blocked: boolean; jobCard: JobCard | null; offers: OfferHistory | null };

// One read before the reply. Without it the chat works as it would with no storage.
async function readChatState(conversationId: string | undefined): Promise<ChatState> {
  const nothing: ChatState = { blocked: false, jobCard: null, offers: null };
  if (!conversationId) return nothing;
  try {
    const state = await storeQuery<Partial<ChatState>>(storeApi.chats.blockState, { conversationId });
    if (!state) return nothing;
    return { blocked: state.blocked === true, jobCard: state.jobCard ?? null, offers: state.offers ?? null };
  } catch {
    // The transcript check still closes an honest client. Don't echo the visitor's text.
    console.error("Could not read whether this chat was already blocked.");
    return nothing;
  }
}

async function storeJobCard(
  messages: readonly UIMessage[],
  reply: { text: string },
  previous: JobCard | null,
  conversationId: string,
) {
  if (!isStoreConfigured()) return;
  const changes = await updateJobCard(messages, reply, previous);
  if (changes) await storeMutationQuietly(storeApi.chats.recordJobCard, { conversationId, changes });
}

async function storeQuality(
  messages: readonly UIMessage[],
  reply: { text: string; tools: string[] },
  conversationId: string,
) {
  try {
    const decision = await scoreConversationQuality(messages, reply);
    if (!decision) return;
    await storeMutationQuietly(storeApi.chats.recordQuality, {
      conversationId,
      sentiment: decision.sentiment,
      wentBadly: decision.wentBadly,
      reason: decision.reason,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    console.error("Jev quality score failed; this chat was not scored.", name);
  }
}

function messageText(message: UIMessage | undefined): string {
  return (message?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n");
}
