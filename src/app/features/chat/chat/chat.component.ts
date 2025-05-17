import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
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
  private shouldScrollToBottom = true;
  userHasScrolled = false;
  
  private destroy$ = new Subject<void>();

  constructor(
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
        }
      });

    // Listen for active chat changes
    this.signalrService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        this.messages = [];
        
        if (chat) {
          this.activeChat = chat;
          this.loading = true;
          
          if (this.currentUserId) {
            this.loadMessages(chat.chatId, this.currentUserId);
          } else {
            this.loading = false;
          }
        }
      });

    // Listen for real-time messages via SignalR
    this.signalrService.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          if (!this.isDuplicateMessage(message)) {
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
    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    this.userHasScrolled = !atBottom;
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
    if (!chatId || !userId) return;
    
    this.loading = true;
    
    this.signalrService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages: MessageDto[]) => {
          if (messages && Array.isArray(messages)) {
            this.messages = messages;
            this.sortMessages();
            this.shouldScrollToBottom = true;
          }
          
          this.loading = false;
        },
        error: (err: Error) => {
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
    this.newMessage = '';
    
    // Create a temporary message for immediate display
    const tempMessage: MessageDto = {
      messageId: -Date.now(),
      chatId: this.activeChat.chatId,
      senderId: this.currentUserId,
      content: messageContent,
      sentAt: new Date().toISOString(),
      isFromMe: true
    };
    
    this.messages.push(tempMessage);
    this.sortMessages();
    this.shouldScrollToBottom = true;
    
    this.signalrService.sendMessage(this.activeChat.chatId, this.currentUserId, messageContent)
      .subscribe({
        error: (err: Error) => {
          console.error('Error sending message:', err);
          // Remove the temp message on error
          this.messages = this.messages.filter(m => m.messageId !== tempMessage.messageId);
          this.newMessage = messageContent;
        }
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
}