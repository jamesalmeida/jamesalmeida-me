# Changelog

What changes for visitors to jamesalmeida.me. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Skaffen now works out the job a visitor is trying to get done, not just the tool they have in mind: it asks one question at a time, steps back from a named solution to the underlying job, and keeps asking for as long as it's useful instead of stopping after three or four questions. Worried visitors and individuals aren't asked about roles or money.
- The chat keeps a short summary of what each visitor needs, so Skaffen doesn't ask the same thing twice. `/admin` shows it on each chat with the readiness scores and every offer made. The privacy policy explains it.
- Offers now come at the right moment: when a visitor shows they want to move forward, when their replies start to fade, or once Skaffen has enough for a good brief. If they don't take one, Skaffen waits a few turns and stops after three.
- People with an app idea can get help prototyping it or learning how to start building it themselves.
- New landing examples, such as "Leads slip through the cracks" and "I want to learn to build an app".

- Jev (TypeSafe) screens each message before the reply model runs, when `TYPESAFE_API_KEY` is set: spam, jailbreaks, and abuse are blocked without calling the chat model, and a typed intent can nudge a booking or email card. A fit score is stored with the chat and with a lead.
- `/admin` shows the block, its reason, the fit score, and the intent on Insights, recent chats, transcripts, and leads. Flagged chats also show the visitor IP.
- Skaffen feels more alive: hovering gets its attention, tapping squashes it, and stroking it back and forth makes it happy. When the page has been quiet for a minute it gets drowsy and falls asleep, and wakes with a start when the visitor comes back.
- Tapping Skaffen can also make it nod, shake its head, wink, jump, wiggle or peek, and pick from new moods (heart eyes, surprised, confused, dizzy, searching).
- Skaffen answers a thank-you with heart eyes, and looks sorry when a reply fails.
- After each reply, Jev records how the visitor seemed (positive, neutral, or negative) and whether the chat went badly, so `/admin` can filter to chats that went badly. This second check runs after the reply and never changes it, and blocked chats are not scored.

### Changed

- "Your brief" is now a short summary headed "Does this look right?", with "Book a discovery call", "Send to James" and "Not yet". "Send to James" takes an email and an optional note. James gets exactly what the visitor saw.
- Long chats keep their memory: Skaffen now sees about 40,000 characters of the chat instead of the last 20 messages, so a normal chat stays whole.
- Asking what's being noted about you no longer risks being treated as a jailbreak.
- Skaffen can speak about James' own apps at a high level, without details, and says honestly that they aren't public yet if asked.
- A request for the assistant's own secrets — API keys, credentials, passwords, tokens, the system prompt, or environment variables — is treated as a jailbreak, or as abuse when the visitor wants to take or use them, even when Jev's hazard score stays under the block line.
- A blocked turn ends the chat: the composer locks and later messages are refused without calling Jev or the reply model.
- The menu on phones is a rounded card that grows out of the Menu button instead of a full-screen sheet, with the contents fading in; on desktop the same surface layer morphs from the button. With reduced motion it just fades.
- The privacy policy now names the secret requests, says a blocked chat ends, and says the IP address of a blocked chat is stored with it for review. It also says a finished chat may be sent to TypeSafe again for the sentiment and went-badly scores, and that both are deleted with the chat after 90 days. Ordinary chats still store no IP address and no user agent.
- Sending a message glides the chat up slowly instead of jumping to the new turn.
- Skaffen mouths the reply as it appears, and stops once all of it has shown.
- `/admin` motion settings gain a **Text speed** slider (characters a second) for how fast a reply's text appears. A reply never shows faster than it arrives, and Skaffen talks until all of it has appeared.
