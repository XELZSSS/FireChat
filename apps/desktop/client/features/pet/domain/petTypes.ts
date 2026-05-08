export type PetStyle = 'default' | 'pixel' | 'minimal';
export type PetSize = 'small' | 'medium' | 'large';
export type PetPosition = 'input-left' | 'input-right';
export type PetMotion = 'off' | 'subtle' | 'active';
export type PetSurface = 'welcome' | 'chat';

export type PetSettings = {
  enabled: boolean;
  style: PetStyle;
  size: PetSize;
  position: PetPosition;
  motion: PetMotion;
  reactions: boolean;
};

export type PetStatus =
  | 'idle'
  | 'typing'
  | 'waiting'
  | 'thinking'
  | 'responding'
  | 'error'
  | 'success'
  | 'sleeping';
