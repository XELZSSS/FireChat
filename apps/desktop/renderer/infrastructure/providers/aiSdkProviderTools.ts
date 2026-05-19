import { jsonSchema } from 'ai';
import { decideAdaptiveToolParallelism } from '@/infrastructure/providers/requestPolicy';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';

type JsonSchemaDefinition = Parameters<typeof jsonSchema>[0];

export const buildProviderOptionsRecord = (
  providerKeys: string[],
  options?: Record<string, unknown>
): Record<string, Record<string, unknown>> | undefined => {
  if (!options || Object.keys(options).length === 0) {
    return undefined;
  }

  const record: Record<string, Record<string, unknown>> = {};
  const normalizedKeys = Array.from(
    new Set(providerKeys.map((key) => key.split('.')[0]?.trim()).filter(Boolean))
  );

  for (const key of normalizedKeys) {
    record[key] = options;
  }

  return record;
};

export const buildToolSet = async (): Promise<Record<string, unknown> | undefined> => {
  return undefined;
};
