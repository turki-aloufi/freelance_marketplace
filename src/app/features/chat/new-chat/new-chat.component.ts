import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { take, switchMap, map } from 'rxjs/operators'; 
import { ChatDto } from '../../../core/models/chat.model'; 

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss']
})
export class NewChatComponent {
  showNewChatForm = false;
  receiverEmail = '';
  loading = false;
  error = '';

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  toggleNewChatForm(): void {
    this.showNewChatForm = !this.showNewChatForm;
    if (!this.showNewChatForm) {
      this.receiverEmail = '';
      this.error = '';
    }
  }

  startNewChat(): void {
    if (!this.receiverEmail) return;
    
    this.loading = true;
    this.error = '';
    
    this.authService.user$.pipe(take(1)).subscribe(currentUser => {
      if (!currentUser) {
        this.loading = false;
        this.error = 'You must be logged in';
        return;
      }
      
      
      console.log('Current user ID:', currentUser.uid);
      console.log('Receiver ID:', this.receiverEmail);
      
     
      if (currentUser.uid === this.receiverEmail) {
        this.loading = false;
        this.error = 'You cannot chat with yourself';
        return;
      }
      
      
      const clientId = currentUser.uid;
      const freelancerId = this.receiverEmail;
      
      
      console.log('Sending to API:', { clientId, freelancerId });
      
      this.chatService.createChat(clientId, freelancerId)
        .pipe(
          
          switchMap((createdChat: ChatDto) => {
            return this.chatService.getUserChats(currentUser.uid).pipe(
              take(1),
              
              map((chats: ChatDto[]) => {
                const fullChat = chats.find(c => c.chatId === createdChat.chatId);
                return fullChat || createdChat;
              })
            );
          })
        )
        .subscribe({
          next: (chat: ChatDto) => {
            console.log('Successfully created chat with details:', chat);
            this.loading = false;
            this.chatService.setActiveChat(chat);
            this.toggleNewChatForm();
          },
          error: (err) => {
            console.error('Error creating chat:', err);
            this.loading = false;
            this.error = 'Failed to create chat. Please try again.';
          }
        });
    });
  }
}