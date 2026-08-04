"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Toast({ message, onDismiss, type = "error" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 6000);
      return () => clearTimeout(t);
    }
  }, [message, onDismiss]);

  const styles = {
    error: { bg: "bg-rose-50",  border: "border-rose-200", text: "text-rose-700",  Icon: AlertCircle  },
    warn:  { bg: "bg-amber-50", border: "border-amber-200",text: "text-amber-700", Icon: AlertCircle  },
    info:  { bg: "bg-em-50",    border: "border-em-200",   text: "text-em-700",    Icon: CheckCircle2 },
  };
  const s = styles[type] || styles.error;

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3
                      max-w-xl w-full mx-4 px-4 py-3 rounded-xl border shadow-md
                      ${s.bg} ${s.border} ${s.text}`}
          role="alert"
        >
          <s.Icon className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
          <button
            onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
