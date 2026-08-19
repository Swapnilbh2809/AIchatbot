import { useEffect, useRef } from "react";

export default function ChatWindow({ user, messages, draft, loading, error, onDraftChange, onSend }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const normalizedMessages = Array.isArray(messages) ? messages : [];

  return (
    <section className="chat-card" aria-label="Support conversation">
      <div className="chat-header"><div><strong>CyVigilant assistant</strong><span>Typically replies in a few seconds</span></div><span className="live-badge">LIVE</span></div>
      <div className="messages" aria-live="polite">
        {normalizedMessages.map((message, index) => {
          const role = message?.role === "user" ? "user" : "assistant";
          const text = typeof message?.content === "string"
            ? message.content
            : typeof message?.text === "string"
              ? message.text
              : "";

          return (
            <div className={`message-row ${role}`} key={`${message?.createdAt || "message"}-${index}`}>
              <div className="avatar">{role === "assistant" ? "C" : (user?.name ? user.name.charAt(0).toUpperCase() : "?")}</div>
              <div className="bubble">
                <p>{text}</p>
                <time>{role === "assistant" ? "CyVigilant assistant" : "You"}</time>
              </div>
            </div>
          );
        })}
        {loading && <div className="message-row assistant"><div className="avatar">C</div><div className="bubble typing"><span /><span /><span /></div></div>}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={onSend}><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Write your message..." rows={1} maxLength={2000} disabled={loading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(event); } }} /><button type="submit" disabled={!draft.trim() || loading} aria-label="Send message">↑</button></form>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <p className="composer-hint">Press Enter to send · Shift + Enter for a new line</p>
    </section>
  );
}
