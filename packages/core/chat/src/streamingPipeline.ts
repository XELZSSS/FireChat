export type ChatStreamingPipelineResult<Status extends string, Message> = {
  status: Status;
  modelMessageId: string;
  message?: Message;
  errorMessage?: string;
};

export type ChatStreamingPipelineOptions<
  Input,
  Message,
  Policy,
  ExecutionResult,
  Status extends string,
> = {
  input: Input;
  prepareStreamingRequest: () => void;
  consumePendingResponseMetadata: () => void;
  createStreamAbortController: () => AbortController;
  startPendingModelResponse: (input: Input) => string;
  getCurrentMessages: () => Message[];
  onStarted?: (payload: { modelMessageId: string; userMessage?: Message }) => void;
  markStreamingStarted: () => void;
  buildRequestPolicy: (input: Input) => Policy;
  executeStreamRequest: (payload: {
    input: Input;
    policy: Policy;
    abortController: AbortController;
    requestStartedAt: number;
    modelMessageId: string;
  }) => Promise<ExecutionResult>;
  finishStreamingRequest: (abortController: AbortController) => void;
  isStopRequested: () => boolean;
  getMessageId: (message: Message) => string;
  hasPersistableMessageContent: (message?: Message) => boolean;
  removeMessageById: (messageId: string) => void;
  getExecutionStatus: (result: ExecutionResult) => Status;
  getExecutionErrorMessage: (result: ExecutionResult) => string | undefined;
  syncHistory: () => void;
  commitCurrentSessionNow?: () => void;
};

export const runChatStreamingPipeline = async <
  Input,
  Message,
  Policy,
  ExecutionResult,
  Status extends string,
>({
  input,
  prepareStreamingRequest,
  consumePendingResponseMetadata,
  createStreamAbortController,
  startPendingModelResponse,
  getCurrentMessages,
  onStarted,
  markStreamingStarted,
  buildRequestPolicy,
  executeStreamRequest,
  finishStreamingRequest,
  isStopRequested,
  getMessageId,
  hasPersistableMessageContent,
  removeMessageById,
  getExecutionStatus,
  getExecutionErrorMessage,
  syncHistory,
  commitCurrentSessionNow,
}: ChatStreamingPipelineOptions<Input, Message, Policy, ExecutionResult, Status>): Promise<
  ChatStreamingPipelineResult<Status | 'aborted', Message>
> => {
  prepareStreamingRequest();
  consumePendingResponseMetadata();

  const abortController = createStreamAbortController();
  const modelMessageId = startPendingModelResponse(input);
  onStarted?.({
    modelMessageId,
    userMessage: getCurrentMessages()[getCurrentMessages().length - 2],
  });

  markStreamingStarted();

  const requestPolicy = buildRequestPolicy(input);
  const requestStartedAt = performance.now();
  const executionResult = await executeStreamRequest({
    input,
    policy: requestPolicy,
    abortController,
    requestStartedAt,
    modelMessageId,
  });

  finishStreamingRequest(abortController);

  if (isStopRequested()) {
    const stoppedMessage = getCurrentMessages().find(
      (message) => getMessageId(message) === modelMessageId
    );
    if (!hasPersistableMessageContent(stoppedMessage)) {
      removeMessageById(modelMessageId);
    }
  }

  const status = getExecutionStatus(executionResult);
  console.info(
    `[chat] request-finished status=${status} elapsed=${Math.round(performance.now() - requestStartedAt)}ms`
  );

  if (getCurrentMessages().length > 0) {
    syncHistory();
    commitCurrentSessionNow?.();
  }

  return {
    status: isStopRequested() && status === 'completed' ? 'aborted' : status,
    modelMessageId,
    message: getCurrentMessages().find((message) => getMessageId(message) === modelMessageId),
    errorMessage: getExecutionErrorMessage(executionResult),
  };
};
