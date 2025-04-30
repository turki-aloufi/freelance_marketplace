// src/app/features/messages/chat/chat.component.ts
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { MessageDto } from '../../../core/models/chat.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: MessageDto[] = [];
  newMessage = '';
  loading = false;
  activeChat: any = null;
  currentUserId: string | null = null;
  private shouldScrollToBottom = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.uid;
        }
      });

    // Get active chat
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        if (chat) {
          this.activeChat = chat;
          this.loadMessages(chat.chatId, this.currentUserId!);
        }
      });

    // Listen for new messages from SignalR
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages(chatId: number, userId: string): void {
    this.loading = true;
    this.messages = [];
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.loading = false;
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loading = false;
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeChat || !this.currentUserId) return;
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, this.newMessage)
      .subscribe({
        next: () => {
          // Message will be added by SignalR
          this.newMessage = '';
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          console.error('Error sending message:', err);
        }
      });
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}