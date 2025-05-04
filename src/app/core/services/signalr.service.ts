// src/app/core/services/signalr.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, from, Subject } from 'rxjs';
import { MessageDto } from '../models/chat.model';
import { NgZone } from '@angular/core';
import { catchError, tap, retry } from 'rxjs/operators';

// Define proper types for the pending operations
interface PendingOperation {
  chatId: number;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection | undefined;
  private messageReceivedSubject = new BehaviorSubject<MessageDto | null>(null);
  
  public messageReceived = this.messageReceivedSubject.asObservable();
  private currentUserId: string | null = null;
  
  // Add connection status tracking
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  public connectionEstablished$ = this.connectionEstablished.asObservable();
  
  // Track pending operations with proper types
  private pendingRoomJoins: PendingOperation[] = [];
  
  // Track active chat rooms
  private activeRooms: Set<number> = new Set<number>();

  constructor(private ngZone: NgZone) { }

  public startConnection(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // If connection exists and is already connected, just return
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      console.log('SignalR connection already established');
      this.connectionEstablished.next(true);
      return Promise.resolve();
    }
    
    console.log('Starting SignalR connection...');
    
    // Create connection with detailed logging
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5021/chatHub')
      .configureLogging(LogLevel.Debug)
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000]) // More aggressive reconnection
      .build();

    // Set up connection event handlers
    this.hubConnection.onreconnecting(error => {
      console.warn('SignalR reconnecting due to error:', error);
      this.connectionEstablished.next(false);
    });
    
    this.hubConnection.onreconnected(connectionId => {
      console.log('SignalR reconnected with ID:', connectionId);
      this.connectionEstablished.next(true);
      
      // Rejoin all active rooms after reconnection
      this.rejoinActiveRooms();
    });
    
    this.hubConnection.onclose(error => {
      console.error('SignalR connection closed with error:', error);
      this.connectionEstablished.next(false);
      
      // Try to restart connection if closed unexpectedly
      if (this.currentUserId) {
        console.log('Attempting to restart connection...');
        setTimeout(() => {
          this.startConnection(this.currentUserId!);
        }, 5000);
      }
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

    // Add confirmation handlers
    this.hubConnection.on('JoinChatSuccess', (chatId: string) => {
      console.log(`Successfully joined chat room: ${chatId}`);
      this.activeRooms.add(parseInt(chatId));
    });
    
    this.hubConnection.on('LeaveChatSuccess', (chatId: string) => {
      console.log(`Successfully left chat room: ${chatId}`);
      this.activeRooms.delete(parseInt(chatId));
    });

    // Add error handlers
    this.hubConnection.on('JoinChatError', (error: string) => {
      console.error(`Error joining chat room: ${error}`);
      // Try to rejoin after a short delay
      setTimeout(() => {
        this.rejoinActiveRooms();
      }, 3000);
    });

    // Start the connection
    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR connected successfully!');
        this.connectionEstablished.next(true);
        
        // Process any pending room joins
        this.processPendingRoomJoins();
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
        this.connectionEstablished.next(false);
        
        // Retry connection after a delay
        console.log('Retrying connection in 5 seconds...');
        setTimeout(() => {
          if (this.currentUserId) {
            this.startConnection(this.currentUserId);
          }
        }, 5000);
        
        throw err;
      });
  }

  private rejoinActiveRooms(): void {
    console.log(`Rejoining ${this.activeRooms.size} active rooms after reconnection`);
    
    // Convert Set to Array to avoid issues during iteration
    const roomsToRejoin = Array.from(this.activeRooms);
    
    // Clear active rooms since we're rejoining them
    this.activeRooms.clear();
    
    // Rejoin each room
    for (const chatId of roomsToRejoin) {
      this.joinChatRoom(chatId)
        .then(() => console.log(`Rejoined room ${chatId}`))
        .catch(err => console.error(`Failed to rejoin room ${chatId}:`, err));
    }
  }

  private processPendingRoomJoins(): void {
    // Process all pending room joins
    const pendingJoins = [...this.pendingRoomJoins];
    this.pendingRoomJoins = [];
    
    for (const {chatId, resolve, reject} of pendingJoins) {
      this.joinChatRoom(chatId)
        .then(resolve)
        .catch(reject);
    }
  }

  public joinChatRoom(chatId: number): Promise<void> {
    // If not connected, queue the join request
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.log(`Connection not ready, queueing join for chat ${chatId}`);
      
      return new Promise<void>((resolve, reject) => {
        this.pendingRoomJoins.push({chatId, resolve, reject});
        
        // Start connection if it doesn't exist
        if (!this.hubConnection && this.currentUserId) {
          this.startConnection(this.currentUserId)
            .catch(err => {
              // If connection fails, reject all pending joins
              this.pendingRoomJoins.forEach(pending => pending.reject(err));
              this.pendingRoomJoins = [];
            });
        }
      });
    }
    
    console.log(`Joining chat room: ${chatId}`);
    return this.hubConnection.invoke('JoinChat', chatId.toString())
      .then(() => {
        console.log(`Join chat room request sent for: ${chatId}`);
        this.activeRooms.add(chatId); // Add to active rooms immediately
      })
      .catch(err => {
        console.error(`Failed to join chat room ${chatId}:`, err);
        
        // Retry after a delay
        setTimeout(() => {
          if (this.hubConnection?.state === HubConnectionState.Connected) {
            console.log(`Retrying join for chat room ${chatId}...`);
            this.hubConnection.invoke('JoinChat', chatId.toString())
              .then(() => {
                console.log(`Retry successful: joined chat room ${chatId}`);
                this.activeRooms.add(chatId);
              })
              .catch(retryErr => console.error(`Retry failed for chat room ${chatId}:`, retryErr));
          }
        }, 3000);
        
        throw err;
      });
  }

  public leaveChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.log(`Not connected, can't leave chat ${chatId}`);
      this.activeRooms.delete(chatId); // Remove from active rooms anyway
      return Promise.resolve();
    }
    
    console.log(`Leaving chat room: ${chatId}`);
    return this.hubConnection.invoke('LeaveChat', chatId.toString())
      .then(() => {
        console.log(`Leave chat room request sent for: ${chatId}`);
        this.activeRooms.delete(chatId);
      })
      .catch(err => {
        console.error(`Failed to leave chat room ${chatId}:`, err);
        // Still remove from active rooms
        this.activeRooms.delete(chatId);
        return Promise.resolve();
      });
  }

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    
    // Clear active rooms
    this.activeRooms.clear();
    
    console.log('Stopping SignalR connection...');
    return this.hubConnection.stop()
      .then(() => {
        console.log('SignalR connection stopped');
        this.connectionEstablished.next(false);
      })
      .catch(err => {
        console.error('Failed to stop SignalR connection:', err);
        return Promise.resolve();
      });
  }
  
  // New method to check if a message is being received by this client
  public checkConnection(): Promise<boolean> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return Promise.resolve(false);
    }
    
    return this.hubConnection.invoke<string>('Ping')
      .then(response => {
        console.log('Ping response:', response);
        return response === 'Pong';
      })
      .catch(err => {
        console.error('Ping failed:', err);
        return false;
      });
  }
}