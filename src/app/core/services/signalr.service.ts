// src/app/core/services/signalr.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { MessageDto } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection | undefined;
  private messageReceivedSubject = new BehaviorSubject<MessageDto | null>(null);
  
  public messageReceived = this.messageReceivedSubject.asObservable();
  private currentUserId: string | null = null;

  constructor() { }

  public startConnection(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // If connection exists and is already connected, just return
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      console.log('SignalR connection already established');
      return Promise.resolve();
    }
    
    console.log('Starting SignalR connection...');
    
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5021/chatHub')
      .withAutomaticReconnect()
      .build();

    // Handle reconnection events
    this.hubConnection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
    });
    
    this.hubConnection.onreconnected(() => {
      console.log('SignalR reconnected!');
    });

    // Set up message receiver
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('SignalR: Message received', message);
      
      // Set the isFromMe flag correctly based on current user
      message.isFromMe = message.senderId === this.currentUserId;
      
      // Publish the message to subscribers
      this.messageReceivedSubject.next(message);
    });

    // Start the connection
    return this.hubConnection.start();
  }

  public joinChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot join chat room: Hub connection not established');
      return Promise.reject('Hub connection not established');
    }
    
    console.log(`Joining chat room: ${chatId}`);
    return this.hubConnection.invoke('JoinChat', chatId.toString());
  }

  public leaveChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot leave chat room: Hub connection not established');
      return Promise.reject('Hub connection not established');
    }
    
    console.log(`Leaving chat room: ${chatId}`);
    return this.hubConnection.invoke('LeaveChat', chatId.toString());
  }

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    
    console.log('Stopping SignalR connection...');
    return this.hubConnection.stop();
  }
}