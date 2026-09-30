import { useEffect, useRef, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

function MessageRow({ message, user }) {
  const [copied, setCopied] = useState(false);
  const role = message?.role === "user" ? "user" : "assistant";
  const text =
    typeof message?.content === "string"
      ? message.content
      : typeof message?.text === "string"
      ? message.text
      : "";

  const timeFormatted = message?.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  function handleCopyAll() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className={`message-row ${role}`}>
      <div className="avatar-wrapper">
        <div className={`avatar ${role}`}>
          {role === "assistant" ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : user?.name ? (
            user.name.charAt(0).toUpperCase()
          ) : (
            "U"
          )}
        </div>
      </div>

      <div className="bubble-wrapper">
        <div className="message-meta">
          <span className="author-name">
            {role === "assistant" ? "AI Chatbot" : user?.name || "You"}
          </span>
          {timeFormatted && <span className="message-time">{timeFormatted}</span>}
        </div>

        <div className="bubble">
          {role === "assistant" ? (
            <MarkdownRenderer content={text} />
          ) : (
            <p className="user-message-text">{text}</p>
          )}
        </div>

        {role === "assistant" && text.length > 0 && (
          <div className="message-actions">
            <button
              type="button"
              className="action-btn"
              onClick={handleCopyAll}
              title="Copy response"
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({
  user,
  messages,
  draft,
  loading,
  error,
  onDraftChange,
  onSend,
  onNewChat,
}) {
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea based on input
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
    textareaRef.current.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [draft]);

  const normalizedMessages = Array.isArray(messages) ? messages : [];
  const showHero =
    normalizedMessages.length <= 1 &&
    (!normalizedMessages[0] ||
      normalizedMessages[0].role === "assistant" &&
      normalizedMessages.length === 1);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim() && !loading) {
        onSend(event);
      }
    }
  }

  return (
    <section className="chat-card" aria-label="AI Conversation Window">
      {/* Chat Card Header */}
      <div className="chat-header">
        <div className="header-info">
          <div className="header-avatar">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="status-ping" aria-hidden="true" />
          </div>
          <div className="header-title-row">
            <strong>AI Chatbot</strong>
          </div>
        </div>

        <div className="header-actions">
          {onNewChat && (
            <button
              type="button"
              className="header-new-btn"
              onClick={onNewChat}
              title="Start a new chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="messages" aria-live="polite">
        {showHero && (
          <div className="empty-chat-hero">
            <div className="hero-sparkle-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
                <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                <path d="M19 11h2m-1 -1v2" />
              </svg>
            </div>
            <h2>What can I help you discover today?</h2>
            <p>
              Ask any question, analyze data, debug code, or brainstorm ideas.
            </p>
          </div>
        )}

        {normalizedMessages.map((msg, index) => (
          <MessageRow
            key={`${msg?.createdAt || "msg"}-${index}`}
            message={msg}
            user={user}
          />
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="avatar-wrapper">
              <div className="avatar assistant">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="bubble-wrapper">
              <div className="message-meta">
                <span className="author-name">AI Chatbot</span>
              </div>
              <div className="bubble typing-indicator">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="typing-text">Generating response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Error Notification */}
      {error && (
        <div className="chat-error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Chat Composer */}
      <form className="composer-container" onSubmit={onSend}>
        <div className="composer-box">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Chatbot... (Shift + Enter for new line)"
            rows={1}
            maxLength={2000}
            disabled={loading}
          />

          <div className="composer-toolbar">
            <span className="char-count">
              {draft.length > 1500 ? `${draft.length}/2000` : ""}
            </span>

            <button
              type="submit"
              className="send-button"
              disabled={!draft.trim() || loading}
              aria-label="Send message"
            >
              {loading ? (
                <div className="spinner-icon" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="composer-caption">
          AI Chatbot can make mistakes. Verify important information.
        </p>
      </form>
    </section>
  );
}
