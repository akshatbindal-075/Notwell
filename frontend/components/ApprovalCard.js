"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, Check, X,
  Pencil, RotateCcw, FileEdit, CheckCircle2
} from "lucide-react";

export default function ApprovalCard({ review, result, onDecision }) {
  const [reviewerName, setReviewerName] = useState("");
  const [comments, setComments]         = useState("");
  const [isEditing, setIsEditing]       = useState(false);
  const [activeTab, setActiveTab]       = useState("soap");

  // Editable fields initialized from result
  const [soap, setSoap] = useState({
    subjective: result?.clinical_note?.subjective || "",
    objective:  result?.clinical_note?.objective  || "",
    assessment: result?.clinical_note?.assessment || "",
    plan:       result?.clinical_note?.plan       || "",
  });

  const [summary, setSummary] = useState({
    chief_complaint: result?.consult_summary?.chief_complaint || "",
    summary:         result?.consult_summary?.summary         || "",
  });

  const [treatment, setTreatment] = useState({
    discharge_instructions: result?.treatment_plan?.discharge_instructions || "",
  });

  // Re-sync if result updates
  useEffect(() => {
    setSoap({
      subjective: result?.clinical_note?.subjective || "",
      objective:  result?.clinical_note?.objective  || "",
      assessment: result?.clinical_note?.assessment || "",
      plan:       result?.clinical_note?.plan       || "",
    });
    setSummary({
      chief_complaint: result?.consult_summary?.chief_complaint || "",
      summary:         result?.consult_summary?.summary         || "",
    });
    setTreatment({
      discharge_instructions: result?.treatment_plan?.discharge_instructions || "",
    });
  }, [result]);

  if (!review) return null;

  const issues = review.issues || [];
  const sev = (s) => ({
    low:      { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669" },
    moderate: { bg: "#fefce8", border: "#fde68a", text: "#854d0e" },
    high:     { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
    critical: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  })[s?.toLowerCase()] || { bg: "#f9fafb", border: "#e5e7eb", text: "#4b5563" };

  const hasModifications =
    soap.subjective !== (result?.clinical_note?.subjective || "") ||
    soap.objective  !== (result?.clinical_note?.objective  || "") ||
    soap.assessment !== (result?.clinical_note?.assessment || "") ||
    soap.plan       !== (result?.clinical_note?.plan       || "") ||
    summary.chief_complaint !== (result?.consult_summary?.chief_complaint || "") ||
    summary.summary         !== (result?.consult_summary?.summary         || "") ||
    treatment.discharge_instructions !== (result?.treatment_plan?.discharge_instructions || "");

  function handleReset() {
    setSoap({
      subjective: result?.clinical_note?.subjective || "",
      objective:  result?.clinical_note?.objective  || "",
      assessment: result?.clinical_note?.assessment || "",
      plan:       result?.clinical_note?.plan       || "",
    });
    setSummary({
      chief_complaint: result?.consult_summary?.chief_complaint || "",
      summary:         result?.consult_summary?.summary         || "",
    });
    setTreatment({
      discharge_instructions: result?.treatment_plan?.discharge_instructions || "",
    });
  }

  function handleApprove() {
    let editedFields = null;
    if (hasModifications) {
      editedFields = {};
      if (
        soap.subjective !== (result?.clinical_note?.subjective || "") ||
        soap.objective  !== (result?.clinical_note?.objective  || "") ||
        soap.assessment !== (result?.clinical_note?.assessment || "") ||
        soap.plan       !== (result?.clinical_note?.plan       || "")
      ) {
        editedFields.clinical_note = {
          ...(result?.clinical_note || {}),
          ...soap,
        };
      }
      if (
        summary.chief_complaint !== (result?.consult_summary?.chief_complaint || "") ||
        summary.summary         !== (result?.consult_summary?.summary         || "")
      ) {
        editedFields.consult_summary = {
          ...(result?.consult_summary || {}),
          ...summary,
        };
      }
      if (
        treatment.discharge_instructions !== (result?.treatment_plan?.discharge_instructions || "")
      ) {
        editedFields.treatment_plan = {
          ...(result?.treatment_plan || {}),
          ...treatment,
        };
      }
    }

    onDecision({
      approved: true,
      reviewerName,
      comments,
      editedFields,
    });
  }

  function handleDecline() {
    onDecision({
      approved: false,
      reviewerName,
      comments,
    });
  }

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
          <p className="text-[11px] text-txt-muted">Review, edit, and approve before finalizing</p>
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

        {/* ── Edit Documentation Section ──────────────────────── */}
        <div className="rounded-xl border border-em-200 overflow-hidden bg-em-50/50">
          <div className="p-3 flex items-center justify-between gap-2 border-b border-em-100 bg-white">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-em-600" />
              <div>
                <p className="text-xs font-bold text-em-900">Clinician Edit Mode</p>
                <p className="text-[11px] text-txt-muted">
                  {hasModifications ? "Modifications staged for approval" : "Adjust findings or instructions before approving"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasModifications && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-txt-muted hover:text-rose-600 px-2 py-1 rounded-lg transition-colors"
                  title="Revert to AI output"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isEditing
                    ? "bg-em-700 text-white shadow-sm"
                    : "bg-white text-em-700 border border-em-300 hover:bg-em-50"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                {isEditing ? "Close Editor" : "Edit Findings"}
                {hasModifications && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="p-3.5 space-y-3 bg-white"
              >
                {/* Sub-tabs */}
                <div className="flex rounded-lg bg-em-50 p-1 border border-em-100 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("soap")}
                    className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
                      activeTab === "soap" ? "bg-white text-em-900 shadow-sm" : "text-txt-muted hover:text-em-700"
                    }`}
                  >
                    SOAP Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("summary")}
                    className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
                      activeTab === "summary" ? "bg-white text-em-900 shadow-sm" : "text-txt-muted hover:text-em-700"
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("treatment")}
                    className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
                      activeTab === "treatment" ? "bg-white text-em-900 shadow-sm" : "text-txt-muted hover:text-em-700"
                    }`}
                  >
                    Discharge Instructions
                  </button>
                </div>

                {/* SOAP Tab */}
                {activeTab === "soap" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Subjective (S)</label>
                      <textarea
                        value={soap.subjective}
                        onChange={(e) => setSoap(prev => ({ ...prev, subjective: e.target.value }))}
                        rows={3}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Subjective narrative…"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Objective (O)</label>
                      <textarea
                        value={soap.objective}
                        onChange={(e) => setSoap(prev => ({ ...prev, objective: e.target.value }))}
                        rows={3}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Objective findings and examination…"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Assessment (A)</label>
                      <textarea
                        value={soap.assessment}
                        onChange={(e) => setSoap(prev => ({ ...prev, assessment: e.target.value }))}
                        rows={2}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Clinical assessment and diagnosis…"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Plan (P)</label>
                      <textarea
                        value={soap.plan}
                        onChange={(e) => setSoap(prev => ({ ...prev, plan: e.target.value }))}
                        rows={3}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Care plan and recommendations…"
                      />
                    </div>
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === "summary" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Chief Complaint</label>
                      <input
                        value={summary.chief_complaint}
                        onChange={(e) => setSummary(prev => ({ ...prev, chief_complaint: e.target.value }))}
                        className="green-input text-xs mt-1"
                        placeholder="Chief complaint…"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Executive Medical Summary</label>
                      <textarea
                        value={summary.summary}
                        onChange={(e) => setSummary(prev => ({ ...prev, summary: e.target.value }))}
                        rows={5}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Executive summary of clinical visit…"
                      />
                    </div>
                  </div>
                )}

                {/* Treatment Tab */}
                {activeTab === "treatment" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">Discharge Instructions</label>
                      <textarea
                        value={treatment.discharge_instructions}
                        onChange={(e) => setTreatment(prev => ({ ...prev, discharge_instructions: e.target.value }))}
                        rows={6}
                        className="green-input text-xs mt-1 leading-relaxed"
                        placeholder="Patient discharge instructions…"
                      />
                    </div>
                  </div>
                )}

                {hasModifications && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-em-700 bg-em-50 px-2.5 py-1.5 rounded-lg border border-em-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-em-600" />
                    Modifications will be included in the finalized documentation and PDF.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #059669, #0d9488)",
              boxShadow: reviewerName ? "0 4px 14px rgba(5,150,105,0.35)" : "none",
            }}
          >
            <Check className="w-4 h-4" />
            {hasModifications ? "Approve with Edits & Finalize" : "Approve & Finalize"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!reviewerName}
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" /> Decline
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
