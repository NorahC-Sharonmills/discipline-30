import { useState } from "react";
import { useDispatch } from "react-redux";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { api } from "../api";
import { dataLoading, signedIn } from "../store";

export function AuthPage({ showToast }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const nextErrors = {};
    if (mode === "register" && payload.name.trim().length < 2) nextErrors.name = "Nhập ít nhất 2 ký tự.";
    if (!payload.email.includes("@")) nextErrors.email = "Email chưa hợp lệ.";
    if (payload.password.length < 8) nextErrors.password = "Mật khẩu cần ít nhất 8 ký tự.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      dispatch(dataLoading());
      dispatch(signedIn(result));
      showToast(mode === "login" ? "Đăng nhập thành công." : "Tài khoản đã được tạo.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand"><CheckCircle2 /> Discipline 30</div>
        <div>
          <p className="eyebrow">30 ngày nhất quán</p>
          <h1>Tiến bộ được tạo từ những việc nhỏ làm đúng mỗi ngày.</h1>
          <p>Theo dõi bữa ăn, nước uống, số đo và thói quen trong một nơi riêng tư, rõ ràng.</p>
        </div>
        <div className="auth-features">
          <span><CheckCircle2 size={18} /> Đồng bộ nhiều thiết bị</span>
          <span><CheckCircle2 size={18} /> Hoạt động khi mất mạng</span>
          <span><CheckCircle2 size={18} /> Báo cáo tiến độ trực quan</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="segmented">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Đăng nhập</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Tạo tài khoản</button>
          </div>
          <div className="auth-heading">
            <h2>{mode === "login" ? "Chào bạn trở lại" : "Bắt đầu hành trình"}</h2>
            <p>{mode === "login" ? "Tiếp tục kế hoạch 30 ngày của bạn." : "Tạo tài khoản để lưu và đồng bộ tiến độ."}</p>
          </div>
          <form onSubmit={submit} noValidate>
            {mode === "register" && (
              <label className="field">
                <span>Họ tên</span>
                <input name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>
            )}
            <label className="field input-icon">
              <span>Email</span>
              <Mail size={18} />
              <input name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="field input-icon">
              <span>Mật khẩu</span>
              <LockKeyhole size={18} />
              <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} aria-invalid={Boolean(errors.password)} />
              <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>
            <button className="button primary full" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
