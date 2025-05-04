// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ChatDto, MessageDto } from '../models/chat.model';
import { SignalrService } from './signalr.service';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5021/api';
  private activeChatSubject = new BehaviorSubject<ChatDto | null>(null);
  public activeChat$ = this.activeChatSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private signalrService: SignalrService,
    private authService: AuthService
  ) {
    // Start SignalR connection when service is initialized
    this.authService.user$.subscribe(user => {
      if (user) {
        console.log('Chat service: Starting SignalR connection for user', user.uid);
        this.signalrService.startConnection(user.uid)
          .then(() => console.log('Chat service: SignalR connected'))
          .catch(err => console.error('Chat service: SignalR connection error:', err));
      }
    });
  }

  setActiveChat(chat: ChatDto | null): void {
    console.log('Chat service: Setting active chat', chat);
    
    // Only change active chat if it's different
    if (this.activeChatSubject.value?.chatId !== chat?.chatId) {
      // Leave previous chat room if exists
      if (this.activeChatSubject.value) {
        const oldChatId = this.activeChatSubject.value.chatId;
        console.log(`Chat service: Leaving previous chat room: ${oldChatId}`);
        
        this.signalrService.leaveChatRoom(oldChatId)
          .then(() => console.log(`Chat service: Left chat room ${oldChatId}`))
          .catch(err => console.error(`Chat service: Error leaving chat ${oldChatId}:`, err));
      }
      
      // Join new chat room if provided
      if (chat) {
        console.log(`Chat service: Joining new chat room: ${chat.chatId}`);
        
        this.signalrService.joinChatRoom(chat.chatId)
          .then(() => console.log(`Chat service: Joined chat room ${chat.chatId}`))
          .catch(err => console.error(`Chat service: Error joining chat ${chat.chatId}:`, err));
      }
      
      // Update the active chat
      this.activeChatSubject.next(chat);
    }
  }

  getUserChats(userId: string): Observable<ChatDto[]> {
    console.log(`Chat service: Getting chats for user ${userId}`);
    
    return this.http.get<ChatDto[]>(`${this.apiUrl}/Chats/user/${userId}`)
      .pipe(
        tap(chats => console.log(`Chat service: Got ${chats.length} chats for user`)),
        catchError(error => {
          console.error('Chat service: Error getting user chats:', error);
          throw error;
        })
      );
  }

  getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    console.log(`Chat service: Getting messages for chat ${chatId}`);
    
    return this.http.get<MessageDto[]>(`${this.apiUrl}/Chats/${chatId}/messages?userId=${userId}`)
      .pipe(
        tap(messages => console.log(`Chat service: Got ${messages.length} messages for chat ${chatId}`)),
        catchError(error => {
          console.error(`Chat service: Error getting messages for chat ${chatId}:`, error);
          throw error;
        })
      );
  }

  sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    console.log(`Chat service: Sending message to chat ${chatId}`);
    
    const messageData = {
      senderId,
      content
    };
    
    return this.http.post<MessageDto>(`${this.apiUrl}/Chats/${chatId}/messages`, messageData)
      .pipe(
        tap(message => console.log('Chat service: Message sent successfully', message)),
        catchError(error => {
          console.error('Chat service: Error sending message:', error);
          throw error;
        })
      );
  }

  createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    console.log(`Chat service: Creating chat between ${clientId} and ${freelancerId}`);
    
    return this.http.post<ChatDto>(`${this.apiUrl}/chats/create`, { 
      clientId, 
      freelancerId 
    }).pipe(
      tap(chat => console.log('Chat service: Chat created successfully', chat)),
      catchError(error => {
        console.error('Chat service: Error creating chat:', error);
        throw error;
      })
    );
  }

  checkChatExists(clientId: string, freelancerId: string): Observable<any> {
    console.log(`Chat service: Checking if chat exists between ${clientId} and ${freelancerId}`);
    
    return this.http.get(`${this.apiUrl}/Chats/check?clientId=${clientId}&freelancerId=${freelancerId}`)
      .pipe(
        tap(result => console.log('Chat service: Chat existence check result', result)),
        catchError(error => {
          console.error('Chat service: Error checking chat existence:', error);
          throw error;
        })
      );
  }
}