export enum Role {
  User = 'user',
  Model = 'model',
}

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  textContent: string;
  kind?: 'text' | 'image';
  data?: string;
  truncated?: boolean;
};

export type ChatPromptInput = {
  text: string;
  attachments?: ChatAttachment[];
};

export type Citation = {
  sourceKind: 'local' | 'remote' | 'web';
  snippet: string;
  score?: number;
  sourcePath?: string;
  remoteProvider?: 'openai-vector-store';
  documentId?: string;
  documentName?: string;
  chunkId?: string;
  chunkIndex?: number;
  url?: string;
  title?: string;
};

export type ChatToolCall = {
  id: string;
  name: string;
  argumentsText: string;
  source?: 'custom' | 'native';
  provider?: ProviderId;
};

export type ChatToolResult = {
  id: string;
  name: string;
  outputText: string;
  isError?: boolean;
  source?: 'custom' | 'native';
  provider?: ProviderId;
};

export type ChatMessagePart =
  | {
      id: string;
      type: 'text';
      text: string;
    }
  | {
      id: string;
      type: 'reasoning';
      text: string;
      status: 'streaming' | 'completed';
    }
  | {
      id: string;
      type: 'attachment';
      attachment: ChatAttachment;
    }
  | {
      id: string;
      type: 'tool-call';
      call: ChatToolCall;
    }
  | {
      id: string;
      type: 'tool-result';
      result: ChatToolResult;
    }
  | {
      id: string;
      type: 'citation';
      citation: Citation;
    };

export type ProviderId = string;

export interface ChatMessage {
  id: string;
  role: Role;
  parts: ChatMessagePart[];
  timestamp: number;
  timeLabel?: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  provider: ProviderId;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderError {
  provider: ProviderId;
  message: string;
  cause?: unknown;
}
