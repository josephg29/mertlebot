import Anthropic from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';
import { getApiKey } from '$lib/server/config.js';
import { QUESTION_CATALOG, CLARIFY_SYSTEM } from '$lib/server/prompts.js';

function regexFilter(prompt) {
  return QUESTION_CATALOG.filter(q => !q.detect.test(prompt));
}

function isSpecificBuildPrompt(prompt) {
  const text = prompt.toLowerCase();
  const boardKnown = /\b(arduino\s+uno|arduino\s+nano|arduino\s+mega|esp32|uno|nano|mega)\b/.test(text);
  const powerKnown = /\b(usb|battery|wall adapter|power supply|powered by)\b/.test(text);
  const outputKnown = /\b(monitor|display|show|blink|beep|measure|detect|track|turn on|turn off|temperature|humidity|distance|alarm|light)\b/.test(text);
  const commentKnown = /\b(commented|comments?|clean code|beginner-friendly|beginner friendly|simple|quick)\b/.test(text);
  const partsMentioned = (text.match(/\b(led|resistor|button|switch|dht22|ultrasonic|hc-sr04|servo|buzzer|potentiometer|oled|lcd|display|breadboard|jumper wires?|sensor)\b/g) || []).length;

  let answered = 0;
  if (boardKnown) answered++;
  if (powerKnown) answered++;
  if (outputKnown) answered++;
  if (commentKnown) answered++;
  if (partsMentioned >= 2) answered++;

  return answered >= 4;
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length < 10) return json({ questions: [] });
  if (isSpecificBuildPrompt(prompt)) return json({ questions: [] });

  const apiKey = getApiKey();
  if (!apiKey) return json({ questions: [] }); // silently skip — generate endpoint will surface the error

  // First pass: regex filter out already-answered questions
  const remaining = regexFilter(prompt);
  if (!remaining.length) return json({ questions: [] });

  // Second pass: LLM with 3-second timeout
  try {
    const client = new Anthropic({ apiKey });
    const allIds = remaining.map(q => q.id).join(', ');

    const res = await Promise.race([
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: CLARIFY_SYSTEM,
        messages: [{
          role: 'user',
          content: `Prompt: "${prompt}"\n\nAvailable question IDs: ${allIds}\n\nReturn a JSON array of IDs to ask.`,
        }],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    let ids;
    try {
      ids = JSON.parse(res.content[0].text.trim());
      if (!Array.isArray(ids)) ids = remaining.map(q => q.id);
    } catch {
      ids = remaining.map(q => q.id);
    }

    const validIds = new Set(QUESTION_CATALOG.map(q => q.id));
    ids = ids.filter(id => validIds.has(id)).slice(0, 5);

    const questions = ids.map(id => QUESTION_CATALOG.find(q => q.id === id)).filter(Boolean);
    return json({ questions });
  } catch {
    // Timeout or LLM error: fall back to regex-filtered set
    return json({ questions: remaining.slice(0, 5) });
  }
}
