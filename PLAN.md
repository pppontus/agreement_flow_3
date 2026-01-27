# Avtalsflöde Bixia – Implementation Plan

## 0. Project Overview
This document outlines the plan to build the "Avtalsflöde" (Agreement Flow) prototype.
**Goal:** A high-fidelity prototype using Bixia's designs details, powered by a Mock Backend (MSW).

### UX Principle
**"One Question Per Screen"**: The flow will strictly follow a wizard/stepper pattern. No long scrolling forms. One distinct task per view to reduce cognitive load.

## 1. Technical Architecture

### Core Stack
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS (with Bixia color palette).
- **State Management**: React Context + Reducers (to handle the complex `Case` state).
- **Mocking**: MSW (Mock Service Worker) for client-side API interception.

### Application Structure
```
/src
  /app
    /(flow)           # The wizard flow
      /identification
      /address
      /product
      /summary
    /debug            # Debug panel components
  /components
    /ui               # Design system atoms (Buttons, Inputs)
    /wizard           # Wizard layout components
  /lib
    /state            # Context & Reducers
    /msw              # Mock definitions
    /types            # TypeScript definitions
```

## 2. Data Modeling

### The "Case" Object
This is the single source of truth for the session.

```typescript
type CaseState = {
  // Context from landing
  visatOmrade: string; // e.g. "SE3"
  visatPris: number;
  
  // User Data
  personnummer: string | null;
  scenario: 'UNKNOWN' | 'BYTE' | 'FLYTT' | 'EXTRA';
  
  // Address Slots
  folkbokforing: Address | null;
  valdAdress: Address | null;
  
  // Status Flags
  isPriceConflict: boolean; // True if SE3 != ValdAdress.SE4
  isExistingCustomer: boolean;
  contractStatus: 'NONE' | 'RÖRLIGT' | 'BUNDET';
}
```

## 3. Mock Strategy (MSW)

We will simulate the backend to allow full "happy path" and "error path" testing without a real server.

### Mock Handler: `/api/identify`
- **Input**: Personnummer.
- **Logic**: Checks against a predefined list of "Personas".
- **Returns**: Name, Address, Existing Customer Status.

### Mock Handler: `/api/address`
- **Input**: Search query.
- **Returns**: Fake address list (Spar data).

### Mock Handler: `/api/price`
- **Input**: Elområde (e.g. "SE3").
- **Returns**: Spot price (e.g. 85.50).
- **Usage**: Used for landing page snapshot AND for fetching correct price if user switches area (Price Conflict).

### Test Personas (The "Facit")
As defined in requirements:
1.  **Anna (19900101-1234)**: Happy Path. Matches everything.
2.  **Bertil (19850505-5555)**: Bound Contract. Triggers warning.
3.  **Cecilia (19990909-9999)**: Mover. Moves from SE1 to SE4. Triggers Price Conflict.

## 4. Implementation Steps

### Phase 1: Setup & Infrastructure
1.  **Init Project**: Create Next.js app, setup Tailwind.
2.  **MSW Implementation**: Install MSW, setup browser worker, create basic handlers.
3.  **Debug Panel**: Build a floating panel that shows current `CaseState` and allows resetting.

### Phase 2: Core Components
1.  **Design System**: Reusable buttons (Primary/Secondary), Input fields, Cards.
2.  **Wizard Wrapper**: A layout handling the "Step X of Y" and Back-navigation.

### Phase 3: The Logic Flow
1.  **Landing Page**: Logic to "guess" SE-area and set initial Context.
2.  **Step 1: ID**: Input PNR -> Call Mock API -> Update State.
3.  **Step 2: Address**:
    - Display fetched address.
    - Implement "Search new address" (Shift to 'FLYTT' scenario).
    - **Logic Check**: Compare Landing-Area vs Selected-Address-Area. If mismatch -> Show Modal.
4.  **Step 3: Product**: Date selection logic (Today vs +14 days).
5.  **Step 4: Contact**:
    - **Existing Customer**: Show prefilled Email/Phone (Read-only or Editable).
    - **New Customer**: Input fields for Email/Phone.
6.  **Step 5: Sign**: Summary and Success state.

## 5. Next Steps
Once verified, run the following command to start development:
> *"Bygg en interaktiv prototyp i React/Next.js baserat på bifogat Markdown-underlag..."*
