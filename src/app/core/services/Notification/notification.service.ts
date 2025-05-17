import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseMainService } from '../FirebaseMainService';

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

  private firestore;

  constructor(private firebaseMainService: FirebaseMainService) {
    const app = this.firebaseMainService.getApp();
    this.firestore = getFirestore(app);
  }

  loadNotifications(userId: string) {
    const notificationsCollection = collection(this.firestore, `notifications/${userId}/items`);
    
    // Use onSnapshot for live monitoring
    onSnapshot(notificationsCollection, (snapshot) => {
      const notifArray: Notification[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        notifArray.push({
          id: +docSnap.id,
          message: data['message'],
          read: data['read'],
          timestamp: data['timestamp']?.toDate ? data['timestamp'].toDate() : new Date(data['timestamp']),
        });
      });

      const currentMap = new Map(this.notificationsSubject.value);
      currentMap.set(userId, notifArray);
      this.notificationsSubject.next(currentMap);
    });
  }

  async addNotification(message: string, userId: string) {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      read: false,
      timestamp: new Date()
    };

    const notifDocRef = doc(this.firestore, `notifications/${userId}/items/${newNotification.id.toString()}`);
    await setDoc(notifDocRef, {
      ...newNotification,
      timestamp: newNotification.timestamp,
    });
  }

  async markAllAsRead(userId: string) {
    const notifications = this.notificationsSubject.value.get(userId) || [];

    for (const notif of notifications) {
      if (!notif.read) {
        const notifDocRef = doc(this.firestore, `notifications/${userId}/items/${notif.id.toString()}`);
        await updateDoc(notifDocRef, { read: true });
      }
    }
  }

  getUnreadCount(userId: string): number {
    return this.notificationsSubject.value.get(userId)?.filter(n => !n.read).length || 0;
  }

  getNotificationsForUser(userId: string): Notification[] {
    return this.notificationsSubject.value.get(userId) || [];
  }
}
