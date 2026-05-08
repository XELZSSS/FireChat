type RollbackAction = {
  label: string;
  run: () => void | Promise<void>;
};

export const createRollbackStack = () => {
  const stack: RollbackAction[] = [];

  return {
    push(label: string, run: RollbackAction['run']): void {
      stack.push({ label, run });
    },
    async rollback(): Promise<void> {
      while (stack.length > 0) {
        const action = stack.pop();
        if (!action) {
          continue;
        }

        try {
          await action.run();
        } catch (error) {
          console.error(action.label, error);
        }
      }
    },
  };
};
