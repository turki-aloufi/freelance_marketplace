import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatComponent } from '../chat/chat.component';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil, take, filter } from 'rxjs';
import { ChatDto } from '../../../core/models/chat.model';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    ChatListComponent,
    ChatComponent,
    RouterModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  activeChat: ChatDto | null = null;
  isConnected = false;
  private destroy$ = new Subject<void>();

  constructor(
    private signalrService: SignalrService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Track connection state
    this.signalrService.connectionEstablished$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        
        // Process route params when connection is established
        if (connected) {
          this.processRouteParams();
        }
      });
    
    // Track active chat changes
    this.signalrService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        this.activeChat = chat;
      });
  }

  private processRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['userId'];
        
        if (userId) {
          // Only start a chat if userId is provided
          this.authService.user$
            .pipe(take(1))
            .subscribe(currentUser => {
              if (currentUser) {
                this.startChatWithUser(currentUser.uid, userId);
              }
            });
        } else {
          // When no userId provided, clear any active chat
          this.signalrService.setActiveChat(null);
        }
      });
  }

  private startChatWithUser(currentUserId: string, targetUserId: string): void {
    if (!targetUserId || !currentUserId) {
      console.error('Missing user IDs', { currentUserId, targetUserId });
      return;
    }
    
    // Only proceed if connected
    if (!this.isConnected) {
      console.log('Waiting for connection before starting chat...');
      this.signalrService.connectionEstablished$
        .pipe(
          filter(connected => connected), 
          take(1),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.startChatWithUser(currentUserId, targetUserId);
        });
      return;
    }
    
    this.signalrService.checkChatExists(currentUserId, targetUserId)
      .subscribe({
        next: (response: {exists: boolean, chatId: number}) => {
          if (response && response.exists) {
            this.signalrService.getUserChats(currentUserId)
              .subscribe({
                next: (chats: ChatDto[]) => {
                  const existingChat = chats.find(c => c.chatId === response.chatId);
                  if (existingChat) {
                    this.signalrService.setActiveChat(existingChat);
                  }
                },
                error: (err: Error) => {
                  console.error('Error getting user chats:', err);
                }
              });
          } else {
            this.signalrService.createChat(currentUserId, targetUserId)
              .subscribe({
                next: (createdChat: ChatDto) => {
                  this.signalrService.setActiveChat(createdChat);
                },
                error: (err: Error) => {
                  console.error('Error creating chat:', err);
                }
              });
          }
        },
        error: (err: Error) => {
          console.error('Error checking if chat exists:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}