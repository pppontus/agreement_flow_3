"use client";

import { Suspense, useState } from 'react';
import { PrivateFlow } from "@/components/flows/PrivateFlow";
import { CompanyFlow, CompanyStep } from "@/components/flows/CompanyFlow";
import { useFlowState } from '@/context/FlowStateContext';
import { useDevPanel } from '@/context/DevPanelContext';
import styles from "./page.module.css";

const FlowOrchestratorContent = () => {
  const { state, setCustomerType, isInitialized, storageUnavailable } = useFlowState();
  const { state: devState } = useDevPanel();
  const [companyStep, setCompanyStep] = useState<CompanyStep>('PRODUCT_SELECT');

  if (!isInitialized) return null;

  const isCompany = state.customerType === 'COMPANY';
  const showCustomerSwitch = isCompany
    ? companyStep === 'PRODUCT_SELECT'
    : state.customerType === 'PRIVATE' && state.currentStep === (state.entryPoint === 'ADDRESS_FIRST'
      ? 'ADDRESS_SEARCH'
      : 'PRODUCT_SELECT');

  // Dynamic theme colors
  const bgColor = isCompany ? '#f0f4f8' : 'var(--color-bg)';
  
  return (
    <main 
      className={styles.page}
      style={{ 
        marginRight: devState.isOpen ? '380px' : '0', 
        transition: 'all 0.3s ease',
        backgroundColor: bgColor
      }}
    >
      {storageUnavailable && <p role="status">Uppgifterna kan inte sparas i den här fliken. Om du laddar om behöver du börja om.</p>}
      {showCustomerSwitch && (
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${!isCompany ? styles.activeTab : ''}`}
            onClick={() => setCustomerType('PRIVATE')}
          >
            Privat
          </button>
          <button 
            className={`${styles.tab} ${isCompany ? styles.activeTab : ''}`}
            onClick={() => setCustomerType('COMPANY')}
          >
            Företag
          </button>
        </div>
      )}

      <Suspense fallback={<div>Laddar...</div>}>
        {!isCompany ? <PrivateFlow key={state.customerType === 'PRIVATE' ? state.caseId || 'private-initial' : 'private'} /> : <CompanyFlow onStepChange={setCompanyStep} />}
      </Suspense>
    </main>
  );
};

const FlowOrchestrator = () => {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <FlowOrchestratorContent />
    </Suspense>
  );
};

export default function Home() {
  return <FlowOrchestrator />;
}
