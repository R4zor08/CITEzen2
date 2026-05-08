import type { Request, Response as ExpressResponse } from 'express';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatBody = {
  messages?: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

function readJsonBody(req: Request): unknown {
  return (req as any).body;
}

function parseBody(req: Request): {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  max_tokens: number;
  stream: boolean;
} | null {
  const body = readJsonBody(req) as ChatBody;
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  return {
    messages,
    model:
      typeof body?.model === 'string' && body.model.trim() !== ''
        ? body.model.trim()
        : 'llama-3.3-70b-versatile',
    temperature: typeof body?.temperature === 'number' ? body.temperature : 0.5,
    max_tokens: typeof body?.max_tokens === 'number' ? body.max_tokens : 768,
    stream: body?.stream !== false
  };
}

async function requestGroq(args: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
  signal?: AbortSignal;
}): Promise<globalThis.Response> {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`
    },
    signal: args.signal,
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature,
      max_tokens: args.max_tokens,
      stream: args.stream
    })
  });
}

export async function streamChat(req: Request, res: ExpressResponse) {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let controller: AbortController | null = null;
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res
        .status(500)
        .json({ error: 'Chat is not configured on the server (missing GROQ_API_KEY).' });
      return;
    }

    const parsed = parseBody(req);
    if (!parsed) {
      res.status(400).json({ error: 'Body must include a non-empty messages array.' });
      return;
    }

    const { messages, model, temperature, max_tokens, stream } = parsed;

    let upstream: globalThis.Response;
    if (!stream) {
      upstream = await requestGroq({
        apiKey,
        model,
        messages,
        temperature,
        max_tokens,
        stream: false
      });
      if (!upstream.ok) {
        const text = await upstream.text().catch(() => '');
        res
          .status(upstream.status)
          .json({ error: text || `Groq request failed (${upstream.status})` });
        return;
      }
      const json = await upstream.json().catch(() => ({} as any));
      const content =
        json?.choices?.[0]?.message?.content && typeof json.choices[0].message.content === 'string'
          ? json.choices[0].message.content
          : '';
      res.status(200).json({
        content,
        model: json?.model ?? model,
        usage: json?.usage ?? null
      });
      return;
    }

    controller = new AbortController();
    req.on('aborted', () => controller?.abort());
    res.on('close', () => {
      if (!res.writableEnded) controller?.abort();
    });

    try {
      upstream = await requestGroq({
        apiKey,
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
        signal: controller.signal
      });
    } catch (e: any) {
      const isAbort =
        e?.name === 'AbortError' ||
        String(e?.message ?? '').toLowerCase().includes('aborted');
      if (isAbort) return;
      console.error('Groq upstream fetch failed', e);
      res.status(502).json({ error: 'Failed to connect to Groq upstream.' });
      return;
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      res
        .status(upstream.status)
        .json({ error: text || `Groq request failed (${upstream.status})` });
      return;
    }

    const upstreamBody = upstream.body;
    if (!upstreamBody) {
      res.status(502).json({ error: 'Upstream returned no body.' });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Helps some proxies (nginx) avoid buffering SSE.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const localReader = upstreamBody.getReader();
    reader = localReader;

    for (;;) {
      const { done, value } = await localReader.read();
      if (done) break;
      if (value) res.write(Buffer.from(value));
    }
  } catch (e: any) {
    const isAbort =
      e?.name === 'AbortError' ||
      String(e?.message ?? '').toLowerCase().includes('aborted');
    if (isAbort) return;
    console.error('Chat stream error', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat streaming failed.' });
    }
  } finally {
    if (reader) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
    }
    if (!res.writableEnded) res.end();
  }
}

