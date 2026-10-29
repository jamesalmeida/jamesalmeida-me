# Changelog

What changes for visitors to jamesalmeida.me. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Jev (TypeSafe) screens each message before the reply model runs, when `TYPESAFE_API_KEY` is set: spam, jailbreaks, and abuse are blocked without calling the chat model, and a typed intent can nudge a booking or email card. A fit score is stored with the chat and with a lead.
- `/admin` shows the block, its reason, the fit score, and the intent on Insights, recent chats, transcripts, and leads. Flagged chats also show the visitor IP.

### Changed

- A request for the assistant's own secrets — API keys, credentials, passwords, tokens, the system prompt, or environment variables — is treated as a jailbreak, or as abuse when the visitor wants to take or use them, even when Jev's hazard score stays under the block line.
- A blocked turn ends the chat: the composer locks and later messages are refused without calling Jev or the reply model.
- The privacy policy now names the secret requests, says a blocked chat ends, and says the IP address of a blocked chat is stored with it for review. Ordinary chats still store no IP address and no user agent.
