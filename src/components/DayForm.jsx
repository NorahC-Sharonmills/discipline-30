import { useEffect, useState } from "react";
import { Check, RotateCcw, Save } from "lucide-react";
import { useDataActions } from "../hooks";

const checks = [
  ["breakfast", "Ăn đúng bữa sáng"],
  ["lunch", "Ăn đúng bữa trưa"],
  ["dinner", "Ăn đúng bữa tối"],
  ["plainWater", "Đủ nước lọc"],
  ["herbalWater", "Đủ nước thảo mộc"],
  ["sleep", "Ngủ trước 23h"],
  ["exercise", "Vận động nhẹ"]
];

export function DayForm({ day, showToast, compact = false }) {
  const actions = useDataActions(showToast);
  const [form, setForm] = useState(day);

  useEffect(() => setForm(day), [day]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateCheck = (key, value) => setForm((current) => ({
    ...current,
    checklist: { ...current.checklist, [key]: value }
  }));

  const save = (completed = form.completed) => actions.saveLog(day.id, {
    checklist: form.checklist,
    actualKcal: form.actualKcal || "",
    actualWaterLiter: form.actualWaterLiter || "",
    weight: form.weight || "",
    waist: form.waist || "",
    note: form.note || "",
    completed
  });

  return (
    <section className="panel day-form-panel">
      <div className="section-heading">
        <div><p className="eyebrow">Nhật ký</p><h2>Checklist ngày {day.id}</h2></div>
        <span className={`status-badge ${day.completed ? "complete" : ""}`}>{day.completed ? "Hoàn thành" : day.status}</span>
      </div>
      <div className="check-grid">
        {checks.map(([key, label]) => (
          <label className="check-item" key={key}>
            <input type="checkbox" checked={Boolean(form.checklist[key])} onChange={(event) => updateCheck(key, event.target.checked)} />
            <span><Check size={15} /></span>
            {label}
          </label>
        ))}
      </div>
      <div className="form-grid">
        <label className="field"><span>Kcal thực tế</span><input type="number" min="0" value={form.actualKcal || ""} onChange={(e) => update("actualKcal", e.target.value)} /></label>
        <label className="field"><span>Nước thực tế (L)</span><input type="number" min="0" step="0.1" value={form.actualWaterLiter || ""} onChange={(e) => update("actualWaterLiter", e.target.value)} /></label>
        <label className="field"><span>Cân nặng (kg)</span><input type="number" min="0" step="0.1" value={form.weight || ""} onChange={(e) => update("weight", e.target.value)} /></label>
        <label className="field"><span>Vòng bụng (cm)</span><input type="number" min="0" step="0.1" value={form.waist || ""} onChange={(e) => update("waist", e.target.value)} /></label>
        <label className="field full"><span>Ghi chú trong ngày</span><textarea rows={compact ? 3 : 4} value={form.note || ""} onChange={(e) => update("note", e.target.value)} /></label>
      </div>
      <div className="form-actions">
        <button className="button primary" type="button" onClick={() => save()}><Save size={18} /> Lưu nhật ký</button>
        <button className="button secondary" type="button" onClick={() => save(true)}><Check size={18} /> Hoàn thành</button>
        <button className="button ghost danger" type="button" onClick={() => actions.removeLog(day.id)}><RotateCcw size={18} /> Đặt lại</button>
      </div>
    </section>
  );
}
