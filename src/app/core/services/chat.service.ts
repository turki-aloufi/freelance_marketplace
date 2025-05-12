// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ChatDto, MessageDto, SendMessageDto, CreateChatDto } from '../models/chat.model';
import { SignalrService } from './signalr.service';
import { AuthService } from './auth.service';

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
        this.signalrService.startConnection(user.uid)
          .then(() => console.log('SignalR connected'))
          .catch(err => console.error('SignalR connection error:', err));
      }
    });
  }

  setActiveChat(chat: ChatDto | null): void {
    console.log('Setting active chat:', chat);
    
    // Clear current chat first
    if (this.activeChatSubject.value) {
      console.log('Leaving chat room:', this.activeChatSubject.value.chatId);
      this.signalrService.leaveChatRoom(this.activeChatSubject.value.chatId)
        .catch(err => console.error('Error leaving previous chat room:', err));
    }
    
    // Short pause before setting new chat
    setTimeout(() => {
      // Join new chat room if provided
      if (chat) {
        console.log('Joining new chat room:', chat.chatId);
        this.signalrService.joinChatRoom(chat.chatId)
          .catch(err => console.error('Error joining new chat room:', err));
      }
      
      // Update the active chat
      this.activeChatSubject.next(chat);
    }, 100);
  }

  getUserChats(userId: string): Observable<ChatDto[]> {
    return this.http.get<ChatDto[]>(`${this.apiUrl}/Chats/user/${userId}`);
  }

  getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.apiUrl}/Chats/${chatId}/messages?userId=${userId}`);
  }

  sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    const message: SendMessageDto = {
      senderId,
      content
    };
    return this.http.post<MessageDto>(`${this.apiUrl}/Chats/${chatId}/messages`, message);
  }

  createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    return this.http.post<ChatDto>(`${this.apiUrl}/chats/create`, { 
      clientId, 
      freelancerId 
    });
  }

  checkChatExists(clientId: string, freelancerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Chats/check?clientId=${clientId}&freelancerId=${freelancerId}`);
  }
}