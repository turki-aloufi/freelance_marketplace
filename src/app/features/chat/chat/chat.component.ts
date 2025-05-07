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
  private refreshInterval = 1000; 
  
  
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
    
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.uid;
        }
      });

    
    this.chatService.activeChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        if (chat) {
          this.activeChat = chat;
          this.loadMessages(chat.chatId, this.currentUserId!);
          
          
          this.startAutoRefresh();
        } else {
          
          this.stopAutoRefresh();
        }
      });

    
    this.signalrService.messageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && this.activeChat && message.chatId === this.activeChat.chatId) {
          
          if (this.pendingMessage && 
              message.content === this.pendingMessage.content && 
              message.senderId === this.currentUserId) {
            
            this.replaceTempMessage(message);
            this.pendingMessage = null;
          } 
          
          else if (!this.isDuplicateMessage(message)) {
            this.messages.push(message);
            this.shouldScrollToBottom = !this.userHasScrolled;
          }
        }
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

  loadMessages(chatId: number, userId: string): void {
    if (!chatId || !userId) return;
    
    
    if (this.loading) return;
    
    
    let scrollTop = 0;
    let scrollHeight = 0;
    
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      scrollTop = element.scrollTop;
      scrollHeight = element.scrollHeight;
    }
    
    
    const isInitialLoad = this.messages.length === 0;
    if (isInitialLoad) {
      this.loading = true;
    }
    
    this.chatService.getChatMessages(chatId, userId)
      .subscribe({
        next: (messages) => {
         
          if (messages.length > this.messages.length || this.messages.length === 0) {
            
            if (this.pendingMessage) {
              const pendingExists = messages.some(m => 
                m.content === this.pendingMessage?.content && 
                m.senderId === this.currentUserId
              );
              
              if (!pendingExists) {
                
                const tempMessage = this.createTempMessage(this.pendingMessage.content);
                messages.push(tempMessage);
              } else {
                
                this.pendingMessage = null;
              }
            }
            
            
            const wasAtBottom = !this.userHasScrolled;
            this.messages = messages;
            
            
            if (wasAtBottom || isInitialLoad) {
              this.shouldScrollToBottom = true;
            } else {
             
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
    
    
    const tempId = -Date.now();
    
    
    this.pendingMessage = {
      tempId: tempId,
      content: messageContent
    };
    
    
    const tempMessage = this.createTempMessage(messageContent);
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;
    
    
    this.newMessage = '';
    
    this.chatService.sendMessage(this.activeChat.chatId, this.currentUserId, messageContent)
      .subscribe({
        next: (sentMessage) => {
          
          if (sentMessage) {
            this.replaceTempMessage(sentMessage);
          }
          this.pendingMessage = null;
        },
        error: (err) => {
          console.error('Error sending message:', err);
          
          
          this.messages = this.messages.filter(m => m.messageId !== tempId);
          
          
          this.newMessage = messageContent;
          
          
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
    
    console.log('Auto-refresh started');
  }
  

  private stopAutoRefresh(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
      console.log('Auto-refresh stopped');
    }
  }
}