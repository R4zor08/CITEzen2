import type { Request, Response as ExpressResponse } from 'express';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function readJsonBody(req: Request): unknown {
  return (req as any).body;
}

export async function streamChat(req: Request, res: ExpressResponse) {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res
        .status(500)
        .json({ error: 'Chat is not configured on the server (missing GROQ_API_KEY).' });
      return;
    }

    const body = readJsonBody(req) as any;
    const messages = body?.messages as ChatMessage[] | undefined;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Body must include a non-empty messages array.' });
      return;
    }

    const model =
      typeof body?.model === 'string' && body.model.trim() !== ''
        ? body.model.trim()
        : 'llama-3.3-70b-versatile';
    const temperature =
      typeof body?.temperature === 'number' ? body.temperature : 0.5;
    const max_tokens =
      typeof body?.max_tokens === 'number' ? body.max_tokens : 768;

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    let upstream: globalThis.Response;
    try {
      upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: true
        })
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

    while (true) {
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
    res.end();
  }
}

