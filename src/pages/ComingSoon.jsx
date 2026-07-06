export default function ComingSoon({ title, description }) {
  return (
    <div className="panel">
      <div className="panel-title mb-2">{title}</div>
      <div className="empty-state">
        <p className="mb-2">Ce module n'est pas encore construit.</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
  );
}
