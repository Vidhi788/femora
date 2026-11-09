import { useEffect } from "react";
import { Check, Info, X } from "lucide-react";

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(onClose, toast.duration ?? 4400);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const good = toast.tone === "good";

  return (
    <div className={`toast ${good ? "toast-good" : "toast-info"}`} role="status" aria-live="polite">
      <div className="toast-icon" aria-hidden="true">
        {good ? <Check size={17} /> : <Info size={17} />}
      </div>

      <div>
        <strong>{toast.title}</strong>
        {toast.message ? <p>{toast.message}</p> : null}
      </div>

      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
