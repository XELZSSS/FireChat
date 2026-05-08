import type {
  ChatAttachment,
  ChatGeneratedImage,
  ChatMessage,
  ChatSession,
} from '@/shared/types/chat';
import { buildMessageParts, readMessagePartState } from '@/shared/utils/chatMessageParts';
import { formatMessageTime } from '@/shared/utils/time';
import { getProviderDefinition } from '@/infrastructure/providers/registry';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

const getDefaultProviderId = () => listProviderIds()[0] ?? 'openai';

export type StoredSession = Partial<ChatSession> &
  Pick<ChatSession, 'id' | 'title' | 'createdAt' | 'updatedAt'>;
export type StoredSessionIndexEntry = Pick<
  ChatSession,
  'id' | 'title' | 'provider' | 'model' | 'createdAt' | 'updatedAt'
> & {
  cliSessionIds?: ChatSession['cliSessionIds'];
};
const normalizeAttachment = (attachment: unknown): ChatAttachment | null => {
  if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) {
    return null;
  }

  const candidate = attachment as Partial<ChatAttachment>;
  const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : null;
  const name =
    typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : 'file';
  const mimeType = typeof candidate.mimeType === 'string' ? candidate.mimeType : 'text/plain';
  const size =
    typeof candidate.size === 'number' && Number.isFinite(candidate.size) ? candidate.size : 0;
  const textContent = typeof candidate.textContent === 'string' ? candidate.textContent : '';
  const kind = candidate.kind === 'image' ? 'image' : 'text';
  const data = typeof candidate.data === 'string' ? candidate.data : undefined;

  if (!id) {
    return null;
  }

  return {
    id,
    name,
    mimeType,
    size,
    textContent,
    kind,
    ...(kind === 'image' && data ? { data } : {}),
    truncated: candidate.truncated === true ? true : undefined,
  };
};

const normalizeGeneratedImage = (image: unknown): ChatGeneratedImage | null => {
  if (!image || typeof image !== 'object' || Array.isArray(image)) {
    return null;
  }

  const candidate = image as Partial<ChatGeneratedImage>;
  const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : null;
  const mimeType =
    typeof candidate.mimeType === 'string' && candidate.mimeType.trim()
      ? candidate.mimeType.trim()
      : 'image/png';
  const data =
    typeof candidate.data === 'string' && candidate.data.trim() ? candidate.data.trim() : null;

  if (!id || !data) {
    return null;
  }

  return {
    id,
    mimeType,
    data,
    model: typeof candidate.model === 'string' ? candidate.model : undefined,
    size: typeof candidate.size === 'string' ? candidate.size : undefined,
    quality: typeof candidate.quality === 'string' ? candidate.quality : undefined,
    background: typeof candidate.background === 'string' ? candidate.background : undefined,
    outputFormat: typeof candidate.outputFormat === 'string' ? candidate.outputFormat : undefined,
  };
};

const normalizeCliSessionId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeCliSessionIds = (value: unknown): ChatSession['cliSessionIds'] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Partial<NonNullable<ChatSession['cliSessionIds']>>;
  const codex = normalizeCliSessionId(candidate.codex);
  const claudeCode = normalizeCliSessionId(candidate.claudeCode);

  if (!codex && !claudeCode) {
    return undefined;
  }

  return {
    ...(codex ? { codex } : {}),
    ...(claudeCode ? { claudeCode } : {}),
  };
};

const normalizeMessage = (message: ChatMessage): ChatMessage => {
  const partState = readMessagePartState({
    ...message,
    parts: Array.isArray(message.parts) ? message.parts : [],
  });

  return {
    ...message,
    parts: buildMessageParts({
      messageId: message.id,
      ...partState,
      attachments: partState.attachments
        .map((attachment) => normalizeAttachment(attachment))
        .filter((attachment): attachment is ChatAttachment => Boolean(attachment)),
      generatedImages: partState.generatedImages
        .map((image) => normalizeGeneratedImage(image))
        .filter((image): image is ChatGeneratedImage => Boolean(image)),
    }),
    timeLabel: message.timeLabel ?? formatMessageTime(message.timestamp),
  };
};

export const normalizeSession = (session: StoredSession): ChatSession => {
  const validProviderIds = new Set(listProviderIds());
  const defaultProviderId = getDefaultProviderId();
  const provider =
    typeof session.provider === 'string' && validProviderIds.has(session.provider)
      ? session.provider
      : defaultProviderId;

  return {
    ...session,
    provider,
    model: session.model ?? getProviderDefinition(defaultProviderId).defaultModel,
    cliSessionIds: normalizeCliSessionIds(session.cliSessionIds),
    messages: (session.messages ?? []).map((message) => normalizeMessage(message)),
  };
};

export const cloneSessions = (sessions: ChatSession[]): ChatSession[] =>
  sessions.map((session) => ({
    ...session,
    cliSessionIds: session.cliSessionIds ? { ...session.cliSessionIds } : undefined,
    messages: session.messages.map((message) => ({
      ...message,
      parts: message.parts.map((part) =>
        part.type === 'attachment'
          ? { ...part, attachment: { ...part.attachment } }
          : part.type === 'generated-image'
            ? { ...part, image: { ...part.image } }
            : part.type === 'tool-call'
              ? { ...part, call: { ...part.call } }
              : part.type === 'tool-result'
                ? { ...part, result: { ...part.result } }
                : part.type === 'citation'
                  ? { ...part, citation: { ...part.citation } }
                  : { ...part }
      ),
    })),
  }));
