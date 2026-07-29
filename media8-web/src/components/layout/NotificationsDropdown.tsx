import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, Info, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, Notification } from '@/contexts/NotificationsContext';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return Package;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return 'text-[#400404] bg-[#400404]/10 border border-[#400404]/20';
    case 'success':
      return 'text-emerald-800 bg-emerald-500/10 border border-emerald-500/20';
    case 'warning':
      return 'text-amber-800 bg-amber-500/10 border border-amber-500/20';
    default:
      return 'text-[#5C1212] bg-[#400404]/5 border border-[#400404]/15';
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}> = ({ notification, onMarkAsRead, onClose }) => {
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 hover:bg-[#400404]/5 transition-colors border-b border-[#400404]/10 last:border-0 cursor-pointer ${
        !notification.read ? 'bg-[#FFFBED]' : 'bg-white/60'
      }`}
    >
      <div className="flex gap-3 items-start">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold text-[#400404] truncate ${!notification.read ? 'font-bold' : ''}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1" />
            )}
          </div>
          <p className="text-[11px] text-[#5C1212]/80 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-[10px] text-[#5C1212]/60 mt-1 font-mono">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
    </button>
  );
};

export const NotificationsDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-[#400404] hover:bg-[#400404]/10 rounded-full transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          title="Notificações"
        >
          <Bell className="w-5 h-5 text-[#400404] shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FFFBED] shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#FFFBED] border border-[#400404]/25 shadow-xl rounded-2xl overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-[#400404]/15 bg-[#400404]/5">
          <h3 className="font-semibold text-xs text-[#400404]">Notificações</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-[11px] font-medium text-[#400404] hover:underline flex items-center gap-1 cursor-pointer"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onClose={() => setOpen(false)}
              />
            ))
          ) : (
            <div className="p-6 text-center text-[#5C1212]/60">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-40 text-[#400404]" />
              <p className="text-xs">Nenhuma notificação recente</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-[#400404]/15 bg-white/50 text-center">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="w-full text-xs font-semibold text-[#400404] hover:text-[#5C1212] flex items-center justify-center gap-1 py-1"
          >
            <span>Ver todas as notificações</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
