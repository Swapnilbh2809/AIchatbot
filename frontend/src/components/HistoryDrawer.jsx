export default function HistoryDrawer({ conversations, activeId, onOpen, onDelete, onNew, onClose }) {
  return (
    <aside className="history-drawer">
      <div className="history-heading">
        <div><p className="eyebrow">Your archive</p><h2>Past chats</h2></div>
        <button onClick={onClose} aria-label="Close history">×</button>
      </div>
      <button className="new-chat-button" onClick={onNew}>＋ New conversation</button>
      <div className="conversation-list">
        {conversations.length ? conversations.map((conversation) => (
          <div className={`conversation-item ${conversation._id === activeId ? "selected" : ""}`} key={conversation._id} onClick={() => onOpen(conversation._id)} role="button" tabIndex="0">
            <span className="conversation-copy"><strong>{conversation.title}</strong><small>{new Date(conversation.updatedAt).toLocaleDateString()} · {conversation.messages.length} messages</small></span>
            <button className="delete-button" onClick={(event) => onDelete(event, conversation._id)} aria-label={`Delete ${conversation.title}`}>⌫</button>
          </div>
        )) : <p className="empty-history">No saved conversations yet.</p>}
      </div>
    </aside>
  );
}
