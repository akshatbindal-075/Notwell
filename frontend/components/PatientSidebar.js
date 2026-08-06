"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Activity, Pill, AlertTriangle, History, ChevronDown, ChevronUp } from "lucide-react";
import { getPatient, getPatientVisits } from "@/lib/api";

const Chip = ({ children, color = "chip-green" }) => (
  <span className={`chip ${color}`}>{children}</span>
);

function Section({ icon: Icon, title, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-em-50 last:border-0 pb-3 mb-3 last:pb-0 last:mb-0">
      <button className="w-full flex items-center justify-between py-1" onClick={() => setOpen(v => !v)}>
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-txt-muted">
          <Icon className="w-3.5 h-3.5 text-em-400" />
          {title}
          {count !== undefined && (
            <span className="bg-em-100 text-em-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-em-300" /> : <ChevronDown className="w-3.5 h-3.5 text-em-300" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PatientSidebar({ patientId }) {
  const [patient, setPatient]   = useState(null);
  const [visits, setVisits]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!patientId) { setPatient(null); setVisits(null); setNotFound(false); return; }
    let cancelled = false;
    setLoading(true); setNotFound(false);
    Promise.all([
      getPatient(patientId).catch(() => null),
      getPatientVisits(patientId).catch(() => null),
    ]).then(([p, v]) => {
      if (cancelled) return;
      if (!p) { setNotFound(true); setPatient(null); setVisits(null); }
      else     { setPatient(p); setVisits(v); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [patientId]);

  if (!patientId) return (
    <div className="card p-6 text-center">
      <User className="w-8 h-8 text-em-200 mx-auto mb-2" />
      <p className="text-xs text-txt-muted">Enter a patient ID to see their context here.</p>
    </div>
  );

  if (loading) return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-2/3" /><div className="skeleton h-3 w-1/2" />
    </div>
  );

  if (notFound) return (
    <div className="card p-5 text-center">
      <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
      <p className="text-xs font-semibold text-em-900">Patient not found</p>
      <p className="text-[11px] text-txt-muted mt-1">Check the ID or create a new patient.</p>
    </div>
  );

  if (!patient) return null;

  const conditions  = patient.conditions  || [];
  const meds        = patient.medications || [];
  const allergies   = patient.allergies   || [];
  const visitCount  = visits?.visit_count ?? 0;
  const visitList   = visits?.visits      ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4" style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{patient.name}</p>
            <p className="text-em-100 text-[11px] mt-0.5 font-mono">{patient.id}</p>
          </div>
        </div>
        {/* RAG status */}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
            <History className="w-3 h-3" />
            {visitCount === 0
              ? "No prior visits — RAG skipped"
              : `${visitCount} prior visit${visitCount > 1 ? "s" : ""} — RAG active`}
          </span>
        </div>
      </div>

      <div className="p-4">
        {patient.dob && (
          <div className="flex items-center gap-2 text-xs text-txt-muted pb-3 mb-3 border-b border-em-50">
            <Calendar className="w-3.5 h-3.5 text-em-400" />
            DOB: {patient.dob}
          </div>
        )}

        <Section icon={Activity} title="Conditions" count={conditions.length}>
          {conditions.length === 0
            ? <p className="text-xs text-txt-muted italic">None recorded</p>
            : <div className="flex flex-wrap gap-1.5">{conditions.map((c, i) => <Chip key={i}>{c}</Chip>)}</div>}
        </Section>

        <Section icon={Pill} title="Medications" count={meds.length}>
          {meds.length === 0
            ? <p className="text-xs text-txt-muted italic">None recorded</p>
            : <div className="space-y-1.5">
                {meds.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Chip color="chip-teal">{m.name || m}</Chip>
                    {m.dosage && <span className="text-[11px] text-txt-muted">{m.dosage}</span>}
                  </div>
                ))}
              </div>}
        </Section>

        <Section icon={AlertTriangle} title="Allergies" count={allergies.length}>
          {allergies.length === 0
            ? <p className="text-xs text-txt-muted italic">None recorded</p>
            : <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => <Chip key={i} color="chip-red">{a.substance || a}</Chip>)}
              </div>}
        </Section>

        {visitCount > 0 && (
          <Section icon={History} title="Past Visits" count={visitCount}>
            <div className="space-y-2">
              {visitList.slice(0, 5).map((v) => (
                <div key={v.id} className="bg-em-50 border border-em-100 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-em-800">
                    {v.date ? new Date(v.date).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "Unknown date"}
                  </p>
                  {v.summary_text && <p className="text-[11px] text-txt-muted mt-0.5 line-clamp-2">{v.summary_text}</p>}
                </div>
              ))}
              {visitCount > 5 && <p className="text-[11px] text-txt-muted text-center">+{visitCount - 5} more visits</p>}
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
}
