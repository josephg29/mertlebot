import { json } from '@sveltejs/kit';
import { llmService } from '$lib/server/llm-service.js';
import { SYSTEM, SKILL_CONTEXT, CHAT_SYSTEM, ageContext } from '$lib/server/prompts.js';

function isAbortError(err) {
  return err?.constructor?.name === 'APIUserAbortError'
    || err?.name === 'APIUserAbortError'
    || err?.message?.includes('Request was aborted')
    || err?.name === 'AbortError'
    || err?.message?.includes('aborted')
    || err?.name === 'AbortError';
}

export async function GET() {
  return json({ error: 'Method Not Allowed — use POST' }, {
    status: 405,
    headers: { 'Allow': 'POST' }
  });
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const skill = body.skill || 'MONKEY';
  const age = Number(body.age) || 25;
  const clarifications = typeof body.clarifications === 'string' ? body.clarifications.trim() : null;

  if (!prompt) return json({ error: 'Prompt required' }, { status: 400 });
  if (prompt.length > 50000) return json({ error: 'Prompt too long' }, { status: 400 });

  try {
    // Classify intent
    const intent = await llmService.classifyIntent(prompt);
    console.log(`Intent: ${intent} — "${prompt.slice(0, 60)}"`);

    // Build system prompt
    const skillContext = SKILL_CONTEXT[skill] || SKILL_CONTEXT.MONKEY;
    const buildSystem = SYSTEM + '\n\n' + skillContext + '\n\n' + ageContext(age);
    const chatSystem = CHAT_SYSTEM + '\n\n' + ageContext(age);
    const fullSystem = intent === 'BUILD' ? buildSystem : chatSystem;

    // Get stream from LLM service
    const streamResult = await llmService.generateStream({
      prompt,
      system: fullSystem,
      skill,
      age,
      clarifications,
      intent
    });

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send intent hint first
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ intent })}\n\n`));

        try {
          if (streamResult.provider === 'anthropic') {
            // Anthropic streaming
            const msgStream = streamResult.stream;
            let chunks = 0;

            msgStream.on('text', (text) => {
              chunks++;
              try {
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ t: text })}\n\n`));
              } catch { /* controller closed */ }
            });

            msgStream.on('end', () => {
              console.log(`Anthropic stream ended — ${chunks} text chunks sent`);
              try {
                controller.enqueue(enc.encode('data: [DONE]\n\n'));
                controller.close();
              } catch { /* already closed */ }
            });

            msgStream.on('error', (err) => {
              if (isAbortError(err)) {
                console.log('Anthropic stream aborted (client disconnect)');
                try { controller.close(); } catch { /* already closed */ }
                return;
              }
              console.error('Anthropic stream error:', err.constructor?.name, err.message);
              try {
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
                controller.enqueue(enc.encode('data: [DONE]\n\n'));
                controller.close();
              } catch { /* already closed */ }
            });
          } else {
            // DeepSeek streaming (SSE)
            const reader = streamResult.stream.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      controller.enqueue(enc.encode('data: [DONE]\n\n'));
                      controller.close();
                      return;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.choices && parsed.choices[0]?.delta?.content) {
                        const text = parsed.choices[0].delta.content;
                        controller.enqueue(enc.encode(`data: ${JSON.stringify({ t: text })}\n\n`));
                      }
                    } catch (e) {
                      // Ignore parse errors for incomplete JSON
                    }
                  }
                }
              }

              // Finalize
              controller.enqueue(enc.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (err) {
              if (isAbortError(err)) {
                console.log('DeepSeek stream aborted (client disconnect)');
                try { controller.close(); } catch { /* already closed */ }
                return;
              }
              console.error('DeepSeek stream error:', err.message);
              try {
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
                controller.enqueue(enc.encode('data: [DONE]\n\n'));
                controller.close();
              } catch { /* already closed */ }
            } finally {
              reader.releaseLock();
            }
          }
        } catch (err) {
          console.error('Stream setup error:', err.message);
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
      cancel() {
        console.log('Client disconnected — aborting stream');
        try { streamResult.abort(); } catch { /* ignore */ }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    });
  } catch (err) {
    console.error('Generate error:', err.message);
    return json({ error: err.message }, { status: 500 });
  }
}