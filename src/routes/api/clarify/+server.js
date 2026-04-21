import { json } from '@sveltejs/kit';
import { llmService } from '$lib/server/llm-service.js';
import { QUESTION_CATALOG, CLARIFY_SYSTEM } from '$lib/server/prompts.js';

function regexFilter(prompt) {
  return QUESTION_CATALOG.filter(q => !q.detect.test(prompt));
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length < 10) return json({ questions: [] });

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
