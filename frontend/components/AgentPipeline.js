"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STAGES = [
  { key: "patient_history", label: "Patient History",        color: "#059669" },
  { key: "clinical_note",   label: "Clinical Note Writer",   color: "#0d9488" },
  { key: "consult_summary", label: "Medical Summary",        color: "#10b981" },
  { key: "treatment_plan",  label: "Treatment Planner",      color: "#047857" },
  { key: "followup_plan",   label: "Follow-up Coordinator",  color: "#14b8a6" },
  { key: "review",          label: "Documentation Reviewer", color: "#065f46" },
];

function stageStatus(result, key) {
  if (!result) return "pending";
  return result[key] ? "done" : "pending";
}

export default function AgentPipeline({ result, running }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-txt-muted">
          Agent Pipeline
        </p>
        {running && (
          <span className="chip chip-green text-[10px]">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>●</motion.span>
            &nbsp;Live
          </span>
        )}
      </div>

      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[17px] top-6 bottom-6 w-px bg-em-100" />

        <div className="space-y-1">
          {STAGES.map((stage, idx) => {
            const status   = stageStatus(result, stage.key);
            const isActive = running && status === "pending" &&
              (idx === 0 || stageStatus(result, STAGES[idx - 1].key) === "done");
            const isDone   = status === "done";

            return (
              <motion.div
                key={stage.key}
                className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
                style={{ background: isActive ? "#ecfdf5" : "transparent" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Icon */}
                <div className="relative z-10 shrink-0">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: `${stage.color}18`, border: `1.5px solid ${stage.color}55` }}>
                          <CheckCircle2 className="w-4 h-4" style={{ color: stage.color }} />
                        </div>
                      </motion.div>
                    ) : isActive ? (
                      <motion.div key="spin" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-em-300"
                          style={{ background: "#ecfdf5", boxShadow: "0 0 12px rgba(5,150,105,0.2)" }}>
                          <Loader2 className="w-4 h-4 text-em-600" />
                        </div>
                      </motion.div>
                    ) : (
                      <div key="idle" className="w-9 h-9 rounded-full flex items-center justify-center bg-em-50 border border-em-100">
                        <Circle className="w-3.5 h-3.5 text-em-200" />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? "text-em-800" : isActive ? "text-em-600" : "text-txt-muted"}`}>
                    {stage.label}
                  </p>
                  {isActive && <p className="text-[11px] text-em-500 mt-0.5">Processing…</p>}
                  {isDone   && <p className="text-[11px] text-em-400 mt-0.5">Complete</p>}
                </div>

                <span className="text-[10px] font-mono text-em-200 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
