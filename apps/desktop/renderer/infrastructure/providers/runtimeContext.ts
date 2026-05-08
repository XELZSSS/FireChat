const buildLocalDateTimeText = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
};

export const buildRuntimeSystemPrompt = (systemPrompt?: string, date = new Date()): string => {
  const normalizedSystemPrompt = systemPrompt?.trim();
  const runtimePrompt = `Current device date and time: ${buildLocalDateTimeText(date)}`;

  return normalizedSystemPrompt ? `${normalizedSystemPrompt}\n\n${runtimePrompt}` : runtimePrompt;
};
