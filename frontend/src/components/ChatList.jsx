import { useState } from "react";
import { Check, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { useChat } from "../chat.jsx";

function group(chats) {
  const today = new Date().setHours(0, 0, 0, 0);
  const day = 86400000;
  const buckets = [["Today", []], ["Yesterday", []], ["Previous 7 days", []], ["Older", []]];
  for (const c of chats) {
    const age = (today - new Date(c.updated).setHours(0, 0, 0, 0)) / day;
    buckets[age <= 0 ? 0 : age <= 1 ? 1 : age <= 7 ? 2 : 3][1].push(c);
  }
  return buckets.filter(([, items]) => items.length);
}

export default function ChatList({ onPick }) {
  const { chats, activeId, open, newChat, removeChat, renameChat } = useChat();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(null);

  const commit = async () => {
    const title = draft.trim();
    const id = editing;
    setEditing(null);
    if (title && id) await renameChat(id, title);
  };

  return (
    <div className="chatlist">
      <button className="btn newchat" onClick={() => { newChat(); onPick?.(); }}>
        <MessageSquarePlus size={16} /> New chat
      </button>
      <div className="chatlist-scroll">
        {chats.length === 0 && <p className="muted small pad">Your conversations will appear here.</p>}
        {group(chats).map(([label, items]) => (
          <section key={label}>
            <h4>{label}</h4>
            {items.map((c) => (
              <div key={c.id} className={`chatitem ${c.id === activeId ? "active" : ""}`}>
                {editing === c.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); commit(); }} className="rename">
                    <input autoFocus value={draft} maxLength={80} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
                  </form>
                ) : confirm === c.id ? (
                  <div className="confirm">
                    <span>Delete chat?</span>
                    <button className="danger" onClick={() => { removeChat(c.id); setConfirm(null); }} aria-label="Confirm delete"><Check size={14} /></button>
                    <button onClick={() => setConfirm(null)} aria-label="Cancel"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <button className="chatitem-main" onClick={() => { open(c.id); onPick?.(); }} title={c.title}>{c.title}</button>
                    <span className="chatitem-actions">
                      <button onClick={() => { setEditing(c.id); setDraft(c.title); }} aria-label="Rename chat"><Pencil size={13} /></button>
                      <button onClick={() => setConfirm(c.id)} aria-label="Delete chat"><Trash2 size={13} /></button>
                    </span>
                  </>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
