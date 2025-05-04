// src/app/features/messages/chat/chat.component.ts
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { MessageDto } from '../../../core/models/chat.model';
import { Subject, takeUntil, debounceTime, filter, interval } from 'rxjs';

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
  signalRConnected = false;
  private shouldScrollToBottom = false;
  private messageIds = new Set<number>(); // Track received message IDs to prevent duplicates
  
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private signalrService: SignalrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Chat component initialized');
    
    // Setup connection checker - every 30 seconds check if SignalR is connected
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeChat && this.currentUserId) {
          this.checkSignalRConnection();
        }
      });
    
    // Monitor SignalR connection status
    this.signalrService.connectionEstablished$
      .pipe(takeUntil(this.destroy$))
      .subscribe(established => {
        console.log('SignalR connection status:', established);
        
        // If connection state changes, update UI
        if (this.signalRConnected !== established) {
          this.signalRConnected = established;
          this.cdr.detectChanges(); // Force change detection
          
          // If connection is established and we have an active chat, make sure we're joined
          if (established && this.activeChat && this.currentUserId) {
            console.log('Connection established, ensuring we are joined to the active chat');
            this.signalrService.joinChatRoom(this.activeChat.chatId)
              .catch(err => console.error('Failed to join chat room after connection established:', err));
          }
        }
      });
    
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
          
          // Only reload messages if chat has changed
          if (!this.activeChat || this.activeChat.chatId !== chat.chatId) {
            this.activeChat = chat;
            this.messageIds.clear(); // Clear tracked message IDs
            
            if (this.currentUserId) {
              this.loadMessages(chat.chatId, this.currentUserId);
            }
          }
        } else {
          this.activeChat = null;
          this.messages = [];
          this.messageIds.clear();
        }
      });

    // Listen for new messages from SignalR
    this.signalrService.messageReceived
      .pipe(
        takeUntil(this.destroy$),
        filter(message => !!message) // Filter out null messages
      )
      .subscribe(message => {
        if (!message) {
          return;
        }
        
        console.log('Message received in chat component:', message);
        
        // Only process messages for the active chat
        if (this.activeChat && message.chatId === this.activeChat.chatId) {
          this.ngZone.run(() => {
            // Check if this message already exists in our messages array
            if (!this.messageIds.has(message.messageId)) {
              console.log('Adding new message to chat view:', message);
              
              // Add message ID to our tracking set
              this.messageIds.add(message.messageId);
              
              // Add the message to our array
              this.messages = [...this.messages, message];
              this.shouldScrollToBottom = true;
              this.cdr.detectChanges(); // Force change detection
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
    this.messageIds.clear();
    
    console.log(`Loading messages for chat ${chatId}`);
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
          console.log(`Loaded ${messages.length} messages`);
          
          // Track all message IDs
          messages.forEach(msg => this.messageIds.add(msg.messageId));
          
          this.messages = messages;
          this.loading = false;
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges(); // Force change detection
          
          // Ensure we're joined to this chat room
          if (this.signalRConnected) {
            this.signalrService.joinChatRoom(chatId)
              .catch(err => console.error('Failed to join chat room after loading messages:', err));
          }
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loading = false;
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeChat || !this.currentUserId) {
      return;
    }
    
    // Check connection before sending
    if (!this.signalRConnected) {
      console.warn('SignalR not connected, attempting to reconnect...');
      this.signalrService.startConnection(this.currentUserId)
        .then(() => {
          // Join the room after reconnection
          return this.signalrService.joinChatRoom(this.activeChat.chatId);
        })
        .then(() => this.doSendMessage())
        .catch(err => console.error('Failed to reconnect SignalR:', err));
      return;
    }
    
    this.doSendMessage();
  }
  
  private doSendMessage(): void {
    const messageContent = this.newMessage.trim();
    console.log(`Sending message to chat ${this.activeChat.chatId}`);
    
    // Store message text and clear input immediately for better UX
    const pendingMessage = this.newMessage;
    this.newMessage = '';
    
    // Add a temporary message with a local ID to the UI immediately
    // This gives immediate feedback to the user
    const tempMessage: MessageDto = {
      messageId: -Date.now(), // Temporary negative ID so it doesn't conflict with server IDs
      chatId: this.activeChat.chatId,
      senderId: this.currentUserId!,
      content: messageContent,
      sentAt: new Date().toISOString(), // Convert to ISO string format
      isFromMe: true
    };
    
    // Add to messages array
    this.messages = [...this.messages, tempMessage];
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId!, messageContent)
      .subscribe({
        next: (sentMessage) => {
          console.log('Message sent successfully:', sentMessage);
          
          // Replace temp message with actual message from server
          const messageIndex = this.messages.findIndex(m => 
            m.messageId === tempMessage.messageId || 
            (m.messageId === sentMessage.messageId));
          
          if (messageIndex >= 0) {
            // Add message ID to tracking set
            this.messageIds.add(sentMessage.messageId);
            
            // Replace the message
            this.messages[messageIndex] = sentMessage;
            this.messages = [...this.messages]; // Create new array to trigger change detection
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error sending message:', err);
          
          // Remove the temporary message
          this.messages = this.messages.filter(m => m.messageId !== tempMessage.messageId);
          
          // Restore the message text if sending failed
          this.newMessage = pendingMessage;
          this.cdr.detectChanges();
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
  
  private checkSignalRConnection(): void {
    this.signalrService.checkConnection()
      .then(connected => {
        if (!connected && this.currentUserId) {
          console.log('Connection check failed, restarting SignalR...');
          return this.signalrService.startConnection(this.currentUserId);
        }
        return Promise.resolve();
      })
      .then(() => {
        if (this.activeChat) {
          return this.signalrService.joinChatRoom(this.activeChat.chatId);
        }
        return Promise.resolve();
      })
      .catch(err => console.error('Error in connection check:', err));
  }
}