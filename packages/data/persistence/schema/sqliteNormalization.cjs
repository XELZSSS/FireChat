const normalizeRequiredString = (value, label) => {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
};

const normalizeOptionalString = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeNumber = (value, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return Math.trunc(value);
};

const normalizeLimit = (value, defaultValue = 200, maxValue = 500) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.max(1, Math.min(maxValue, Math.trunc(value)));
};

const normalizeOptionalLimit = (value, maxValue = 5000) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(1, Math.min(maxValue, Math.trunc(value)));
};

const parseJson = (value, emptyValue) => {
  if (typeof value !== 'string' || !value) {
    return emptyValue;
  }

  return JSON.parse(value);
};

module.exports = {
  normalizeLimit,
  normalizeNumber,
  normalizeOptionalLimit,
  normalizeOptionalString,
  normalizeRequiredString,
  parseJson,
};
