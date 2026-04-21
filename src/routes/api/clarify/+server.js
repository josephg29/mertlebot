import { json } from '@sveltejs/kit';
import { llmService } from '$lib/server/llm-service.js';
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

  // First pass: regex filter out already-answered questions
  const remaining = regexFilter(prompt);
  if (!remaining.length) return json({ questions: [] });

  // Second pass: LLM with 3-second timeout
  try {
    const ids = await llmService.clarify(prompt, remaining, CLARIFY_SYSTEM);
    
    const validIds = new Set(QUESTION_CATALOG.map(q => q.id));
    const filteredIds = ids.filter(id => validIds.has(id)).slice(0, 5);

    const questions = filteredIds.map(id => QUESTION_CATALOG.find(q => q.id === id)).filter(Boolean);
    return json({ questions });
  } catch {
    // Timeout or LLM error: fall back to regex-filtered set
    return json({ questions: remaining.slice(0, 5) });
  }
}
