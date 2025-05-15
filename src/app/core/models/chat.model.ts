export interface ChatDto {
    chatId: number;
    clientId: string;
    freelancerId: string;
    startedAt: string; 
    otherUserName: string;
    otherUserImageUrl: string;
    lastMessage: string;
    lastMessageTime: string | null; 
    lastMessageSenderId?: string; 
    isLastMessageFromMe: boolean;
}
  
export interface MessageDto {
    messageId: number;
    chatId: number;
    senderId: string;
    content: string;
    sentAt: string | Date; 
    isFromMe: boolean;
}
  
  export interface SendMessageDto {
    senderId: string;
    content: string;
  }
  
  export interface CreateChatDto {
    clientId: string;
    freelancerId: string;
  }