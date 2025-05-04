// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { ChatDto, MessageDto, SendMessageDto } from '../models/chat.model';
import { SignalrService } from './signalr.service';
import { AuthService } from './auth.service';
import { tap, catchError, switchMap, filter, take } from 'rxjs/operators';

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
    // Initialize SignalR when service is created
    this.authService.user$.pipe(
      filter(user => !!user), // Only proceed if user exists
      take(1) // Take only the first valid user
    ).subscribe(user => {
      if (user) {
        console.log('Chat service: Initializing SignalR for user', user.uid);
        this.signalrService.startConnection(user.uid)
          .then(() => console.log('Chat service: SignalR connection initialized'))
          .catch(err => console.error('Chat service: Error initializing SignalR:', err));
      }
    });
  }

  setActiveChat(chat: ChatDto | null): void {
    console.log('Setting active chat:', chat);
    
    // Only change if different chat
    if (this.activeChatSubject.value?.chatId !== chat?.chatId) {
      // Leave previous chat room if exists
      if (this.activeChatSubject.value) {
        const oldChatId = this.activeChatSubject.value.chatId;
        console.log(`Leaving previous chat room: ${oldChatId}`);
        
        this.signalrService.leaveChatRoom(oldChatId)
          .catch(err => console.error(`Error leaving chat ${oldChatId}:`, err));
      }
      
      // Join new chat room if provided
      if (chat) {
        console.log(`Joining new chat room: ${chat.chatId}`);
        
        // Wait for SignalR connection before attempting to join
        this.signalrService.connectionEstablished$
          .pipe(
            filter(established => established), // Only proceed when connection is established
            take(1) // Take only the first true value
          )
          .subscribe(() => {
            console.log('Connection established, joining chat room');
            this.signalrService.joinChatRoom(chat.chatId)
              .catch(err => console.error(`Error joining chat ${chat.chatId}:`, err));
          });
      }
      
      // Update active chat immediately
      this.activeChatSubject.next(chat);
    }
  }

  getUserChats(userId: string): Observable<ChatDto[]> {
    console.log(`Getting chats for user ${userId}`);
    
    return this.http.get<ChatDto[]>(`${this.apiUrl}/Chats/user/${userId}`)
      .pipe(
        tap(chats => console.log(`Got ${chats.length} chats for user ${userId}`)),
        catchError(error => {
          console.error('Error getting user chats:', error);
          return of([]);
        })
      );
  }

  getChatMessages(chatId: number, userId: string): Observable<MessageDto[]> {
    console.log(`Getting messages for chat ${chatId}`);
    
    return this.http.get<MessageDto[]>(`${this.apiUrl}/Chats/${chatId}/messages?userId=${userId}`)
      .pipe(
        tap(messages => {
          console.log(`Got ${messages.length} messages for chat ${chatId}`);
        }),
        catchError(error => {
          console.error(`Error getting messages for chat ${chatId}:`, error);
          return of([]);
        })
      );
  }

  sendMessage(chatId: number, senderId: string, content: string): Observable<MessageDto> {
    console.log(`Sending message to chat ${chatId}`);
    
    const message: SendMessageDto = {
      senderId,
      content
    };
    
    return this.http.post<MessageDto>(`${this.apiUrl}/Chats/${chatId}/messages`, message)
      .pipe(
        tap(response => {
          console.log('Message sent successfully:', response);
        }),
        catchError(error => {
          console.error('Error sending message:', error);
          throw error;
        })
      );
  }

  createChat(clientId: string, freelancerId: string): Observable<ChatDto> {
    console.log(`Creating chat between ${clientId} and ${freelancerId}`);
    
    return this.http.post<ChatDto>(`${this.apiUrl}/chats/create`, { 
      clientId, 
      freelancerId 
    }).pipe(
      tap(response => console.log('Chat created:', response)),
      catchError(error => {
        console.error('Error creating chat:', error);
        throw error;
      })
    );
  }

  checkChatExists(clientId: string, freelancerId: string): Observable<any> {
    console.log(`Checking if chat exists between ${clientId} and ${freelancerId}`);
    
    return this.http.get(`${this.apiUrl}/Chats/check?clientId=${clientId}&freelancerId=${freelancerId}`)
      .pipe(
        tap(response => console.log('Chat existence check result:', response)),
        catchError(error => {
          console.error('Error checking chat existence:', error);
          throw error;
        })
      );
  }
}