const PLAN_START = "2026-05-25";
const PLAN_END = "2026-06-23";
const BASE_KCAL = 1709;
const STORAGE_KEY = "discipline30.logs.v1";
const PLAN_EDIT_KEY = "discipline30.planEdits.v1";

const breakfastMenu = [
  "2 trứng luộc + 1 củ khoai lang nhỏ + nước ấm",
  "Sữa chua không đường + 1 chuối nhỏ + 1 trứng",
  "Ngô luộc + 2 trứng + nước ấm",
  "Yến mạch 35g + sữa chua không đường + 1 trứng",
  "Khoai lang + trứng + nước ấm",
  "Ngô/khoai + 2 trứng",
  "Sữa chua không đường + trứng + trái cây ít ngọt"
];

const lunchMenus = {
  1: [
    "Dứa 250-300g + ức gà 150g + rau luộc",
    "Dứa 250-300g + cá 150g + canh bí",
    "Dứa 250-300g + thịt nạc 150g + củ sen/bí ngô",
    "Dứa 250-300g + đậu phụ 200g + 1 trứng + rau xanh + nấm",
    "Dứa 250-300g + cá/ức gà 150g + salad ít sốt"
  ],
  2: [
    "1/2 bát cơm hoặc củ sen + thịt nạc 150g + củ sen/bí ngô",
    "1/2 bát cơm hoặc củ sen + đậu phụ 200g + 1 trứng + rau xanh + nấm",
    "1/2 bát cơm hoặc củ sen + cá/ức gà 150g + salad ít sốt",
    "1/2 bát cơm hoặc củ sen + ức gà 150g + rau luộc",
    "1/2 bát cơm hoặc củ sen + cá 150g + canh bí"
  ],
  3: [
    "Củ sen/bí ngô + cá/ức gà 150g + salad ít sốt; giảm cơm",
    "Củ sen/bí ngô + ức gà 150g + rau luộc; giảm cơm",
    "Củ sen/bí ngô + cá 150g + canh bí; giảm cơm",
    "Củ sen/bí ngô + thịt nạc 150g + củ sen/bí ngô; giảm cơm",
    "Củ sen/bí ngô + đậu phụ 200g + 1 trứng + rau xanh + nấm; giảm cơm"
  ],
  4: [
    "Cá 150g + nhiều rau + 1/3-1/2 bát cơm",
    "Thịt nạc 150g + nhiều rau + 1/3-1/2 bát cơm",
    "Đậu phụ 200g + 1 trứng + nhiều rau + 1/3-1/2 bát cơm",
    "Cá/ức gà 150g + nhiều rau + 1/3-1/2 bát cơm",
    "Ức gà 150g + nhiều rau + 1/3-1/2 bát cơm"
  ]
};

const dinnerMenu = [
  "Cá/ức gà + rau xanh + 1/2 bát cơm",
  "Đậu phụ + canh bí/củ sen + 1/2 bát cơm",
  "Thịt nạc + rau luộc, ít tinh bột",
  "Trứng/đậu phụ + rau + bí ngô/củ sen",
  "Cá + rau xanh, không ăn đêm"
];

const weekSettings = [
  {
    maxDay: 7,
    week: 1,
    targetKcal: 1400,
    herbalType: "Tuần đinh lăng pha loãng",
    pineappleNote: "Dứa 250-300g thay cơm trưa, không ăn mỗi dứa, vẫn phải có đạm + rau."
  },
  {
    maxDay: 14,
    week: 2,
    targetKcal: 1350,
    herbalType: "Tuần lá vối / trà xanh pha loãng",
    pineappleNote: "Dứa 150-200g nếu thèm ngọt, không bắt buộc."
  },
  {
    maxDay: 21,
    week: 3,
    targetKcal: 1300,
    herbalType: "Tuần đỗ đen + kỷ tử + táo đỏ + sen, uống vừa phải",
    pineappleNote: "Không cần dứa hằng ngày."
  },
  {
    maxDay: 30,
    week: 4,
    targetKcal: 1250,
    herbalType: "Tuần atiso / tía tô / bồ công anh pha loãng",
    pineappleNote: "Dứa chỉ dùng như trái cây phụ 100-150g."
  }
];

let currentView = "dashboard";
let currentFilter = "all";
let logs = loadLogs();
let planEdits = loadPlanEdits();
let plan = buildPlan();

function parseLocalDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(key) {
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

function getWeekday(dateKey) {
  const names = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return names[parseLocalDate(dateKey).getDay()];
}

function addDays(dateKey, offset) {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function getSetting(dayNumber) {
  return weekSettings.find((setting) => dayNumber <= setting.maxDay);
}

function buildPlan() {
  return Array.from({ length: 30 }, (_, index) => {
    const id = index + 1;
    const date = addDays(PLAN_START, index);
    const setting = getSetting(id);
    const lunchCycle = lunchMenus[setting.week];
    const edited = planEdits[id] || {};

    return {
      id,
      date,
      weekday: getWeekday(date),
      targetKcal: edited.targetKcal ?? setting.targetKcal,
      deficitFrom1709: BASE_KCAL - (edited.targetKcal ?? setting.targetKcal),
      plainWaterLiter: 1.15,
      herbalWaterLiter: 1.15,
      herbalType: edited.herbalType ?? setting.herbalType,
      breakfast: edited.breakfast ?? breakfastMenu[index % breakfastMenu.length],
      lunch: edited.lunch ?? lunchCycle[index % lunchCycle.length],
      dinner: edited.dinner ?? dinnerMenu[index % dinnerMenu.length],
      pineappleNote: edited.pineappleNote ?? setting.pineappleNote,
      warmLemonAfterMeal: edited.warmLemonAfterMeal ?? "Có thể uống chanh ấm sau ăn nếu hợp bụng; nếu đau dạ dày/trào ngược thì không ép.",
      sleepBefore23: edited.sleepBefore23 ?? "Ngủ trước 23h là tiêu chí kỷ luật.",
      exerciseNote: edited.exerciseNote ?? "Đi bộ/bơi tùy sức; vận động là bonus, không tính calo vận động vào kế hoạch.",
      actualKcal: "",
      actualWaterLiter: "",
      weight: "",
      waist: "",
      status: "",
      note: ""
    };
  });
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function getPlanStatus(date) {
  const today = getTodayKey();
  if (date > today) return "Chưa tới";
  if (date === today) return "Hôm nay";
  return "Đã qua";
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function loadPlanEdits() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_EDIT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveDayLog(dayId, log) {
  const allowed = {
    checklist: log.checklist || {},
    actualKcal: log.actualKcal || "",
    actualWaterLiter: log.actualWaterLiter || "",
    weight: log.weight || "",
    waist: log.waist || "",
    note: log.note || "",
    completed: Boolean(log.completed)
  };
  logs[String(dayId)] = allowed;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  renderAll();
}

function savePlanEdit(dayId, edit) {
  planEdits[String(dayId)] = edit;
  localStorage.setItem(PLAN_EDIT_KEY, JSON.stringify(planEdits));
  plan = buildPlan();
  renderAll();
}

function resetDay(dayId) {
  delete logs[String(dayId)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  renderAll();
}

function getMergedDay(day) {
  const log = logs[String(day.id)] || {};
  const status = log.completed ? "Hoàn thành" : getPlanStatus(day.date);

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
    completed: Boolean(log.completed),
    status
  };
}

function getMergedPlan() {
  return plan.map(getMergedDay);
}

function calculateStats() {
  const days = getMergedPlan();
  const completedDays = days.filter((day) => day.completed);
  const kcalValues = days.map((day) => Number(day.actualKcal)).filter(Boolean);
  const waterValues = days.map((day) => Number(day.actualWaterLiter)).filter(Boolean);
  const weightValues = days.map((day) => Number(day.weight)).filter(Boolean);
  const waistValues = days.map((day) => Number(day.waist)).filter(Boolean);

  return {
    completed: completedDays.length,
    completionRate: Math.round((completedDays.length / days.length) * 100),
    averageKcal: average(kcalValues),
    averageWater: average(waterValues),
    weightChange: changeFromFirstToLast(weightValues),
    waistChange: changeFromFirstToLast(waistValues),
    totalExpectedDeficit: days.reduce((sum, day) => sum + day.deficitFrom1709, 0),
    latestWeight: lastValue(weightValues),
    latestWaist: lastValue(waistValues),
    overdue: days.filter((day) => day.status === "Đã qua").length
  };
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function changeFromFirstToLast(values) {
  if (values.length < 2) return null;
  return values[values.length - 1] - values[0];
}

function lastValue(values) {
  return values.length ? values[values.length - 1] : null;
}

function renderDashboard() {
  const stats = calculateStats();
  const days = getMergedPlan();
  const todayDay = days.find((day) => day.date === getTodayKey());
  const todayText = todayDay ? `Ngày ${todayDay.id}` : getOutsidePlanMessage();
  const dashboard = document.querySelector("#dashboardView");

  dashboard.innerHTML = `
    <div class="grid">
      <div class="card alt">
        <h2>Tổng quan</h2>
        <div class="progress-wrap" aria-label="Tiến độ hoàn thành">
          <div class="progress-bar" style="width: ${stats.completionRate}%"></div>
        </div>
        <p class="muted" style="margin: 10px 0 0;">${stats.completed}/30 ngày hoàn thành (${stats.completionRate}%)</p>
      </div>

      <div class="grid two">
        ${metric("Hôm nay", todayText, todayDay ? formatDisplayDate(todayDay.date) : "")}
        ${metric("Kcal hôm nay", todayDay ? `${todayDay.targetKcal} kcal` : "-", todayDay ? `Thâm hụt ${todayDay.deficitFrom1709} kcal` : "")}
        ${metric("Nước hôm nay", todayDay ? "2.3L" : "-", todayDay ? "1.15L lọc + 1.15L thảo mộc" : "")}
        ${metric("Đã qua chưa xong", String(stats.overdue), "Ngày cần vá lại")}
        ${metric("Tổng thâm hụt dự kiến", `${stats.totalExpectedDeficit} kcal`, "Không tính calo vận động")}
        ${metric("Cân nặng mới nhất", stats.latestWeight === null ? "-" : `${stats.latestWeight} kg`, "Theo log đã nhập")}
        ${metric("Vòng bụng mới nhất", stats.latestWaist === null ? "-" : `${stats.latestWaist} cm`, "Theo log đã nhập")}
        ${metric("Nước thảo mộc", todayDay ? todayDay.herbalType : "-", "Pha loãng, không uống đặc")}
      </div>

      <div class="card">
        <h3>Nguyên tắc</h3>
        <div class="detail-line"><span>Không dùng</span><strong>Nước muối hồng như cách giảm mỡ.</strong></div>
        <div class="detail-line"><span>Chanh ấm</span><strong>Nếu đau dạ dày/trào ngược thì không ép uống.</strong></div>
        <div class="detail-line"><span>Vận động</span><strong>Chỉ là bonus, không cộng calo vào kế hoạch ăn.</strong></div>
      </div>
    </div>
  `;
}

function renderToday() {
  const todayView = document.querySelector("#todayView");
  const today = getTodayKey();

  if (today < PLAN_START || today > PLAN_END) {
    todayView.innerHTML = `<div class="card"><h2>Hôm nay</h2><p class="empty">${getOutsidePlanMessage()}</p></div>`;
    return;
  }

  const day = getMergedPlan().find((item) => item.date === today);
  todayView.innerHTML = `
    <div class="grid">
      ${renderPlanCard(day)}
      ${renderWarnings(day)}
      ${renderDayForm(day)}
    </div>
  `;
  attachFormHandlers(todayView, day.id);
}

function renderDayList() {
  const daysView = document.querySelector("#daysView");
  const days = getMergedPlan();
  const filteredDays = filterDays(days, currentFilter);

  daysView.innerHTML = `
    <div class="card">
      <h2>Danh sách 30 ngày</h2>
      <div class="filter-row" role="tablist" aria-label="Lọc ngày">
        ${filterButton("all", "Tất cả")}
        ${filterButton("today", "Hôm nay")}
        ${filterButton("past", "Đã qua")}
        ${filterButton("completed", "Hoàn thành")}
        ${filterButton("incomplete", "Chưa hoàn thành")}
      </div>
      <div id="dayList">
        ${filteredDays.length ? filteredDays.map(renderDayListCard).join("") : `<div class="empty">Không có ngày phù hợp.</div>`}
      </div>
    </div>
  `;

  daysView.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderDayList();
    });
  });

  daysView.querySelectorAll(".day-card").forEach((card) => {
    card.addEventListener("click", () => renderDayDetail(Number(card.dataset.dayId)));
  });
}

function renderDayDetail(dayId) {
  const day = getMergedPlan().find((item) => item.id === dayId);
  const modal = document.querySelector("#detailModal");
  const body = document.querySelector("#detailBody");
  document.querySelector("#detailTitle").textContent = `Ngày ${day.id} - ${formatDisplayDate(day.date)}`;

  body.innerHTML = `
    <div class="grid">
      ${renderPlanCard(day)}
      ${renderWarnings(day)}
      ${renderDayForm(day)}
      <div class="card">
        <button id="togglePlanEdit" class="button secondary full" type="button">Chỉnh plan ngày này</button>
        <form id="planEditForm" class="edit-plan" style="margin-top: 12px;">
          ${field("editTargetKcal", "Kcal mục tiêu", day.targetKcal, "number")}
          ${field("editHerbalType", "Loại nước/thảo mộc", day.herbalType)}
          ${field("editBreakfast", "Bữa sáng", day.breakfast, "textarea")}
          ${field("editLunch", "Bữa trưa", day.lunch, "textarea")}
          ${field("editDinner", "Bữa tối", day.dinner, "textarea")}
          ${field("editPineappleNote", "Ghi chú dứa", day.pineappleNote, "textarea")}
          ${field("editWarmLemonAfterMeal", "Chanh ấm sau ăn", day.warmLemonAfterMeal, "textarea")}
          ${field("editSleepBefore23", "Ngủ trước 23h", day.sleepBefore23, "textarea")}
          ${field("editExerciseNote", "Đi bộ/bơi tùy sức", day.exerciseNote, "textarea")}
          <button class="button full" type="submit">Lưu chỉnh plan</button>
        </form>
      </div>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  attachFormHandlers(body, day.id);
  attachPlanEditHandlers(body, day.id);
}

function renderStats() {
  const stats = calculateStats();
  document.querySelector("#statsView").innerHTML = `
    <div class="grid">
      <div class="card alt">
        <h2>Thống kê</h2>
        <p class="muted">Chỉ hiển thị dữ liệu theo log bạn nhập, không cam kết giảm cân.</p>
      </div>
      <div class="grid two">
        ${metric("Số ngày hoàn thành", `${stats.completed}/30`, `${stats.completionRate}%`)}
        ${metric("Kcal thực tế TB", stats.averageKcal === null ? "-" : `${Math.round(stats.averageKcal)} kcal`, "Nếu có nhập")}
        ${metric("Nước thực tế TB", stats.averageWater === null ? "-" : `${stats.averageWater.toFixed(2)}L`, "Nếu có nhập")}
        ${metric("Cân nặng đổi", stats.weightChange === null ? "-" : `${formatChange(stats.weightChange)} kg`, "Từ lần nhập đầu đến cuối")}
        ${metric("Vòng bụng đổi", stats.waistChange === null ? "-" : `${formatChange(stats.waistChange)} cm`, "Từ lần nhập đầu đến cuối")}
        ${metric("Thâm hụt dự kiến", `${stats.totalExpectedDeficit} kcal`, "Theo plan gốc/đã chỉnh")}
      </div>
    </div>
  `;
}

function renderPlanCard(day) {
  return `
    <div class="card plan-card">
      <div class="day-card-top">
        <div>
          <h2>Ngày ${day.id}</h2>
          <p class="muted">${day.weekday}, ${formatDisplayDate(day.date)}</p>
        </div>
        ${statusPill(day.status)}
      </div>
      ${detail("Kcal mục tiêu", `${day.targetKcal} kcal`)}
      ${detail("Thâm hụt", `${day.deficitFrom1709} kcal từ mốc ${BASE_KCAL}`)}
      ${detail("Nước lọc", `${day.plainWaterLiter}L`)}
      ${detail("Nước thảo mộc", `${day.herbalWaterLiter}L`)}
      ${detail("Loại nước/thảo mộc", day.herbalType)}
      ${detail("Bữa sáng", day.breakfast)}
      ${detail("Bữa trưa", day.lunch)}
      ${detail("Bữa tối", day.dinner)}
      ${detail("Ghi chú dứa", day.pineappleNote)}
      ${detail("Chanh ấm sau ăn", day.warmLemonAfterMeal)}
      ${detail("Ngủ trước 23h", day.sleepBefore23)}
      ${detail("Đi bộ/bơi tùy sức", day.exerciseNote)}
    </div>
  `;
}

function renderDayForm(day) {
  return `
    <form class="card day-form" data-day-id="${day.id}">
      <h2>Checklist ngày này</h2>
      <div class="checklist">
        ${check("breakfast", "Đã ăn đúng bữa sáng", day.checklist.breakfast)}
        ${check("lunch", "Đã ăn đúng bữa trưa", day.checklist.lunch)}
        ${check("dinner", "Đã ăn đúng bữa tối", day.checklist.dinner)}
        ${check("plainWater", "Đã uống đủ nước lọc", day.checklist.plainWater)}
        ${check("herbalWater", "Đã uống đủ nước thảo mộc", day.checklist.herbalWater)}
        ${check("sleep", "Đã ngủ trước 23h", day.checklist.sleep)}
        ${check("exercise", "Có vận động nhẹ", day.checklist.exercise)}
      </div>

      <div class="field-grid" style="margin-top: 14px;">
        ${field("actualKcal", "Kcal thực tế", day.actualKcal, "number")}
        ${field("actualWaterLiter", "Nước thực tế (L)", day.actualWaterLiter, "number", "0.1")}
        ${field("weight", "Cân nặng (kg)", day.weight, "number", "0.1")}
        ${field("waist", "Vòng bụng (cm)", day.waist, "number", "0.1")}
        ${field("note", "Ghi chú cá nhân", day.note, "textarea")}
      </div>

      <div class="actions" style="margin-top: 14px;">
        <button class="button" type="submit">Lưu ngày này</button>
        <button class="button secondary mark-complete" type="button">Đánh dấu hoàn thành</button>
        <button class="button danger reset-day" type="button">Reset ngày này</button>
      </div>
    </form>
  `;
}

function renderWarnings(day) {
  const warnings = [];
  const actualKcal = Number(day.actualKcal);
  const actualWater = Number(day.actualWaterLiter);
  const note = String(day.note || "").toLowerCase();

  if (actualKcal && actualKcal < 1200) {
    warnings.push({ type: "danger", text: "Không nên xuống dưới 1200 kcal/ngày nếu không có chuyên gia theo dõi." });
  }
  if (actualWater && actualWater < 2.0) {
    warnings.push({ type: "warn", text: "Nước hôm nay hơi thiếu." });
  }
  if (day.status === "Đã qua") {
    warnings.push({ type: "warn", text: "Ngày này bị đục lỗ đáy cốc rồi, mai vá lại." });
  }
  if (note.includes("dứa đơn độc") || note.includes("mỗi dứa") || note.includes("chỉ ăn dứa")) {
    warnings.push({ type: "warn", text: "Dứa không phải bữa ăn hoàn chỉnh. Cần có đạm + rau." });
  }

  if (!warnings.length) return "";

  return `
    <div class="grid">
      ${warnings.map((warning) => `<div class="alert ${warning.type === "danger" ? "danger" : ""}">${escapeHtml(warning.text)}</div>`).join("")}
    </div>
  `;
}

function metric(label, value, sub) {
  return `
    <div class="card metric">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      ${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ""}
    </div>
  `;
}

function detail(label, value) {
  return `<div class="detail-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function check(name, label, checked) {
  return `
    <label class="check-row">
      <input type="checkbox" name="${name}" ${checked ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function field(name, label, value, type = "text", step = "") {
  const safeValue = escapeHtml(value ?? "");
  if (type === "textarea") {
    return `
      <label class="field full">
        <span>${escapeHtml(label)}</span>
        <textarea name="${name}">${safeValue}</textarea>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${name}" type="${type}" value="${safeValue}" ${step ? `step="${step}"` : ""} inputmode="${type === "number" ? "decimal" : "text"}">
    </label>
  `;
}

function filterButton(key, label) {
  return `<button class="filter-button ${currentFilter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`;
}

function renderDayListCard(day) {
  return `
    <button class="day-card" type="button" data-day-id="${day.id}">
      <div class="day-card-top">
        <div>
          <div class="day-title">Ngày ${day.id} - ${formatDisplayDate(day.date)}</div>
          <div class="muted">${day.weekday} · ${day.targetKcal} kcal</div>
        </div>
        ${statusPill(day.status)}
      </div>
      <div class="day-summary">
        <span>Sáng: ${escapeHtml(shorten(day.breakfast))}</span>
        <span>Trưa: ${escapeHtml(shorten(day.lunch))}</span>
        <span>Tối: ${escapeHtml(shorten(day.dinner))}</span>
      </div>
    </button>
  `;
}

function statusPill(status) {
  const className = status === "Hoàn thành" ? "" : status === "Đã qua" ? "danger" : status === "Hôm nay" ? "warn" : "";
  return `<span class="status-pill ${className}">${escapeHtml(status)}</span>`;
}

function filterDays(days, filter) {
  if (filter === "today") return days.filter((day) => day.status === "Hôm nay");
  if (filter === "past") return days.filter((day) => day.status === "Đã qua");
  if (filter === "completed") return days.filter((day) => day.completed);
  if (filter === "incomplete") return days.filter((day) => !day.completed);
  return days;
}

function getOutsidePlanMessage() {
  const today = getTodayKey();
  if (today < PLAN_START) return "Kế hoạch chưa bắt đầu";
  if (today > PLAN_END) return "Kế hoạch 30 ngày đã kết thúc";
  return "";
}

function collectForm(form, completedOverride) {
  return {
    checklist: {
      breakfast: form.elements.breakfast.checked,
      lunch: form.elements.lunch.checked,
      dinner: form.elements.dinner.checked,
      plainWater: form.elements.plainWater.checked,
      herbalWater: form.elements.herbalWater.checked,
      sleep: form.elements.sleep.checked,
      exercise: form.elements.exercise.checked
    },
    actualKcal: form.elements.actualKcal.value.trim(),
    actualWaterLiter: form.elements.actualWaterLiter.value.trim(),
    weight: form.elements.weight.value.trim(),
    waist: form.elements.waist.value.trim(),
    note: form.elements.note.value.trim(),
    completed: completedOverride
  };
}

function attachFormHandlers(scope, dayId) {
  const form = scope.querySelector(`.day-form[data-day-id="${dayId}"]`);
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const existing = logs[String(dayId)] || {};
    saveDayLog(dayId, collectForm(form, Boolean(existing.completed)));
  });

  form.querySelector(".mark-complete").addEventListener("click", () => {
    saveDayLog(dayId, collectForm(form, true));
  });

  form.querySelector(".reset-day").addEventListener("click", () => {
    resetDay(dayId);
  });
}

function attachPlanEditHandlers(scope, dayId) {
  const toggle = scope.querySelector("#togglePlanEdit");
  const form = scope.querySelector("#planEditForm");
  if (!toggle || !form) return;

  toggle.addEventListener("click", () => {
    form.classList.toggle("open");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const targetKcal = Number(form.elements.editTargetKcal.value) || getMergedPlan().find((day) => day.id === dayId).targetKcal;
    savePlanEdit(dayId, {
      targetKcal,
      herbalType: form.elements.editHerbalType.value.trim(),
      breakfast: form.elements.editBreakfast.value.trim(),
      lunch: form.elements.editLunch.value.trim(),
      dinner: form.elements.editDinner.value.trim(),
      pineappleNote: form.elements.editPineappleNote.value.trim(),
      warmLemonAfterMeal: form.elements.editWarmLemonAfterMeal.value.trim(),
      sleepBefore23: form.elements.editSleepBefore23.value.trim(),
      exerciseNote: form.elements.editExerciseNote.value.trim()
    });
    renderDayDetail(dayId);
  });
}

function renderAll() {
  renderDashboard();
  renderToday();
  renderDayList();
  renderStats();
  switchView(currentView);
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function formatChange(value) {
  if (value > 0) return `+${value.toFixed(1)}`;
  return value.toFixed(1);
}

function shorten(text) {
  return text.length > 74 ? `${text.slice(0, 74)}...` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelector("#closeDetail").addEventListener("click", () => {
  const modal = document.querySelector("#detailModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
});

document.querySelector("#detailModal").addEventListener("click", (event) => {
  if (event.target.id === "detailModal") {
    event.currentTarget.classList.remove("open");
    event.currentTarget.setAttribute("aria-hidden", "true");
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      document.querySelector("#syncStatus").textContent = "SW lỗi";
    });
  });
}

renderAll();
