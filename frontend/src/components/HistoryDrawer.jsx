import { useState, useMemo } from "react";

function formatConversationDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export default function HistoryDrawer({
  conversations,
  activeId,
  onOpen,
  onDelete,
  onNew,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) =>
      (c.title || "").toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  return (
    <aside
      className="history-drawer"
      onClick={(e) => e.stopPropagation()}
      aria-label="Conversation history"
    >
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-title-group">
          <div className="drawer-icon-wrap">
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3>Chat History</h3>
            <span className="drawer-badge">
              {conversations.length}{" "}
              {conversations.length === 1 ? "thread" : "threads"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="drawer-close-btn"
          onClick={onClose}
          aria-label="Close history drawer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <button
        type="button"
        className="drawer-new-chat-btn"
        onClick={onNew}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Conversation</span>
      </button>

      {/* Search Input (visible if there are conversations) */}
      {conversations.length > 2 && (
        <div className="drawer-search-wrap">
          <svg
            className="search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="drawer-search-input"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="conversations-scroll">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isSelected = conv._id === activeId;
            const messageCount = conv.messages?.length || 0;
            const dateDisplay = formatConversationDate(conv.updatedAt || conv.createdAt);

            return (
              <div
                key={conv._id}
                className={`conversation-card ${isSelected ? "active" : ""}`}
                onClick={() => onOpen(conv._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(conv._id);
                  }
                }}
              >
                <div className="conv-content">
                  <span className="conv-title">{conv.title || "Untitled Conversation"}</span>
                  <div className="conv-footer">
                    <span className="conv-date">{dateDisplay}</span>
                    {messageCount > 0 && (
                      <span className="conv-count">
                        {messageCount} {messageCount === 1 ? "msg" : "msgs"}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="conv-delete-btn"
                  onClick={(e) => onDelete(e, conv._id)}
                  aria-label={`Delete conversation ${conv.title}`}
                  title="Delete conversation"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-history-state">
            <div className="empty-icon-wrap">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p>
              {searchTerm
                ? "No chats matching your search."
                : "No saved conversations yet."}
            </p>
            <span className="empty-subtext">
              {searchTerm
                ? "Try searching for a different keyword."
                : "Your chat threads will appear here automatically."}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
