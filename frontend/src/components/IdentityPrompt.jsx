import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function IdentityPrompt({ onContinue, error }) {
  const [name, setName] = useState("");
  const googleRef = useRef(null);

  useEffect(() => {
    function renderGoogle() {
      if (!GOOGLE_CLIENT_ID || !window.google || !googleRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onContinue({ token: response.credential }),
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 300,
      });
    }

    window.addEventListener("google-loaded", renderGoogle);
    renderGoogle();
    return () => window.removeEventListener("google-loaded", renderGoogle);
  }, [onContinue]);

  function handleSubmit(event) {
    event.preventDefault();
    if (name.trim()) {
      onContinue({ name: name.trim() });
    }
  }

  return (
    <main className="identity-screen">
      {/* Ambient background glows */}
      <div className="ambient-glow glow-1" aria-hidden="true" />
      <div className="ambient-glow glow-2" aria-hidden="true" />

      <div className="identity-card-wrapper">
        <section className="identity-card" aria-labelledby="welcome-title">
          {/* Header Brand */}
          <div className="identity-header">
            <div className="brand-logo-large">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h1 id="welcome-title">AI Chatbot</h1>
          </div>

          {/* Guest Name Form */}
          <form className="identity-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="visitor-name">Enter your name to begin</label>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="visitor-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex, Sarah, or Developer"
                  maxLength={80}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!name.trim()}
            >
              <span>Get Started</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          {/* Social Auth Option */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="divider-row">
                <span>or continue with Google</span>
              </div>
              <div className="google-auth-container" ref={googleRef} />
            </>
          )}

          {error && (
            <div className="identity-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
