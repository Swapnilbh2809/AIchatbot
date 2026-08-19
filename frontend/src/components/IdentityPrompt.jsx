import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function IdentityPrompt({ onContinue, error }) {
  const [name, setName] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const googleRef = useRef(null);

  useEffect(() => {
    function renderGoogle() {
      if (!GOOGLE_CLIENT_ID || !window.google || !googleRef.current) {
        setGoogleAvailable(false);
        return;
      }

      try {
        if (!window.google.accounts?.id) {
          setGoogleAvailable(false);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onContinue({ token: response.credential }),
        });

        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: 280,
        });

        setGoogleAvailable(true);
      } catch (loadError) {
        console.warn("Google sign-in failed to initialize:", loadError);
        setGoogleAvailable(false);
      }
    }

    window.addEventListener("google-loaded", renderGoogle);
    renderGoogle();
    return () => window.removeEventListener("google-loaded", renderGoogle);
  }, [onContinue]);

  function submit(event) {
    event.preventDefault();
    if (name.trim()) onContinue({ name: name.trim() });
  }

  return (
    <main className="identity-screen">
      <section className="identity-prompt" aria-labelledby="welcome-title">
        

        <h1 id="welcome-title">AI ChatBot</h1>
        <form className="name-form" onSubmit={submit}>
        <div className="name-row">
            <input id="visitor-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Type your name" maxLength={80} autoFocus />
            <button type="submit">Let's Begin <span aria-hidden="true">→</span></button>
          </div>
        </form>
        <div className="prompt-divider"><span>or</span></div>
        {GOOGLE_CLIENT_ID && googleAvailable ? (
          <div className="google-button" ref={googleRef} />
        ) : GOOGLE_CLIENT_ID ? (
          <p className="error-message">Google sign-in is blocked in this browser. You can still continue with your name.</p>
        ) : (
          <p className="error-message">Google sign-in is not configured.</p>
        )}
        <p className="storage-warning">Your conversations are stored using the name which you'll enter, the name is case sensitive, or Google account.</p>
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>
    </main>
  );
}
