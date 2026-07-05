import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { store } from "./store";
import "./styles.css";

const RECOVERY_KEYS = [
  "discipline30.cache.v2",
  "discipline30.syncQueue.v1"
];

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Application render failed", error);
  }

  recover = async () => {
    RECOVERY_KEYS.forEach((key) => localStorage.removeItem(key));
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
    }
    window.location.reload();
  };

  render() {
    if (this.state.failed) {
      return (
        <main className="recovery-page">
          <section className="panel recovery-panel">
            <h1>Ứng dụng cần tải lại dữ liệu</h1>
            <p>Dữ liệu lưu trên trình duyệt này không còn tương thích với phiên bản hiện tại.</p>
            <button className="button primary" type="button" onClick={this.recover}>
              Tải lại ứng dụng
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </AppErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    registration.update();
  });
}
