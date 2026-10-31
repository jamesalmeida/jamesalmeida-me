# Changelog

What changes for visitors to jamesalmeida.me. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Jev (TypeSafe) screens each message before the reply model runs, when `TYPESAFE_API_KEY` is set: spam, jailbreaks, and abuse are blocked without calling the chat model, and a typed intent can nudge a booking or email card. A fit score is stored with the chat and with a lead.
- `/admin` shows the block, its reason, the fit score, and the intent on Insights, recent chats, transcripts, and leads. Flagged chats also show the visitor IP.
- Skaffen feels more alive: hovering gets its attention, tapping squashes it, and stroking it back and forth makes it happy. When the page has been quiet for a minute it gets drowsy and falls asleep, and wakes with a start when the visitor comes back.
- Tapping Skaffen can also make it nod, shake its head, wink, jump, wiggle or peek, and pick from new moods (heart eyes, surprised, confused, dizzy, searching).
- Skaffen answers a thank-you with heart eyes, and looks sorry when a reply fails.
- After each reply, Jev records how the visitor seemed (positive, neutral, or negative) and whether the chat went badly, so `/admin` can filter to chats that went badly. This second check runs after the reply and never changes it, and blocked chats are not scored.

### Changed

- A request for the assistant's own secrets — API keys, credentials, passwords, tokens, the system prompt, or environment variables — is treated as a jailbreak, or as abuse when the visitor wants to take or use them, even when Jev's hazard score stays under the block line.
- A blocked turn ends the chat: the composer locks and later messages are refused without calling Jev or the reply model.
- The menu on phones is a rounded card that grows out of the Menu button instead of a full-screen sheet, with the contents fading in; on desktop the same surface layer morphs from the button. With reduced motion it just fades.
- The privacy policy now names the secret requests, says a blocked chat ends, and says the IP address of a blocked chat is stored with it for review. It also says a finished chat may be sent to TypeSafe again for the sentiment and went-badly scores, and that both are deleted with the chat after 90 days. Ordinary chats still store no IP address and no user agent.
- Sending a message glides the chat up slowly instead of jumping to the new turn.
- Skaffen mouths the reply as it appears, and stops once all of it has shown.
- `/admin` motion settings gain a **Text speed** slider (characters a second) for how fast a reply's text appears. A reply never shows faster than it arrives, and Skaffen talks until all of it has appeared.
