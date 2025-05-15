import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatDto } from '../../../core/models/chat.model';
import { Subject, takeUntil, finalize } from 'rxjs';

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
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private signalrService: SignalrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('ChatListComponent initialized');
    
    // Manually initialize the connection for immediate user
    this.authService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        console.log('User detected, initializing connection and loading chats:', user);
        this.initializeConnectionAndLoadChats(user.uid);
      } else {
        console.log('No user available');
      }
    });

    // Track active chat
    this.signalrService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        this.activeChat = chat;
      });
  }

  initializeConnectionAndLoadChats(userId: string): void {
    console.log('Initializing connection for user:', userId);
    this.loading = true;
    this.error = null;
    
    // First ensure connection is established
    this.signalrService.startConnection(userId)
      .then(() => {
        console.log('Connection established, loading chats');
        this.loadChats(userId);
      })
      .catch(err => {
        console.error('Failed to establish connection:', err);
        this.error = 'Failed to connect to chat server. Please refresh the page.';
        this.loading = false;
      });
  }

  loadChats(userId: string): void {
  this.loading = true;
  this.error = null;
  
  this.signalrService.getUserChats(userId)
    .pipe(
      finalize(() => {
        this.loading = false;
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (chats: ChatDto[]) => {
        console.log('Chats loaded successfully:', chats);
        
        // Filter out chats with no messages
        const chatsWithMessages = chats.filter(chat => 
          chat.lastMessage && chat.lastMessage.trim() !== ''
        );
        
        this.chats = this.sortChatsByRecency(chatsWithMessages);
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('Error loading chats:', err);
        this.error = 'Failed to load chats. Please try again.';
        this.loading = false;
      }
    });
}

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
    this.signalrService.setActiveChat(chat);
  }

  retryLoadChats(): void {
    this.authService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        this.initializeConnectionAndLoadChats(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('ChatListComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}