"use client";

import { AddressSearch } from '@/components/flow/AddressSearch';
import { AppDownloadPrompt } from '@/components/flow/AppDownloadPrompt';
import { Confirmation } from '@/components/flow/Confirmation';
import { ContactForm } from '@/components/flow/ContactForm';
import { ExistingContractExtrasIntro } from '@/components/flow/ExistingContractExtrasIntro';
import { ExtraOfferBixiaNara } from '@/components/flow/ExtraOfferBixiaNara';
import { ExtraOfferContactMe } from '@/components/flow/ExtraOfferContactMe';
import { ExtraOfferRealtimeMeter } from '@/components/flow/ExtraOfferRealtimeMeter';
import { FlowStop } from '@/components/flow/FlowStop';
import { Identification } from '@/components/flow/Identification';
import { MoveOffer } from '@/components/flow/MoveOffer';
import { PriceConflictResolver } from '@/components/flow/PriceConflictResolver';
import { ProductSelection } from '@/components/flow/ProductSelection';
import { SigningFlow } from '@/components/flow/SigningFlow';
import { StartDatePicker } from '@/components/flow/StartDatePicker';
import { TermsConsent } from '@/components/flow/TermsConsent';
import type {
  Address,
  ContactDraft,
  DateSelection,
  CompareProfileKwh,
  Elomrade,
  ExtraServicesSelection,
  FacilityHandling,
  HousingType,
  IdMethod,
  Invoice,
  PrivateCaseState,
  PrivateFlowStep,
  Product,
} from '@/types';
import type { ExtraOfferEligibility } from '@/flow/privateFlow';
import { DEMO_ORDER_ID } from '@/services/mockData';
import styles from './PrivateFlow.module.css';

type CompareProfileChange = {
  housingType?: HousingType | null;
  compareProfileKwh?: CompareProfileKwh | null;
  customConsumptionKwh?: number | null;
};

type PrivateFlowActions = {
  changeDateDraft: (value: DateSelection) => void;
  changeContactDraft: (value: ContactDraft) => void;
  cancelIdentification: () => void;
  selectProduct: (product: Product, region: Elomrade) => void;
  clarifyProduct: (product: Product) => void;
  changeCompareProfile: (profile: CompareProfileChange) => void;
  confirmAddress: (address: Address, apartmentDetails?: { number: string; co?: string }) => void;
  authenticate: (pnr: string, method: IdMethod) => Promise<void>;
  goBack: () => void;
  navigate: (step: PrivateFlowStep) => void;
  restart: () => void;
  startExtras: () => void;
  selectDate: (date: string, mode: 'EARLIEST' | 'SPECIFIC') => void;
  confirmContact: (contact: { email: string; phone: string; invoice: Invoice | null }) => void;
  moveExisting: () => void;
  addNewAddress: () => void;
  confirmTerms: (consents: {
    termsAccepted: boolean;
    riskAccepted: boolean;
    marketing: { email: boolean; sms: boolean };
    facilityHandling?: FacilityHandling;
  }) => void;
  signed: () => void;
  confirmationContinue: () => void;
  confirmBixiaNara: (value: { selected: boolean; county?: string }) => void;
  confirmRealtimeMeter: (selected: boolean) => void;
  appContinue: () => void;
  submitContactServices: (services: ExtraServicesSelection['contactMeServices']) => Promise<void>;
  extrasDone: () => void;
};

interface PrivateFlowStepsProps {
  state: PrivateCaseState;
  eligibility: ExtraOfferEligibility;
  requireBankIdVerification: boolean;
  hasFacilityFromCrm: boolean;
  recommendedInvoiceAddress: Address | null;
  suggestedCustomInvoiceAddress: Address | null;
  actions: PrivateFlowActions;
}

export const PrivateFlowSteps = ({
  state,
  eligibility,
  requireBankIdVerification,
  hasFacilityFromCrm,
  recommendedInvoiceAddress,
  suggestedCustomInvoiceAddress,
  actions,
}: PrivateFlowStepsProps) => {
  const {
    shouldOfferBixiaNara,
    shouldOfferRealtimeMeter,
    shouldOfferAnyDirectExtras,
    shouldOfferAnyContactExtras,
    contactServicesToOffer,
  } = eligibility;
  const canSelectExtraServices = shouldOfferAnyDirectExtras || shouldOfferAnyContactExtras;

  switch (state.currentStep) {
    case 'PRODUCT_SELECT':
      return (
        <div className={styles.startPageSections}>
          <ProductSelection
            title={state.entryOffer?.source === 'PARTNER' ? 'Ditt partnererbjudande' : state.entryOffer ? 'Ditt erbjudande' : 'Välj elavtal'}
            onProductSelect={actions.selectProduct}
            onBack={state.entryPoint === 'ADDRESS_FIRST' ? actions.goBack : undefined}
            initialRegion={state.elomrade || undefined}
            hideRegionSelector={state.entryPoint === 'ADDRESS_FIRST'}
            requireRegionSelection={state.entryPoint === 'PRODUCT_FIRST'}
            visibleProductIds={state.entryOffer ? [state.entryOffer.productId] : undefined}
            allowAdvisor={!state.entryOffer}
            notice={state.entryOffer?.source === 'PARTNER'
              ? 'Erbjudandet är förvalt via din partner.'
              : state.entryOffer
                ? 'Erbjudandet är förvalt från produktsidan.'
                : undefined}
            showGenericOptionSection={false}
            compareConfig={{
              housingType: state.housingType,
              compareProfileKwh: state.compareProfileKwh,
              customConsumptionKwh: state.customConsumptionKwh,
            }}
            onCompareConfigChange={actions.changeCompareProfile}
          />
        </div>
      );
    case 'PRODUCT_CLARIFY':
      return (
        <ProductSelection
          onProductSelect={actions.clarifyProduct}
          initialRegion={state.elomrade || undefined}
          hideRegionSelector
          notice="Välj avtalsform för adressen för att gå vidare."
          compareConfig={{
            housingType: state.housingType,
            compareProfileKwh: state.compareProfileKwh,
            customConsumptionKwh: state.customConsumptionKwh,
          }}
          onCompareConfigChange={actions.changeCompareProfile}
        />
      );
    case 'ADDRESS_SEARCH':
      return (
        <AddressSearch
          onConfirmAddress={actions.confirmAddress}
          onBack={state.entryPoint === 'PRODUCT_FIRST' ? actions.goBack : undefined}
          suggestedAddress={state.valdAdress || state.customer.folkbokforing}
        />
      );
    case 'IDENTIFY':
      return state.isPriceConflict ? (
        <PriceConflictResolver />
      ) : (
        <Identification
          onAuthenticated={actions.authenticate}
          onCancelRequest={actions.cancelIdentification}
          onBack={actions.goBack}
          bankIdOnly={requireBankIdVerification}
          securityMessage={requireBankIdVerification
            ? 'Du är redan kund hos oss. Verifiera dig med BankID för att fortsätta.'
            : undefined}
          backLabel={state.entryPoint === 'ADDRESS_FIRST' ? 'Tillbaka till avtal' : 'Tillbaka till adress'}
        />
      );
    case 'FLOW_STOP':
      return state.stop.reason ? (
        <FlowStop
          reason={state.stop.reason}
          onBack={() => actions.navigate('IDENTIFY')}
          onRestart={actions.restart}
        />
      ) : null;
    case 'EXISTING_CONTRACT_EXTRAS':
      return (
        <ExistingContractExtrasIntro
          productName={state.selectedProduct?.name}
          hasAnyExtrasToOffer={canSelectExtraServices}
          onContinue={actions.startExtras}
          onDone={() => actions.navigate('APP_DOWNLOAD')}
          onBack={actions.goBack}
        />
      );
    case 'DETAILS':
      if (state.detailsStep === 'DATE') {
        return (
          <StartDatePicker
            value={state.dateDraft ?? (state.startDate ? { date: state.startDate, mode: state.startDateMode } : null)}
            onChange={actions.changeDateDraft}
            onSelectDate={actions.selectDate}
            onBack={actions.goBack}
            address={state.valdAdress || undefined}
            isSwitching={state.scenario === 'BYTE'}
            moveChoice={state.moveChoice}
            productName={state.selectedProduct?.name}
            isExistingCustomer={state.customer.isExistingCustomer}
            bindingEndDate={state.customer.contractEndDate || undefined}
          />
        );
      }
      return (
        <ContactForm
          draft={state.contactDraft}
          onDraftChange={actions.changeContactDraft}
          initialData={state.customer}
          initialInvoice={state.invoice}
          recommendedInvoiceAddress={recommendedInvoiceAddress}
          suggestedCustomInvoiceAddress={suggestedCustomInvoiceAddress}
          onConfirm={actions.confirmContact}
          onBack={actions.goBack}
        />
      );
    case 'MOVE_OFFER':
      return state.customer.folkbokforing && state.valdAdress ? (
        <MoveOffer
          currentAddress={state.customer.folkbokforing}
          newAddress={state.valdAdress}
          selectedChoice={state.moveChoice}
          onMove={actions.moveExisting}
          onNew={actions.addNewAddress}
          onBack={actions.goBack}
        />
      ) : null;
    case 'TERMS':
      return (
        <TermsConsent
          onConfirm={actions.confirmTerms}
          onBack={actions.goBack}
          requiresFacilityId={!hasFacilityFromCrm}
          productType={state.selectedProduct?.type}
          initialRiskAccepted={state.riskInfoAccepted}
          initialTermsAccepted={state.termsAccepted}
          existingMarketingConsent={state.customer.marketingConsent}
          initialMarketingConsent={state.marketingConsent}
          initialFacilityHandling={state.facilityHandling}
        />
      );
    case 'SIGNING':
      return <SigningFlow onSigned={actions.signed} onCancel={actions.goBack} />;
    case 'CONFIRMATION':
      return (
        <Confirmation
          orderId={DEMO_ORDER_ID}
          product={state.selectedProduct || undefined}
          address={state.valdAdress || undefined}
          email={state.customer.email || undefined}
          invoice={state.invoice || undefined}
          facilityHandling={state.facilityHandling || undefined}
          canSelectExtraServices={canSelectExtraServices}
          onContinue={actions.confirmationContinue}
        />
      );
    case 'EXTRA_BIXIA_NARA':
      return shouldOfferBixiaNara ? (
        <ExtraOfferBixiaNara
          address={state.valdAdress || undefined}
          initialSelected={state.extraServicesSelection?.bixiaNara.selected ?? false}
          initialCounty={state.extraServicesSelection?.bixiaNara.county}
          onConfirm={actions.confirmBixiaNara}
          onBack={actions.goBack}
        />
      ) : null;
    case 'EXTRA_REALTIME_METER':
      return shouldOfferRealtimeMeter ? (
        <ExtraOfferRealtimeMeter
          initialSelected={state.extraServicesSelection?.realtimeMeter.selected ?? false}
          onConfirm={actions.confirmRealtimeMeter}
          onBack={actions.goBack}
        />
      ) : null;
    case 'APP_DOWNLOAD':
      return (
        <AppDownloadPrompt
          selection={state.extraServicesSelection}
          hasFinalExtrasStep={shouldOfferAnyContactExtras}
          onContinue={actions.appContinue}
          onBack={actions.goBack}
        />
      );
    case 'EXTRA_CONTACT':
      return shouldOfferAnyContactExtras ? (
        <ExtraOfferContactMe
          initialSelection={state.extraServicesSelection}
          availableServiceIds={contactServicesToOffer}
          phone={state.customer.phone || undefined}
          onSubmit={actions.submitContactServices}
          onDone={actions.extrasDone}
          onBack={actions.goBack}
        />
      ) : null;
    default:
      return null;
  }
};
