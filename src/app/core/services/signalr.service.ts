import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { MessageDto, ChatDto } from '../models/chat.model';
import { filter, take } from 'rxjs/operators';

import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageDto } from '../models/chat.model';
import {environment} from '../../../environment.prod'
@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: HubConnection;
  private messageReceivedSubject = new BehaviorSubject<MessageDto | null>(null);
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private activeChatSubject = new BehaviorSubject<ChatDto | null>(null);
  private connectionPromise: Promise<void> | null = null;
  
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public connectionEstablished$ = this.connectionEstablished.asObservable();
  public activeChat$ = this.activeChatSubject.asObservable();

  constructor() {}

  public startConnection(userId: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chatHub`)
      .withAutomaticReconnect()
      .build();
    
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      message.isFromMe = message.senderId === userId;
      this.messageReceivedSubject.next(message);
    });

    this.connectionPromise = this.hubConnection.start().then(() => {
      this.connectionEstablished.next(true);
    }).catch(err => {
      console.error('Error establishing SignalR connection:', err);
      this.connectionPromise = null;
      this.connectionEstablished.next(false);
      throw err;
    });

    return this.connectionPromise;
  }

  private async ensureConnection(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    await firstValueFrom(
      this.connectionEstablished$.pipe(
        filter(connected => connected === true),
        take(1)
      )
    );
    
    return Promise.resolve();
  }

  public setActiveChat(chat: ChatDto | null): void {
    if (this.activeChatSubject.value?.chatId !== chat?.chatId) {
      if (this.activeChatSubject.value && this.isConnected()) {
        this.leaveChatRoom(this.activeChatSubject.value.chatId);
      }
      
      if (chat && this.isConnected()) {
        this.joinChatRoom(chat.chatId);
      }
      
      this.activeChatSubject.next(chat);
    }
  }

  public async joinChatRoom(chatId: number): Promise<void> {
    await this.ensureConnection();
    return this.hubConnection.invoke('JoinChat', chatId.toString());
  }

  public async leaveChatRoom(chatId: number): Promise<void> {
    await this.ensureConnection();
    return this.hubConnection.invoke('LeaveChat', chatId.toString());
  }

  public sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    const subject = new Subject<MessageDto>();
    
    this.ensureConnection()
      .then(() => {
        this.hubConnection.invoke('SendMessage', chatId, senderId, content)
          .then((message: MessageDto) => {
            subject.next(message);
            subject.complete();
          })
          .catch(err => subject.error(err));
      })
      .catch(err => subject.error(err));
      
    return subject.asObservable();
  }

  public getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    const subject = new Subject<MessageDto[]>();
    
    this.ensureConnection()
      .then(() => {
        this.hubConnection.invoke('GetChatMessages', chatId, userId)
          .then((messages: MessageDto[]) => {
            subject.next(messages);
            subject.complete();
          })
          .catch(err => subject.error(err));
      })
      .catch(err => subject.error(err));
    
    return subject.asObservable();
  }
  
  public getUserChats(userId: string): Observable<ChatDto[]> {
    const subject = new Subject<ChatDto[]>();
    
    this.ensureConnection()
      .then(() => {
        this.hubConnection.invoke('GetUserChats', userId)
          .then((chats: ChatDto[]) => {
            subject.next(chats);
            subject.complete();
          })
          .catch(err => subject.error(err));
      })
      .catch(err => subject.error(err));
    
    return subject.asObservable();
  }
  
  public createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    const subject = new Subject<ChatDto>();
    
    this.ensureConnection()
      .then(() => {
        this.hubConnection.invoke('CreateChat', clientId, freelancerId)
          .then((chat: ChatDto) => {
            subject.next(chat);
            subject.complete();
          })
          .catch(err => subject.error(err));
      })
      .catch(err => subject.error(err));
    
    return subject.asObservable();
  }

  public checkChatExists(clientId: string, freelancerId: string): Observable<{exists: boolean, chatId: number}> {
    const subject = new Subject<{exists: boolean, chatId: number}>();
    
    this.ensureConnection()
      .then(() => {
        this.hubConnection.invoke('CheckChatExists', clientId, freelancerId)
          .then((result: {exists: boolean, chatId: number}) => {
            subject.next(result);
            subject.complete();
          })
          .catch(err => subject.error(err));
      })
      .catch(err => subject.error(err));
    
    return subject.asObservable();
  }

  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    this.connectionEstablished.next(false);
    this.connectionPromise = null;
    return this.hubConnection.stop();
  }
  
  public isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }
}