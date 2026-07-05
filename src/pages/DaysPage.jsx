import { useMemo, useState } from "react";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { DayForm } from "../components/DayForm";
import { PlanEditForm } from "../components/PlanEditForm";
import { PlanSummary } from "../components/PlanSummary";
import { formatDate } from "../plan";

export function DaysPage({ days, showToast }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => days.filter((day) => {
    if (filter === "complete" && !day.completed) return false;
    if (filter === "pending" && day.completed) return false;
    const value = `${day.id} ${day.breakfast} ${day.lunch} ${day.dinner}`.toLowerCase();
    return value.includes(search.trim().toLowerCase());
  }), [days, filter, search]);

  return (
    <div className="page-stack">
      <section className="toolbar">
        <label className="search-field"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm ngày hoặc món ăn" /></label>
        <div className="segmented compact">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tất cả</button>
          <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Chưa xong</button>
          <button className={filter === "complete" ? "active" : ""} onClick={() => setFilter("complete")}>Hoàn thành</button>
        </div>
      </section>
      <section className="day-table panel">
        <div className="table-head"><span>Ngày</span><span>Kế hoạch</span><span>Trạng thái</span><span /></div>
        {filtered.map((day) => (
          <button className="table-row" key={day.id} onClick={() => setSelected(day)}>
            <span className="day-number">{day.id}</span>
            <span><strong>{formatDate(day.date)}</strong><small>{day.targetKcal} kcal · {day.breakfast}</small></span>
            <span><em className={`status-badge ${day.completed ? "complete" : ""}`}>{day.status}</em></span>
            <ChevronRight size={19} />
          </button>
        ))}
        {!filtered.length && <p className="empty-state">Không có ngày phù hợp bộ lọc.</p>}
      </section>

      {selected && (
        <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label={`Ngày ${selected.id}`}>
            <div className="modal-header">
              <div><SlidersHorizontal size={20} /><strong>Chi tiết ngày {selected.id}</strong></div>
              <button className="icon-button" aria-label="Đóng" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-content">
              <PlanSummary day={days.find((day) => day.id === selected.id)} />
              <DayForm day={days.find((day) => day.id === selected.id)} showToast={showToast} compact />
              <PlanEditForm day={days.find((day) => day.id === selected.id)} showToast={showToast} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
