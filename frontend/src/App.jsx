import { useEffect, useState } from "react";
import { request } from "./api";
import IdentityPrompt from "./components/IdentityPrompt";
import HistoryDrawer from "./components/HistoryDrawer";
import ChatWindow from "./components/ChatWindow";

const starterMessage = {
  role: "assistant",
  content:
    "Hello! I'm your AI Chatbot. I can help answer questions, write and debug code, draft content, analyze problems, and much more. What would you like to work on today?",
  createdAt: new Date().toISOString(),
};

function profileFromToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      window
        .atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse Google ID token:", error);
    return {};
  }
}

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (identity) loadHistory();
  }, [identity]);

  useEffect(() => {
    if (!historyOpen) return;

    function handlePointerDown(event) {
      const drawer = document.querySelector(".history-drawer");
      const toggle = document.querySelector(".history-toggle-btn");
      const backdrop = document.querySelector(".history-backdrop");

      if (!drawer || !toggle) return;

      const clickedInsideDrawer = drawer.contains(event.target);
      const clickedToggle = toggle.contains(event.target);
      const clickedBackdrop = backdrop ? backdrop.contains(event.target) : false;

      if (!clickedInsideDrawer && !clickedToggle && !clickedBackdrop) {
        setHistoryOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [historyOpen]);

  async function loadHistory() {
    try {
      const query = identity.token
        ? ""
        : `?userName=${encodeURIComponent(identity.name)}`;

      const data = await request(`/api/chat/history${query}`, identity);
      setConversations(data.conversations || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function continueAs(nextIdentity) {
    if (nextIdentity.token) {
      const profile = profileFromToken(nextIdentity.token);
      setIdentity({
        token: nextIdentity.token,
        name: profile.name || profile.email,
        email: profile.email,
      });
    } else {
      setIdentity({
        name: nextIdentity.name,
      });
    }

    setMessages([starterMessage]);
    setConversationId("");
    setError("");
  }

  async function openConversation(id) {
    try {
      const data = await request(`/api/chat/history/${id}`, identity);
      setConversationId(id);
      setMessages(data.conversation.messages || []);
      setHistoryOpen(false);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteConversation(event, id) {
    event.stopPropagation();
    try {
      await request(`/api/chat/history/${id}`, identity, {
        method: "DELETE",
      });

      setConversations((current) =>
        current.filter((conversation) => conversation._id !== id)
      );

      if (conversationId === id) {
        startNewConversation();
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function sendMessage(event) {
    if (event) event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    setDraft("");
    setError("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);

    setLoading(true);

    try {
      const data = await request("/api/chat", identity, {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          userName: identity.name,
          message,
        }),
      });

      const assistantReply = {
        role: "assistant",
        content:
          data?.message?.content ||
          data?.reply ||
          "I'm here to help. What would you like to explore next?",
        createdAt: data?.message?.createdAt || new Date().toISOString(),
      };

      setConversationId(data.conversationId);
      setMessages((current) => [...current, assistantReply]);
      await loadHistory();
    } catch (requestError) {
      setError(requestError.message);
      setDraft(message);
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setConversationId("");
    setMessages([starterMessage]);
    setDraft("");
    setError("");
    setHistoryOpen(false);
  }

  function signOut() {
    setIdentity(null);
    setMessages([]);
    setConversations([]);
    setConversationId("");
  }

  if (!identity) {
    return <IdentityPrompt onContinue={continueAs} error={error} />;
  }

  return (
    <div className="app-layout">
      {/* Ambient background glows */}
      <div className="ambient-glow glow-1" aria-hidden="true" />
      <div className="ambient-glow glow-2" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="history-toggle-btn"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-expanded={historyOpen}
            aria-label="Toggle history menu"
          >
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
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>History</span>
            {conversations.length > 0 && (
              <span className="count-pill">{conversations.length}</span>
            )}
          </button>

          <button
            type="button"
            className="new-chat-top-btn"
            onClick={startNewConversation}
            title="Start new conversation"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        <div className="topbar-center">
          <div className="brand-badge">
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="brand-name">AI Chatbot</span>
            <span className="live-indicator">LIVE</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="user-profile-chip">
            <div className="user-avatar-badge">
              {identity.name ? identity.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="user-display-name">{identity.name}</span>
            <button
              type="button"
              className="sign-out-btn"
              onClick={signOut}
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* History Slide-out Drawer */}
      {historyOpen && (
        <>
          <div
            className="history-backdrop"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
          <HistoryDrawer
            conversations={conversations}
            activeId={conversationId}
            onOpen={openConversation}
            onDelete={deleteConversation}
            onNew={startNewConversation}
            onClose={() => setHistoryOpen(false)}
          />
        </>
      )}

      {/* Main Chat Layout Area */}
      <main className="main-content">
        <div className="chat-container-wrap">
          <ChatWindow
            user={identity}
            messages={messages}
            draft={draft}
            loading={loading}
            error={error}
            onDraftChange={setDraft}
            onSend={sendMessage}
            onNewChat={startNewConversation}
          />
        </div>
      </main>
    </div>
  );
}