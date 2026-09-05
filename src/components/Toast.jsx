import { createContext, useCallback, useContext, useRef, useState } from "react";
import "./Toast.css";

/**
 * Toast.jsx
 *
 * A lightweight, dependency-free toast notification system. Wrap the app
 * once with <ToastProvider> (see index.js), then any component anywhere
 * in the tree can call useToast().showToast(...) — no prop drilling needed.
 *
 * Replaces window.alert() for things like "failed to generate agent key" —
 * alert() blocks the entire page until dismissed, which feels jarring and
 * dated; a toast shows the same information without interrupting anything.
 */

const ToastContext = createContext(null);

let nextToastId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  /** type: "success" | "error" | "info" */
  const showToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismissToast(id), duration);
      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismissToast(t.id)}
            role="alert"
          >
            <span className="toast-icon" aria-hidden="true">
              {t.type === "success" ? "\u2713" : t.type === "error" ? "\u2715" : "i"}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be called from a component inside <ToastProvider>.");
  }
  return ctx;
}
