import type { PetMotion, PetPosition, PetSettings, PetSize, PetStyle } from './petTypes';

const PET_STYLES = new Set<PetStyle>(['default', 'pixel', 'minimal']);
const PET_SIZES = new Set<PetSize>(['small', 'medium', 'large']);
const PET_POSITIONS = new Set<PetPosition>(['input-left', 'input-right']);
const PET_MOTIONS = new Set<PetMotion>(['off', 'subtle', 'active']);

export const DEFAULT_PET_SETTINGS: PetSettings = {
  enabled: false,
  style: 'default',
  size: 'medium',
  position: 'input-left',
  motion: 'subtle',
  reactions: true,
};

const readStringOption = <T extends string>(value: unknown, options: Set<T>, current: T): T => {
  return typeof value === 'string' && options.has(value as T) ? (value as T) : current;
};

const normalizePetPosition = (value: unknown, current: PetPosition): PetPosition => {
  if (value === 'floating') {
    return 'input-right';
  }

  return readStringOption(value, PET_POSITIONS, current);
};

export const normalizePetSettings = (
  value: unknown,
  currentSettings: Partial<PetSettings> = DEFAULT_PET_SETTINGS
): PetSettings => {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const record = raw as Record<string, unknown>;
  const current = { ...DEFAULT_PET_SETTINGS, ...currentSettings };

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : current.enabled,
    style: readStringOption(record.style, PET_STYLES, current.style),
    size: readStringOption(record.size, PET_SIZES, current.size),
    position: normalizePetPosition(
      record.position,
      normalizePetPosition(current.position, DEFAULT_PET_SETTINGS.position)
    ),
    motion: readStringOption(record.motion, PET_MOTIONS, current.motion),
    reactions: typeof record.reactions === 'boolean' ? record.reactions : current.reactions,
  };
};

export const arePetSettingsEqual = (left: PetSettings, right: PetSettings): boolean =>
  left.enabled === right.enabled &&
  left.style === right.style &&
  left.size === right.size &&
  left.position === right.position &&
  left.motion === right.motion &&
  left.reactions === right.reactions;
