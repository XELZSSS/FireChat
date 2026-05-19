import type { PetStatus } from '../domain/petTypes';

export type PetExpression = {
  eyes: {
    left: string;
    right: string;
  };
  brows?: {
    left: string;
    right: string;
  };
  mouth: {
    d: string;
    fill?: boolean;
  };
  thought?: boolean;
  cheek?: boolean;
};

export const PET_EXPRESSIONS: Record<PetStatus, PetExpression> = {
  idle: {
    eyes: {
      left: 'M20 25H24V31H20V25Z',
      right: 'M32 25H36V31H32V25Z',
    },
    mouth: { d: 'M24 35H32' },
  },
  typing: {
    eyes: {
      left: 'M19 23H25V30H19V23Z',
      right: 'M31 23H37V30H31V23Z',
    },
    brows: {
      left: 'M19 19L25 18',
      right: 'M31 18L37 19',
    },
    mouth: { d: 'M23 34Q28 39 33 34' },
    cheek: true,
  },
  waiting: {
    eyes: {
      left: 'M18 28L25 30L24 32L17 30Z',
      right: 'M31 30L38 28L39 30L32 32Z',
    },
    brows: {
      left: 'M19 21L25 23',
      right: 'M31 23L37 21',
    },
    mouth: { d: 'M25 36H31' },
  },
  thinking: {
    eyes: {
      left: 'M20 25H25V30H20V25Z',
      right: 'M31 27H38V30H31V27Z',
    },
    brows: {
      left: 'M19 21L25 19',
      right: 'M31 21L37 22',
    },
    mouth: { d: 'M25 35Q28 32 31 35' },
    thought: true,
  },
  responding: {
    eyes: {
      left: 'M22 21L26 26L22 31L18 26Z',
      right: 'M34 21L38 26L34 31L30 26Z',
    },
    brows: {
      left: 'M19 19L25 21',
      right: 'M31 21L37 19',
    },
    mouth: { d: 'M24.5 33A3.5 3.5 0 1 0 31.5 33A3.5 3.5 0 1 0 24.5 33', fill: true },
  },
  error: {
    eyes: {
      left: 'M18 25L20 23L23 26L26 23L28 25L25 28L28 31L26 33L23 30L20 33L18 31L21 28Z',
      right: 'M30 25L32 23L35 26L38 23L40 25L37 28L40 31L38 33L35 30L32 33L30 31L33 28Z',
    },
    brows: {
      left: 'M19 20L25 23',
      right: 'M31 23L37 20',
    },
    mouth: { d: 'M24 36Q28 32 32 36' },
  },
  success: {
    eyes: {
      left: 'M18 25L21 29L25 24L27 26L21 33L16 27Z',
      right: 'M31 25L34 29L38 24L40 26L34 33L29 27Z',
    },
    brows: {
      left: 'M19 20L25 19',
      right: 'M31 19L37 20',
    },
    mouth: { d: 'M23 34Q28 40 33 34' },
    cheek: true,
  },
  sleeping: {
    eyes: {
      left: 'M18 28H25V30H18V28Z',
      right: 'M31 28H38V30H31V28Z',
    },
    mouth: { d: 'M25 35H31' },
    thought: true,
  },
};
