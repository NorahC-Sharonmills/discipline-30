import { configureStore, createSlice } from "@reduxjs/toolkit";

const TOKEN_KEY = "discipline30.token.v1";
const CACHE_KEY = "discipline30.cache.v2";

function addLocalDays(dateKey, offset) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

function localDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function defaultPlan() {
  const startDate = localDateKey();
  return {
    startDate,
    endDate: addLocalDays(startDate, 29),
    planData: {}
  };
}
const DEFAULT_GOALS = {
  targetWeight: "",
  targetWaist: "",
  weeklyCompletion: 5,
  reminderTime: "20:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
  emailReminder: false
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

const cached = readJson(CACHE_KEY, {});
const cachedPlan = isRecord(cached.plan) ? cached.plan : {};
const fallbackPlan = defaultPlan();

const sessionSlice = createSlice({
  name: "session",
  initialState: {
    token: localStorage.getItem(TOKEN_KEY) || "",
    user: cached.user || null
  },
  reducers: {
    signedIn(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
    },
    signedOut(state) {
      state.token = "";
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
    },
    userLoaded(state, action) {
      state.user = action.payload;
    }
  }
});

const dataSlice = createSlice({
  name: "data",
  initialState: {
    logs: isRecord(cached.logs) ? cached.logs : {},
    planEdits: isRecord(cached.planEdits) ? cached.planEdits : {},
    goals: { ...DEFAULT_GOALS, ...(isRecord(cached.goals) ? cached.goals : {}) },
    plan: {
      ...fallbackPlan,
      ...cachedPlan,
      startDate: isDateKey(cachedPlan.startDate) ? cachedPlan.startDate : fallbackPlan.startDate,
      endDate: isDateKey(cachedPlan.endDate) ? cachedPlan.endDate : fallbackPlan.endDate
    },
    syncState: "idle",
    loaded: false
  },
  reducers: {
    dataLoaded(state, action) {
      const currentFallback = defaultPlan();
      const nextPlan = isRecord(action.payload.plan) ? action.payload.plan : state.plan;
      Object.assign(state, action.payload, {
        goals: { ...DEFAULT_GOALS, ...(action.payload.goals || {}) },
        logs: isRecord(action.payload.logs) ? action.payload.logs : {},
        planEdits: isRecord(action.payload.planEdits) ? action.payload.planEdits : {},
        plan: {
          ...currentFallback,
          ...nextPlan,
          startDate: isDateKey(nextPlan.startDate) ? nextPlan.startDate : currentFallback.startDate,
          endDate: isDateKey(nextPlan.endDate) ? nextPlan.endDate : currentFallback.endDate
        },
        syncState: "synced",
        loaded: true
      });
    },
    logSaved(state, action) {
      state.logs[String(action.payload.dayId)] = action.payload.log;
    },
    logRemoved(state, action) {
      delete state.logs[String(action.payload)];
    },
    planEditSaved(state, action) {
      state.planEdits[String(action.payload.dayId)] = action.payload.edit;
    },
    goalsSaved(state, action) {
      state.goals = action.payload;
    },
    syncChanged(state, action) {
      state.syncState = action.payload;
    },
    dataLoading(state) {
      state.loaded = false;
    },
    progressReset(state, action) {
      const currentFallback = defaultPlan();
      state.logs = {};
      state.planEdits = {};
      state.goals = { ...DEFAULT_GOALS };
      state.plan = { ...currentFallback, ...action.payload };
      state.syncState = "synced";
      state.loaded = true;
    },
    dataLoadFailed(state) {
      state.loaded = true;
    },
    cleared() {
      return dataSlice.getInitialState();
    }
  }
});

export const {
  signedIn,
  signedOut,
  userLoaded
} = sessionSlice.actions;
export const {
  dataLoaded,
  logSaved,
  logRemoved,
  planEditSaved,
  goalsSaved,
  syncChanged,
  dataLoading,
  progressReset,
  dataLoadFailed,
  cleared
} = dataSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer,
    data: dataSlice.reducer
  }
});

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    user: state.session.user,
    logs: state.data.logs,
    planEdits: state.data.planEdits,
    goals: state.data.goals,
    plan: state.data.plan
  }));
});
