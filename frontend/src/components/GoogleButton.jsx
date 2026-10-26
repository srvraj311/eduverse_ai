import { useEffect, useRef, useState } from "react";
import { api } from "../api";

const SRC = "https://accounts.google.com/gsi/client";
let scriptPromise;

function loadGsi() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Couldn't load Google sign-in"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** "Continue with Google" via Google Identity Services. Renders nothing unless the server has GOOGLE_CLIENT_ID. */
export default function GoogleButton({ onCredential, onError }) {
  const box = useRef(null);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    api.authConfig().then((c) => setClientId(c.google_client_id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId || !box.current) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => onCredential(res.credential),
        });
        const light = (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")) === "light";
        window.google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: light ? "outline" : "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: box.current.offsetWidth || 320,
        });
      })
      .catch((e) => onError?.(e.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, onError]);

  if (!clientId) return null;
  return (
    <>
      <div className="or"><span>or</span></div>
      <div className="google-btn" ref={box} />
    </>
  );
}
