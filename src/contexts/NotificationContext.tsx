import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read?: boolean;
}

const NotificationContext = createContext<{
  notifications: Notification[];
  addNotification: (message: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
}>({
  notifications: [],
  addNotification: () => {},
  markAllRead: () => {},
  removeNotification: () => {},
});

const NOTIF_KEY = 'app_notifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications from Firestore on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const querySnapshot = await getDocs(collection(db, 'notifications'));
    setNotifications(querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data(), timestamp: new Date(docSnap.data().timestamp) })));
  }

  const addNotification = async (message: string) => {
    await addDoc(collection(db, 'notifications'), { message, timestamp: new Date(), read: false });
    fetchNotifications();
  };

  const markAllRead = async () => {
    // Optionally implement markAllRead in Firestore
    fetchNotifications();
  };

  const removeNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
    fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext); 