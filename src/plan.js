export const PLAN_START = "2026-05-25";
export const PLAN_END = "2026-06-23";
export const BASE_KCAL = 1709;

const breakfasts = [
  "2 trứng luộc, khoai lang nhỏ và nước ấm",
  "Sữa chua không đường, chuối nhỏ và 1 trứng",
  "Ngô luộc, 2 trứng và nước ấm",
  "Yến mạch 35g, sữa chua không đường và 1 trứng",
  "Khoai lang, trứng và nước ấm",
  "Ngô hoặc khoai và 2 trứng",
  "Sữa chua không đường, trứng và trái cây ít ngọt"
];

const lunches = [
  "Ức gà 150g, rau luộc và phần tinh bột phù hợp",
  "Cá 150g, canh bí và phần tinh bột phù hợp",
  "Thịt nạc 150g, củ sen hoặc bí ngô",
  "Đậu phụ 200g, 1 trứng, rau xanh và nấm",
  "Cá hoặc ức gà 150g với salad ít sốt"
];

const dinners = [
  "Cá hoặc ức gà, rau xanh và 1/2 bát cơm",
  "Đậu phụ, canh bí hoặc củ sen và 1/2 bát cơm",
  "Thịt nạc và rau luộc, ít tinh bột",
  "Trứng hoặc đậu phụ, rau và bí ngô",
  "Cá và rau xanh, không ăn đêm"
];

const weekSettings = [
  { max: 7, kcal: 1400, herbalType: "Đinh lăng pha loãng" },
  { max: 14, kcal: 1350, herbalType: "Lá vối hoặc trà xanh pha loãng" },
  { max: 21, kcal: 1300, herbalType: "Đỗ đen, kỷ tử, táo đỏ và sen" },
  { max: 30, kcal: 1250, herbalType: "Atiso, tía tô hoặc bồ công anh pha loãng" }
];

function addDays(dateKey, offset) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

function localDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function buildPlan(edits = {}, startDate = PLAN_START) {
  return Array.from({ length: 30 }, (_, index) => {
    const id = index + 1;
    const week = weekSettings.find((item) => id <= item.max);
    const edit = edits[String(id)] || {};
    const targetKcal = edit.targetKcal ?? week.kcal;
    return {
      id,
      date: addDays(startDate, index),
      targetKcal,
      deficitFrom1709: BASE_KCAL - targetKcal,
      plainWaterLiter: 1.15,
      herbalWaterLiter: 1.15,
      herbalType: edit.herbalType ?? week.herbalType,
      breakfast: edit.breakfast ?? breakfasts[index % breakfasts.length],
      lunch: edit.lunch ?? lunches[index % lunches.length],
      dinner: edit.dinner ?? dinners[index % dinners.length],
      pineappleNote: edit.pineappleNote ?? "Dùng dứa như một phần bữa ăn, luôn kèm đạm và rau.",
      warmLemonAfterMeal: edit.warmLemonAfterMeal ?? "Chỉ uống chanh ấm khi phù hợp với dạ dày.",
      sleepBefore23: edit.sleepBefore23 ?? "Ưu tiên ngủ trước 23h.",
      exerciseNote: edit.exerciseNote ?? "Đi bộ hoặc bơi tùy sức; vận động là phần bổ trợ."
    };
  });
}

export function mergePlan(plan, logs) {
  const today = localDateKey();
  return plan.map((day) => {
    const log = logs[String(day.id)] || {};
    const status = log.completed
      ? "Hoàn thành"
      : day.date === today
        ? "Hôm nay"
        : day.date < today
          ? "Đã qua"
          : "Sắp tới";
    return {
      ...day,
      ...log,
      checklist: {
        breakfast: false,
        lunch: false,
        dinner: false,
        plainWater: false,
        herbalWater: false,
        sleep: false,
        exercise: false,
        ...(log.checklist || {})
      },
      status,
      completed: Boolean(log.completed)
    };
  });
}

export function calculateStats(days) {
  const values = (key) => days.map((day) => Number(day[key])).filter(Number.isFinite).filter((v) => v);
  const completed = days.filter((day) => day.completed).length;
  const weight = values("weight");
  const waist = values("waist");
  const streak = days.reduce((best, day, index) => {
    if (!day.completed) return best;
    let count = 1;
    while (index - count >= 0 && days[index - count].completed) count += 1;
    return Math.max(best, count);
  }, 0);
  return {
    completed,
    completionRate: Math.round((completed / days.length) * 100),
    streak,
    averageKcal: average(values("actualKcal")),
    averageWater: average(values("actualWaterLiter")),
    latestWeight: weight.at(-1) ?? null,
    latestWaist: waist.at(-1) ?? null,
    weightChange: weight.length > 1 ? weight.at(-1) - weight[0] : null,
    waistChange: waist.length > 1 ? waist.at(-1) - waist[0] : null
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}
