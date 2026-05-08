export const normalizeModelName = (modelName: string): string => modelName.trim().toLowerCase();

export const getModelNameVariants = (modelName: string): string[] => {
  const normalized = normalizeModelName(modelName);
  const variants = new Set([normalized]);

  for (const separator of ['/', ':']) {
    const tail = normalized.split(separator).pop()?.trim();
    if (tail) {
      variants.add(tail);
    }
  }

  return Array.from(variants).filter(Boolean);
};

export const matchesModelVariant = (
  modelName: string,
  matcher: (variant: string) => boolean
): boolean => {
  return getModelNameVariants(modelName).some(matcher);
};

export const hasModelAlias = (modelName: string, alias: string): boolean => {
  const normalizedAlias = normalizeModelName(alias);
  return matchesModelVariant(modelName, (variant) => variant === normalizedAlias);
};

export const replaceTrailingModelAlias = (
  modelName: string,
  fromAlias: string,
  toAlias: string
): string => {
  const trimmed = modelName.trim();
  const normalized = normalizeModelName(trimmed);
  const normalizedFromAlias = normalizeModelName(fromAlias);

  if (normalized === normalizedFromAlias) {
    return toAlias;
  }

  for (const separator of ['/', ':']) {
    const suffix = `${separator}${normalizedFromAlias}`;
    if (normalized.endsWith(suffix)) {
      return `${trimmed.slice(0, trimmed.length - fromAlias.length)}${toAlias}`;
    }
  }

  return trimmed;
};

export const resolveReasoningPairModel = (
  modelName: string,
  enabled: boolean,
  pairs: Map<string, string>
): string => {
  for (const [reasoningModel, nonReasoningModel] of pairs.entries()) {
    if (hasModelAlias(modelName, reasoningModel)) {
      return enabled
        ? modelName
        : replaceTrailingModelAlias(modelName, reasoningModel, nonReasoningModel);
    }

    if (hasModelAlias(modelName, nonReasoningModel)) {
      return enabled
        ? replaceTrailingModelAlias(modelName, nonReasoningModel, reasoningModel)
        : modelName;
    }
  }

  return modelName;
};
