const TOKEN_KEY = "eduverse_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function parseError(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg).join(", ");
  } catch {
    /* not json */
  }
  return `Request failed (${res.status})`;
}

async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Can't reach the server. Check your connection.", { cause: e });
  }
  if (res.status === 401 && auth) onUnauthorized();
  if (!res.ok) throw new Error(await parseError(res));
  return res.status === 204 ? null : res.json();
}

export const api = {
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password }, auth: false }),
  signup: (name, username, password) => request("/auth/signup", { method: "POST", body: { name, username, password }, auth: false }),
  me: () => request("/auth/me"),
  savePreferences: (prefs) => request("/auth/preferences", { method: "PUT", body: prefs }),
  chats: () => request("/chats"),
  chatMessages: (id) => request(`/chats/${id}/messages`),
  renameChat: (id, title) => request(`/chats/${id}`, { method: "PATCH", body: { title } }),
  deleteChat: (id) => request(`/chats/${id}`, { method: "DELETE" }),
  plans: () => request("/plans"),
  savePlan: (message_id) => request("/plans", { method: "POST", body: { message_id } }),
  togglePlanTopic: (id, index, done) => request(`/plans/${id}/topics/${index}`, { method: "PUT", body: { done } }),
  deletePlan: (id) => request(`/plans/${id}`, { method: "DELETE" }),
  submitQuiz: (message_id, answers, finished = false) => request("/quiz/submit", { method: "POST", body: { message_id, answers, finished } }),
  quizResults: () => request("/quiz/results"),
};

/**
 * POST /chat/stream and parse the Server-Sent Events by hand
 * (EventSource can't send POST bodies or auth headers).
 * handlers: { start, delta, status, block, done, error }
 */
export async function streamChat(message, mode, chatId, handlers, signal) {
  let res;
  try {
    res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ message, mode, chat_id: chatId }),
      signal,
    });
  } catch (e) {
    if (e.name === "AbortError") return;
    throw new Error("Can't reach the server. Check your connection.", { cause: e });
  }
  if (res.status === 401) onUnauthorized();
  if (!res.ok) throw new Error(await parseError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        let event = "message";
        let data = "";
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (data) handlers[event]?.(JSON.parse(data));
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") throw e;
  }
}
