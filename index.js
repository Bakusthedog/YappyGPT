import { Bot } from './yapper.js';

const botToken = process.env.YAPPER_BOT_TOKEN;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const botName = process.env.YAPPER_BOT_NAME || 'Yapper AI';
const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

if (!botToken) throw new Error('Missing YAPPER_BOT_TOKEN secret.');
if (!openRouterKey) throw new Error('Missing OPENROUTER_API_KEY secret.');

const bot = new Bot(botToken);

const recentByChannel = new Map();
const MAX_HISTORY_MESSAGES = 8;
const MAX_REPLY_CHARS = 1800;
const cooldowns = new Map();
const COOLDOWN_MS = 4000;

async function askOpenRouter(prompt, history = []) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'X-OpenRouter-Title': 'Yapper AI Bot'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are ${botName}, a friendly AI assistant inside Yapper, a Discord-like chat app. Reply in the language the user uses, usually Polish. Be helpful, clear, and concise. You are a bot; do not claim to be human.`
        },
        ...history,
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || `OpenRouter HTTP ${response.status}`;
    throw new Error(detail);
  }

  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('OpenRouter returned an empty response.');
  }
  return answer.trim().slice(0, MAX_REPLY_CHARS);
}

function findTrigger(content) {
  // Only uses msg.content, which is present in the example API.
  // Mention detection is textual until Yapper's exact mention format is documented.
  const text = String(content || '').trim();

  const commandMatch = text.match(/^\/ai(?:\s+([\s\S]+))?$/i);
  if (commandMatch) {
    return { prompt: (commandMatch[1] || '').trim(), type: 'command' };
  }

  const mentionMatch = text.match(/^@Yapper(?:\s+([\s\S]+))?$/i)
    || text.match(/^@YapperAI(?:\s+([\s\S]+))?$/i)
    || text.match(/^@Yapper AI(?:\s+([\s\S]+))?$/i);

  if (mentionMatch) {
    return { prompt: (mentionMatch[1] || '').trim(), type: 'mention' };
  }
  return null;
}

// Keep the command registered using the API shown in your example.
// The callback context is only used through its documented ctx.reply method.
bot.command('ping', 'Check the bot is alive', (ctx) => ctx.reply('pong 🏓'));

bot.command('ai', 'Ask Yapper AI a question', (ctx) =>
  ctx.reply('Użyj: /ai twoje pytanie — np. /ai wyjaśnij mi JavaScript. Jeśli komenda nie przekazuje treści do message event, podeślij dokumentację API, a dopasujemy handler bez zgadywania.')
);

bot.on('message', async (msg) => {
  const content = String(msg.content || '').trim();

  if (content.toLowerCase() === 'hi bot') {
    await msg.reply('hi! 👋');
    return;
  }

  const trigger = findTrigger(content);
  if (!trigger) return;

  if (!trigger.prompt) {
    await msg.reply('Napisz pytanie po komendzie, np. `/ai jak działa JavaScript?` albo `@Yapper jak działa JavaScript?`');
    return;
  }

  // Per-sender cooldown. The supplied API example does not document a sender ID field,
  // so this conservative global cooldown avoids relying on undocumented message properties.
  const now = Date.now();
  const last = cooldowns.get('global') || 0;
  if (now - last < COOLDOWN_MS) {
    await msg.reply('Daj mi chwilkę 😅 Spróbuj ponownie za kilka sekund.');
    return;
  }
  cooldowns.set('global', now);

  const historyKey = 'default';
  const history = recentByChannel.get(historyKey) || [];

  try {
    const answer = await askOpenRouter(trigger.prompt, history);
    recentByChannel.set(historyKey, [
      ...history,
      { role: 'user', content: trigger.prompt },
      { role: 'assistant', content: answer }
    ].slice(-MAX_HISTORY_MESSAGES));
    await msg.reply(answer);
  } catch (error) {
    console.error('Yapper AI error:', error.message);
    await msg.reply('Nie udało mi się uzyskać odpowiedzi z AI. Sprawdź klucz OpenRouter, wybrany model i limity API.');
  }
});

bot.start();
console.log(`🤖 ${botName} started. OpenRouter model: ${model}`);
