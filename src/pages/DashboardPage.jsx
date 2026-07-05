import { CalendarCheck, Droplets, Flame, Scale, Target, TrendingUp } from "lucide-react";
import { calculateStats, formatDate } from "../plan";
import { StatCard } from "../components/StatCard";

export function DashboardPage({ days }) {
  const stats = calculateStats(days);
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = days.find((day) => day.date === todayKey) || days.find((day) => !day.completed) || days.at(-1);
  const recent = days.filter((day) => day.completed || day.actualKcal || day.note).slice(-5).reverse();

  return (
    <div className="page-stack">
      <section className="welcome-band">
        <div>
          <p className="eyebrow">Tiến độ kế hoạch</p>
          <h2>{stats.completed === 30 ? "Bạn đã hoàn thành hành trình." : "Giữ nhịp, từng ngày một."}</h2>
          <p>{stats.completed}/30 ngày đã hoàn thành. Chuỗi tốt nhất hiện tại là {stats.streak} ngày.</p>
        </div>
        <div className="progress-ring" style={{ "--progress": `${stats.completionRate * 3.6}deg` }}>
          <span><strong>{stats.completionRate}%</strong><small>hoàn thành</small></span>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard icon={CalendarCheck} label="Ngày hoàn thành" value={`${stats.completed}/30`} note="Toàn bộ kế hoạch" />
        <StatCard icon={TrendingUp} label="Chuỗi dài nhất" value={`${stats.streak} ngày`} note="Tính theo log hoàn thành" tone="blue" />
        <StatCard icon={Scale} label="Cân nặng gần nhất" value={stats.latestWeight ? `${stats.latestWeight} kg` : "-"} note={stats.weightChange === null ? "Chưa đủ dữ liệu" : `${stats.weightChange > 0 ? "+" : ""}${stats.weightChange.toFixed(1)} kg`} tone="amber" />
        <StatCard icon={Target} label="Vòng bụng gần nhất" value={stats.latestWaist ? `${stats.latestWaist} cm` : "-"} note={stats.waistChange === null ? "Chưa đủ dữ liệu" : `${stats.waistChange > 0 ? "+" : ""}${stats.waistChange.toFixed(1)} cm`} tone="rose" />
      </section>

      <div className="content-grid">
        <section className="panel today-focus">
          <div className="section-heading">
            <div><p className="eyebrow">Tiếp theo</p><h2>Ngày {today.id} · {formatDate(today.date)}</h2></div>
            <span className="status-badge">{today.status}</span>
          </div>
          <div className="focus-metrics">
            <div><Flame /><span><small>Mục tiêu</small><strong>{today.targetKcal} kcal</strong></span></div>
            <div><Droplets /><span><small>Nước uống</small><strong>2.3 lít</strong></span></div>
          </div>
          <div className="meal-preview">
            <span><small>Sáng</small>{today.breakfast}</span>
            <span><small>Trưa</small>{today.lunch}</span>
            <span><small>Tối</small>{today.dinner}</span>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="section-heading"><div><p className="eyebrow">Gần đây</p><h2>Hoạt động</h2></div></div>
          {recent.length ? (
            <div className="activity-list">
              {recent.map((day) => (
                <div key={day.id}>
                  <span className={day.completed ? "done" : ""}>{day.completed ? "✓" : day.id}</span>
                  <div><strong>Ngày {day.id}</strong><small>{formatDate(day.date)} · {day.completed ? "Đã hoàn thành" : "Đã cập nhật"}</small></div>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">Chưa có nhật ký. Hãy bắt đầu từ ngày đầu tiên.</p>}
        </section>
      </div>
    </div>
  );
}
