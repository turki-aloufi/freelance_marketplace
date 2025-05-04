// src/app/core/services/signalr.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { MessageDto } from '../models/chat.model';
import { NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection | undefined;
  private messageReceivedSubject = new BehaviorSubject<MessageDto | null>(null);
  
  public messageReceived = this.messageReceivedSubject.asObservable();
  private currentUserId: string | null = null;
  
  // Track connection status
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  public connectionEstablished$ = this.connectionEstablished.asObservable();

  constructor(private ngZone: NgZone) { }

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
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .build();

    // Set up connection event handlers
    this.hubConnection.onreconnecting(error => {
      console.warn('SignalR reconnecting due to error:', error);
      this.connectionEstablished.next(false);
    });
    
    this.hubConnection.onreconnected(connectionId => {
      console.log('SignalR reconnected with ID:', connectionId);
      this.connectionEstablished.next(true);
      
      // Re-join active chat rooms if needed
      // Implementation depends on your specific needs
    });
    
    this.hubConnection.onclose(error => {
      console.error('SignalR connection closed with error:', error);
      this.connectionEstablished.next(false);
    });

    // Set up message receiver with NgZone to ensure UI updates
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('SignalR: Message received', message);
      
      // Set the isFromMe flag correctly based on current user
      message.isFromMe = message.senderId === this.currentUserId;
      
      // Use NgZone to ensure Angular's change detection runs
      this.ngZone.run(() => {
        this.messageReceivedSubject.next({...message});
      });
    });

    // Start the connection
    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR connected successfully!');
        this.connectionEstablished.next(true);
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
        this.connectionEstablished.next(false);
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

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    
    console.log('Stopping SignalR connection...');
    return this.hubConnection.stop()
      .then(() => {
        console.log('SignalR connection stopped');
        this.connectionEstablished.next(false);
      })
      .catch(err => {
        console.error('Failed to stop SignalR connection:', err);
        throw err;
      });
  }
}