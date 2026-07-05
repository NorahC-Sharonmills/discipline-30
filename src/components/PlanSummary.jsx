import { Droplets, Flame, Moon, Salad, Soup, Utensils } from "lucide-react";
import { formatDate } from "../plan";

export function PlanSummary({ day }) {
  const rows = [
    [Salad, "Bữa sáng", day.breakfast],
    [Utensils, "Bữa trưa", day.lunch],
    [Soup, "Bữa tối", day.dinner],
    [Droplets, "Nước uống", `${day.plainWaterLiter}L nước lọc + ${day.herbalWaterLiter}L ${day.herbalType}`],
    [Moon, "Kỷ luật", day.sleepBefore23]
  ];
  return (
    <section className="panel">
      <div className="section-heading">
        <div><p className="eyebrow">{formatDate(day.date)}</p><h2>Kế hoạch ngày {day.id}</h2></div>
        <span className="kcal-chip"><Flame size={16} /> {day.targetKcal} kcal</span>
      </div>
      <div className="plan-rows">
        {rows.map(([Icon, label, value]) => (
          <div className="plan-row" key={label}>
            <span><Icon size={19} /></span>
            <div><small>{label}</small><strong>{value}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}
