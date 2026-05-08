import type { ChatMessage, ChatPromptInput, ProviderId } from '@/shared/types/chat';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ProviderChat, ProviderModelItem } from '@/infrastructure/providers/types';
import { buildMessagePromptContent } from '@/shared/utils/chatAttachmentPrompt';
import {
  runDesktopCliPrompt,
  stopDesktopCliProvider,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { hasFireChatBridge } from '@client/features/desktop-shell/infrastructure/firechatBridge';
import type { CliProviderId } from '@contracts/desktop';

type CliProviderDefinition = {
  id: CliProviderId;
  defaultModel: string;
  modelName: string;
};

const CLI_PROVIDER_DEFINITIONS: Record<CliProviderId, CliProviderDefinition> = {
  codex: {
    id: 'codex',
    defaultModel: 'gpt-5.5',
    modelName: 'Codex CLI',
  },
  'claude-code': {
    id: 'claude-code',
    defaultModel: 'claude-code',
    modelName: 'Claude Code CLI',
  },
};

class CliProvider implements ProviderChat {
  private modelName: string;
  private sessionId?: string;

  constructor(private readonly definition: CliProviderDefinition) {
    this.modelName = definition.defaultModel;
  }

  getId(): ProviderId {
    return this.definition.id;
  }

  getModelName(): string {
    return this.modelName;
  }

  setModelName(model: string): void {
    this.modelName = model.trim() || this.definition.defaultModel;
  }

  getApiKey(): string | undefined {
    return undefined;
  }

  setApiKey(_apiKey?: string): void {
    return;
  }

  getCliSessionId(): string | undefined {
    return this.sessionId;
  }

  setCliSessionId(sessionId?: string): void {
    const normalizedSessionId = sessionId?.trim();
    this.sessionId = normalizedSessionId || undefined;
  }

  async listModels(): Promise<ProviderModelItem[]> {
    return [
      {
        id: this.definition.defaultModel,
        name: this.definition.modelName,
      },
    ];
  }

  resetChat(): void {
    this.sessionId = undefined;
  }

  async startChatWithHistory(_messages: ChatMessage[]): Promise<void> {
    return;
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    _requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    if (!hasFireChatBridge()) {
      throw new Error('CLI providers are only available in the desktop app.');
    }

    const currentText = buildMessagePromptContent(message).trim();
    if (!currentText) {
      throw new Error('Message text is required.');
    }

    const abortHandler = () => {
      void stopDesktopCliProvider(this.definition.id);
    };
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      const result = await runDesktopCliPrompt({
        provider: this.definition.id,
        prompt: currentText,
        sessionId: this.sessionId,
      });

      this.sessionId = result.sessionId ?? this.sessionId;
      if (result.text) {
        yield result.text;
      }
    } finally {
      signal?.removeEventListener('abort', abortHandler);
    }
  }
}

export const createCodexCliProviderInstance = (): ProviderChat =>
  new CliProvider(CLI_PROVIDER_DEFINITIONS.codex);

export const createClaudeCodeCliProviderInstance = (): ProviderChat =>
  new CliProvider(CLI_PROVIDER_DEFINITIONS['claude-code']);
