"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Sparkles, Download,
  ChevronRight, HeartPulse, UserCheck
} from "lucide-react";
import AgentPipeline from "@/components/AgentPipeline";
import AgentOutputTabs from "@/components/AgentOutputTabs";
import ApprovalCard from "@/components/ApprovalCard";
import PatientSidebar from "@/components/PatientSidebar";
import NewPatientForm from "@/components/NewPatientForm";
import Toast from "@/components/Toast";
import { startConsultation, getConsultationStatus, submitApproval } from "@/lib/api";

const FadeUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Home() {
  const [patientId, setPatientId]   = useState("");
  const [transcript, setTranscript] = useState("");
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [finalized, setFinalized]   = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("notwell_last_patient_id") : null;
    if (saved) setPatientId(saved);
  }, []);

  function handleSelectPatient(id) {
    setPatientId(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("notwell_last_patient_id", id);
      } else {
        localStorage.removeItem("notwell_last_patient_id");
      }
    }
  }

  async function handleRun() {
    if (!patientId || !transcript) return;
    setRunning(true); setError(null); setResult(null); setFinalized(false);
    try {
      const { session_id } = await startConsultation({ patientId, transcript });
      setResult({ session_id, status: "in_progress" });
      const poll = setInterval(async () => {
        try {
          const status = await getConsultationStatus(session_id);
          const merged = { session_id, ...(status.result || {}), status: status.status };
          setResult(merged);
          if (status.status !== "in_progress") {
            clearInterval(poll); setRunning(false);
            if (status.status === "error") {
              const e = (status.errors || []).slice(-1)[0];
              setError(e ? `${e.stage}: ${e.error}` : "Pipeline failed.");
            }
          }
        } catch (e) { clearInterval(poll); setRunning(false); setError(e?.response?.data?.detail || e.message); }
      }, 3000);
    } catch (e) { setError(e?.response?.data?.detail || e.message); setRunning(false); }
  }

  async function handleApprovalDecision({ approved, reviewerName, comments }) {
    if (!result?.session_id) return;
    try {
      await submitApproval({ sessionId: result.session_id, approved, reviewerName, comments });
      setFinalized(true);
    } catch (e) { setError(e?.response?.data?.detail || e.message); }
  }

  const pdfUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/consultations/${result?.session_id}/pdf`;
  const needsApproval = result?.status === "pending_approval" && !finalized;

  return (
    <main className="min-h-screen">
      <Toast message={error} onDismiss={() => setError(null)} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-em-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* NotWell logo */}
            <div className="relative shrink-0">
              <Image
                src="/notwell-logo.png"
                alt="NotWell"
                width={40}
                height={40}
                className="rounded-xl"
                style={{ boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}
              />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-em-400 border-2 border-white">
                <span className="absolute inset-0 rounded-full bg-em-400 animate-ping opacity-60" />
              </span>
            </div>
            <div>
              <h1 className="font-bold text-em-900 text-base leading-tight tracking-tight">
                NotWell
              </h1>
              <p className="text-[11px] text-txt-muted">
                AI clinical documentation · 6-agent pipeline
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-em-700 bg-em-50 px-3 py-1.5 rounded-full border border-em-200">
            <HeartPulse className="w-3.5 h-3.5 text-em-500" />
            System operational
          </div>
        </div>
      </header>

      {/* ── Subtle top-of-page colour wash ─────────────────────── */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #059669, #14b8a6, #34d399, #14b8a6, #059669)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

      {/* ── 3-column grid ─────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_1fr] xl:grid-cols-[280px_340px_1fr] gap-5">

        {/* Col 1 — Patient Sidebar */}
        <div>
          <div className="lg:sticky lg:top-[74px] space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-txt-muted px-1">
              Patient Context
            </p>
            <PatientSidebar patientId={patientId} />
          </div>
        </div>

        {/* Col 2 — Input + Pipeline */}
        <FadeUp className="space-y-4">
          <div className="lg:sticky lg:top-[74px]">
            {/* Input card */}
            <div className="card overflow-hidden">
              {/* Header stripe */}
              <div className="px-5 py-4 border-b border-em-100 flex items-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-em-100 border border-em-200">
                  <FileText className="w-3.5 h-3.5 text-em-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-em-900">New Consultation</p>
                  <p className="text-[11px] text-txt-muted">Enter patient details below</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="section-label">Patient ID</label>
                  <input
                    id="patient-id-input"
                    value={patientId}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    placeholder="e.g. PAT-9A82F1"
                    className="green-input mt-1"
                  />
                  <div className="mt-2">
                    <NewPatientForm onCreated={(id) => handleSelectPatient(id)} />
                  </div>
                </div>

                <div>
                  <label className="section-label">Consultation Transcript</label>
                  <textarea
                    id="transcript-input"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={9}
                    placeholder="Paste or type the consultation transcript here…"
                    className="green-input mt-1 resize-none leading-relaxed"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: running || !patientId || !transcript ? 1 : 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={running || !patientId || !transcript}
                  onClick={handleRun}
                  id="run-pipeline-btn"
                  className="btn-primary"
                >
                  {running ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Running pipeline…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run Agent Pipeline
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Pipeline tracker */}
            <AnimatePresence>
              {(running || result) && (
                <motion.div className="mt-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <AgentPipeline result={result} running={running} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>

        {/* Col 3 — Output + Approval + PDF */}
        <div className="space-y-4">
          {(running || result) && <AgentOutputTabs result={result} running={running} />}

          {needsApproval && (
            <ApprovalCard review={result?.review} onDecision={handleApprovalDecision} />
          )}

          {finalized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="card p-8 text-center relative overflow-hidden"
            >
              {/* Tint wash */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)" }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-em-100 border border-em-200">
                  <Download className="w-6 h-6 text-em-700" />
                </div>
                <p className="font-bold text-lg text-em-900">Documentation Finalized</p>
                <p className="text-txt-muted text-sm mt-1">Discharge summary is ready for download.</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="pdf-download-link"
                  className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 4px 14px rgba(5,150,105,0.35)" }}
                >
                  <Download className="w-4 h-4" />
                  Download Discharge PDF
                </a>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!running && !result && (
            <FadeUp delay={0.2}>
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-em-50 border border-em-200">
                  <Sparkles className="w-7 h-7 text-em-500" />
                </div>
                <p className="font-semibold text-em-900">NotWell is ready</p>
                <p className="text-sm text-txt-muted mt-2 leading-relaxed max-w-xs mx-auto">
                  Enter a patient ID and consultation transcript, then click "Run Agent Pipeline" to generate clinical documentation.
                </p>
              </div>
            </FadeUp>
          )}
        </div>
      </div>
    </main>
  );
}
