import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatComponent } from '../chat/chat.component';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { ChatDto } from '../../../core/models/chat.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { take, switchMap } from 'rxjs/operators';

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
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Track active chat changes
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        this.activeChat = chat;
      });
    
    // Check for userId in query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['userId'];
        console.log('Received userId in messages component:', userId);
        
        if (userId) {
          // Only start a chat if userId is provided
          this.authService.user$
            .pipe(take(1))
            .subscribe(currentUser => {
              if (currentUser) {
                console.log('Current user:', currentUser.uid);
                console.log('Starting chat with user:', userId);
                this.startChatWithUser(currentUser.uid, userId);
              }
            });
        } else {
          // When no userId provided, clear any active chat
          this.chatService.setActiveChat(null);
        }
      });
  }

  private startChatWithUser(currentUserId: string, targetUserId: string): void {
    // Keep your existing implementation
    if (!targetUserId || !currentUserId) {
      console.error('Missing user IDs', { currentUserId, targetUserId });
      return;
    }
    
    console.log('Checking if chat exists between', currentUserId, 'and', targetUserId);
    
    this.chatService.checkChatExists(currentUserId, targetUserId)
      .subscribe({
        next: (response: any) => {
          console.log('Chat exists check response:', response);
          
          if (response && response.exists) {
            this.chatService.getUserChats(currentUserId)
              .subscribe(chats => {
                console.log('User chats:', chats);
                const existingChat = chats.find(c => c.chatId === response.chatId);
                if (existingChat) {
                  console.log('Setting active chat:', existingChat);
                  this.chatService.setActiveChat(existingChat);
                } else {
                  console.error('Could not find chat with ID', response.chatId);
                }
              });
          } else {
            console.log('Creating new chat between', currentUserId, 'and', targetUserId);
            this.chatService.createChat(currentUserId, targetUserId)
              .subscribe({
                next: (createdChat) => {
                  console.log('Chat created:', createdChat);
                  this.chatService.setActiveChat(createdChat);
                },
                error: (err) => {
                  console.error('Error creating chat:', err);
                }
              });
          }
        },
        error: (err) => {
          console.error('Error checking if chat exists:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}