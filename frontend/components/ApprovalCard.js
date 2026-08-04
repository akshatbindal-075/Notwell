"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, Check, X } from "lucide-react";

export default function ApprovalCard({ review, onDecision }) {
  const [reviewerName, setReviewerName] = useState("");
  const [comments, setComments]         = useState("");
  if (!review) return null;

  const issues = review.issues || [];
  const sev = (s) => ({
    low:      { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669" },
    moderate: { bg: "#fefce8", border: "#fde68a", text: "#854d0e" },
    high:     { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
    critical: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  })[s?.toLowerCase()] || { bg: "#f9fafb", border: "#e5e7eb", text: "#4b5563" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-em-100 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-em-100 border border-em-200">
          <ShieldCheck className="w-4 h-4 text-em-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-em-900">Human Approval Required</p>
          <p className="text-[11px] text-txt-muted">Review and approve before finalizing</p>
        </div>
        {issues.length > 0 && (
          <span className="chip chip-orange">
            <AlertTriangle className="w-3 h-3" />
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {review.reviewer_notes && (
          <p className="text-sm text-txt-secondary leading-relaxed">{review.reviewer_notes}</p>
        )}

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            {issues.map((issue, i) => {
              const s = sev(issue.severity);
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.text }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-em-900">{issue.field}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-txt-muted">{issue.issue}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3 pt-1">
          <input
            placeholder="Your name (reviewing clinician)"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="green-input"
          />
          <textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            className="green-input resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.97 }} whileHover={{ scale: reviewerName ? 1.01 : 1 }}
            disabled={!reviewerName}
            onClick={() => onDecision({ approved: true, reviewerName, comments })}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #059669, #0d9488)",
              boxShadow: reviewerName ? "0 4px 14px rgba(5,150,105,0.35)" : "none",
            }}
          >
            <Check className="w-4 h-4" /> Approve & Finalize
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!reviewerName}
            onClick={() => onDecision({ approved: false, reviewerName, comments })}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-txt-muted border border-em-100 bg-em-50 hover:bg-em-100 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" /> Reject
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
