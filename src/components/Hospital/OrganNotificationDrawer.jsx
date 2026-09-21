import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const TYPE_CONFIG = {
  OFFER_RECEIVED:      { label: 'Offer Received', icon: '📩', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  OFFER_ACCEPTED:      { label: 'Offer Accepted', icon: '✅', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OFFER_DECLINED:      { label: 'Offer Declined', icon: '❌', badgeBg: 'bg-red-50 text-red-700 border-red-200' },
  OFFER_EXPIRED:       { label: 'Offer Expired',  icon: '⏳', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  TRANSPORT_STARTED:   { label: 'In Transport',   icon: '🚑', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  ALLOCATION_COMPLETED:{ label: 'Transplant Done', icon: '🎉', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200' }
};

export default function OrganNotificationDrawer({ isOpen, onClose, unreadCount, setUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const socket = useSocket();

  // ── Fetch Notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/organ/notifications');
      if (res && res.success) {
        setNotifications(res.data || []);
        if (typeof setUnreadCount === 'function') {
          setUnreadCount(res.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch organ notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Socket.IO Real-Time Listener ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif) => {
      console.log('🔔 Live Organ Notification Received:', notif);
      setNotifications(prev => [notif, ...prev]);
      if (typeof setUnreadCount === 'function') {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('organ_notification_received', handleNewNotif);

    return () => {
      socket.off('organ_notification_received', handleNewNotif);
    };
  }, [socket, setUnreadCount]);

  // ── Mark Single Read ──────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      const res = await api.patch(`/api/organ/notifications/${id}/read`);
      if (res && res.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        if (typeof setUnreadCount === 'function') {
          setUnreadCount(res.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  // ── Mark All Read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/api/organ/notifications/mark-all-read');
      if (res && res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        if (typeof setUnreadCount === 'function') {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50 animate-slideLeft">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200/80 flex flex-col justify-between font-sans">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shadow-inner">
                🔔
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Organ Notifications</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time allocation & offer alerts</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">
              Unread: <strong className="text-red-600 font-extrabold">{unreadCount || 0}</strong>
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-red-600 hover:text-red-700 font-bold hover:underline transition-colors"
              >
                ✓ Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3 opacity-60">📭</span>
                <p className="text-sm font-bold text-slate-600">No Notifications Yet</p>
                <p className="text-xs text-slate-400 mt-1">Organ offer status changes and alerts will appear here live.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || {
                  label: notif.type,
                  icon: '📢',
                  badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
                };

                return (
                  <div
                    key={notif._id}
                    onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      notif.isRead
                        ? 'bg-slate-50/60 border-slate-200/60 opacity-80'
                        : 'bg-white border-slate-200 shadow-md shadow-slate-200/40 ring-1 ring-red-500/10 hover:border-red-300'
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    )}

                    <div className="flex items-start space-x-3">
                      <span className="text-xl leading-none">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${config.badgeBg}`}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 leading-snug break-words">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          {!notif.isRead && (
                            <span className="text-red-500 font-bold hover:underline">
                              Mark read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              🔒 LifeLink Encrypted Organ Allocation Telemetry
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
