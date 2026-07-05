import { configureStore, createSlice } from "@reduxjs/toolkit";

const TOKEN_KEY = "discipline30.token.v1";
const CACHE_KEY = "discipline30.cache.v2";

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

const cached = readJson(CACHE_KEY, {});

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
    logs: cached.logs || {},
    planEdits: cached.planEdits || {},
    goals: cached.goals || {
      targetWeight: "",
      targetWaist: "",
      weeklyCompletion: 5,
      reminderTime: "20:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
      emailReminder: false
    },
    syncState: "idle"
  },
  reducers: {
    dataLoaded(state, action) {
      Object.assign(state, action.payload, { syncState: "synced" });
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
    goals: state.data.goals
  }));
});
