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
          console.log('Chat component: User set', this.currentUserId);
        }
      });

    // Get active chat
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        if (chat) {
          console.log('Chat component: Active chat updated', chat);
          this.activeChat = chat;
          
          if (this.currentUserId) {
            this.loadMessages(chat.chatId, this.currentUserId);
          }
        }
      });

    // Listen for new messages from SignalR
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          console.log('Chat component: Received message for active chat', message);
          
          // Avoid duplicating messages
          const existingMessage = this.messages.find(m => m.messageId === message.messageId);
          if (!existingMessage) {
            this.messages.push(message);
            this.shouldScrollToBottom = true;
            console.log('Chat component: Added new message to display');
          } else {
            console.log('Chat component: Skipped duplicate message');
          }
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
    
    console.log(`Chat component: Loading messages for chat ${chatId}`);
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          console.log(`Chat component: Loaded ${messages.length} messages`);
          this.messages = messages;
          this.loading = false;
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          console.error('Chat component: Error loading messages:', err);
          this.loading = false;
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeChat || !this.currentUserId) {
      console.log('Chat component: Cannot send empty message');
      return;
    }
    
    const messageContent = this.newMessage.trim();
    console.log(`Chat component: Sending message to chat ${this.activeChat.chatId}`);
    
    // Store current message and clear input field immediately for better UX
    const pendingMessage = this.newMessage;
    this.newMessage = '';
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, pendingMessage)
      .subscribe({
        next: (sentMessage) => {
          console.log('Chat component: Message sent successfully', sentMessage);
          // The new message will be added via the SignalR callback
        },
        error: (err) => {
          console.error('Chat component: Error sending message:', err);
          // Restore the message if sending failed
          this.newMessage = pendingMessage;
          alert('Failed to send message. Please try again.');
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