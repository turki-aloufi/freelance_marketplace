import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Map<string, Notification[]>>(new Map());
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    // Load notifications from localStorage when configuring the service
    if (typeof localStorage !== 'undefined') {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        this.notificationsSubject.next(new Map(JSON.parse(savedNotifications)));
      }
    }
  }

  // Add a new notification for a specific user
  addNotification(message: string, userId: string) {
    const currentNotifications = this.notificationsSubject.value.get(userId) || [];
    const newNotification: Notification = {
      id: Date.now(), 
      message,
      read: false,
      timestamp: new Date()
    };

    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(
      new Map(this.notificationsSubject.value).set(userId, updatedNotifications)
    );

    // Save notifications in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(Array.from(this.notificationsSubject.value.entries())));
    }
  }

  //  Mark a single notification as read
  // markNotificationAsRead(userId: string, notificationId: number) {
  //   const userNotifications = this.notificationsSubject.value.get(userId);
  //   if (!userNotifications) return;

  //   const updated = userNotifications.map(notification =>
  //     notification.id === notificationId ? { ...notification, read: true } : notification
  //   );

  //   this.notificationsSubject.next(
  //     new Map(this.notificationsSubject.value).set(userId, updated)
  //   );

  //   // Save notifications in localStorage
  //   if (typeof localStorage !== 'undefined') {
  //     localStorage.setItem('notifications', JSON.stringify(Array.from(this.notificationsSubject.value.entries())));
  //   }
  // }

  //  Mark all notifications as read
  markAllAsRead(userId: string) {
    const updated = this.notificationsSubject.value.get(userId)?.map(n => ({ ...n, read: true })) || [];
    this.notificationsSubject.next(
      new Map(this.notificationsSubject.value).set(userId, updated)
    );

    //  Save notifications in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(Array.from(this.notificationsSubject.value.entries())));
    }
  }

  // Number of unread notifications
  getUnreadCount(userId: string): number {
    return this.notificationsSubject.value.get(userId)?.filter(n => !n.read).length || 0;
  }

  // Get notifications for a specific user
  getNotificationsForUser(userId: string): Notification[] {
    return this.notificationsSubject.value.get(userId) || [];
  }
}

