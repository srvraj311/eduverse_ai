import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpenCheck, Lightbulb, Menu, MessageCircle, MessageSquarePlus, Route, Square } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { useChat } from "../chat.jsx";
import Message from "../components/Message.jsx";
import ChatList from "../components/ChatList.jsx";

const MODES = [
  { id: "chat", label: "Ask", icon: MessageCircle, placeholder: "Ask me anything you want to learn…" },
  { id: "quiz", label: "Quiz", icon: BookOpenCheck, placeholder: "Quiz me on… (e.g. the French Revolution)" },
  { id: "plan", label: "Study plan", icon: Route, placeholder: "Plan to learn… (e.g. Python in 6 weeks)" },
];

const STARTERS = [
  { mode: "chat", text: "Explain how neural networks learn, simply", hue: "blue", icon: Lightbulb },
  { mode: "quiz", text: "Quiz me on the solar system", hue: "purple", icon: BookOpenCheck },
  { mode: "plan", text: "Study plan to learn Python in 6 weeks", hue: "green", icon: Route },
  { mode: "chat", text: "Why is the sky blue? Explain like I'm 10", hue: "orange", icon: Lightbulb },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Chat() {
  const { user } = useAuth();
  const { messages, loaded, busy, send, stop, retry, patchMessage, chats, activeId, newChat } = useChat();
  const [mode, setMode] = useState("chat");
  const [text, setText] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef(null);
  const input = useRef(null);
  const stick = useRef(true);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (stick.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (loaded) scrollToBottom();
  }, [loaded, scrollToBottom]);

  const onScroll = () => {
    const el = scroller.current;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setAtBottom(near);
  };

  const resize = () => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const submit = (override, overrideMode) => {
    const value = (override ?? text).trim();
    if (!value || busy) return;
    stick.current = true;
    send(value, overrideMode ?? mode);
    setText("");
    requestAnimationFrame(resize);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const empty = loaded && messages.length === 0;
  const active = MODES.find((m) => m.id === mode);

  return (
    <div className="chat-layout">
      <aside className={`chat-side glass ${listOpen ? "open" : ""}`}>
        <ChatList onPick={() => setListOpen(false)} />
      </aside>
      {listOpen && <div className="scrim" onClick={() => setListOpen(false)} />}
    <div className="chat">
      <header className="chat-top">
        <div className="row gap">
          <button className="btn btn-sm btn-ghost only-mobile" onClick={() => setListOpen(true)} aria-label="Chats"><Menu size={16} /></button>
          <h1>{chats.find((c) => c.id === activeId)?.title ?? "New chat"}</h1>
        </div>
        <button className="btn btn-sm btn-ghost only-mobile" onClick={newChat} aria-label="New chat"><MessageSquarePlus size={14} /></button>
      </header>

      <div className="scroller" ref={scroller} onScroll={onScroll}>
        <div className="thread">
          {empty && (
            <div className="empty">
              <h2><span className="grad">{greeting()}, {user.name.split(" ")[0]}.</span></h2>
              <p>What would you like to learn today?</p>
              <div className="starters">
                {STARTERS.map(({ text: t, mode: m, hue, icon: Icon }) => (
                  <button key={t} className={`starter glass hue-${hue}`} onClick={() => submit(t, m)}>
                    <span className="feature-icon"><Icon size={18} /></span>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <Message key={m.id} m={m} isLast={i === messages.length - 1} onRetry={retry} onSend={send} patchMessage={patchMessage} />
          ))}
        </div>
      </div>

      {!atBottom && (
        <button className="jump glass" onClick={() => { stick.current = true; scrollToBottom(true); }} aria-label="Scroll to latest">
          <ArrowDown size={18} />
        </button>
      )}

      <div className="composer-wrap">
        <div className="composer glass">
          <div className="modes" role="radiogroup" aria-label="Mode">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button key={id} role="radio" aria-checked={mode === id} className={`mode ${mode === id ? "on" : ""}`} onClick={() => setMode(id)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="input-row">
            <textarea
              ref={input}
              rows={1}
              value={text}
              maxLength={4000}
              placeholder={active.placeholder}
              onChange={(e) => { setText(e.target.value); resize(); }}
              onKeyDown={onKey}
              aria-label="Message"
            />
            {busy ? (
              <button className="send stop" onClick={stop} aria-label="Stop generating"><Square size={14} fill="currentColor" /></button>
            ) : (
              <button className="send" onClick={() => submit()} disabled={!text.trim()} aria-label="Send"><ArrowUp size={18} /></button>
            )}
          </div>
        </div>
        <p className="fineprint">Eduverse can make mistakes. Double-check important facts.</p>
      </div>
    </div>
    </div>
  );
}
