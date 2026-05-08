import { memo } from 'react';
import { normalizePetSettings } from '../domain/petDefaults';
import type { PetSettings, PetStatus } from '../domain/petTypes';
import ChatPet from './ChatPet';

type PetPreviewProps = {
  settings: PetSettings;
};

const PREVIEW_STATUSES: PetStatus[] = [
  'idle',
  'typing',
  'waiting',
  'thinking',
  'responding',
  'success',
  'error',
];

const PetPreview = memo(function PetPreview({ settings }: PetPreviewProps) {
  const previewSettings = normalizePetSettings({
    ...settings,
    enabled: true,
    size: 'small',
  });

  return (
    <div className="pet-preview" aria-hidden="true">
      {PREVIEW_STATUSES.map((status) => (
        <ChatPet key={status} status={status} settings={previewSettings} />
      ))}
    </div>
  );
});

export default PetPreview;
