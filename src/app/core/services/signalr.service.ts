// src/app/core/services/signalr.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
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
    
    // Create connection with detailed logging
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5021/chatHub')
      .configureLogging(LogLevel.Information) // Enable detailed logging
      .withAutomaticReconnect()
      .build();

    // Set up message receiver with proper callback handling
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('SignalR: Message received', message);
      
      // Set the isFromMe flag correctly based on current user
      message.isFromMe = message.senderId === this.currentUserId;
      
      // Force the message out to subscribers
      this.messageReceivedSubject.next({...message});
    });

    // Start the connection with detailed error handling
    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR connected successfully!');
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
        throw err;
      });
  }

  public joinChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot join chat room: Hub connection not established');
      return Promise.reject('Hub connection not established');
    }
    
    console.log(`Joining chat room: ${chatId}`);
    return this.hubConnection.invoke('JoinChat', chatId.toString())
      .then(() => {
        console.log(`Successfully joined chat room: ${chatId}`);
      })
      .catch(err => {
        console.error(`Failed to join chat room ${chatId}:`, err);
        throw err;
      });
  }

  public leaveChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot leave chat room: Hub connection not established');
      return Promise.reject('Hub connection not established');
    }
    
    console.log(`Leaving chat room: ${chatId}`);
    return this.hubConnection.invoke('LeaveChat', chatId.toString())
      .then(() => {
        console.log(`Successfully left chat room: ${chatId}`);
      })
      .catch(err => {
        console.error(`Failed to leave chat room ${chatId}:`, err);
        throw err;
      });
  }

  // Send a test message to specific chat room (for debugging)
  public sendTestMessage(chatId: number, content: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot send test message: Hub connection not established');
      return Promise.reject('Hub connection not established');
    }
    
    console.log(`Sending test message to chat room: ${chatId}`);
    return this.hubConnection.invoke('SendTestMessage', chatId.toString(), content)
      .then(() => {
        console.log(`Test message sent to chat room: ${chatId}`);
      })
      .catch(err => {
        console.error(`Failed to send test message to chat room ${chatId}:`, err);
        throw err;
      });
  }

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    
    console.log('Stopping SignalR connection...');
    return this.hubConnection.stop()
      .then(() => {
        console.log('SignalR connection stopped');
      })
      .catch(err => {
        console.error('Failed to stop SignalR connection:', err);
        throw err;
      });
  }
}