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
          // Sort chats by last message time (most recent first)
          this.chats = this.sortChatsByRecency(chats);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading chats:', err);
          this.loading = false;
        }
      });
  }

  // New method to sort chats by recency
  private sortChatsByRecency(chats: ChatDto[]): ChatDto[] {
    return [...chats].sort((a, b) => {
      // If no last message time, put at the bottom
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      // Compare timestamps (most recent first)
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });
  }

  selectChat(chat: ChatDto): void {
    this.chatService.setActiveChat(chat);
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Today - show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Within last week - show day name
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older - show month and day
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}