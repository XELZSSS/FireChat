import { memo } from 'react';
import type { PetSettings, PetStatus } from '../domain/petTypes';
import { PET_EXPRESSIONS } from './petExpressions';

type PetRendererProps = {
  status: PetStatus;
  settings: PetSettings;
};

const BODY_PATH_BY_STYLE: Record<PetSettings['style'], string> = {
  default: 'M9 19L17 8L25 19H31L39 8L47 19V42H9V19Z',
  pixel: 'M8 20H14V14H20V20H36V14H42V20H48V42H8V20Z',
  minimal:
    'M10 22C10 14 16 10 28 10C40 10 46 14 46 22V39C46 42 43 44 40 44H16C13 44 10 42 10 39V22Z',
};

const PetRenderer = memo(function PetRenderer({ status, settings }: PetRendererProps) {
  const expression = PET_EXPRESSIONS[status];

  return (
    <svg className="chat-pet-svg" viewBox="0 0 56 48" aria-hidden="true">
      <path className="chat-pet-body" d={BODY_PATH_BY_STYLE[settings.style]} />
      {expression.brows ? (
        <g className="chat-pet-strokes">
          <path d={expression.brows.left} />
          <path d={expression.brows.right} />
        </g>
      ) : null}
      <g className="chat-pet-marks">
        <path d={expression.eyes.left} />
        <path d={expression.eyes.right} />
      </g>
      <path
        className={expression.mouth.fill ? 'chat-pet-mouth-fill' : 'chat-pet-stroke'}
        d={expression.mouth.d}
      />
      {expression.cheek ? (
        <g className="chat-pet-cheeks">
          <rect x="14.5" y="31" width="4" height="2" />
          <rect x="38" y="31" width="4" height="2" />
        </g>
      ) : null}
      {expression.thought ? (
        <g className="chat-pet-thought">
          <rect x="47" y="12" width="3" height="3" />
          <rect x="51" y="8" width="3.5" height="3.5" />
          <rect x="47.5" y="4" width="2.5" height="2.5" />
        </g>
      ) : null}
    </svg>
  );
});

export default PetRenderer;
