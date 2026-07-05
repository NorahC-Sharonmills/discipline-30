import { useSelector } from "react-redux";
import { BellRing, Mail, Send } from "lucide-react";
import { api } from "../api";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export function SettingsPage({ showToast }) {
  const user = useSelector((state) => state.session.user);

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
    </div>
  );
}
