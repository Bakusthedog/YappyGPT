# Yapper AI — Replit starter

A JavaScript starter bot for Yapper using the API surface shown in the supplied example:
- `new Bot(token)`
- `bot.command(name, description, callback)`
- `bot.on('message', callback)`
- `ctx.reply(text)`
- `msg.content`
- `msg.reply(text)`
- `bot.start()`

It connects to OpenRouter's chat-completions API and defaults to `openrouter/free`.

## Replit setup

1. Create a Node.js Repl.
2. Upload/extract these files into the project.
3. Add the Yapper library file `yapper.js` to the project. This starter intentionally does not invent its implementation.
4. In Replit → Secrets, add:
   - `YAPPER_BOT_TOKEN` = your Yapper bot token
   - `OPENROUTER_API_KEY` = your OpenRouter API key
   - Optional `YAPPER_BOT_NAME` = `Yapper AI`
   - Optional `OPENROUTER_MODEL` = `openrouter/free`
5. Run with `npm start`.

Get an OpenRouter API key from the official OpenRouter dashboard. Never put it directly into `index.js` or commit it to a public repository.

## How to talk to it

- `hi bot` → `hi! 👋`
- `/ping` → `pong 🏓`
- `/ai explain JavaScript` → asks the free-model router
- `@Yapper explain JavaScript` → asks the AI using a textual mention trigger

## Important integration note

The only Yapper API details available for this starter are the methods and properties shown in the example you supplied. Therefore, mention detection currently checks the literal text `@Yapper`, and AI questions are parsed from `msg.content`. The registered `/ai` command callback only uses the documented `ctx.reply` method; if Yapper handles slash commands separately and does not also emit the original message through `bot.on('message')`, the command will show a usage hint rather than process the argument. To implement native mentions and slash-command arguments correctly, provide the `yapper.js` file or its official API documentation so the exact message/command fields can be used without guessing.

## Troubleshooting

- `Missing YAPPER_BOT_TOKEN`: add the secret in Replit.
- `Missing OPENROUTER_API_KEY`: add the secret in Replit.
- API/model errors: try again later; free model availability and rate limits can change.
- If `fetch` is unavailable, use Node.js 18 or newer.
