import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, streamChat } from "./api";

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

let tempId = 0;
const nextId = () => `tmp-${++tempId}`;

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null); // null = a fresh, not-yet-created chat
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const activeRef = useRef(null);
  const lastRequest = useRef(null);

  const open = useCallback(async (id) => {
    abortRef.current?.abort();
    activeRef.current = id;
    setActiveId(id);
    setMessages([]);
    if (!id) return;
    try {
      const d = await api.chatMessages(id);
      if (activeRef.current === id) setMessages(d.messages);
    } catch {
      /* chat vanished; stay empty */
    }
  }, []);

  useEffect(() => {
    api
      .chats()
      .then((d) => {
        setChats(d.chats);
        if (d.chats[0]) return open(d.chats[0].id);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open]);

  const patchLast = useCallback((fn) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const copy = prev.slice();
      copy[copy.length - 1] = fn(copy[copy.length - 1]);
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text, mode = "chat") => {
      const message = text.trim();
      if (!message || busy) return;
      lastRequest.current = { message, mode };
      const controller = new AbortController();
      abortRef.current = controller;
      const chatAtStart = activeRef.current;
      setBusy(true);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", type: "text", content: message },
        { id: nextId(), role: "assistant", type: "text", content: "", streaming: true, status: mode === "chat" ? "" : "Working on it…" },
      ]);
      try {
        await streamChat(
          message,
          mode,
          chatAtStart,
          {
            start: ({ chat_id, title, new: isNew }) => {
              activeRef.current = chat_id;
              setActiveId(chat_id);
              const now = new Date().toISOString();
              setChats((cs) => (isNew ? [{ id: chat_id, title, updated: now }, ...cs] : [{ ...cs.find((c) => c.id === chat_id), updated: now }, ...cs.filter((c) => c.id !== chat_id)]));
            },
            delta: ({ t }) => patchLast((m) => ({ ...m, content: m.content + t, status: "" })),
            status: ({ t }) => patchLast((m) => ({ ...m, status: t })),
            block: ({ id, type, content }) => patchLast((m) => ({ ...m, id, type, content, status: "" })),
            error: ({ message: err }) => patchLast((m) => ({ ...m, error: err })),
            checking: () => patchLast((m) => ({ ...m, checking: true })),
            review: ({ verdict, notes, text }) =>
              patchLast((m) => ({ ...m, checking: false, review: { verdict, notes }, ...(text ? { content: text } : {}) })),
            done: ({ id }) => patchLast((m) => ({ ...m, id: id || m.id, streaming: false, status: "" })),
          },
          controller.signal,
        );
      } catch (e) {
        patchLast((m) => ({ ...m, error: e.message }));
      } finally {
        patchLast((m) => ({ ...m, streaming: false, checking: false, status: "" }));
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, patchLast],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const retry = useCallback(() => {
    const req = lastRequest.current;
    if (!req) return;
    setMessages((prev) => {
      const copy = prev.slice();
      if (copy.at(-1)?.error) copy.pop();
      if (copy.at(-1)?.role === "user") copy.pop();
      return copy;
    });
    setTimeout(() => send(req.message, req.mode), 0);
  }, [send]);

  const newChat = useCallback(() => open(null), [open]);

  const removeChat = useCallback(
    async (id) => {
      await api.deleteChat(id);
      setChats((cs) => cs.filter((c) => c.id !== id));
      if (activeRef.current === id) await open(null);
    },
    [open],
  );

  const renameChat = useCallback(async (id, title) => {
    const updated = await api.renameChat(id, title);
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
  }, []);

  const patchMessage = useCallback((id, patch) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const value = useMemo(
    () => ({ chats, activeId, messages, loaded, busy, send, stop, retry, open, newChat, removeChat, renameChat, patchMessage }),
    [chats, activeId, messages, loaded, busy, send, stop, retry, open, newChat, removeChat, renameChat, patchMessage],
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
