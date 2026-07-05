import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";

export function ToastRegion({ items }) {
  return (
    <div className="toast-region" aria-live="polite">
      {items.map((item) => {
        const Icon = item.tone === "error" ? AlertCircle : item.tone === "warning" ? WifiOff : CheckCircle2;
        return <div className={`toast ${item.tone}`} key={item.id}><Icon size={19} />{item.message}</div>;
      })}
    </div>
  );
}
