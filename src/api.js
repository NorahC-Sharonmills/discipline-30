const OLD_LOGS_KEY = "discipline30.logs.v1";
const OLD_EDITS_KEY = "discipline30.planEdits.v1";
const IMPORT_KEY = "discipline30.imported.v2";
const QUEUE_KEY = "discipline30.syncQueue.v1";

export async function api(path, options = {}) {
  const token = localStorage.getItem("discipline30.token.v1");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error || "Không thể kết nối máy chủ.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function importLegacyData() {
  if (localStorage.getItem(IMPORT_KEY)) return;
  const parse = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  };
  const logs = parse(OLD_LOGS_KEY);
  const planEdits = parse(OLD_EDITS_KEY);
  if (Object.keys(logs).length || Object.keys(planEdits).length) {
    await api("/import", {
      method: "POST",
      body: JSON.stringify({ logs, planEdits })
    });
  }
  localStorage.setItem(IMPORT_KEY, "1");
}

export function queueRequest(path, options) {
  const queue = getQueue();
  const replacementIndex = queue.findIndex((item) => item.path === path);
  const item = { path, options, queuedAt: new Date().toISOString() };
  if (replacementIndex >= 0) queue[replacementIndex] = item;
  else queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue() {
  const queue = getQueue();
  if (!queue.length) return 0;
  const remaining = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await api(item.path, item.options);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return synced;
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}
