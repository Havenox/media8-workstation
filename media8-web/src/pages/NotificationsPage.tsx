import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Package, CheckCircle, AlertTriangle, Info, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useNotifications, Notification } from '@/contexts/NotificationsContext';
import { Button } from '@/components/ui/button';

export const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-[#400404]" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-700" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-700" />;
      default:
        return <Info className="w-4 h-4 text-blue-700" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#400404]/15 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#400404] tracking-tight">Notificações</h2>
          <p className="text-xs text-[#5C1212]/80 font-normal mt-0.5">
            Acompanhe atualizações de projetos, transcodificações e alertas da estação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.read) && (
            <Button
              type="button"
              variant="outline"
              onClick={markAllAsRead}
              className="border-[#400404]/25 text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] text-xs font-medium cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              <span>Marcar todas como lidas</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              className="border-red-500/30 text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#400404] text-[#FFFBED]'
              : 'bg-white text-[#400404] border border-[#400404]/15 hover:bg-[#400404]/5'
          }`}
        >
          Todas ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#400404] text-[#FFFBED]'
              : 'bg-white text-[#400404] border border-[#400404]/15 hover:bg-[#400404]/5'
          }`}
        >
          Não Lidas ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) markAsRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !notif.read
                  ? 'bg-white border-[#400404]/30 shadow-md ring-1 ring-[#400404]/10'
                  : 'bg-white/60 border-[#400404]/15 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#FFFBED] border border-[#400404]/15 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm text-[#400404] ${!notif.read ? 'font-bold' : 'font-semibold'}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full">
                        Nova
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5C1212]/80 leading-relaxed">
                    {notif.message}
                  </p>

                  <p className="text-[11px] text-[#5C1212]/60 font-mono pt-1">
                    {format(new Date(notif.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} (
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })})
                  </p>
                </div>
              </div>

              {notif.link && (
                <div className="flex items-center text-xs font-medium text-[#400404] hover:underline shrink-0">
                  <span>Acessar</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white/50 border border-[#400404]/15 rounded-2xl">
            <Bell className="w-10 h-10 text-[#400404]/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#400404]">Nenhuma notificação encontrada</h3>
            <p className="text-xs text-[#5C1212]/70 mt-1">
              Você não possui notificações {filter === 'unread' ? 'não lidas' : 'no seu histórico'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
