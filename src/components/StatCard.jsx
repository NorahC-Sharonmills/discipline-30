export function StatCard({ icon: Icon, label, value, note, tone = "green" }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`}><Icon size={20} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}
