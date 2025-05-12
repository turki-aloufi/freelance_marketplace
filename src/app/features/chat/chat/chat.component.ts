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
  userHasScrolled = false;
  
  private refreshTimerId: any = null;
  private refreshInterval = 5000; // Changed from 1000ms to 5000ms
  
  private pendingMessage: {
    tempId: number;
    content: string;
  } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    // Get current user ID
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.uid;
          console.log('Current user ID set:', this.currentUserId);
        }
      });

    // Listen for active chat changes
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        console.log('Active chat changed:', chat);
        
        // Clear previous chat state
        this.stopAutoRefresh();
        this.messages = [];
        
        if (chat) {
          this.activeChat = chat;
          this.loading = true; // Show loading indicator
          
          console.log(`Loading messages for chat ${chat.chatId} with user ${this.currentUserId}`);
          
          // Load messages for the new chat
          if (this.currentUserId) {
            this.loadMessages(chat.chatId, this.currentUserId);
            this.startAutoRefresh();
          } else {
            console.error('Cannot load messages: currentUserId is null');
            this.loading = false;
          }
        }
      });

    // Listen for real-time messages
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          console.log('Received message via SignalR:', message);
          
          if (this.pendingMessage && 
              message.content === this.pendingMessage.content && 
              message.senderId === this.currentUserId) {
            // Replace temp message with the real one from server
            this.replaceTempMessage(message);
            this.pendingMessage = null;
          } else if (!this.isDuplicateMessage(message)) {
            // Add new message from other user
            this.messages.push(message);
            this.sortMessages();
            this.shouldScrollToBottom = !this.userHasScrolled;
          }
        }
      });
  }

  // Sort messages by time and ID
  sortMessages(): void {
    this.messages.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeA !== timeB ? timeA - timeB : a.messageId - b.messageId;
    });
  }

  isDuplicateMessage(message: MessageDto): boolean {
    return this.messages.some(m => 
      m.messageId === message.messageId ||
      (m.content === message.content && 
       m.senderId === message.senderId &&
       Math.abs(new Date(m.sentAt).getTime() - new Date(message.sentAt).getTime()) < 5000)
    );
  }

  onScroll(): void {
    const el = this.messagesContainer.nativeElement;
    const threshold = 100; // px
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    this.userHasScrolled = !atBottom;
  }
  
  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && !this.userHasScrolled) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // FIXED loadMessages function
  loadMessages(chatId: number, userId: string): void {
    // Validate parameters
    if (!chatId || !userId) {
      console.error('Invalid chatId or userId', { chatId, userId });
      this.loading = false;
      return;
    }
    
    console.log(`Loading messages for chat ${chatId} and user ${userId}`);
    
    // Set loading state
    this.loading = true;
    
    // Call API to get messages
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          console.log(`Successfully loaded ${messages.length} messages for chat ${chatId}`);
          
          // Check if we got any messages back
          if (messages && Array.isArray(messages)) {
            // Sort messages by sent time
            messages.sort((a, b) => {
              // Convert timestamps to milliseconds for comparison
              const timeA = new Date(a.sentAt).getTime();
              const timeB = new Date(b.sentAt).getTime();
              
              // First compare by time
              if (timeA !== timeB) {
                return timeA - timeB;
              }
              
              // If same time, use message ID as tiebreaker
              return a.messageId - b.messageId;
            });
            
            // Set the messages to component state
            this.messages = messages;
            
            // Always scroll to bottom when loading messages
            this.shouldScrollToBottom = true;
          } else {
            console.error('Received invalid messages data:', messages);
            this.messages = [];
          }
          
          // Clear loading state
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loading = false;
          this.messages = []; // Clear messages on error
        }
      });
  }
  
  scrollToBottomManually(): void {
    this.scrollToBottom();
    this.userHasScrolled = false;
  }
  
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeChat || !this.currentUserId) return;
    
    const messageContent = this.newMessage.trim();
    const tempId = -Date.now();
    
    // Create a temporary message ID
    this.pendingMessage = {
      tempId: tempId,
      content: messageContent
    };
    
    // Add temp message to the list
    const tempMessage = this.createTempMessage(messageContent);
    this.messages.push(tempMessage);
    this.sortMessages();
    this.shouldScrollToBottom = true;
    
    // Clear input field
    this.newMessage = '';
    
    // Send message to server
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, messageContent)
      .subscribe({
        next: (sentMessage) => {
          console.log('Message sent successfully:', sentMessage);
          if (sentMessage) {
            this.replaceTempMessage(sentMessage);
            this.sortMessages();
          }
          this.pendingMessage = null;
        },
        error: (err) => {
          console.error('Error sending message:', err);
          
          // Remove the temporary message
          this.messages = this.messages.filter(m => m.messageId !== tempId);
          
          // Restore the message to the input field
          this.newMessage = messageContent;
          this.pendingMessage = null;
        }
      });
  }

  formatTime(timestamp: string): string {
    if (!timestamp) {
      return '';
    }
    
    // Create a Date object from the UTC timestamp
    const utcDate = new Date(timestamp);
    
    // Format with locale settings and 12-hour format
    return utcDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private createTempMessage(content: string): MessageDto {
    return {
      messageId: -Date.now(), 
      chatId: this.activeChat.chatId,
      senderId: this.currentUserId!,
      content: content,
      sentAt: new Date().toISOString(),
      isFromMe: true
    };
  }

  private replaceTempMessage(serverMessage: MessageDto): void {
    const index = this.messages.findIndex(m => 
      (m.messageId < 0 && m.content === serverMessage.content) || 
      m.messageId === serverMessage.messageId
    );
    
    if (index >= 0) {
      this.messages[index] = serverMessage;
    }
  }
 
  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    this.refreshTimerId = setInterval(() => {
      if (this.activeChat && this.currentUserId && !this.loading) {
        this.loadMessages(this.activeChat.chatId, this.currentUserId);
      }
    }, this.refreshInterval);
    
    console.log('Auto-refresh started with interval', this.refreshInterval);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
      console.log('Auto-refresh stopped');
    }
  }
}