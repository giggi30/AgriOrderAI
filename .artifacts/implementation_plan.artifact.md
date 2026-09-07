# Implementazione Fase 3: Gamification Loyalty, Profile Page & Catalogo Premi

Questo piano descrive i passaggi per implementare la Fase 3 del progetto AgriOrderAI, focalizzandosi sulla gamification, la fidelizzazione del cliente e il catalogo premi B2B.

## User Review Required

> [!IMPORTANT]
> L'implementazione prevede l'aggiunta di nuovi componenti UI e la gestione di uno stato di "punti loyalty" persistente. I livelli di fedeltà sono calcolati dinamicamente in base ai punti accumulati.

## Proposed Changes

### [Componente Dashboard]

#### [MODIFY] [AgriOrderDashboard.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/components/AgriOrderDashboard.tsx)
- Aggiunta stato `loyaltyPoints` e persistenza in `localStorage`.
- Aggiunta stati per i modali: `isProfileOpen`, `isRewardsOpen`.
- Implementazione componenti interni:
    - `LoyaltyProgressBar`: Visualizza l'avanzamento punti nel carrello.
    - `ProfileModal`: Pagina profilo con Fidelity Card dinamica, livelli e badge.
    - `RewardsModal`: Catalogo premi riscattabili.
- Integrazione logica AI per suggerimento premi in chat.
- Aggiornamento header per triggerare l'apertura del profilo.

## Verification Plan

### Automated Tests
- Non applicabili in questa fase (simulazione UI).

### Manual Verification
1. **Verifica Punti**: Aggiungere prodotti al carrello e verificare che la `LoyaltyProgressBar` mostri l'incremento potenziale dei punti (1€ = 1 punto).
2. **Apertura Profilo**: Cliccare sul badge cliente nell'header e verificare l'apertura della Fidelity Card con il livello corretto (Bronzo/Argento/Oro/Platinum).
3. **Catalogo Premi**: Aprire il catalogo premi, verificare la visualizzazione dei premi e l'abilitazione dei tasti "Riscatta" in base ai punti.
4. **AI Suggestion**: Simulare un ordine che raggiunge una soglia premi e verificare se l'AI suggerisce il premio in chat (opzionale, basato su trigger UI).
