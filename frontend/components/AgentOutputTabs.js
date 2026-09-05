"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, Loader2,
  ClipboardList, FileText, BarChart2,
  Syringe, CalendarDays, ShieldCheck,
  AlertTriangle, Pill, Activity, Tag, Info,
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────────────────── */
const Chip = ({ children, color = "chip-green", icon: Icon }) => (
  <span className={`chip ${color}`}>
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </span>
);

const RiskBanner = ({ level }) => {
  const map = {
    low:      { cls: "risk-low",      label: "Low Risk"      },
    moderate: { cls: "risk-moderate", label: "Moderate Risk" },
    high:     { cls: "risk-high",     label: "High Risk"     },
    critical: { cls: "risk-critical", label: "Critical"      },
  };
  const e = map[level?.toLowerCase()] || map.low;
  return <span className={`risk-banner ${e.cls}`}>{e.label}</span>;
};

const SLabel = ({ children }) => (
  <p className="section-label">{children}</p>
);

const Empty = ({ message = "No data yet." }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <Clock className="w-7 h-7 text-em-200 mb-3" />
    <p className="text-sm text-txt-muted">{message}</p>
  </div>
);

const Skeleton = ({ lines = 4 }) => (
  <div className="space-y-3 py-4">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`skeleton h-3 ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-1/2"}`} />
    ))}
  </div>
);

/* ── Patient History ─────────────────────────────────────────── */
function PatientHistoryTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Patient history will appear once Stage 1 completes." />;
  return (
    <div className="space-y-5">
      <div>
        <SLabel>Known Conditions</SLabel>
        {data.known_conditions?.length > 0
          ? <div className="flex flex-wrap gap-2">{data.known_conditions.map((c, i) => <Chip key={i}>{c}</Chip>)}</div>
          : <p className="text-sm text-txt-muted italic">None recorded</p>}
      </div>
      <div>
        <SLabel>Current Medications</SLabel>
        {data.medications?.length > 0
          ? <div className="flex flex-wrap gap-2">
              {data.medications.map((m, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Chip color="chip-teal" icon={Pill}>{m.name}</Chip>
                  {m.dosage    && <span className="text-xs text-txt-muted">{m.dosage}</span>}
                  {m.frequency && <span className="text-xs text-txt-muted">· {m.frequency}</span>}
                </span>
              ))}
            </div>
          : <p className="text-sm text-txt-muted italic">None recorded</p>}
      </div>
      <div>
        <SLabel>Allergies</SLabel>
        {data.allergies?.length > 0
          ? <div className="flex flex-wrap gap-2">
              {data.allergies.map((a, i) => (
                <Chip key={i} color="chip-red" icon={AlertTriangle}>{a.substance}{a.reaction ? ` — ${a.reaction}` : ""}</Chip>
              ))}
            </div>
          : <Chip color="chip-green">No known allergies</Chip>}
      </div>
      {data.relevant_flags?.length > 0 && (
        <div>
          <SLabel>Clinical Flags</SLabel>
          <div className="space-y-2">
            {data.relevant_flags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {(() => {
        const filteredVisits = (data.past_visits_summary || []).filter(
          (v) => !String(v).toLowerCase().includes("scheduled follow-up")
        );
        if (filteredVisits.length === 0) return null;
        return (
          <div>
            <SLabel>Past Visits</SLabel>
            <ul className="space-y-1">
              {filteredVisits.map((v, i) => (
                <li key={i} className="text-sm text-em-800 flex items-start gap-2">
                  <span className="text-em-400 mt-0.5">•</span>{v}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Clinical Note ───────────────────────────────────────────── */
function ClinicalNoteTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Clinical note will appear once Stage 2 completes." />;
  const soaps = [
    { key: "subjective", label: "S — Subjective", value: data.subjective },
    { key: "objective",  label: "O — Objective",  value: data.objective  },
    { key: "assessment", label: "A — Assessment", value: data.assessment },
    { key: "plan",       label: "P — Plan",       value: data.plan       },
  ];
  return (
    <div className="space-y-4">
      {soaps.map(({ key, label, value }) => (
        <div key={key} className="soap-section">
          <SLabel>{label}</SLabel>
          <p className="text-sm text-em-900 leading-relaxed">{value || <span className="italic text-txt-muted">Not documented</span>}</p>
        </div>
      ))}
      {data.icd10_codes?.length > 0 && (
        <div>
          <SLabel>ICD-10 Codes</SLabel>
          <div className="flex flex-wrap gap-2">
            {data.icd10_codes.map((code, i) => <Chip key={i} color="chip-gray" icon={Tag}>{code}</Chip>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────────── */
function SummaryTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Summary will appear once Stage 3 completes." />;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SLabel>Chief Complaint</SLabel>
          <p className="text-base font-bold text-em-900">{data.chief_complaint}</p>
        </div>
        <RiskBanner level={data.risk_level} />
      </div>
      <div>
        <SLabel>Clinical Narrative</SLabel>
        <p className="text-sm text-em-800 leading-relaxed">{data.summary}</p>
      </div>
      {data.key_findings?.length > 0 && (
        <div>
          <SLabel>Key Findings</SLabel>
          <ul className="space-y-1">
            {data.key_findings.map((f, i) => (
              <li key={i} className="text-sm text-em-800 flex items-start gap-2">
                <span className="text-em-400 mt-0.5">•</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.diagnosis?.length > 0 && (
        <div>
          <SLabel>Diagnosis</SLabel>
          <div className="flex flex-wrap gap-2">
            {data.diagnosis.map((d, i) => <Chip key={i}>{d}</Chip>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Treatment ───────────────────────────────────────────────── */
function TreatmentTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Treatment plan will appear once Stage 4 completes." />;
  return (
    <div className="space-y-5">
      {data.diagnosis_addressed?.length > 0 && (
        <div>
          <SLabel>Diagnosis Addressed</SLabel>
          <div className="flex flex-wrap gap-2">
            {data.diagnosis_addressed.map((d, i) => <Chip key={i}>{d}</Chip>)}
          </div>
        </div>
      )}
      {data.treatment_steps?.length > 0 && (
        <div>
          <SLabel>Treatment Steps</SLabel>
          <ol className="space-y-3">
            {data.treatment_steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-em-900">{step.action}</p>
                  {step.rationale && <p className="text-xs text-txt-muted mt-0.5">{step.rationale}</p>}
                  {step.timeframe && <span className="chip chip-gray mt-1">{step.timeframe}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {data.prescribed_medications?.length > 0 && (
        <div>
          <SLabel>Prescribed Medications</SLabel>
          <div className="space-y-2">
            {data.prescribed_medications.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Chip color="chip-teal" icon={Pill}>{m.name}</Chip>
                {m.dosage    && <span className="text-xs text-txt-muted">{m.dosage}</span>}
                {m.frequency && <span className="text-xs text-txt-muted">· {m.frequency}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.discharge_instructions && (
        <div>
          <SLabel>Discharge Instructions</SLabel>
          <div className="bg-em-50 border border-em-100 rounded-xl p-4">
            <p className="text-sm text-em-800 leading-relaxed whitespace-pre-line">{data.discharge_instructions}</p>
          </div>
        </div>
      )}
      {data.precautions?.length > 0 && (
        <div>
          <SLabel>Precautions</SLabel>
          <div className="space-y-1.5">
            {data.precautions.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-amber-800">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Follow-up ───────────────────────────────────────────────── */
function FollowUpTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Follow-up plan will appear once Stage 5 completes." />;
  const pClass = (p) => ({ low:"priority-low", moderate:"priority-moderate", high:"priority-high", critical:"priority-critical" })[p?.toLowerCase()] || "priority-low";
  return (
    <div className="space-y-5">
      {data.follow_ups?.length > 0 && (
        <div>
          <SLabel>Scheduled Follow-ups</SLabel>
          <div className="space-y-3">
            {data.follow_ups.map((f, i) => (
              <div key={i} className="border border-em-100 rounded-xl p-4 bg-em-50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-em-900">{f.reason}</p>
                  <span className={`chip text-[10px] ${pClass(f.priority)}`}>{f.priority || "low"}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 mt-2">
                  <p className="text-xs text-txt-muted flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-em-400" />{f.suggested_date}
                  </p>
                  {f.department && (
                    <p className="text-xs text-txt-muted flex items-center gap-1">
                      <Activity className="w-3 h-3 text-em-400" />{f.department}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.reminder_channels?.length > 0 && (
        <div>
          <SLabel>Reminder Channels</SLabel>
          <div className="flex flex-wrap gap-2">
            {data.reminder_channels.map((ch, i) => <Chip key={i} color="chip-teal">{ch}</Chip>)}
          </div>
        </div>
      )}
      {data.notes && (
        <div>
          <SLabel>Notes</SLabel>
          <p className="text-sm text-txt-muted leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ── Review ──────────────────────────────────────────────────── */
function ReviewTab({ data, running }) {
  if (!data) return running ? <Skeleton /> : <Empty message="Documentation review will appear once Stage 6 completes." />;
  const sColor = (s) => ({ low:"chip-green", moderate:"chip-yellow", high:"chip-orange", critical:"chip-red" })[s?.toLowerCase()] || "chip-gray";
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        {data.passed
          ? <span className="chip chip-green text-sm px-3 py-1.5"><CheckCircle2 className="w-4 h-4" /> Review Passed</span>
          : <span className="chip chip-red text-sm px-3 py-1.5"><AlertTriangle className="w-4 h-4" /> Issues Found</span>}
        {data.requires_human_approval && (
          <span className="chip chip-orange"><ShieldCheck className="w-3 h-3" /> Approval Required</span>
        )}
      </div>
      {data.reviewer_notes && (
        <div>
          <SLabel>Reviewer Notes</SLabel>
          <p className="text-sm text-em-800 leading-relaxed">{data.reviewer_notes}</p>
        </div>
      )}
      {data.issues?.length > 0 && (
        <div>
          <SLabel>Issues ({data.issues.length})</SLabel>
          <div className="space-y-2">
            {data.issues.map((issue, i) => (
              <div key={i} className="border border-em-100 rounded-xl p-3 flex items-start gap-3 bg-em-50">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-em-900">{issue.field}</span>
                    <Chip color={sColor(issue.severity)}>{issue.severity}</Chip>
                  </div>
                  <p className="text-sm text-txt-muted">{issue.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.issues?.length === 0 && data.passed && (
        <div className="bg-em-50 border border-em-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-em-500 shrink-0" />
          <p className="text-sm text-em-800">All documentation checks passed. No issues found.</p>
        </div>
      )}
    </div>
  );
}

/* ── Tab definitions ─────────────────────────────────────────── */
const TABS = [
  { id:"patient_history", label:"Patient History",  icon:ClipboardList, component:PatientHistoryTab, dataKey:"patient_history" },
  { id:"clinical_note",   label:"Clinical Note",    icon:FileText,      component:ClinicalNoteTab,   dataKey:"clinical_note"   },
  { id:"consult_summary", label:"Summary",          icon:BarChart2,     component:SummaryTab,        dataKey:"consult_summary" },
  { id:"treatment_plan",  label:"Treatment Plan",   icon:Syringe,       component:TreatmentTab,      dataKey:"treatment_plan"  },
  { id:"followup_plan",   label:"Follow-up",        icon:CalendarDays,  component:FollowUpTab,       dataKey:"followup_plan"   },
  { id:"review",          label:"Review",           icon:ShieldCheck,   component:ReviewTab,         dataKey:"review"          },
];

/* ── Main ────────────────────────────────────────────────────── */
export default function AgentOutputTabs({ result, running }) {
  const [activeTab, setActiveTab] = useState("patient_history");
  const done = (key) => Boolean(result?.[key]);
  const isActive = (key) => {
    if (!running || done(key)) return false;
    const idx = TABS.findIndex((t) => t.dataKey === key);
    return idx === 0 || done(TABS[idx - 1]?.dataKey);
  };
  if (!result && !running) return null;

  return (
    <div className="card overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-em-100 px-4 overflow-x-auto bg-em-50">
        <div className="flex gap-4 min-w-max">
          {TABS.map((tab) => {
            const isDone   = done(tab.dataKey);
            const isAct    = isActive(tab.dataKey);
            const TabIcon  = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex items-center gap-1.5 ${activeTab === tab.id ? "active" : ""}`}
              >
                {isDone ? (
                  <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-em-500" />
                  </motion.span>
                ) : isAct ? (
                  <motion.span key="spin" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 className="w-3.5 h-3.5 text-em-500" />
                  </motion.span>
                ) : (
                  <TabIcon className="w-3.5 h-3.5 opacity-40" />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[240px]">
        <AnimatePresence mode="wait">
          {TABS.map((tab) => {
            if (tab.id !== activeTab) return null;
            const TabContent = tab.component;
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
              >
                <TabContent data={result?.[tab.dataKey]} running={running} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
