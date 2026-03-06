import axios from "axios";

export const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  company: string;
  photo_path: string | null;
  has_face: boolean;
  created_at: string;
  visit_count?: number;
  last_visit?: string | null;
  visits?: Visit[];
}

export interface Visit {
  id: number;
  timestamp: string;
  notes: string;
}

export interface RecognitionResult {
  matched: boolean;
  confidence?: number;
  distance?: number;
  client?: Client;
  reason?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  client_name: string | null;
}

export interface AdminStats {
  total_clients: number;
  total_visits: number;
  total_chat_messages: number;
  total_contact_messages: number;
  visits_last_7_days: number;
  top_visitors: { name: string; visits: number }[];
  recent_activity: {
    type: string;
    client_name: string;
    timestamp: string;
    notes: string;
  }[];
}

// ─── Clients API ─────────────────────────────────────────────────────────────

export const clientsApi = {
  list: () => api.get<Client[]>("/api/clients/").then((r) => r.data),
  get: (id: number) => api.get<Client>(`/api/clients/${id}`).then((r) => r.data),
  create: (formData: FormData) =>
    api.post<Client>("/api/clients/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  update: (id: number, formData: FormData) =>
    api.put<Client>(`/api/clients/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/clients/${id}`).then((r) => r.data),
  logVisit: (id: number) => api.post(`/api/clients/${id}/visit`).then((r) => r.data),
};

// ─── Face Recognition API ────────────────────────────────────────────────────

export const recognitionApi = {
  recognize: (descriptor: number[], autoLogVisit = true) =>
    api
      .post<RecognitionResult>("/api/recognize/", { descriptor, auto_log_visit: autoLogVisit })
      .then((r) => r.data),
};

// ─── Chat API ────────────────────────────────────────────────────────────────

export const chatApi = {
  send: (message: string, clientId?: number | null, sessionId?: string) =>
    api
      .post<ChatResponse>("/api/chat/", {
        message,
        client_id: clientId ?? null,
        session_id: sessionId ?? null,
      })
      .then((r) => r.data),
  getGreeting: (clientId?: number | null, visitCount?: number, lastVisit?: string) =>
    api
      .post<{ greeting: string; client_name: string | null }>("/api/chat/greeting", {
        client_id: clientId ?? null,
        visit_count: visitCount ?? 0,
        last_visit: lastVisit ?? null,
      })
      .then((r) => r.data),
  getLogs: (limit = 50) =>
    api.get(`/api/chat/logs?limit=${limit}`).then((r) => r.data),
};

// ─── Contact API ─────────────────────────────────────────────────────────────

export const contactApi = {
  submit: (data: { name: string; email: string; company: string; message: string }) =>
    api.post("/api/contact/", data).then((r) => r.data),
  list: () => api.get("/api/contact/").then((r) => r.data),
  delete: (id: number) => api.delete(`/api/contact/${id}`).then((r) => r.data),
};

// ─── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => api.get<AdminStats>("/api/admin/stats").then((r) => r.data),
  getVisits: (limit = 100) =>
    api.get(`/api/admin/visits?limit=${limit}`).then((r) => r.data),
};

export default api;
