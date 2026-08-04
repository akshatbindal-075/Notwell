"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Check } from "lucide-react";
import { createPatient } from "@/lib/api";

export default function NewPatientForm({ onCreated }) {
  const [open, setOpen]     = useState(false);
  const [name, setName]     = useState("");
  const [dob, setDob]       = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  async function handleCreate() {
    if (!name) return;
    setSaving(true); setError(null);
    try {
      const patient = await createPatient({ name, dob: dob || undefined });
      onCreated(patient.id);
      setOpen(false); setName(""); setDob("");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-em-600 hover:text-em-700 transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        {open ? "Cancel" : "New patient"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 bg-em-50 rounded-xl border border-em-100 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patient full name"
                className="green-input"
              />
              <input
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="Date of birth (optional, e.g. 1990-04-12)"
                className="green-input"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={saving || !name}
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-2 text-xs font-bold transition-all disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 3px 10px rgba(5,150,105,0.3)" }}
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Creating…" : "Create patient"}
              </motion.button>
              {error && <p className="text-xs text-rose-500">{error}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
