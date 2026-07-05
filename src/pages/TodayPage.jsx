import { PlanSummary } from "../components/PlanSummary";
import { DayForm } from "../components/DayForm";

export function TodayPage({ days, showToast }) {
  const key = new Date().toISOString().slice(0, 10);
  const day = days.find((item) => item.date === key) || days.find((item) => !item.completed) || days.at(-1);
  return (
    <div className="split-page">
      <PlanSummary day={day} />
      <DayForm day={day} showToast={showToast} />
    </div>
  );
}
