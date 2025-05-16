import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Observable, from, Subject } from 'rxjs';
import { MessageDto, ChatDto } from '../models/chat.model';

import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ChatDto, MessageDto, SendMessageDto, CreateChatDto } from '../models/chat.model';
import { SignalrService } from './signalr.service';
import { AuthService } from './auth.service';
import {environment} from '../../../environment.prod'
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5021/api';
  private activeChatSubject = new BehaviorSubject<ChatDto | null>(null);
  
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public connectionEstablished$ = this.connectionEstablished.asObservable();
  public activeChat$ = this.activeChatSubject.asObservable();

  constructor() {}

  public startConnection(userId: string): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5021/chatHub')
      .withAutomaticReconnect()
      .build();
    
    // Set up message receiving handler
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('SignalR received message:', message);
      message.isFromMe = message.senderId === userId;
      this.messageReceivedSubject.next(message);
    });

    return this.hubConnection.start().then(() => {
      console.log('SignalR Connected!');
      this.connectionEstablished.next(true);
    });
  }

  public setActiveChat(chat: ChatDto | null): void {
    if (this.activeChatSubject.value?.chatId !== chat?.chatId) {
      // Leave previous chat room if exists
      if (this.activeChatSubject.value) {
        this.leaveChatRoom(this.activeChatSubject.value.chatId);
      }
      
      // Join new chat room if provided
      if (chat) {
        this.joinChatRoom(chat.chatId);
      }
      
      this.activeChatSubject.next(chat);
    }
  }

  public joinChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return Promise.reject('Hub connection not established');
    }
    console.log(`Joining chat room: ${chatId}`);
    return this.hubConnection.invoke('JoinChat', chatId.toString());
  }

  public leaveChatRoom(chatId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return Promise.reject('Hub connection not established');
    }
    console.log(`Leaving chat room: ${chatId}`);
    return this.hubConnection.invoke('LeaveChat', chatId.toString());
  }

  public sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return from(Promise.reject('Hub connection not established'));
    }
    
    const subject = new Subject<MessageDto>();
    
    this.hubConnection.invoke('SendMessage', chatId, senderId, content)
      .then((message: MessageDto) => {
        subject.next(message);
        subject.complete();
      })
      .catch((err: Error) => {
        console.error('Error sending message via SignalR:', err);
        subject.error(err);
      });
      
    return subject.asObservable();
  }

  // Add BOTH method names for compatibility
  public getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return from(Promise.reject('Hub connection not established'));
    }
    
    return from(this.hubConnection.invoke('GetChatMessages', chatId, userId));
  }
  
  // Alias for compatibility
  public getChatHistory(chatId: number, userId: string): Observable<MessageDto[]> {
    return this.getChatMessages(chatId, userId);
  }
  
  public getUserChats(userId: string): Observable<ChatDto[]> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return from(Promise.reject('Hub connection not established'));
    }
    
    return from(this.hubConnection.invoke('GetUserChats', userId));
  }
  
  public createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return from(Promise.reject('Hub connection not established'));
    }
    
    return from(this.hubConnection.invoke('CreateChat', clientId, freelancerId));
  }

  public checkChatExists(clientId: string, freelancerId: string): Observable<{exists: boolean, chatId: number}> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return from(Promise.reject('Hub connection not established'));
    }
    
    return from(this.hubConnection.invoke('CheckChatExists', clientId, freelancerId));
  }

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    this.connectionEstablished.next(false);
    return this.hubConnection.stop();
  }
  
  public isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }
}