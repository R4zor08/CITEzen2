import type { NextFunction, Request, Response as ExpressResponse } from 'express';
import mongoose from 'mongoose';
import { ok } from '../http/apiResponse.js';
import { BadRequestError, NotFoundError } from '../http/httpError.js';
import * as chatService from '../services/chatService.js';

type IncomingChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachment?: {
    name: string;
    mimeType: string;
    size: number;
    dataUrl?: string;
    data?: string;
  };
};

function canPersistSession(sessionId?: string): sessionId is string {
  return !!sessionId && mongoose.isValidObjectId(sessionId);
}

type ChatBody = {
  messages?: IncomingChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  sessionId?: string;
  persistUserMessage?: boolean;
};

function readJsonBody(req: Request): unknown {
  return (req as Request & { body: unknown }).body;
}

function parseMessagesField(raw: unknown): IncomingChatMessage[] | null {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { messages?: IncomingChatMessage[] };
      if (Array.isArray(parsed.messages)) return parsed.messages;
      if (Array.isArray(parsed)) return parsed as IncomingChatMessage[];
    } catch {
      return null;
    }
  }
  const body = raw as ChatBody;
  if (Array.isArray(body?.messages)) return body.messages;
  return null;
}

function parsePayloadBody(req: Request): ChatBody {
  const body = readJsonBody(req) as Record<string, unknown>;
  if (typeof body?.payload === 'string') {
    try {
      return JSON.parse(body.payload) as ChatBody;
    } catch {
      return {};
    }
  }
  if (typeof body?.messages === 'string') {
    try {
      const parsed = JSON.parse(body.messages) as ChatBody | IncomingChatMessage[];
      if (Array.isArray(parsed)) return { messages: parsed };
      return parsed as ChatBody;
    } catch {
      return {};
    }
  }
  return body as ChatBody;
}

function parseStreamBody(req: Request): {
  messages: IncomingChatMessage[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
  sessionId?: string;
  persistUserMessage: boolean;
} | null {
  const extra = parsePayloadBody(req);
  const messages =
    parseMessagesField(extra) ?? parseMessagesField(readJsonBody(req));
  if (!messages || messages.length === 0) return null;

  return {
    messages,
    temperature: typeof extra?.temperature === 'number' ? extra.temperature : 0.5,
    max_tokens: typeof extra?.max_tokens === 'number' ? extra.max_tokens : 2048,
    stream: extra?.stream !== false,
    sessionId: typeof extra?.sessionId === 'string' ? extra.sessionId : undefined,
    persistUserMessage: extra?.persistUserMessage !== false
  };
}

async function requestGroq(args: {
  apiKey: string;
  model: string;
  messages: IncomingChatMessage[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
  signal?: AbortSignal;
}): Promise<globalThis.Response> {
  const textOnly = args.messages.map((m) => ({
    role: m.role,
    content: m.content
  }));
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`
    },
    signal: args.signal,
    body: JSON.stringify({
      model: args.model,
      messages: textOnly,
      temperature: args.temperature,
      max_tokens: args.max_tokens,
      stream: args.stream
    })
  });
}

function formatChatError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('GROQ_API_KEY')) {
    return 'Chat is not configured on the server (missing GROQ_API_KEY).';
  }
  return msg || 'Chat request failed';
}

function chatErrorHttpStatus(e: unknown): number {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('429')) return 429;
  return 502;
}

export async function listSessions(req: Request, res: ExpressResponse, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const sessions = await chatService.listSessions(userId);
    ok(res, sessions);
  } catch (e) {
    next(e);
  }
}

export async function createSessionHandler(
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) {
  try {
    const title =
      typeof req.body?.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : 'GabAI';
    const session = await chatService.createSession(req.user!.id, title);
    ok(res, session, 201);
  } catch (e) {
    next(e);
  }
}

export async function getSessionMessages(
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) {
  try {
    const session = await chatService.getSession(req.params.id, req.user!.id);
    if (!session) throw new NotFoundError('Chat session not found');
    const messages = await chatService.listMessages(req.params.id);
    ok(res, { session, messages });
  } catch (e) {
    next(e);
  }
}

export async function patchSession(
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) throw new BadRequestError('title is required');
    const session = await chatService.updateSessionTitle(
      req.params.id,
      req.user!.id,
      title
    );
    if (!session) throw new NotFoundError('Chat session not found');
    ok(res, session);
  } catch (e) {
    next(e);
  }
}

export async function deleteSessionHandler(
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) {
  try {
    const deleted = await chatService.deleteSession(req.params.id, req.user!.id);
    if (!deleted) throw new NotFoundError('Chat session not found');
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
}

export async function importSessions(
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) {
  try {
    const sessions = req.body?.sessions;
    if (!Array.isArray(sessions)) {
      throw new BadRequestError('sessions array is required');
    }
    const userId = req.user!.id;
    const created: string[] = [];

    for (const s of sessions) {
      if (!s?.id || !Array.isArray(s.messages)) continue;
      const existing = await chatService.getSession(String(s.id), userId);
      if (existing) continue;

      const session = await chatService.createSession(
        userId,
        typeof s.title === 'string' ? s.title : 'GabAI'
      );
      const msgs = s.messages
        .filter((m: { role?: string }) => m.role === 'user' || m.role === 'assistant')
        .map(
          (m: {
            role: 'user' | 'assistant';
            content?: string;
            attachment?: {
              name: string;
              mimeType: string;
              size: number;
              dataUrl?: string;
            };
          }) => ({
            role: m.role,
            content: String(m.content ?? ''),
            attachment: chatService.attachmentFromJson(m.attachment)
          })
        );
      await chatService.replaceMessages(session.id, msgs);
      created.push(session.id);
    }

    ok(res, { imported: created.length, sessionIds: created });
  } catch (e) {
    next(e);
  }
}

export async function streamChat(req: Request, res: ExpressResponse) {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let controller: AbortController | null = null;

  try {
    const parsed = parseStreamBody(req);
    if (!parsed) {
      res.status(400).json({ error: 'Body must include a non-empty messages array.' });
      return;
    }

    const { messages, temperature, max_tokens, stream, sessionId, persistUserMessage } =
      parsed;
    const userId = req.user?.id;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      res.status(500).json({ error: 'Chat is not configured (missing GROQ_API_KEY).' });
      return;
    }

    const model =
      typeof (readJsonBody(req) as ChatBody)?.model === 'string'
        ? String((readJsonBody(req) as ChatBody).model)
        : 'llama-3.3-70b-versatile';

    if (!stream) {
      const upstream = await requestGroq({
        apiKey,
        model,
        messages,
        temperature,
        max_tokens,
        stream: false
      });
      if (!upstream.ok) {
        const text = await upstream.text().catch(() => '');
        res.status(upstream.status).json({ error: text || 'Groq request failed' });
        return;
      }
      const json = await upstream.json().catch(() => ({} as { choices?: { message?: { content?: string } }[] }));
      const content = json?.choices?.[0]?.message?.content ?? '';
      res.status(200).json({ content, model });
      return;
    }

    controller = new AbortController();
    req.on('aborted', () => controller?.abort());
    res.on('close', () => {
      if (!res.writableEnded) controller?.abort();
    });

    const upstream = await requestGroq({
      apiKey,
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
      signal: controller.signal
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      res.status(upstream.status).json({ error: text || 'Groq request failed' });
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
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const localReader = upstreamBody.getReader();
    reader = localReader;
    let fullContent = '';

    for (;;) {
      const { done, value } = await localReader.read();
      if (done) break;
      if (value) {
        res.write(Buffer.from(value));
        const chunk = new TextDecoder().decode(value);
        for (const line of chunk.split(/\r?\n/)) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch {
            // ignore
          }
        }
      }
    }

    if (canPersistSession(sessionId) && userId && persistUserMessage && lastUser) {
      const session = await chatService.getSession(sessionId, userId);
      if (session) {
        await chatService.appendMessage({
          sessionId,
          role: 'user',
          content: lastUser.content,
          attachment: chatService.attachmentFromJson(lastUser.attachment)
        });
        await chatService.appendMessage({
          sessionId,
          role: 'assistant',
          content: fullContent.trim()
        });
      }
    }
  } catch (e: unknown) {
    const isAbort =
      e instanceof Error &&
      (e.name === 'AbortError' || e.message.toLowerCase().includes('aborted'));
    if (isAbort) return;
    console.error('Chat stream error', e);
    if (!res.headersSent) {
      res.status(chatErrorHttpStatus(e)).json({ error: formatChatError(e) });
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
