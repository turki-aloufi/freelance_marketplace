import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatDto } from '../../../core/models/chat.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: ChatDto[] = [];
  loading = true;
  activeChat: ChatDto | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.loadChats(user.uid);
        }
      });

    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        this.activeChat = chat;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadChats(userId: string): void {
    this.loading = true;
    this.chatService.getUserChats(userId)
      .subscribe({
        next: (chats) => {
          // Filter out chats with no messages
          const nonEmptyChats = chats.filter(chat => 
            chat.lastMessage != null && chat.lastMessage.trim() !== ''
          );
          
          // Sort the non-empty chats by recency
          this.chats = this.sortChatsByRecency(nonEmptyChats);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading chats:', err);
          this.loading = false;
        }
      });
  }

  // Keep your existing sortChatsByRecency method
  private sortChatsByRecency(chats: ChatDto[]): ChatDto[] {
    return [...chats].sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });
  }

  selectChat(chat: ChatDto): void {
    this.chatService.setActiveChat(chat);
  }

  formatTime(timestamp: string): string {
    // Keep your existing formatTime method
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}