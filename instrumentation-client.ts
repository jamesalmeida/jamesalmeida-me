import { initBotId } from "botid/client/core";

// Vercel BotID. Keep paths and checkLevel in sync with lib/bot-protection.ts.
initBotId({
  protect: [
    { path: "/api/chat", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/api/generate-title", method: "POST", advancedOptions: { checkLevel: "basic" } },
  ],
});
