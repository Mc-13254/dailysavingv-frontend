import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { NotificationAPI } from '../api/endpoints';

const SEVERITY_DOT = { INFO: 'bg-blue-400', WARNING: 'bg-amber-400', ALERT: 'bg-red-500' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const refreshCount = () => NotificationAPI.unreadCount().then(({ data }) => setUnreadCount(data)).catch(() => {});

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = async () => {
    if (!open) {
      const { data } = await NotificationAPI.list(false);
      setItems(data);
    }
    setOpen(!open);
  };

  const openItem = async (n) => {
    if (!n.isRead) { await NotificationAPI.markRead(n.notificationID); refreshCount(); }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    await NotificationAPI.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button className="relative text-white/80 hover:text-white" title="Notifications" onClick={toggle}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600">Notifications</span>
            {unreadCount > 0 && <button className="text-[11px] text-brand-blue" onClick={markAllRead}>Tout marquer comme lu</button>}
          </div>
          {items.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 text-center normal-case">Aucune notification.</div>
          ) : (
            items.map((n) => (
              <div key={n.notificationID} onClick={() => openItem(n)}
                className={`px-3 py-2 border-b border-gray-50 cursor-pointer hover:bg-gray-50 flex gap-2 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[n.severity] || 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{n.title}</div>
                  <div className="text-[11px] text-gray-500 normal-case line-clamp-2">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdDate).toLocaleString('fr-FR')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
