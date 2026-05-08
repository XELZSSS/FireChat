export type SettingsRollback = () => void | Promise<void>;

export type SettingsTransactionStep<Context> = {
  name: string;
  run(context: Context): void | Promise<void>;
  rollback?: SettingsRollback;
};

export const runSettingsTransaction = async <Context>(
  context: Context,
  steps: SettingsTransactionStep<Context>[],
  onFailure?: (error: unknown) => void | Promise<void>
): Promise<void> => {
  const completed = [] as SettingsTransactionStep<Context>[];

  try {
    for (const step of steps) {
      await step.run(context);
      completed.push(step);
    }
  } catch (error) {
    for (const step of completed.reverse()) {
      await step.rollback?.();
    }

    await onFailure?.(error);
    throw error;
  }
};
