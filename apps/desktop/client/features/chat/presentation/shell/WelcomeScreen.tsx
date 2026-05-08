import { memo } from 'react';
import type { ReactNode } from 'react';

const CONTAINER_CLASS =
  'flex min-h-full flex-1 flex-col items-center justify-center px-4 pb-24 pt-12';
const INPUT_WRAPPER_CLASS = 'welcome-input-shell flex w-full items-start justify-center';

interface WelcomeScreenProps {
  input: ReactNode;
  pet?: ReactNode;
}

const WelcomeScreen = memo(function WelcomeScreen({ input, pet }: WelcomeScreenProps) {
  return (
    <div className={CONTAINER_CLASS}>
      {pet ? <div className="welcome-pet-shell">{pet}</div> : null}
      <div className={INPUT_WRAPPER_CLASS}>{input}</div>
    </div>
  );
});

export default WelcomeScreen;
