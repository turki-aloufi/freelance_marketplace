// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// export interface Notification {
//   id: number;
//   message: string;
//   read: boolean;
//   timestamp: Date;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService {
//   private notificationsSubject = new BehaviorSubject<Map<string, Notification[]>>(new Map());
//   notifications$ = this.notificationsSubject.asObservable();

//   constructor() {
//     // Load notifications from localStorage when configuring the service
//     if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
//       const savedNotifications = localStorage.getItem('notifications');
//       if (savedNotifications) {
//         this.notificationsSubject.next(new Map(JSON.parse(savedNotifications)));
//       }
//     }
//   }

//   // Add a new notification for a specific user
//   addNotification(message: string, userId: string) {
//     const currentNotifications = this.notificationsSubject.value.get(userId) || [];
//     const newNotification: Notification = {
//       id: Date.now(), 
//       message,
//       read: false,
//       timestamp: new Date()
//     };

//     const updatedNotifications = [newNotification, ...currentNotifications];
//     this.notificationsSubject.next(
//       new Map(this.notificationsSubject.value).set(userId, updatedNotifications)
//     );

//     // Save notifications in localStorage
//     if (typeof localStorage !== 'undefined') {
//       localStorage.setItem('notifications', JSON.stringify(Array.from(this.notificationsSubject.value.entries())));
//     }
//   }



//   //  Mark all notifications as read
//   markAllAsRead(userId: string) {
//     const updated = this.notificationsSubject.value.get(userId)?.map(n => ({ ...n, read: true })) || [];
//     this.notificationsSubject.next(
//       new Map(this.notificationsSubject.value).set(userId, updated)
//     );

//     //  Save notifications in localStorage
//    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
//       localStorage.setItem('notifications', JSON.stringify(Array.from(this.notificationsSubject.value.entries())));
//     }
//   }

//   // Number of unread notifications
//   getUnreadCount(userId: string): number {
//     return this.notificationsSubject.value.get(userId)?.filter(n => !n.read).length || 0;
//   }

//   // Get notifications for a specific user
//   getNotificationsForUser(userId: string): Notification[] {
//     return this.notificationsSubject.value.get(userId) || [];
//   }
// }
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
    
    // استخدم onSnapshot للمراقبة المباشرة
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
