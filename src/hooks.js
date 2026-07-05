import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { api, queueRequest } from "./api";
import {
  goalsSaved,
  logRemoved,
  logSaved,
  planEditSaved,
  syncChanged
} from "./store";

export function useDataActions(showToast) {
  const dispatch = useDispatch();

  const run = useCallback(async (optimisticAction, path, options) => {
    dispatch(optimisticAction);
    dispatch(syncChanged("syncing"));
    try {
      await api(path, options);
      dispatch(syncChanged("synced"));
      showToast("Đã lưu và đồng bộ.");
    } catch (error) {
      if (!error.status || error.status >= 500) {
        queueRequest(path, options);
        dispatch(syncChanged("offline"));
        showToast("Đã lưu trên thiết bị. Sẽ đồng bộ khi có mạng.", "warning");
      } else {
        dispatch(syncChanged("synced"));
        showToast(error.message, "error");
      }
    }
  }, [dispatch, showToast]);

  return {
    saveLog: (dayId, log) => run(
      logSaved({ dayId, log }),
      `/logs/${dayId}`,
      { method: "PUT", body: JSON.stringify(log) }
    ),
    removeLog: (dayId) => run(
      logRemoved(dayId),
      `/logs/${dayId}`,
      { method: "DELETE" }
    ),
    saveEdit: (dayId, edit) => run(
      planEditSaved({ dayId, edit }),
      `/plan-edits/${dayId}`,
      { method: "PUT", body: JSON.stringify(edit) }
    ),
    saveGoals: (goals) => run(
      goalsSaved(goals),
      "/goals",
      { method: "PUT", body: JSON.stringify(goals) }
    )
  };
}
