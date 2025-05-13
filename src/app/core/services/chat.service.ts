// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

  // Helper method to get headers with authorization token
  private getAuthHeaders() {
    return from(this.authService.getValidToken()).pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('Authentication token not available');
        }
        return [new HttpHeaders().set('Authorization', `Bearer ${token}`)];
      })
    );
  }

  setActiveChat(chat: ChatDto | null): void {
    // First, set the local value to null to force clean reinitialization
    this.activeChatSubject.next(null);
    
    // Short delay to ensure cleanup completes
    setTimeout(() => {
      if (chat?.chatId !== this.activeChatSubject.value?.chatId) {
        // Leave previous chat room if exists
        if (this.activeChatSubject.value) {
          this.signalrService.leaveChatRoom(this.activeChatSubject.value.chatId)
            .catch(err => console.error('Error leaving chat room:', err));
        }
        
        // Join new chat room if provided
        if (chat) {
          this.signalrService.joinChatRoom(chat.chatId)
            .catch(err => console.error('Error joining chat room:', err));
        }
        
        this.activeChatSubject.next(chat);
      }
    }, 100);
  }

  getUserChats(userId: string): Observable<ChatDto[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.get<ChatDto[]>(`${this.apiUrl}/Chats/user/${userId}`, { headers });
      })
    );
  }

  getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.get<MessageDto[]>(
          `${this.apiUrl}/Chats/${chatId}/messages?userId=${userId}`, 
          { headers }
        );
      })
    );
  }

  sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    const message: SendMessageDto = {
      senderId,
      content
    };
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post<MessageDto>(
          `${this.apiUrl}/Chats/${chatId}/messages`, 
          message, 
          { headers }
        );
      })
    );
  }

  createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post<ChatDto>(
          `${this.apiUrl}/chats/create`, 
          { clientId, freelancerId }, 
          { headers }
        );
      })
    );
  }

  checkChatExists(clientId: string, freelancerId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.get(
          `${this.apiUrl}/Chats/check?clientId=${clientId}&freelancerId=${freelancerId}`,
          { headers }
        );
      })
    );
  }
}