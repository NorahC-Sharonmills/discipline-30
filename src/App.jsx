import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Target,
  User
} from "lucide-react";
import { api, flushQueue, importLegacyData } from "./api";
import { buildPlan, formatDate, mergePlan } from "./plan";
import { dataLoaded, dataLoadFailed, dataLoading, signedOut, userLoaded } from "./store";
import { AuthPage } from "./components/AuthPage";
import { ToastRegion } from "./components/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { TodayPage } from "./pages/TodayPage";
import { DaysPage } from "./pages/DaysPage";
import { StatsPage } from "./pages/StatsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { SettingsPage } from "./pages/SettingsPage";

const navItems = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/today", label: "Hôm nay", icon: ClipboardList },
  { to: "/days", label: "30 ngày", icon: CalendarDays },
  { to: "/stats", label: "Thống kê", icon: BarChart3 },
  { to: "/goals", label: "Mục tiêu", icon: Target },
  { to: "/settings", label: "Cài đặt", icon: Settings }
];

export function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useSelector((state) => state.session);
  const { logs, planEdits, plan, syncState, loaded } = useSelector((state) => state.data);
  const [theme, setTheme] = useState(localStorage.getItem("discipline30.theme") || "light");
  const [mobileNav, setMobileNav] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, tone = "success") => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("discipline30.theme", theme);
  }, [theme]);

  useEffect(() => setMobileNav(false), [location.pathname]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        await importLegacyData();
        const [profile, data] = await Promise.all([
          api("/me"),
          api("/data")
        ]);
        if (!active) return;
        dispatch(userLoaded(profile.user));
        dispatch(dataLoaded(data));
      } catch (error) {
        if (!navigator.onLine) {
          dispatch(dataLoadFailed());
          showToast("Đang dùng dữ liệu đã lưu trên thiết bị.", "warning");
          return;
        }
        dispatch(signedOut());
        showToast(error.message, "error");
      }
    })();
    return () => {
      active = false;
    };
  }, [dispatch, showToast, token]);

  useEffect(() => {
    if (!token) return;
    const syncPending = async () => {
      const count = await flushQueue();
      if (count) {
        showToast(`Đã đồng bộ ${count} thay đổi ngoại tuyến.`);
        dispatch(dataLoaded(await api("/data")));
      }
    };
    window.addEventListener("online", syncPending);
    if (navigator.onLine) syncPending();
    return () => window.removeEventListener("online", syncPending);
  }, [dispatch, showToast, token]);

  const days = useMemo(
    () => mergePlan(buildPlan(planEdits, plan.startDate), logs),
    [logs, plan.startDate, planEdits]
  );

  if (!token) return <AuthPage showToast={showToast} />;
  if (!loaded) {
    return (
      <main className="loading-page">
        <span className="loading-spinner" />
        <p>Đang tải kế hoạch 30 ngày...</p>
      </main>
    );
  }

  const logout = () => {
    dispatch(dataLoading());
    dispatch(signedOut());
    navigate("/");
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Check size={19} strokeWidth={3} /></span>
          <div>
            <strong>Discipline 30</strong>
            <span>Nhật ký sức khỏe</span>
          </div>
        </div>
        <nav aria-label="Điều hướng chính">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="user-summary" type="button" onClick={() => navigate("/settings")}>
            <span className="avatar"><User size={18} /></span>
            <span><strong>{user?.name || "Tài khoản"}</strong><small>{user?.email}</small></span>
          </button>
          <button className="icon-button" type="button" title="Đăng xuất" onClick={logout}>
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" aria-label="Mở menu" onClick={() => setMobileNav(true)}>
            <Menu size={21} />
          </button>
          <div>
            <h1>{navItems.find((item) => item.to === location.pathname)?.label || "Discipline 30"}</h1>
            <p>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</p>
          </div>
          <div className="topbar-actions">
            <span className={`sync-state ${syncState}`}>
              <span />
              {syncState === "syncing" ? "Đang đồng bộ" : syncState === "offline" ? "Ngoại tuyến" : "Đã đồng bộ"}
            </span>
            <button className="icon-button" type="button" title="Đổi giao diện" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage days={days} />} />
            <Route path="/today" element={<TodayPage days={days} showToast={showToast} />} />
            <Route path="/days" element={<DaysPage days={days} showToast={showToast} />} />
            <Route path="/stats" element={<StatsPage days={days} />} />
            <Route path="/goals" element={<GoalsPage days={days} showToast={showToast} />} />
            <Route path="/settings" element={<SettingsPage showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {mobileNav && <button className="nav-backdrop" type="button" aria-label="Đóng menu" onClick={() => setMobileNav(false)} />}
      <ToastRegion items={toasts} />
    </div>
  );
}
