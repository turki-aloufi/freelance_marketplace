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
  
  // Auto-refresh properties
  private refreshTimerId: any = null;
  private refreshInterval = 1000; // 1 second refresh interval (adjust as needed)
  
  // For message deduplication
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
          
          // Start auto-refresh when a chat becomes active
          this.startAutoRefresh();
        } else {
          // Stop auto-refresh if no active chat
          this.stopAutoRefresh();
        }
      });

    // Listen for new messages from SignalR
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          // Check if this is our pending message
          if (this.pendingMessage && 
              message.content === this.pendingMessage.content && 
              message.senderId === this.currentUserId) {
            // Replace temp message with real one
            this.replaceTempMessage(message);
            this.pendingMessage = null;
          } 
          // Otherwise check if it's a new message
          else if (!this.isDuplicateMessage(message)) {
            this.messages.push(message);
            this.shouldScrollToBottom = !this.userHasScrolled;
          }
        }
      });
  }

  isDuplicateMessage(message: MessageDto): boolean {
    return this.messages.some(m => 
      // Check if exact message ID match
      m.messageId === message.messageId ||
      // Or check content + sender match for pending message
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
    // Stop auto-refresh when component is destroyed
    this.stopAutoRefresh();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages(chatId: number, userId: string): void {
    if (!chatId || !userId) return;
    
    // Don't load if already loading
    if (this.loading) return;
    
    // Save current scroll position before loading
    let scrollTop = 0;
    let scrollHeight = 0;
    
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      scrollTop = element.scrollTop;
      scrollHeight = element.scrollHeight;
    }
    
    // Only show loading indicator on initial load
    const isInitialLoad = this.messages.length === 0;
    if (isInitialLoad) {
      this.loading = true;
    }
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          // Check if there are actually new messages
          if (messages.length > this.messages.length || this.messages.length === 0) {
            // Check if we have a pending message that needs to be added
            if (this.pendingMessage) {
              const pendingExists = messages.some(m => 
                m.content === this.pendingMessage?.content && 
                m.senderId === this.currentUserId
              );
              
              if (!pendingExists) {
                // Add our pending message to the display
                const tempMessage = this.createTempMessage(this.pendingMessage.content);
                messages.push(tempMessage);
              } else {
                // Server has our message, clear pending state
                this.pendingMessage = null;
              }
            }
            
            // Update messages while maintaining scroll position
            const wasAtBottom = !this.userHasScrolled;
            this.messages = messages;
            
            // Only scroll to bottom if we were already at the bottom or this is the first load
            if (wasAtBottom || isInitialLoad) {
              this.shouldScrollToBottom = true;
            } else {
              // Otherwise restore scroll position after view updates
              setTimeout(() => {
                if (this.messagesContainer) {
                  const element = this.messagesContainer.nativeElement;
                  const newScrollHeight = element.scrollHeight;
                  const heightDifference = newScrollHeight - scrollHeight;
                  element.scrollTop = scrollTop + heightDifference;
                }
              }, 0);
            }
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loading = false;
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
    
    // Create a temporary ID for the pending message
    const tempId = -Date.now();
    
    // Save pending message details
    this.pendingMessage = {
      tempId: tempId,
      content: messageContent
    };
    
    // Create a temporary message to display immediately
    const tempMessage = this.createTempMessage(messageContent);
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;
    
    // Clear input
    this.newMessage = '';
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, messageContent)
      .subscribe({
        next: (sentMessage) => {
          // Replace temp message with confirmed message
          if (sentMessage) {
            this.replaceTempMessage(sentMessage);
          }
          this.pendingMessage = null;
        },
        error: (err) => {
          console.error('Error sending message:', err);
          
          // Remove temp message on error
          this.messages = this.messages.filter(m => m.messageId !== tempId);
          
          // Restore message to input
          this.newMessage = messageContent;
          
          // Clear pending state
          this.pendingMessage = null;
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
  
  // Helper method to create a temporary message
  private createTempMessage(content: string): MessageDto {
    return {
      messageId: -Date.now(), // Use negative ID to avoid conflicts with server IDs
      chatId: this.activeChat.chatId,
      senderId: this.currentUserId!,
      content: content,
      sentAt: new Date().toISOString(),
      isFromMe: true
    };
  }
  
  // Helper method to replace a temporary message with the confirmed one
  private replaceTempMessage(serverMessage: MessageDto): void {
    // Find the temporary message
    const index = this.messages.findIndex(m => 
      (m.messageId < 0 && m.content === serverMessage.content) || 
      m.messageId === serverMessage.messageId
    );
    
    if (index >= 0) {
      // Replace it with the server message
      this.messages[index] = serverMessage;
    }
  }
  
  // Start auto-refresh timer
  private startAutoRefresh(): void {
    // Stop any existing timer first
    this.stopAutoRefresh();
    
    // Start a new timer
    this.refreshTimerId = setInterval(() => {
      if (this.activeChat && this.currentUserId && !this.loading) {
        this.loadMessages(this.activeChat.chatId, this.currentUserId);
      }
    }, this.refreshInterval);
    
    console.log('Auto-refresh started');
  }
  
  // Stop auto-refresh timer
  private stopAutoRefresh(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
      console.log('Auto-refresh stopped');
    }
  }
}