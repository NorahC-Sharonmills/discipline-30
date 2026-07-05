import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BellRing, Mail, RotateCcw, Send } from "lucide-react";
import { api, clearLocalProgress } from "../api";
import { progressReset, syncChanged } from "../store";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function localDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function SettingsPage({ showToast }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const [resetting, setResetting] = useState(false);

  const enablePush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Chưa cấu hình VITE_VAPID_PUBLIC_KEY.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Bạn chưa cho phép thông báo.");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await api("/push/subscribe", { method: "POST", body: JSON.stringify(subscription) });
      showToast("Đã bật thông báo đẩy.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const testReminder = async () => {
    try {
      const result = await api("/reminders/test", { method: "POST", body: "{}" });
      showToast(result.channels.length ? `Đã gửi qua ${result.channels.join(", ")}.` : "Chưa có kênh nhắc việc nào được cấu hình.", result.channels.length ? "success" : "warning");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const resetProgress = async () => {
    const confirmed = window.confirm(
      "Bắt đầu lại từ Ngày 1 hôm nay? Toàn bộ nhật ký, chỉnh sửa kế hoạch và mục tiêu hiện tại sẽ bị xóa. Tài khoản của bạn vẫn được giữ lại."
    );
    if (!confirmed) return;

    setResetting(true);
    dispatch(syncChanged("syncing"));
    try {
      const startDate = localDateKey();
      const result = await api("/reset", {
        method: "POST",
        body: JSON.stringify({ startDate })
      });
      clearLocalProgress();
      dispatch(progressReset(result.plan));
      showToast("Đã bắt đầu lại từ Ngày 1.");
    } catch (error) {
      dispatch(syncChanged("synced"));
      showToast(error.message, "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="settings-grid">
      <section className="panel profile-panel">
        <span className="profile-avatar">{user?.name?.slice(0, 1).toUpperCase()}</span>
        <div><p className="eyebrow">Tài khoản</p><h2>{user?.name}</h2><p>{user?.email}</p></div>
      </section>
      <section className="panel settings-list">
        <div className="section-heading"><div><p className="eyebrow">Nhắc việc</p><h2>Kênh thông báo</h2></div></div>
        <div className="setting-row">
          <span className="setting-icon"><BellRing size={20} /></span>
          <span><strong>Thông báo đẩy</strong><small>Nhận nhắc việc ngay cả khi không mở ứng dụng.</small></span>
          <button className="button secondary" onClick={enablePush}>Bật</button>
        </div>
        <div className="setting-row">
          <span className="setting-icon"><Mail size={20} /></span>
          <span><strong>Email</strong><small>Gửi tới địa chỉ đăng nhập của bạn.</small></span>
          <button className="button secondary" onClick={testReminder}><Send size={16} /> Gửi thử</button>
        </div>
      </section>
      <section className="panel settings-list danger-zone">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dữ liệu chương trình</p>
            <h2>Bắt đầu lại 30 ngày</h2>
            <p>Đưa tiến độ về Ngày 1 tính từ hôm nay và xóa dữ liệu của lượt hiện tại.</p>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-icon"><RotateCcw size={20} /></span>
          <span>
            <strong>Reset toàn bộ tiến độ</strong>
            <small>Nhật ký, chỉnh sửa thực đơn và mục tiêu sẽ bị xóa; tài khoản và thông báo đẩy được giữ lại.</small>
          </span>
          <button className="button secondary danger" disabled={resetting} onClick={resetProgress}>
            <RotateCcw size={16} /> {resetting ? "Đang reset..." : "Bắt đầu lại"}
          </button>
        </div>
      </section>
    </div>
  );
}
