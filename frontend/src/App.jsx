import { useEffect, useState } from "react";
import { request } from "./api";
import IdentityPrompt from "./components/IdentityPrompt";
import HistoryDrawer from "./components/HistoryDrawer";
import ChatWindow from "./components/ChatWindow";

const starterMessage = {
  role: "assistant",
  content:
    "Hi, I'm your CyVigilant support assistant. Tell me what you need help with and I'll point you in the right direction.",
};

function profileFromToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
    const jsonPayload = decodeURIComponent(
      window.atob(padded)
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
      const drawer = document.querySelector('.history-drawer');
      const toggle = document.querySelector('.history-toggle');
      const backdrop = document.querySelector('.history-backdrop');

      if (!drawer || !toggle) return;

      const clickedInsideDrawer = drawer.contains(event.target);
      const clickedToggle = toggle.contains(event.target);
      const clickedBackdrop = backdrop ? backdrop.contains(event.target) : false;

      if (!clickedInsideDrawer && !clickedToggle && !clickedBackdrop) {
        setHistoryOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [historyOpen]);

  async function loadHistory() {
    try {
      const query = identity.token
        ? ""
        : `?userName=${encodeURIComponent(identity.name)}`;

      const data = await request(
        `/api/chat/history${query}`,
        identity
      );

      setConversations(data.conversations);
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
      const data = await request(
        `/api/chat/history/${id}`,
        identity
      );

      setConversationId(id);
      setMessages(data.conversation.messages);
      setHistoryOpen(false);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteConversation(event, id) {
    event.stopPropagation();

    try {
      await request(
        `/api/chat/history/${id}`,
        identity,
        {
          method: "DELETE",
        }
      );

      setConversations((current) =>
        current.filter(
          (conversation) => conversation._id !== id
        )
      );

      if (conversationId === id) {
        startNewConversation();
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || loading) return;

    setDraft("");
    setError("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setLoading(true);

    try {
      const data = await request(
        "/api/chat",
        identity,
        {
          method: "POST",
          body: JSON.stringify({
            conversationId,
            userName: identity.name,
            message,
          }),
        }
      );

      const assistantReply = {
        role: "assistant",
        content:
          data?.message?.content ||
          data?.reply ||
          "I’m here to help. Please try again.",
      };

      setConversationId(data.conversationId);

      setMessages((current) => [
        ...current,
        assistantReply,
      ]);

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
    return (
      <IdentityPrompt
        onContinue={continueAs}
        error={error}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="history-toggle"
          onClick={() => setHistoryOpen((open) => !open)}
          aria-expanded={historyOpen}
        >
          ☰ <span>History</span>
        </button>

        <div className="brand-mark small">
          C<span>·</span>V
        </div>

        <div className="topbar-label">
          Support desk <span>/</span> Live assistant
        </div>

        <div className="account">
          <span>{identity.name}</span>

          <button onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {historyOpen && (
        <>
          <button
            type="button"
            className="history-backdrop"
            aria-label="Close history"
            onClick={() => setHistoryOpen(false)}
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

      <section className="centered-chat-layout">
        <div className="chat-intro">
          <p className="eyebrow">
            Your conversation
          </p>

          <h1>
            How can we help?
          </h1>

          <p>
            Ask anything about CyVigilant. This chat is saved under{" "}
            <strong>{identity.name}</strong>.
          </p>
        </div>

        <ChatWindow
          user={identity}
          messages={messages}
          draft={draft}
          loading={loading}
          error={error}
          onDraftChange={setDraft}
          onSend={sendMessage}
        />
      </section>
    </main>
  );
}