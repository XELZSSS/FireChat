import { isPlainObject } from '@/shared/utils/plainObject';

const normalizeComparableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item));
  }

  if (isPlainObject(value)) {
    const normalizedEntries = Object.keys(value)
      .sort()
      .flatMap((key) => {
        const normalized = normalizeComparableValue(value[key]);
        return normalized === undefined ? [] : [[key, normalized] as const];
      });

    return Object.fromEntries(normalizedEntries);
  }

  return value;
};

export const stableSerializeComparableValue = (value: unknown): string => {
  return JSON.stringify(normalizeComparableValue(value)) ?? 'undefined';
};

export const areComparableValuesEqual = (left: unknown, right: unknown): boolean => {
  return stableSerializeComparableValue(left) === stableSerializeComparableValue(right);
};
