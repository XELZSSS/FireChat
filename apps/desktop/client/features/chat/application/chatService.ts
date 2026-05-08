import { ChatOrchestrator } from '@client/features/chat/application/chatOrchestrator';

export type ChatService = ChatOrchestrator;

export const chatService = new ChatOrchestrator();
