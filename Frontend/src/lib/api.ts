// src/lib/api.ts
// ─── Utilitaire API central ───────────────────────────────────────────────────

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
}

export function getUtilisateur() {
  try {
    return JSON.parse(localStorage.getItem("utilisateur") || "{}");
  } catch {
    return {};
  }
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("utilisateur");
  window.location.href = "/auth";
}
