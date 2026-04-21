import { json } from '@sveltejs/kit';
import { llmService } from '$lib/server/llm-service.js';
import { SIM_PROMPT } from '$lib/server/prompts.js';
import { extractLibraries } from '$lib/server/wokwi.js';

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { prompt, guide } = body;
  if (!prompt) return json({ error: 'Prompt required' }, { status: 400 });
  if (!guide) return json({ error: 'Guide required' }, { status: 400 });
  if (prompt.length > 600) return json({ error: 'Prompt too long (max 600 characters)' }, { status: 400 });

  try {
    const text = await llmService.simulate(prompt, guide, SIM_PROMPT);
    
    const diagramMatch = text.match(/```json\s*\n([\s\S]*?)```/);
    const sketchMatch = text.match(/```(?:cpp|ino|arduino|c\+\+)\s*\n([\s\S]*?)```/);

    if (!diagramMatch || !sketchMatch) {
      throw new Error('Failed to generate simulation files');
    }

    const diagram = diagramMatch[1].trim();
    const sketch = sketchMatch[1].trim();

    // Validate JSON before sending to Wokwi
    JSON.parse(diagram);

    const libs = extractLibraries(sketch);
    const files = [
      { name: 'sketch.ino',   content: sketch },
      { name: 'diagram.json', content: diagram },
    ];
    if (libs.length > 0) {
      files.push({ name: 'libraries.txt', content: libs.join('\n') });
    }

    const wokwiRes = await fetch('https://wokwi.com/api/projects/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://wokwi.com/projects/new/arduino-uno',
        'Origin': 'https://wokwi.com',
      },
      body: JSON.stringify({
        name: `mertle.bot — ${prompt.slice(0, 60)}`,
        unlisted: true,
        files,
      })
    });

    if (!wokwiRes.ok) {
      const errText = await wokwiRes.text();
      throw new Error(`Wokwi error ${wokwiRes.status}: ${errText.slice(0, 200)}`);
    }

    const { projectId } = await wokwiRes.json();

    return json({
      embedUrl: `https://wokwi.com/projects/${projectId}/embed?dark=1&view=diagram`,
      projectUrl: `https://wokwi.com/projects/${projectId}`,
    });

  } catch (err) {
    console.error('Simulate error:', err.message);
    return json({ error: err.message }, { status: 500 });
  }
}
