import { memo } from 'react';
import { t } from '@/shared/utils/i18n';
import type { PetSettings, PetStatus } from '../domain/petTypes';
import PetRenderer from './PetRenderer';

type ChatPetProps = {
  status: PetStatus;
  settings: PetSettings;
};

const ChatPet = memo(function ChatPet({ status, settings }: ChatPetProps) {
  return (
    <div
      className="chat-pet"
      data-state={status}
      data-size={settings.size}
      data-motion={settings.motion}
      data-position={settings.position}
      data-style={settings.style}
      aria-label={t('chatPet.label')}
    >
      <PetRenderer status={status} settings={settings} />
    </div>
  );
});

export default ChatPet;
