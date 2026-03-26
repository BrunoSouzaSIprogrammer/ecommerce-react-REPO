import { useEffect } from "react";

export default function Toast({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "var(--card)",
      color: "var(--text)",
      padding: "12px 20px",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
      zIndex: 999
    }}>
      {message}
    </div>
  );
}