import { initBotId } from "botid/client/core";

// Vercel BotID. Keep paths and checkLevel in sync with lib/bot-protection.ts.
initBotId({
  protect: [
    { path: "/api/chat", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/api/generate-title", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/api/events", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/api/feedback", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/api/leads", method: "POST", advancedOptions: { checkLevel: "basic" } },
  ],
});
