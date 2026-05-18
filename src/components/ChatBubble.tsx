import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { toast } from 'sonner';
import { getApiBase } from '../lib/api';
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  UserIcon,
  Loader2Icon,
  Trash2Icon,
  FileTextIcon,
  FileIcon,
  DownloadIcon,
  UploadCloudIcon,
  FileSpreadsheetIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  MoreHorizontalIcon,
  SearchIcon,
  AlertTriangleIcon,
  Copy as CopyIcon,
  RefreshCw as RefreshCwIcon } from
'lucide-react';
interface Attachment {
  type: 'image' | 'file';
  name: string;
  size: number;
  mimeType: string;
  dataUrl: string;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment?: Attachment;
}
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
interface ChatBubbleProps {
  user: User;
  /** Parent-controlled open state. Omit for FAB-only control. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Host fills the window (e.g. #gabai route); panel is always visible, no FAB. */
  isStandaloneWindow?: boolean;
}
const CITEZEN_LOGO = "/Gemini_Generated_Image_u7mgetu7mgetu7mg.png";

type ChatIntent = 'citezen' | 'campus' | 'general';

function detectIntent(text: string): ChatIntent {
  const t = text.toLowerCase();
  const citezenTerms = [
    'citezen',
    'concern',
    'complaint',
    'ticket',
    'department',
    'dashboard',
    'status',
    'submit',
    'forward',
    'nemsu'
  ];
  const campusTerms = [
    'school',
    'campus',
    'class',
    'student',
    'teacher',
    'professor',
    'university'
  ];

  if (citezenTerms.some((k) => t.includes(k))) return 'citezen';
  if (campusTerms.some((k) => t.includes(k))) return 'campus';
  return 'general';
}

function buildSystemPrompt(args: { userName: string; userRole: string; intent: ChatIntent }) {
  return `You are GabAI, the campus assistant for CITEzen concern management at NEMSU (North Eastern Mindanao State University). Current user: ${args.userName} (${args.userRole}).

Current detected intent category: ${args.intent}

Behavior policy:
1) If the user asks about CITEzen workflows (submit, track, comments, departments, dashboards, roles), give practical and accurate step-by-step guidance first.
2) If the user asks campus-adjacent questions, answer helpfully and briefly, then suggest a relevant CITEzen action when useful.
3) If the user asks general non-CITEzen questions, still answer clearly and concisely. Do not refuse only because it is off-topic.
4) Never invent private account data, university policies you do not know, or system capabilities.
5) Refuse harmful or illegal requests briefly and safely.

Formatting rules:
- Use plain text only (no markdown emphasis).
- Keep answers easy to scan with short paragraphs or numbered steps when needed.

Language rules:
- Reply in the same language as the user (English, Tagalog/Filipino, Bisaya/Cebuano, or mixed style).
- If user mixes languages (Taglish/Bislish), mirror naturally.
`;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const getDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays <= 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  return 'Older';
};

/** Plain, professional assistant text: no markdown asterisks in the UI. */
function formatAssistantReply(text: string): string {
  if (!text) return text;
  let s = text;
  for (let i = 0; i < 24 && s.includes('**'); i++) {
    s = s.replace(/\*\*([^*]*)\*\*/g, '$1');
  }
  for (let i = 0; i < 24; i++) {
    const next = s.replace(/\*([^*\n]+)\*/g, '$1');
    if (next === s) break;
    s = next;
  }
  s = s.replace(/^(\s*)\*\s+/gm, '$1- ');
  s = s.replace(/\*/g, '');
  return s;
}

export function ChatBubble({
  user,
  open: openControlled,
  onOpenChange,
  isStandaloneWindow = false
}: ChatBubbleProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen =
    isStandaloneWindow ? true : openControlled ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (isStandaloneWindow) {
        if (!next) window.close();
        return;
      }
      onOpenChange?.(next);
      if (openControlled === undefined) setInternalOpen(next);
    },
    [isStandaloneWindow, onOpenChange, openControlled]
  );
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const createInitialGreeting = (): Message => ({
    role: 'assistant',
    content: `Hi ${user.name.split(' ')[0]}! I'm GabAI—your guide for CITEzen (concerns, departments, and how the app works). Ask me anything about the system, or other questions too; I'll help when I can and be clear when something isn't my specialty. What would you like to know?`
  });
  const createNewSession = (): ChatSession => ({
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: 'GabAI',
    messages: [createInitialGreeting()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  // Sessions State & Migration
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem(`citezen_sessions_${user.id}`);
    const oldChat = localStorage.getItem(`citezen_chat_${user.id}`);
    if (savedSessions) {
      try {
        return JSON.parse(savedSessions);
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    } else if (oldChat) {
      try {
        const parsedOld = JSON.parse(oldChat);
        const migratedSession: ChatSession = {
          id: Date.now().toString(),
          title: 'Previous Conversation',
          messages: parsedOld,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.removeItem(`citezen_chat_${user.id}`);
        return [migratedSession];
      } catch (e) {
        console.error('Failed to migrate old chat', e);
      }
    }
    return [createNewSession()];
  });
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const saved = localStorage.getItem(`citezen_active_chat_${user.id}`);
    if (saved && sessions.some((s) => s.id === saved)) return saved;
    return sessions[0]?.id || '';
  });
  // Ensure we always have an active session
  useEffect(() => {
    if (!sessions.some((s) => s.id === activeChatId)) {
      if (sessions.length > 0) {
        setActiveChatId(sessions[0].id);
      } else {
        const newSession = createNewSession();
        setSessions([newSession]);
        setActiveChatId(newSession.id);
      }
    }
  }, [sessions, activeChatId]);
  const activeSession =
  sessions.find((s) => s.id === activeChatId) || sessions[0];
  // Persistence
  useEffect(() => {
    localStorage.setItem(
      `citezen_sessions_${user.id}`,
      JSON.stringify(sessions)
    );
    localStorage.setItem(`citezen_active_chat_${user.id}`, activeChatId);
  }, [sessions, activeChatId, user.id]);
  // Chat UI State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef('');
  const streamRevealRawLenRef = useRef(0);
  const streamRevealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const [inlineEditIndex, setInlineEditIndex] = useState<number | null>(null);
  const [inlineEditDraft, setInlineEditDraft] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState<Attachment | null>(
    null
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // History UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>>(
    {});
  const [activeUserPopover, setActiveUserPopover] = useState<number | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<{
    type: 'clear' | 'delete';
    chatId: string;
  } | null>(null);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historySearchRef = useRef<HTMLInputElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    if (isOpen && view === 'chat') {
      scrollToBottom();
    }
  }, [
  activeSession?.messages,
  isOpen,
  view,
  stagedAttachment,
  isProcessingFile,
  streamingContent]
  );

  useEffect(() => {
    if (isStandaloneWindow) return;
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isStandaloneWindow]);

  useEffect(() => {
    if (!isOpen || view !== 'history') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        historySearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, view]);
  // --- Chat Management Actions ---
  const handleNewChat = () => {
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setView('chat');
    setStagedAttachment(null);
    setInput('');
    setInlineEditIndex(null);
    setInlineEditDraft('');
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const clearStreamReveal = () => {
    if (streamRevealIntervalRef.current) {
      clearInterval(streamRevealIntervalRef.current);
      streamRevealIntervalRef.current = null;
    }
  };

  const flushStreamDisplay = () => {
    clearStreamReveal();
    const target = streamBufferRef.current;
    streamRevealRawLenRef.current = target.length;
    setStreamingContent(formatAssistantReply(target));
  };

  const startStreamReveal = () => {
    clearStreamReveal();
    streamBufferRef.current = '';
    streamRevealRawLenRef.current = 0;
    setStreamingContent('');
    streamRevealIntervalRef.current = setInterval(() => {
      const target = streamBufferRef.current;
      let len = streamRevealRawLenRef.current;
      if (len >= target.length) {
        if (target.length > 0) {
          setStreamingContent(formatAssistantReply(target));
        }
        return;
      }
      const lag = target.length - len;
      const step = lag > 120 ? 2 : 1;
      len = Math.min(target.length, len + step);
      streamRevealRawLenRef.current = len;
      setStreamingContent(formatAssistantReply(target.slice(0, len)));
    }, 115);
  };
  const executeConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'clear') {
      setSessions((prev) =>
      prev.map((s) => {
        if (s.id === confirmAction.chatId) {
          return {
            ...s,
            title: 'GabAI',
            messages: [createInitialGreeting()],
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      })
      );
      toast.success('Conversation cleared');
    } else if (confirmAction.type === 'delete') {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== confirmAction.chatId);
        if (filtered.length === 0) return [createNewSession()];
        return filtered;
      });
      if (activeChatId === confirmAction.chatId) {
        const remaining = sessions.filter((s) => s.id !== confirmAction.chatId);
        if (remaining.length > 0) setActiveChatId(remaining[0].id);
      }
      toast.success('Conversation deleted');
    }
    setConfirmAction(null);
  };
  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      setSessions((prev) =>
      prev.map((s) =>
      s.id === id ?
      {
        ...s,
        title: editTitle.trim(),
        updatedAt: new Date().toISOString()
      } :
      s
      )
      );
    }
    setEditingChatId(null);
  };
  // --- File Handling ---
  const processFile = (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error('File too large', {
        description: 'Maximum file size is 5MB.'
      });
      return;
    }
    const isImage = file.type.startsWith('image/');
    const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    if (!validTypes.includes(file.type) && !isImage) {
      toast.error('Invalid file type', {
        description: 'Please upload a supported image or document.'
      });
      return;
    }
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        setStagedAttachment({
          type: isImage ? 'image' : 'file',
          name: file.name,
          size: file.size,
          mimeType: file.type,
          dataUrl: e.target?.result as string
        });
        setIsProcessingFile(false);
      }, 600);
    };
    reader.onerror = () => {
      toast.error('Error reading file');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  // --- Messaging ---
  const streamGroqCompletion = useCallback(
    async (chatId: string, conversation: Message[]) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setIsStreaming(false);
      setStreamingContent('');
      streamBufferRef.current = '';
      clearStreamReveal();

      const contextMessages = conversation.slice(-20).map((m) => {
        let content = m.content;
        if (m.attachment) {
          const attachmentNote = `[User attached a ${m.attachment.type}: ${m.attachment.name} (${formatFileSize(m.attachment.size)})]`;
          content = content ? `${content}\n${attachmentNote}` : attachmentNote;
        }
        return {
          role: m.role,
          content
        };
      });
      const lastUserMessage =
        [...conversation].reverse().find((m) => m.role === 'user')?.content ?? '';
      const intent = detectIntent(lastUserMessage);
      const systemPrompt = buildSystemPrompt({
        userName: user.name,
        userRole: user.role,
        intent
      });
      const contextHint = `Context hint:
- Intent category: ${intent}
- Keep response useful even if not CITEzen-specific.
- If relevant, end with a short CITEzen-related next step.`;
      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextHint },
        ...contextMessages
      ];

      try {
        const url = `${getApiBase()}/api/chat/stream`;
        const token = localStorage.getItem('citezen_token');
        const response = await fetch(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: payloadMessages,
              temperature: 0.5,
              max_tokens: 768,
              stream: true
            })
          }
        );

        if (!response.ok) {
          const msg = await response.text().catch(() => '');
          throw new Error(msg || `Chat request failed (${response.status})`);
        }

        const contentType = response.headers.get('content-type') ?? '';

        const loweredContentType = contentType.toLowerCase();

        if (loweredContentType && !loweredContentType.includes('text/event-stream')) {
          const msg = await response.text().catch(() => '');
          throw new Error(
            msg ||
              `Unexpected response type from server (${contentType || 'unknown'})`
          );
        }

        setIsLoading(false);
        setIsStreaming(true);
        startStreamReveal();

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body');
        let pending = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          pending += decoder.decode(value, { stream: true });
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            if (line === 'data: [DONE]') continue;
            if (!line.startsWith('data: ')) continue;
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) streamBufferRef.current += delta;
            } catch {
              // Ignore malformed JSON; SSE lines can be split across chunks.
            }
          }
        }

        if (pending.trim()) {
          const line = pending.trim();
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) streamBufferRef.current += delta;
            } catch {
              // ignore
            }
          }
        }

        flushStreamDisplay();
        let fullContent = formatAssistantReply(streamBufferRef.current);
        streamBufferRef.current = '';
        clearStreamReveal();

        if (!fullContent.trim()) {
          const fallback = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: payloadMessages,
              temperature: 0.5,
              max_tokens: 768,
              stream: false
            })
          });

          if (!fallback.ok) {
            const fallbackText = await fallback.text().catch(() => '');
            throw new Error(
              fallbackText ||
                `Stream returned no tokens and fallback failed (${fallback.status}).`
            );
          }

          const fallbackData = (await fallback.json().catch(() => ({} as any))) as {
            content?: string;
          };
          fullContent = formatAssistantReply(String(fallbackData.content ?? ''));
          if (!fullContent.trim()) {
            throw new Error(
              'Stream returned no tokens and fallback response was empty.'
            );
          }
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === chatId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      role: 'assistant',
                      content: fullContent.trim()
                    }
                  ],
                  updatedAt: new Date().toISOString()
                }
              : s
          )
        );
        setIsStreaming(false);
        setStreamingContent('');
      } catch (error) {
        const anyErr = error as any;
        const isAbort =
          anyErr?.name === 'AbortError' ||
          String(anyErr?.message ?? '').toLowerCase().includes('aborted');

        if (isAbort) {
          flushStreamDisplay();
          const partial = formatAssistantReply(streamBufferRef.current.trim());
          streamBufferRef.current = '';
          clearStreamReveal();
          if (partial) {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === chatId
                  ? {
                      ...s,
                      messages: [
                        ...s.messages,
                        {
                          role: 'assistant',
                          content: partial
                        }
                      ],
                      updatedAt: new Date().toISOString()
                    }
                  : s
              )
            );
          }
          setIsStreaming(false);
          setStreamingContent('');
          return;
        }

        console.error('Chat error:', error);
        setIsStreaming(false);
        setStreamingContent('');
        streamBufferRef.current = '';
        clearStreamReveal();
        const rawMessage = String(
          anyErr?.message ||
            'Sorry, I encountered an error connecting to the server. Please try again later.'
        );
        const safeMessage =
          rawMessage.includes('<!DOCTYPE') || rawMessage.length > 400
            ? 'I had trouble completing your request. Please try again, or ask a shorter version of your question.'
            : rawMessage;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === chatId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      role: 'assistant',
                      content: safeMessage
                    }
                  ],
                  updatedAt: new Date().toISOString()
                }
              : s
          )
        );
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortRef.current = null;
        streamBufferRef.current = '';
        clearStreamReveal();
        setStreamingContent('');
      }
    },
    [user]
  );

  const copyMessageText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const resendUserMessageAt = async (index: number) => {
    if (isLoading || isStreaming) return;
    const sess = sessions.find((s) => s.id === activeChatId);
    if (!sess || sess.messages[index]?.role !== 'user') return;
    const trimmed = sess.messages.slice(0, index + 1);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? { ...s, messages: trimmed, updatedAt: new Date().toISOString() }
          : s
      )
    );
    await streamGroqCompletion(activeChatId, trimmed);
  };

  const regenerateAssistantAt = async (index: number) => {
    if (isLoading || isStreaming) return;
    const sess = sessions.find((s) => s.id === activeChatId);
    if (!sess || sess.messages[index]?.role !== 'assistant') return;
    const trimmed = sess.messages.slice(0, index);
    if (trimmed.length === 0) {
      toast.error('Nothing to regenerate from yet.');
      return;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? { ...s, messages: trimmed, updatedAt: new Date().toISOString() }
          : s
      )
    );
    await streamGroqCompletion(activeChatId, trimmed);
  };

  const saveInlineUserEdit = async (index: number) => {
    const text = inlineEditDraft.trim();
    if (!text) {
      toast.error('Message cannot be empty.');
      return;
    }
    if (isLoading || isStreaming) return;
    const sess = sessions.find((s) => s.id === activeChatId);
    if (!sess || sess.messages[index]?.role !== 'user') return;
    const updated = sess.messages.map((m, i) =>
      i === index ? { ...m, content: text } : m
    );
    const trimmed = updated.slice(0, index + 1);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? { ...s, messages: trimmed, updatedAt: new Date().toISOString() }
          : s
      )
    );
    setInlineEditIndex(null);
    setInlineEditDraft('');
    await streamGroqCompletion(activeChatId, trimmed);
  };

  const handleSend = async (textToSend?: string) => {
    const messageText =
      typeof textToSend === 'string' ? textToSend : input.trim();
    if (
      (!messageText && !stagedAttachment) ||
      isLoading ||
      isStreaming ||
      isProcessingFile ||
      !activeSession
    ) {
      return;
    }
    if (typeof textToSend !== 'string') setInput('');
    const currentAttachment = stagedAttachment;
    setStagedAttachment(null);
    setInlineEditIndex(null);
    setInlineEditDraft('');

    const newUserMessage: Message = {
      role: 'user',
      content: messageText,
      ...(currentAttachment && {
        attachment: currentAttachment
      })
    };
    const newMessages = [...activeSession.messages, newUserMessage];

    let newTitle = activeSession.title;
    if (activeSession.messages.length === 1 && newTitle === 'GabAI') {
      newTitle =
        messageText.slice(0, 40) + (messageText.length > 40 ? '...' : '');
      if (!newTitle && currentAttachment)
        newTitle = `Attached ${currentAttachment.type}`;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? {
              ...s,
              title: newTitle,
              messages: newMessages,
              updatedAt: new Date().toISOString()
            }
          : s
      )
    );

    await streamGroqCompletion(activeChatId, newMessages);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const suggestions = [
  'How do I submit a concern?',
  'Track my concern status',
  'What departments handle what?',
  'How does CITEzen work?'];

  // --- History Grouping ---
  const groupedSessions = useMemo(() => {
    const filtered = sessions.
    filter(
      (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.messages.some((m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).
    sort(
      (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return filtered.reduce(
      (acc, session) => {
        const group = getDateGroup(session.updatedAt);
        if (!acc[group]) acc[group] = [];
        acc[group].push(session);
        return acc;
      },
      {} as Record<string, ChatSession[]>
    );
  }, [sessions, searchQuery]);
  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];
  return (
    <>
      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxImage &&
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxImage(null)}>
          
            <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxImage(null)}>
            
              <XIcon className="h-6 w-6" />
            </button>
            <motion.img
            initial={{
              scale: 0.9,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            exit={{
              scale: 0.9,
              opacity: 0
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            src={lightboxImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
          
          </motion.div>
        }
      </AnimatePresence>

      {/* Main Chat Widget */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: 12
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: 12
          }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 320
          }}
          className={
            isStandaloneWindow
              ? 'h-full w-full min-h-0 max-h-full z-50 glass-panel flex flex-col overflow-hidden shadow-2xl shadow-purple-500/20 border-purple-500/30 rounded-none'
              : 'fixed inset-0 z-[60] h-[100dvh] min-h-[100dvh] w-full max-w-none glass-panel flex flex-col overflow-hidden shadow-2xl shadow-purple-500/20 border-white/10 rounded-none pt-[env(safe-area-inset-top,0px)] isolate'
          }>
          
            {/* Confirmation Modal */}
            <AnimatePresence>
              {confirmAction &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}
              className="absolute inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              
                  <motion.div
                initial={{
                  scale: 0.9,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0
                }}
                className="bg-dark-800 border border-white/10 rounded-xl p-5 w-full max-w-[280px] shadow-2xl text-center">
                
                    <AlertTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
                    <h4 className="text-white font-bold mb-2">Are you sure?</h4>
                    <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                      {confirmAction.type === 'clear' ?
                  'Clear this conversation? Messages will be permanently removed.' :
                  'Delete this conversation? This action cannot be undone.'}
                    </p>
                    <div className="flex gap-3">
                      <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium">
                    
                        Cancel
                      </button>
                      <button
                    onClick={executeConfirmAction}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors text-sm font-medium">
                    
                        {confirmAction.type === 'clear' ?
                    'Clear Chat' :
                    'Delete'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
            }
            </AnimatePresence>

            <div className="flex-1 relative overflow-hidden flex flex-col">
              <AnimatePresence mode="wait" initial={false}>
                {view === 'history' ?
              <motion.div
                key="history"
                initial={{
                  x: -20,
                  opacity: 0
                }}
                animate={{
                  x: 0,
                  opacity: 1
                }}
                exit={{
                  x: -20,
                  opacity: 0
                }}
                transition={{
                  duration: 0.2
                }}
                className="absolute inset-0 flex flex-col bg-dark-900">
                
                    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[320px] mx-auto">
                    {/* History Header */}
                    <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 bg-dark-900 shrink-0">
                      <h3 className="text-sm font-semibold text-white">
                        Chats
                      </h3>
                      <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close">
                    
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* History Search & New Chat */}
                    <div className="px-3 py-3 border-b border-white/10 bg-dark-900 shrink-0 space-y-2">
                      <button
                    type="button"
                    onClick={handleNewChat}
                    className="w-full min-h-[44px] py-2.5 rounded-lg border border-white/10 bg-transparent text-gray-200 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    
                        <PlusIcon className="h-4 w-4 shrink-0" /> New chat
                      </button>
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        <input
                      ref={historySearchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats…"
                      className="w-full bg-dark-800 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-0" />
                    
                      </div>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar">
                      {Object.keys(groupedSessions).length === 0 ?
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <MessageCircleIcon className="h-10 w-10 text-gray-600 mb-3" />
                          <p className="text-sm text-gray-500">
                            {sessions.length === 0
                              ? 'No chats yet'
                              : 'No conversations found'}
                          </p>
                        </div> :

                  groupOrder.map((group) => {
                    const groupSessions = groupedSessions[group];
                    if (!groupSessions || groupSessions.length === 0)
                    return null;
                    return (
                      <div key={group} className="space-y-1">
                              <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollapsedGroups((prev) => ({
                              ...prev,
                              [group]: !prev[group]
                            }));
                          }}
                          className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors group/header">
                          
                                <h4 className="text-xs font-medium text-gray-500">
                                  {group}
                                </h4>
                                <motion.div
                            animate={{
                              rotate: collapsedGroups[group] ? -90 : 0
                            }}
                            transition={{
                              duration: 0.2
                            }}>
                            
                                  <ChevronDownIcon className="h-3.5 w-3.5 text-gray-500 group-hover/header:text-gray-300 transition-colors" />
                                </motion.div>
                              </button>
                              <AnimatePresence initial={false}>
                                {!collapsedGroups[group] &&
                          groupSessions.map((session) => {
                            const isActive = session.id === activeChatId;
                            const isMenuOpen = openMenuSessionId === session.id;
                            return (
                              <div
                                key={session.id}
                                onClick={() => {
                                  if (editingChatId === session.id) return;
                                  setActiveChatId(session.id);
                                  setView('chat');
                                  setOpenMenuSessionId(null);
                                }}
                                className={`group relative flex items-center min-h-[44px] px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                
                                        {editingChatId === session.id ?
                                  <input
                                    autoFocus
                                    value={editTitle}
                                    onChange={(e) =>
                                    setEditTitle(e.target.value)
                                    }
                                    onBlur={() =>
                                    saveRename(session.id)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter')
                                      saveRename(session.id);
                                      if (e.key === 'Escape')
                                      setEditingChatId(null);
                                    }}
                                    className="flex-1 min-w-0 bg-dark-800 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
                                    onClick={(e) =>
                                    e.stopPropagation()
                                    } /> :


                                  <span
                                    className={`flex-1 min-w-0 text-sm font-medium truncate pr-8 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                    
                                              {session.title}
                                            </span>
                                  }

                                        {/* Row menu */}
                                        <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuSessionId(
                                        isMenuOpen ? null : session.id
                                      );
                                    }}
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition-colors shrink-0 ${isMenuOpen ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 max-md:opacity-100'}`}
                                    aria-label="Chat options">
                                    
                                            <MoreHorizontalIcon className="h-4 w-4" />
                                          </button>

                                        <AnimatePresence>
                                          {isMenuOpen &&
                                    <>
                                              <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuSessionId(null);
                                        }} />
                                      
                                              <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute right-0 top-full mt-1 z-50 w-36 bg-dark-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1"
                                        onClick={(e) => e.stopPropagation()}>
                                        
                                                <button
                                          type="button"
                                          onClick={() => {
                                            setEditTitle(session.title);
                                            setEditingChatId(session.id);
                                            setOpenMenuSessionId(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                                          
                                                  <PencilIcon className="h-3.5 w-3.5 text-gray-400" />
                                                  Rename
                                                </button>
                                                <button
                                          type="button"
                                          onClick={() => {
                                            setConfirmAction({
                                              type: 'delete',
                                              chatId: session.id
                                            });
                                            setOpenMenuSessionId(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                          
                                                  <Trash2Icon className="h-3.5 w-3.5" />
                                                  Delete
                                                </button>
                                              </motion.div>
                                            </>
                                    }
                                        </AnimatePresence>
                                      </div>);

                          })}
                              </AnimatePresence>
                            </div>);

                  })
                  }
                    </div>
                    </div>
                  </motion.div> :

              <motion.div
                key="chat"
                initial={{
                  x: 20,
                  opacity: 0
                }}
                animate={{
                  x: 0,
                  opacity: 1
                }}
                exit={{
                  x: 20,
                  opacity: 0
                }}
                transition={{
                  duration: 0.2
                }}
                className="absolute inset-0 flex flex-col bg-dark-900/50">
                
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-3 border-b border-white/10 bg-dark-800/80 backdrop-blur-md shrink-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                      onClick={() => setView('history')}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                      title="View History">
                      
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <motion.div
                          whileHover={{
                            scale: 1.05
                          }}
                          className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                          
                              <img
                            src={CITEZEN_LOGO}
                            alt="GabAI"
                            className="h-8 w-8 object-cover rounded-full" />
                          
                            </motion.div>
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-dark-800" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <h3 className="text-sm font-bold text-white truncate leading-tight">
                              {activeSession?.title || 'GabAI'}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                              </span>
                              <span className="text-[10px] font-medium text-green-400">
                                Online
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                      onClick={handleNewChat}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-colors"
                      title="GabAI">
                      
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                      onClick={() =>
                      setConfirmAction({
                        type: 'clear',
                        chatId: activeChatId
                      })
                      }
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-red-400 transition-colors"
                      title="Clear Chat">
                      
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                      onClick={() => setOpen(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                      
                          <XIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div
                  className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 custom-scrollbar relative"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}>
                  
                      {/* Drag Overlay */}
                      <AnimatePresence>
                        {isDragging &&
                    <motion.div
                      initial={{
                        opacity: 0
                      }}
                      animate={{
                        opacity: 1
                      }}
                      exit={{
                        opacity: 0
                      }}
                      className="absolute inset-0 z-10 bg-purple-500/10 backdrop-blur-sm border-2 border-dashed border-purple-500/50 rounded-xl m-2 flex flex-col items-center justify-center text-purple-400">
                      
                            <UploadCloudIcon className="h-12 w-12 mb-2 animate-bounce" />
                            <p className="font-medium">
                              Drop files here to attach
                            </p>
                          </motion.div>
                    }
                      </AnimatePresence>

                    <div className="mx-auto w-full max-w-3xl space-y-5 sm:space-y-6">
                      {activeSession?.messages.map((msg, index) => {
                    const isLast =
                    index === activeSession.messages.length - 1;
                    return (
                      <motion.div
                        key={index}
                        initial={
                        isLast ?
                        {
                          opacity: 0,
                          x: msg.role === 'user' ? 20 : -20
                        } :
                        false
                        }
                        animate={{
                          opacity: 1,
                          x: 0
                        }}
                        transition={{
                          type: 'spring',
                          damping: 25,
                          stiffness: 300
                        }}
                        className={`group/msg flex w-full items-start gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        
                            {msg.role === 'assistant' &&
                        <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                                <img
                            src={CITEZEN_LOGO}
                            alt="GabAI"
                            className="h-8 w-8 object-cover rounded-full" />
                          
                              </div>
                        }

                            <div
                          className={`flex min-w-0 max-w-[min(100%,36rem)] flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          
                              <div
                            className={`rounded-[1.35rem] px-4 py-2.5 text-[15px] leading-7 shadow-sm ${msg.role === 'user' ? 'chat-user-bubble chat-bubble-user' : 'chat-bubble-assistant'}`}>
                            
                                {msg.role === 'user' && inlineEditIndex === index ?
                            <div className="w-full min-w-[min(100%,16rem)] space-y-2">
                                    <textarea
                                value={inlineEditDraft}
                                onChange={(e) => setInlineEditDraft(e.target.value)}
                                rows={3}
                                className="chat-inline-edit w-full resize-y rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                disabled={isLoading || isStreaming} />
                                
                                    <div className="flex justify-end gap-2">
                                      <button
                                  type="button"
                                  onClick={() => {
                                    setInlineEditIndex(null);
                                    setInlineEditDraft('');
                                  }}
                                  className="chat-inline-cancel-btn rounded-lg px-3 py-1.5 text-xs text-[var(--chat-bubble-fg-muted)]">
                                  
                                        Cancel
                                      </button>
                                      <button
                                  type="button"
                                  onClick={() => void saveInlineUserEdit(index)}
                                  disabled={isLoading || isStreaming}
                                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40">
                                  
                                        Save & resend
                                      </button>
                                    </div>
                                  </div> :

                            <>
                                    {msg.content &&
                              <p className="whitespace-pre-wrap">
                                          {msg.role === 'assistant' ?
                                  formatAssistantReply(msg.content) :
                                  msg.content}
                                        </p>
                              }

                                    {msg.attachment &&
                              <div className={msg.content ? 'mt-2' : ''}>
                                          {msg.attachment.type === 'image' ?
                                <img
                                  src={msg.attachment.dataUrl}
                                  alt={msg.attachment.name}
                                  className="chat-attach-thumb max-w-[220px] w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                  onClick={() =>
                                  setLightboxImage(
                                    msg.attachment!.dataUrl
                                  )
                                  } /> :


                                <a
                                  href={msg.attachment.dataUrl}
                                  download={msg.attachment.name}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors no-underline text-current group ${msg.role === 'user' ? 'chat-attach-row-user hover:brightness-110' : 'chat-attach-row-asst hover:brightness-110'}`}>
                                  
                                          <div
                                    className={`p-2 rounded-lg ${msg.role === 'user' ? 'chat-attach-icon-user' : 'chat-attach-icon-asst'}`}>
                                    
                                            {msg.attachment.mimeType.includes(
                                      'pdf'
                                    ) ||
                                    msg.attachment.mimeType.includes(
                                      'text'
                                    ) ?
                                    <FileTextIcon className="h-4 w-4" /> :
                                    msg.attachment.mimeType.includes(
                                      'spreadsheet'
                                    ) ?
                                    <FileSpreadsheetIcon className="h-4 w-4" /> :

                                    <FileIcon className="h-4 w-4" />
                                    }
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                              {msg.attachment.name}
                                            </p>
                                            <p className="text-[10px] opacity-70">
                                              {formatFileSize(msg.attachment.size)}
                                            </p>
                                          </div>
                                          <DownloadIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 shrink-0 transition-opacity" />
                                        </a>
                                }
                                          </div>
                              }
                                  </>
                            }
                              </div>

                              {(msg.content || msg.role === 'assistant') &&
                              <div
                            className={`flex flex-wrap items-center gap-1 px-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/msg:opacity-100 sm:group-focus-within/msg:opacity-100 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            
                                <button
                              type="button"
                              onClick={() =>
                              void copyMessageText(
                                msg.role === 'assistant' ?
                                formatAssistantReply(msg.content) :
                                msg.content
                              )
                              }
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 hover:bg-white/5 hover:text-gray-200">
                              
                                    <CopyIcon className="h-3.5 w-3.5" />
                                    Copy
                                  </button>

                                {msg.role === 'user' && !msg.attachment &&
                              <>
                                    <button
                                  type="button"
                                  onClick={() => {
                                    if (isLoading || isStreaming) return;
                                    setInlineEditIndex(index);
                                    setInlineEditDraft(msg.content);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 hover:bg-white/5 hover:text-gray-200">
                                  
                                        <PencilIcon className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                    <button
                                  type="button"
                                  onClick={() => void resendUserMessageAt(index)}
                                  disabled={isLoading || isStreaming}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 hover:bg-white/5 hover:text-gray-200 disabled:opacity-40">
                                  
                                        <RefreshCwIcon className="h-3.5 w-3.5" />
                                        Resend
                                      </button>
                                  </>
                            }

                                {msg.role === 'assistant' &&
                              <button
                                type="button"
                                onClick={() => void regenerateAssistantAt(index)}
                                disabled={isLoading || isStreaming}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 hover:bg-white/5 hover:text-gray-200 disabled:opacity-40">
                                
                                    <RefreshCwIcon className="h-3.5 w-3.5" />
                                    Regenerate
                                  </button>
                            }
                              </div>
                            }
                            </div>

                            {msg.role === 'user' &&
                        <div className="relative mt-0.5 shrink-0">
                                <button
                            onClick={() =>
                            setActiveUserPopover(
                              activeUserPopover === index ?
                              null :
                              index
                            )
                            }
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center border border-purple-500/50 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            
                                  {user.profilePicture ?
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="h-full w-full object-cover" /> :


                            <span className="text-xs font-bold text-white">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                            }
                                </button>

                                <AnimatePresence>
                                  {activeUserPopover === index &&
                            <>
                                      <div
                                className="fixed inset-0 z-40"
                                onClick={() =>
                                setActiveUserPopover(null)
                                } />
                              
                                      <motion.div
                                initial={{
                                  opacity: 0,
                                  scale: 0.9,
                                  y: 10
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.9,
                                  y: 10
                                }}
                                className="absolute bottom-full right-0 mb-2 z-50 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                
                                        <div className="p-3 border-b border-white/5">
                                          <p className="text-sm font-bold text-white truncate">
                                            {user.name}
                                          </p>
                                          <p className="text-xs text-purple-400 capitalize font-medium">
                                            {user.role}
                                          </p>
                                        </div>
                                        <div className="p-3 bg-dark-900/50">
                                          <p className="text-xs text-gray-400 truncate mb-2">
                                            {user.email}
                                          </p>
                                          <div className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />{' '}
                                            View Profile
                                          </div>
                                        </div>
                                      </motion.div>
                                    </>
                            }
                                </AnimatePresence>
                              </div>
                        }
                          </motion.div>);

                  })}

                      {activeSession?.messages.length === 1 &&
                  activeSession.messages[0].role === 'assistant' &&
                  !isLoading &&
                  !isStreaming &&
                  <motion.div
                    initial={{
                      opacity: 0
                    }}
                    animate={{
                      opacity: 1
                    }}
                    transition={{
                      delay: 0.3,
                      staggerChildren: 0.1
                    }}
                    className="flex flex-wrap gap-2 mt-2 pl-0 sm:pl-11">
                    
                            {suggestions.map((suggestion, i) =>
                    <motion.button
                      key={i}
                      initial={{
                        opacity: 0,
                        y: 10
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      transition={{
                        delay: 0.3 + i * 0.1
                      }}
                      whileHover={{
                        scale: 1.03
                      }}
                      whileTap={{
                        scale: 0.97
                      }}
                      onClick={() => handleSend(suggestion)}
                      className="chat-chip text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 hover:border-purple-400/60 hover:bg-purple-500/20 hover:text-white active:bg-purple-500/30 px-3.5 py-2 rounded-full transition-all duration-200 text-left whitespace-nowrap shadow-sm">
                      
                                {suggestion}
                              </motion.button>
                    )}
                          </motion.div>
                  }

                      {isLoading &&
                  <div className="flex items-end gap-2 justify-start">
                          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 shrink-0 mb-1">
                            <img
                        src={CITEZEN_LOGO}
                        alt="GabAI"
                        className="h-8 w-8 object-cover rounded-full" />
                      
                          </div>
                          <div className="chat-bubble-assistant rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
                            <div className="flex gap-1">
                              <motion.div
                          animate={{
                            y: [0, -5, 0]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        
                              <motion.div
                          animate={{
                            y: [0, -5, 0]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.2
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        
                              <motion.div
                          animate={{
                            y: [0, -5, 0]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.4
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        
                            </div>
                          </div>
                        </div>
                  }

                      {/* Streaming message */}
                      {isStreaming && streamingContent &&
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -20
                    }}
                    animate={{
                      opacity: 1,
                      x: 0
                    }}
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 300
                    }}
                    className="flex items-end gap-2 justify-start">
                    
                          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 shrink-0 mb-1">
                            <img
                        src={CITEZEN_LOGO}
                        alt="GabAI"
                        className="h-8 w-8 object-cover rounded-full" />
                      
                          </div>
                          <div className="chat-bubble-assistant max-w-[85%] rounded-2xl px-4 py-2.5 text-sm rounded-bl-sm shadow-md">
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {streamingContent}
                              <span className="inline-block w-1.5 h-4 bg-purple-400 rounded-sm ml-0.5 animate-pulse align-middle" />
                            </p>
                          </div>
                        </motion.div>
                  }

                      <div ref={messagesEndRef} />
                    </div>
                    </div>

                    {/* Preview Bar */}
                    <AnimatePresence>
                      {(stagedAttachment || isProcessingFile) &&
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto'
                    }}
                    exit={{
                      opacity: 0,
                      height: 0
                    }}
                    className="px-3 pt-3 bg-dark-800/80 backdrop-blur-md border-t border-white/10">
                    
                          <div className="bg-dark-900 border border-white/10 rounded-xl p-2 flex items-center gap-3 relative overflow-hidden">
                            {isProcessingFile ?
                      <>
                                <div className="h-10 w-10 rounded-lg bg-dark-800 flex items-center justify-center border border-white/5">
                                  <Loader2Icon className="h-5 w-5 text-purple-400 animate-spin" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-400 font-medium mb-1.5">
                                    Processing file...
                                  </p>
                                  <div className="h-1 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <motion.div
                              className="h-full bg-purple-500"
                              initial={{
                                width: '0%'
                              }}
                              animate={{
                                width: '100%'
                              }}
                              transition={{
                                duration: 0.5
                              }} />
                            
                                  </div>
                                </div>
                              </> :
                      stagedAttachment ?
                      <>
                                {stagedAttachment.type === 'image' ?
                        <img
                          src={stagedAttachment.dataUrl}
                          alt="Preview"
                          className="h-10 w-10 rounded-lg object-cover border border-white/10" /> :


                        <div className="h-10 w-10 rounded-lg bg-dark-800 border border-white/10 flex items-center justify-center text-purple-400">
                                    {stagedAttachment.mimeType.includes(
                            'pdf'
                          ) ||
                          stagedAttachment.mimeType.includes(
                            'text'
                          ) ?
                          <FileTextIcon className="h-5 w-5" /> :
                          stagedAttachment.mimeType.includes(
                            'spreadsheet'
                          ) ?
                          <FileSpreadsheetIcon className="h-5 w-5" /> :

                          <FileIcon className="h-5 w-5" />
                          }
                                  </div>
                        }
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">
                                    {stagedAttachment.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(stagedAttachment.size)}
                                  </p>
                                </div>
                                <button
                          onClick={() => setStagedAttachment(null)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                          
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </> :
                      null}
                          </div>
                        </motion.div>
                  }
                    </AnimatePresence>

                    {/* Input Area */}
                    <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] border-t border-white/10 bg-dark-800/80 backdrop-blur-md shrink-0">
                      {inlineEditIndex !== null &&
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-200">
                          <span className="truncate">
                            Editing a message above. Save or cancel in the chat bubble.
                          </span>
                          <button
                          type="button"
                          onClick={() => {
                            setInlineEditIndex(null);
                            setInlineEditDraft('');
                          }}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs text-purple-200 hover:bg-white/10">
                          
                            Dismiss
                          </button>
                        </div>
                      }
                      <div className="flex items-center gap-2.5">
                        <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processFile(e.target.files[0]);
                          e.target.value = ''; // reset
                        }
                      }}
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                    
                        <div
                      className="chat-composer-pill min-w-0"
                      title="Type a message. Drag and drop a file onto the chat to attach.">
                      
                          <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything"
                        ref={inputRef}
                        className="chat-composer-input custom-scrollbar max-h-32"
                        rows={1}
                        disabled={isLoading || isStreaming || inlineEditIndex !== null} />
                        </div>
                        <button
                      type="button"
                      onClick={() => (isStreaming ? stopStreaming() : handleSend())}
                      disabled={
                      (!isStreaming && !input.trim() && !stagedAttachment) ||
                      isLoading ||
                      isProcessingFile ||
                      (!isStreaming && inlineEditIndex !== null)
                      }
                      title={isStreaming ? 'Stop' : 'Send'}
                      className={`chat-composer-send disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none ${isStreaming ? 'chat-composer-send-stop' : ''}`}>
                      
                          {isLoading ?
                      <Loader2Icon className="h-5 w-5 animate-spin" /> :

                      isStreaming ? <XIcon className="h-5 w-5" /> : <SendIcon className="h-5 w-5" />
                      }
                        </button>
                      </div>
                      {isStreaming &&
                      <div className="mt-1.5 text-[11px] text-gray-500 flex items-center justify-end">
                          Streaming… press{' '}
                          <span className="mx-1 rounded bg-white/5 px-1.5 py-0.5 border border-white/10 text-gray-300">
                            Stop
                          </span>{' '}
                          to interrupt.
                        </div>
                      }
                    </div>
                  </motion.div>
              }
              </AnimatePresence>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Floating Button — hidden while full-screen chat is open */}
      {!isStandaloneWindow && !isOpen &&
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{
          scale: 1.05
        }}
        whileTap={{
          scale: 0.95
        }}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-4 sm:right-6 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl z-[61] bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30 transition-colors duration-300">
        
        <AnimatePresence mode="wait">
          <motion.div
            key="chat"
            initial={{
              opacity: 0,
              rotate: 90
            }}
            animate={{
              opacity: 1,
              rotate: 0
            }}
            exit={{
              opacity: 0,
              rotate: -90
            }}
            transition={{
              duration: 0.2
            }}
            className="relative">
          
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                <img
                src={CITEZEN_LOGO}
                alt="Chat"
                className="h-9 w-9 object-cover rounded-full" />
              
              </div>
              {activeSession?.messages.length === 1 &&
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-purple-600"></span>
              </span>
          }
            </motion.div>
        </AnimatePresence>
      </motion.button>
      }
    </>);

}