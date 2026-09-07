'use client';

import { useEffect, useRef } from 'react';
import type {
  PrivateCaseState,
  PrivateDetailsStep,
  PrivateFlowStep,
} from '@/types';
import { isPrivateFlowStep } from '@/state/flowState';
import { resolvePrivateNavigation } from '@/flow/privateFlow';

/** Native history avoids a second asynchronous router update racing the reducer. */
export function usePrivateNavigation(
  state: PrivateCaseState,
  navigate: (step: PrivateFlowStep, detailsStep?: PrivateDetailsStep) => void,
) {
  const initialized = useRef(false);
  const replaceNext = useRef(true);
  const waitingFor = useRef<string | null>(null);
  const current = useRef(state);
  useEffect(() => {
    current.current = state;
  }, [state]);

  useEffect(() => {
    const readHistory = () => {
      const saved = current.current;
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('step');
      const requested =
        raw === 'RISK_INFO'
          ? 'TERMS'
          : isPrivateFlowStep(raw)
            ? raw
            : raw
              ? saved.entryPoint === 'ADDRESS_FIRST'
                ? 'ADDRESS_SEARCH'
                : 'PRODUCT_SELECT'
              : saved.currentStep;
      const detail = params.get('details');
      const target = resolvePrivateNavigation(
        saved,
        requested,
        detail === 'DATE' || detail === 'CONTACT' ? detail : saved.detailsStep,
      );
      replaceNext.current = true;
      waitingFor.current = `${target.step}:${target.detailsStep}`;
      navigate(target.step, target.detailsStep);
      // Also repair URLs whose corrected target is already the current state.
      params.set('step', target.step);
      if (target.step === 'DETAILS') params.set('details', target.detailsStep);
      else params.delete('details');
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${params}`,
      );
    };
    if (!initialized.current) {
      initialized.current = true;
      readHistory();
    }
    window.addEventListener('popstate', readHistory);
    return () => window.removeEventListener('popstate', readHistory);
  }, [navigate]);

  useEffect(() => {
    if (
      waitingFor.current &&
      waitingFor.current !== `${state.currentStep}:${state.detailsStep}`
    )
      return;
    waitingFor.current = null;
    const target = resolvePrivateNavigation(state, state.currentStep);
    if (
      target.step !== state.currentStep ||
      target.detailsStep !== state.detailsStep
    ) {
      replaceNext.current = true;
      navigate(target.step, target.detailsStep);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('step', state.currentStep);
    if (state.currentStep === 'DETAILS')
      params.set('details', state.detailsStep);
    else params.delete('details');
    const url = `${window.location.pathname}?${params}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      if (replaceNext.current) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    replaceNext.current = false;
  }, [navigate, state]);
}
