import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Bell, Ruler, Save, Scale, Trophy } from "lucide-react";
import { useDataActions } from "../hooks";
import { calculateStats } from "../plan";

export function GoalsPage({ days, showToast }) {
  const stored = useSelector((state) => state.data.goals);
  const [goals, setGoals] = useState(stored);
  const actions = useDataActions(showToast);
  const stats = calculateStats(days);
  useEffect(() => setGoals(stored), [stored]);
  useEffect(() => {
    if (!goals.timezone) {
      setGoals((current) => ({
        ...current,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok"
      }));
    }
  }, [goals.timezone]);

  const update = (key, value) => setGoals((current) => ({ ...current, [key]: value }));
  const progress = Math.min(100, Math.round((stats.completed / 30) * 100));

  return (
    <div className="goals-layout">
      <section className="panel goal-overview">
        <div className="trophy"><Trophy size={28} /></div>
        <p className="eyebrow">Mục tiêu tổng</p>
        <h2>Hoàn thành 30 ngày kỷ luật</h2>
        <p>Mục tiêu tốt cần vừa đủ cụ thể để dẫn đường, vừa đủ thực tế để bạn tiếp tục.</p>
        <div className="goal-progress"><span style={{ width: `${progress}%` }} /></div>
        <strong>{stats.completed}/30 ngày</strong>
      </section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Thiết lập</p><h2>Mục tiêu cá nhân</h2></div></div>
        <div className="form-grid">
          <label className="field field-with-icon"><span>Cân nặng mục tiêu (kg)</span><Scale size={18} /><input type="number" step="0.1" value={goals.targetWeight || ""} onChange={(e) => update("targetWeight", e.target.value)} /></label>
          <label className="field field-with-icon"><span>Vòng bụng mục tiêu (cm)</span><Ruler size={18} /><input type="number" step="0.1" value={goals.targetWaist || ""} onChange={(e) => update("targetWaist", e.target.value)} /></label>
          <label className="field"><span>Số ngày hoàn thành mỗi tuần</span><input type="number" min="1" max="7" value={goals.weeklyCompletion || 5} onChange={(e) => update("weeklyCompletion", Number(e.target.value))} /></label>
          <label className="field field-with-icon"><span>Giờ nhắc hằng ngày</span><Bell size={18} /><input type="time" value={goals.reminderTime || "20:00"} onChange={(e) => update("reminderTime", e.target.value)} /></label>
        </div>
        <label className="toggle-row">
          <span><strong>Nhắc qua email</strong><small>Cần cấu hình SMTP trên máy chủ.</small></span>
          <input type="checkbox" checked={Boolean(goals.emailReminder)} onChange={(e) => update("emailReminder", e.target.checked)} />
        </label>
        <button className="button primary" onClick={() => actions.saveGoals(goals)}><Save size={18} /> Lưu mục tiêu</button>
      </section>
    </div>
  );
}
