"use client";

import { Suspense } from 'react';
import { PrivateFlow } from "@/components/flows/PrivateFlow";
import { CompanyFlow } from "@/components/flows/CompanyFlow";
import { useFlowState } from '@/hooks/useFlowState';
import { useDevPanel } from '@/context/DevPanelContext';
import styles from "./page.module.css";

const FlowOrchestrator = () => {
  const { state, setCustomerType, isInitialized } = useFlowState();
  const { state: devState } = useDevPanel();

  if (!isInitialized) return null;

  const isCompany = state.customerType === 'COMPANY';

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

      <Suspense fallback={<div>Laddar...</div>}>
        {!isCompany ? <PrivateFlow /> : <CompanyFlow />}
      </Suspense>
    </main>
  );
};

export default function Home() {
  return <FlowOrchestrator />;
}
