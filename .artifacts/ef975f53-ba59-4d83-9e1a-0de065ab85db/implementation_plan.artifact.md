# Implementazione Privacy Policy e Rebranding in "Ortuso"

Questo piano prevede il rebranding dell'applicazione AgriOrder, sostituendo il nome "Tenuta Valle Verde" con "Ortuso", e l'aggiunta di una sezione dedicata alla Privacy Policy ispirata al sito di riferimento.

## User Review Required

> [!IMPORTANT]
> Il nome dell'azienda è stato cambiato da **Tenuta Valle Verde** a **Ortuso**. Tutti i testi dell'interfaccia e le istruzioni dell'AI saranno aggiornati di conseguenza.

> [!NOTE]
> La Privacy Policy è stata redatta basandosi sulle informazioni estratte dal sito `ortuso.com`, adattandole al contesto dell'applicazione AgriOrder.

## Proposed Changes

### Rebranding (Sostituzione Nome)

#### [MODIFY] [AgriOrderDashboard.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/components/AgriOrderDashboard.tsx)
- Sostituzione di "Tenuta Valle Verde" con "Ortuso" nell'header, nel footer del PDF e nei messaggi AI.

#### [MODIFY] [AgriOrderWidget.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/components/AgriOrderWidget.tsx)
- Aggiornamento del messaggio di benvenuto dell'AI.

#### [MODIFY] [agriOrderService.ts](file:///Users/luigiragni/Desktop/AgriOrderAI/src/lib/agriOrderService.ts)
- Aggiornamento delle `SYSTEM_INSTRUCTION` per il modello Gemini.

#### [MODIFY] [Documentazione](file:///Users/luigiragni/Desktop/AgriOrderAI/Piano%20di%20Sviluppo%20AgriOrder%20AI%20-%20Gemini%20Integration.md)
- Aggiornamento dei file MD di specifica e piano di sviluppo.

---

### Nuova Sezione Privacy Policy

#### [NEW] [page.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/app/privacy/page.tsx)
- Creazione della pagina della Privacy Policy con lo stile del sito (Dark Mode coerente con AgriOrder).

#### [MODIFY] [AgriOrderDashboard.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/components/AgriOrderDashboard.tsx)
- Aggiunta di un link alla Privacy Policy nel footer del PDF e/o nella dashboard.

## Verification Plan

### Manual Verification
- Verificare che tutti i riferimenti a "Tenuta Valle Verde" siano spariti e sostituiti da "Ortuso".
- Navigare su `/privacy` per visualizzare la nuova informativa.
- Verificare che il link nella dashboard funzioni correttamente.
