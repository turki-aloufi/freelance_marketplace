// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// export interface Notification {
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

//   //Add notification for specific user only
//   addNotification(message: string, userId: string) {
//     const currentNotifications = this.notificationsSubject.value.get(userId) || [];
//     const newNotification: Notification = {
//       message,
//       read: false,
//       timestamp: new Date(),
//     };
    
//     // Update notifications for the selected user
//     const updatedNotifications = [newNotification, ...currentNotifications];
//     this.notificationsSubject.next(new Map(this.notificationsSubject.value).set(userId, updatedNotifications));
//   }

//   // مارك جميع الإشعارات كمقروءة للمستخدم المحدد
//   markAllAsRead(userId: string) {
//     const updated = this.notificationsSubject.value.get(userId)?.map(n => ({ ...n, read: true })) || [];
//     this.notificationsSubject.next(new Map(this.notificationsSubject.value).set(userId, updated));
//   }
  

//   // Get the number of unread notifications for a specified user
//   getUnreadCount(userId: string): number {
//     return this.notificationsSubject.value.get(userId)?.filter(n => !n.read).length || 0;
//   }
// }


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
  }


 // تعديل الدالة markNotificationAsRead
markNotificationAsRead(userId: string, notificationId: number) {
  const userNotifications = this.notificationsSubject.value.get(userId);
  if (!userNotifications) return;

  // تحديث الإشعار المحدد ليصبح مقروءًا
  const updated = userNotifications.map(notification =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );

  // تحديث قائمة الإشعارات للمستخدم
  this.notificationsSubject.next(
    new Map(this.notificationsSubject.value).set(userId, updated)
  );
}


  // markAllAsRead(userId: string) {
  //   const updated = this.notificationsSubject.value.get(userId)?.map(n => ({ ...n, read: true })) || [];
  //   this.notificationsSubject.next(new Map(this.notificationsSubject.value).set(userId, updated));
  // }

  getUnreadCount(userId: string): number {
    return this.notificationsSubject.value.get(userId)?.filter(n => !n.read).length || 0;
  }
}
