import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const client = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

export async function startConsultation({ patientId, transcript, sessionId }) {
  const { data } = await client.post("/consultations/run", {
    patient_id: patientId,
    transcript,
    session_id: sessionId,
  });
  return data; // { session_id, status: "in_progress" }
}

export async function getConsultationStatus(sessionId) {
  const { data } = await client.get(`/consultations/${sessionId}`);
  return data;
}

export async function submitApproval({ sessionId, approved, reviewerName, comments }) {
  const { data } = await client.post("/consultations/approve", {
    session_id: sessionId,
    approved,
    reviewer_name: reviewerName,
    comments,
  });
  return data;
}

export async function createPatient({ name, dob }) {
  const { data } = await client.post("/patients", null, { params: { name, dob } });
  return data;
}

export async function getPatient(patientId) {
  const { data } = await client.get(`/patients/${patientId}`);
  return data;
}

export async function getPatientVisits(patientId) {
  const { data } = await client.get(`/patients/${patientId}/visits`);
  return data;
}
