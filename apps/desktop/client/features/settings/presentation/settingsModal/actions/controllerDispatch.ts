import { useCallback, type Dispatch } from 'react';
import {
  SettingsModalAction,
  SettingsModalState,
} from '@client/features/settings/presentation/settingsModal/state/reducer';

const PATCH_ACTION_BY_SECTION = {
  provider: 'patch_provider',
  app: 'patch_app',
  ui: 'patch_ui',
} as const satisfies Record<'provider' | 'app' | 'ui', SettingsModalAction['type']>;

type PatchableStateSection = keyof typeof PATCH_ACTION_BY_SECTION;

export const useSettingsSectionDispatchers = (dispatch: Dispatch<SettingsModalAction>) => {
  const patchStateSection = useCallback(
    <Section extends PatchableStateSection>(
      section: Section,
      payload: Partial<SettingsModalState[Section]>
    ) => {
      dispatch({
        type: PATCH_ACTION_BY_SECTION[section],
        payload,
      } as SettingsModalAction);
    },
    [dispatch]
  );

  const setStateSectionField = useCallback(
    <Section extends PatchableStateSection, Field extends keyof SettingsModalState[Section]>(
      section: Section,
      key: Field,
      value: SettingsModalState[Section][Field]
    ) => {
      patchStateSection(section, {
        [key]: value,
      } as unknown as Partial<SettingsModalState[Section]>);
    },
    [patchStateSection]
  );

  const setProviderField = useCallback(
    <K extends keyof SettingsModalState['provider']>(
      key: K,
      value: SettingsModalState['provider'][K]
    ) => {
      setStateSectionField('provider', key, value);
    },
    [setStateSectionField]
  );

  const setAppField = useCallback(
    <K extends keyof SettingsModalState['app']>(key: K, value: SettingsModalState['app'][K]) => {
      setStateSectionField('app', key, value);
    },
    [setStateSectionField]
  );

  const setUiField = useCallback(
    <K extends keyof SettingsModalState['ui']>(key: K, value: SettingsModalState['ui'][K]) => {
      setStateSectionField('ui', key, value);
    },
    [setStateSectionField]
  );

  return {
    patchStateSection,
    setStateSectionField,
    setProviderField,
    setAppField,
    setUiField,
  };
};
