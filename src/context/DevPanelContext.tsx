'use client';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { apiLogEmitter, type ApiLogEntry } from '@/services/apiClient';
import type { FlowPhase } from '@/types/dev';
export type { ApiLogEntry } from '@/services/apiClient';
export type {
  FlowPhase,
  MockAddressResult,
  MockEntryPreset,
  MockExistingExtrasType,
  MockMarketingConsentType,
  MockScenarioType,
} from '@/types/dev';
const initial = {
  isOpen: false,
  apiLogs: [] as ApiLogEntry[],
  currentPhase: 'PRODUCT_SELECT' as FlowPhase,
};
const noop = () => {};
const DevPanelContext = createContext({
  state: initial,
  togglePanel: noop,
  clearLogs: noop,
  setCurrentPhase: noop as (phase: FlowPhase) => void,
});
export const useDevPanel = () => useContext(DevPanelContext);
export function DevPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  useEffect(
    () =>
      apiLogEmitter.subscribe((entry) =>
        setState((prev) => ({
          ...prev,
          apiLogs: [entry, ...prev.apiLogs].slice(0, 50),
        })),
      ),
    [],
  );
  const togglePanel = useCallback(
    () => setState((prev) => ({ ...prev, isOpen: !prev.isOpen })),
    [],
  );
  const clearLogs = useCallback(
    () => setState((prev) => ({ ...prev, apiLogs: [] })),
    [],
  );
  const setCurrentPhase = useCallback(
    (phase: FlowPhase) =>
      setState((prev) =>
        prev.currentPhase === phase ? prev : { ...prev, currentPhase: phase },
      ),
    [],
  );
  return (
    <DevPanelContext.Provider
      value={{ state, togglePanel, clearLogs, setCurrentPhase }}
    >
      {children}
    </DevPanelContext.Provider>
  );
}
