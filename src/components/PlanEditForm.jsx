import { useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { useDataActions } from "../hooks";

const fields = [
  ["targetKcal", "Kcal mục tiêu", "number"],
  ["herbalType", "Nước thảo mộc", "text"],
  ["breakfast", "Bữa sáng", "textarea"],
  ["lunch", "Bữa trưa", "textarea"],
  ["dinner", "Bữa tối", "textarea"],
  ["pineappleNote", "Ghi chú trái cây", "textarea"],
  ["warmLemonAfterMeal", "Chanh ấm sau ăn", "textarea"],
  ["sleepBefore23", "Kỷ luật giấc ngủ", "textarea"],
  ["exerciseNote", "Vận động", "textarea"]
];

export function PlanEditForm({ day, showToast }) {
  const actions = useDataActions(showToast);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(day);
  useEffect(() => setForm(day), [day]);

  const save = () => {
    const edit = Object.fromEntries(fields.map(([key]) => [
      key,
      key === "targetKcal" ? Number(form[key]) : String(form[key] || "").trim()
    ]));
    actions.saveEdit(day.id, edit);
    setOpen(false);
  };

  return (
    <section className="panel">
      <div className="section-heading edit-heading">
        <div><p className="eyebrow">Tùy chỉnh</p><h2>Kế hoạch riêng cho ngày {day.id}</h2></div>
        <button className="button secondary" onClick={() => setOpen(!open)}><Pencil size={17} /> {open ? "Đóng" : "Chỉnh sửa"}</button>
      </div>
      {open && (
        <div className="form-grid edit-form">
          {fields.map(([key, label, type]) => (
            <label className={`field ${type === "textarea" ? "full" : ""}`} key={key}>
              <span>{label}</span>
              {type === "textarea"
                ? <textarea rows="3" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                : <input type={type} min={type === "number" ? 1000 : undefined} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}
            </label>
          ))}
          <button className="button primary" onClick={save}><Save size={18} /> Lưu chỉnh sửa</button>
        </div>
      )}
    </section>
  );
}
