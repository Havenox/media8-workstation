import React, { createContext, useContext, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'success' | 'warning' | 'info';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'Projeto atualizado',
    message: 'O projeto "Campanha Institucional 2026" recebeu novos links de mídias anexadas.',
    type: 'order',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 43).toISOString(), // 43 min ago
    link: '/projects',
  },
  {
    id: 'notif-2',
    title: 'Pacote atribuído',
    message: 'Você foi atribuído como Lead Editor no projeto "Reels Moda Verão".',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    link: '/projects',
  },
  {
    id: 'notif-3',
    title: 'Novo recurso disponível',
    message: 'Confira as seções retráteis sutis e o novo painel de notificações no Workstation PAM.',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    link: '/projects',
  },
  {
    id: 'notif-4',
    title: 'Projeto concluído',
    message: 'A esteira de ingestão finalizou a transcodificação dos arquivos de proxy.',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    link: '/workstation',
  },
];

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationsProvider');
  }
  return context;
};
