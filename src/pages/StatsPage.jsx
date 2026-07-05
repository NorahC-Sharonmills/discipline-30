import { Bar, Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip
} from "chart.js";
import { Download, FileText, Share2 } from "lucide-react";
import { calculateStats } from "../plan";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

export function StatsPage({ days }) {
  const stats = calculateStats(days);
  const labels = days.map((day) => `N${day.id}`);
  const weight = days.map((day) => Number(day.weight) || null);
  const kcal = days.map((day) => Number(day.actualKcal) || null);

  const exportCsv = () => {
    const header = ["Ngày", "Ngày tháng", "Hoàn thành", "Kcal", "Nước", "Cân nặng", "Vòng bụng", "Ghi chú"];
    const rows = days.map((day) => [day.id, day.date, day.completed ? "Có" : "Không", day.actualKcal || "", day.actualWaterLiter || "", day.weight || "", day.waist || "", day.note || ""]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "discipline-30-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const share = async () => {
    const text = `Discipline 30: ${stats.completed}/30 ngày hoàn thành, chuỗi ${stats.streak} ngày.`;
    if (navigator.share) await navigator.share({ title: "Tiến độ Discipline 30", text });
    else await navigator.clipboard.writeText(text);
  };

  return (
    <div className="page-stack report-page">
      <section className="report-actions">
        <div><p className="eyebrow">Báo cáo cá nhân</p><h2>Xu hướng 30 ngày</h2></div>
        <div>
          <button className="button secondary" onClick={share}><Share2 size={17} /> Chia sẻ</button>
          <button className="button secondary" onClick={exportCsv}><Download size={17} /> CSV</button>
          <button className="button primary" onClick={() => window.print()}><FileText size={17} /> In / PDF</button>
        </div>
      </section>
      <div className="report-summary">
        <div><small>Hoàn thành</small><strong>{stats.completionRate}%</strong></div>
        <div><small>Kcal trung bình</small><strong>{stats.averageKcal ? `${Math.round(stats.averageKcal)} kcal` : "-"}</strong></div>
        <div><small>Nước trung bình</small><strong>{stats.averageWater ? `${stats.averageWater.toFixed(1)} L` : "-"}</strong></div>
        <div><small>Chuỗi tốt nhất</small><strong>{stats.streak} ngày</strong></div>
      </div>
      <div className="chart-grid">
        <section className="panel chart-panel">
          <div className="section-heading"><div><h2>Cân nặng</h2><p>Biến động theo lần ghi nhận</p></div></div>
          <div className="chart-wrap">
            <Line data={{ labels, datasets: [{ label: "kg", data: weight, borderColor: "#19745a", backgroundColor: "rgba(25,116,90,.12)", fill: true, tension: 0.35, spanGaps: true }] }} options={chartOptions} />
          </div>
        </section>
        <section className="panel chart-panel">
          <div className="section-heading"><div><h2>Kcal thực tế</h2><p>So sánh với mục tiêu từng ngày</p></div></div>
          <div className="chart-wrap">
            <Bar data={{ labels, datasets: [{ label: "Thực tế", data: kcal, backgroundColor: "#cf8753", borderRadius: 4 }, { label: "Mục tiêu", data: days.map((d) => d.targetKcal), backgroundColor: "rgba(25,116,90,.2)", borderRadius: 4 }] }} options={chartOptions} />
          </div>
        </section>
      </div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: "index" },
  plugins: { legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true } } },
  scales: { x: { grid: { display: false } }, y: { border: { display: false } } }
};
