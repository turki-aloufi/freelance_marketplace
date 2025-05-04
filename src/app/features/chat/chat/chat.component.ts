// src/app/features/messages/chat/chat.component.ts
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked, NgZone } from '@angular/core';
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
    private signalrService: SignalrService,
    private ngZone: NgZone // Add NgZone for change detection
  ) {}

  ngOnInit(): void {
    console.log('Chat component initialized');
    
    // Get current user
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.uid;
          console.log('Current user set:', this.currentUserId);
        }
      });

    // Get active chat
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        if (chat) {
          console.log('Active chat updated:', chat);
          this.activeChat = chat;
          
          if (this.currentUserId) {
            this.loadMessages(chat.chatId, this.currentUserId);
          }
        }
      });

    // IMPORTANT: The key fix - listen for new messages from SignalR
    this.setupSignalRListener();
  }
  
  // Extract SignalR message handling to a separate method for clarity
  private setupSignalRListener(): void {
    console.log('Setting up SignalR message listener');
    
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        // Skip null messages
        if (!message) {
          return;
        }
        
        console.log('Message received from SignalR:', message);
        
        // Only process messages for the active chat
        if (this.activeChat && message.chatId === this.activeChat.chatId) {
          console.log('Message is for active chat, processing...');
          
          // Run inside NgZone to ensure change detection happens
          this.ngZone.run(() => {
            // Check if message already exists to avoid duplicates
            const existingMessageIndex = this.messages.findIndex(m => m.messageId === message.messageId);
            
            if (existingMessageIndex === -1) {
              console.log('Adding new message to chat view');
              this.messages.push(message);
              this.shouldScrollToBottom = true;
            } else {
              console.log('Message already exists, not adding duplicate');
            }
          });
        } else {
          console.log('Message is not for active chat, ignoring');
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
    console.log('Chat component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages(chatId: number, userId: string): void {
    this.loading = true;
    this.messages = [];
    
    console.log(`Loading messages for chat ${chatId}`);
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          console.log(`Loaded ${messages.length} messages`);
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
    if (!this.newMessage.trim() || !this.activeChat || !this.currentUserId) {
      return;
    }
    
    const messageContent = this.newMessage.trim();
    console.log(`Sending message to chat ${this.activeChat.chatId}`);
    
    // Clear input immediately for better UX
    const pendingMessage = this.newMessage;
    this.newMessage = '';
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, messageContent)
      .subscribe({
        next: (sentMessage) => {
          console.log('Message sent successfully:', sentMessage);
          // No need to add message manually, SignalR will deliver it
        },
        error: (err) => {
          console.error('Error sending message:', err);
          // Restore the message text if sending failed
          this.newMessage = pendingMessage;
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