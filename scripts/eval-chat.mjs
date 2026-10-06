#!/usr/bin/env node
/**
 * Sequential chat eval. No npm dependencies.
 * Usage: EVAL_BASE_URL=http://localhost:3000 EVAL_COOKIE='...' npm run eval
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const casesPath = join(here, "eval-cases.json");
const resultsPath = join(here, "eval-results.json");

const baseUrl = (process.env.EVAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const cookie = process.env.EVAL_COOKIE || "";
const only = new Set(
  (process.env.EVAL_ONLY || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

const ALLOWED_DOLLARS = new Set([500, 1000, 1500, 2000, 2500, 5000]);
const TIMEOUT_MS = 60_000;

const BANNED_EMAIL = ["you", "can", "always", "reach"].join("");
const BANNED_PHONE_PREFIX = String(400 + 8);

const GLOBAL_CHECKS = [
  { label: "old email", re: new RegExp(BANNED_EMAIL, "i") },
  { label: "old phone", re: new RegExp(BANNED_PHONE_PREFIX) },
  { label: "call length", re: /\b(20|30|60)[- ]?min/i },
  { label: "code fence", re: /```/ },
  { label: "PROVISIONAL", re: /PROVISIONAL/ },
];

function dollarAmounts(text) {
  const amounts = [];
  const re = /\$\s*(\d+(?:\.\d+)?)\s*k\b|\$\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/gi;
  for (const match of text.matchAll(re)) {
    if (match[1] != null) {
      amounts.push(Math.round(Number.parseFloat(match[1]) * 1000));
    } else {
      amounts.push(Math.round(Number.parseFloat(match[2].replace(/,/g, ""))));
    }
  }
  return amounts;
}

function parseSse(body) {
  let text = "";
  const tools = new Set();
  const toolNamesById = new Map();

  for (const line of body.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      continue;
    }
    if (!event || typeof event !== "object") continue;
    if (event.type === "text-delta" && typeof event.delta === "string") {
      text += event.delta;
    }
    if (typeof event.toolName === "string" && event.toolName) {
      tools.add(event.toolName);
      if (typeof event.toolCallId === "string") {
        toolNamesById.set(event.toolCallId, event.toolName);
      }
    }
    if (
      (event.type === "tool-output-available" || event.type === "tool-output-error") &&
      typeof event.toolCallId === "string" &&
      toolNamesById.has(event.toolCallId)
    ) {
      tools.add(toolNamesById.get(event.toolCallId));
    }
  }

  return { text, tools: [...tools] };
}

async function runCase(testCase) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;

  let status = 0;
  let raw = "";
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: testCase.messages }),
      signal: controller.signal,
    });
    status = response.status;
    raw = await response.text();
  } catch (error) {
    clearTimeout(timer);
    const reason = error?.name === "AbortError" ? "timeout after 60s" : String(error);
    return { id: testCase.id, pass: false, reasons: [reason], status, text: "", tools: [] };
  }
  clearTimeout(timer);

  const reasons = [];
  const expected = testCase.expectStatus ?? 200;
  if (status !== expected) {
    reasons.push(`status ${status}, expected ${expected}`);
  }

  const parsed = status === 200 ? parseSse(raw) : { text: raw, tools: [] };
  const skipText = testCase.expectStatus != null && testCase.expectStatus !== 200;

  if (!skipText && status === 200) {
    for (const check of GLOBAL_CHECKS) {
      if (check.re.test(parsed.text)) reasons.push(`global matched ${check.label}`);
    }

    for (const pattern of testCase.mustMatch ?? []) {
      if (!new RegExp(pattern, "i").test(parsed.text)) {
        reasons.push(`mustMatch failed /${pattern}/`);
      }
    }

    if (Array.isArray(testCase.mustMatchAny) && testCase.mustMatchAny.length > 0) {
      const hit = testCase.mustMatchAny.some((pattern) =>
        new RegExp(pattern, "i").test(parsed.text),
      );
      if (!hit) reasons.push(`mustMatchAny failed [${testCase.mustMatchAny.join(" | ")}]`);
    }

    for (const pattern of testCase.mustNotMatch ?? []) {
      if (new RegExp(pattern, "i").test(parsed.text)) {
        reasons.push(`mustNotMatch hit /${pattern}/`);
      }
    }

    if (testCase.mustCallTool && !parsed.tools.includes(testCase.mustCallTool)) {
      reasons.push(`mustCallTool ${testCase.mustCallTool} (saw ${parsed.tools.join(", ") || "none"})`);
    }

    if (testCase.mustNotCallTool && parsed.tools.includes(testCase.mustNotCallTool)) {
      reasons.push(`mustNotCallTool ${testCase.mustNotCallTool}`);
    }

    if (testCase.allowedDollarAmountsOnly === true) {
      const bad = dollarAmounts(parsed.text).filter((amount) => !ALLOWED_DOLLARS.has(amount));
      if (bad.length > 0) reasons.push(`disallowed $ amounts: ${bad.join(", ")}`);
    }
  }

  return {
    id: testCase.id,
    pass: reasons.length === 0,
    reasons,
    status,
    text: parsed.text,
    tools: parsed.tools,
  };
}

const allCases = JSON.parse(readFileSync(casesPath, "utf8"));
const cases = only.size > 0 ? allCases.filter((item) => only.has(item.id)) : allCases;

if (cases.length === 0) {
  console.error("No eval cases to run.");
  process.exit(1);
}

const results = [];
for (const testCase of cases) {
  process.stderr.write(`running ${testCase.id}...\n`);
  const result = await runCase(testCase);
  results.push(result);
  const mark = result.pass ? "PASS" : "FAIL";
  console.log(`${result.id}\t${mark}\t${result.reasons.join("; ") || "ok"}`);
  console.log("---");
  console.log(result.text || "(no text)");
  console.log("");
}

writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);

const failed = results.filter((result) => !result.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) process.exit(1);
