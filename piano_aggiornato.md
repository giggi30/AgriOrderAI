# Piano d'Azione Sprint: Demo Ortuso "WOW Edition"

**Obiettivo:** Trasformare la demo attuale di AgriOrderAI in una simulazione ad alto impatto specifica per il Frantoio Ortuso, integrando un flusso d'acquisto ultra-veloce, un sistema loyalty completo con catalogo premi e la gestione del venditore/distributore assegnato.

---

### **Fase 1: Rebranding, Profilo Cliente & Routing Venditore (2,5 ore)**

* **UI Header & Profilo Assegnato:** Sostituire "Tenuta Valle Verde" con **Frantoio Ortuso**. Inserire nell'interfaccia un badge cliente visibile:
  * *Cliente:* Ristorante Il Ponte
  * *Venditore/Fornitore Assegnato:* **Olio Italia s.r.l. (Agente: Mario Rossi)**
* **Mock Data Catalogo Ortuso:** Aggiornare il catalogo prodotti con articoli reali incluse le foto:
  * * Latta Olio EVO Biologico 5L* (€ 45,00) [public/images/olio.png]
  * * Olio d’Oliva Vetro 1 LT (90,00€ / 7.50€ x 12 (cartone)) [public/images/olio-di-oliva-vetro-1lt.jpg]
  * * Olio di Semi di Girasole Pet 1 LT* (26,40€ / 2,20€ x 12 (cartone)) [public/images/olio-di-semi-di-girasole-pet-1lt.jpg]
  * * Olio di Semi di Girasole Pet 5 LT* (22,00€ / 11,00€ x 2 (cartone)) [public/images/olio-di-semi-di-girasole-pet-5lt.jpg]
  * * Aceto Balsamico di Modena IGP 6 stelle Vetro 250 ml (€6,17) [public/images/aceto-balsamico-250ml-6-stelle.jpg]
  * * Aceto Balsamico di Modena IGP 4 stelle Vetro 500 ml (€6,17) [public/images/aceto-balsamico-500ml-4-stelle.jpg]
  * * Passata di Pomodoro 100% Italiano 750 ml (33,60€ / 2,80€ x 12 (cartone)) [public/images/passata-di-pomodoro-100_-pomodoro-italiano-ml.-750.jpg]
  * * Pomodori Datterini 100% Italiano 500 ml (28,80€ / 1,20€ x 24 (cartone)) [public/images/pomodori-datterini-100_-pomodoro-italiano-ml.-500.jpg]
  * Olio al Tartufo Bianco 250 ml (10,77€) [public/images/olio-tartufo-250-ml_bottiglia.jpg]
  * * Salsa Tartufata 500g (15,73€) [public/images/salsa-tartufata-barattolo-grande.jpg]
  * * Box Degustazione Ristorazione (6 Bottiglie)* (€ 65,00) [public/images/box-degustazione-ristorazione.png]

---

### **Fase 2: UX Checkout "Express" & Riordino Istantaneo (2,5 ore)**

* **Acquisto Snello in 1-Click:** Eliminare ogni modulo o passaggio superfluo tipico dei B2C. L'ordine B2B non monetizzato richiede solo la conferma delle quantità.
* **Tasto Rapido "Ordine Ricorrente":**

  * **Logica di tracciamento**: Il sistema analizza lo storico ordini dell'utente. Se la medesima combinazione di prodotti viene ordinata per almeno 2 volte dallo stesso account, questi prodotti vengono contrassegnati come "Ordine Ricorrente".

  * **UI Component**: Sostituire il pulsante generico "Ordine Veloce" con il tasto rapido "Ordina il solito" (o "Il tuo Ordine Ricorrente").

  * **Comportamento al click**: Il tasto invia un prompt all'AI che recupera dal database il paniere di prodotti del pattern ricorrente, li inserisce automaticamente nel carrello e risponde in chat: "Ho caricato i prodotti del tuo ordine abituale [Elenco prodotti]. Vuoi confermare?".

  * **Fallback**: Se l'utente non ha ancora uno storico di ordini ripetuti (meno di 2 ordini uguali), il tasto rimane visibile come "Ultimo Ordine" oppure carica l'ultimo ordine effettuato in assoluto.
* **Flusso Chat-to-Cart-to-Order:**
  * L'utente scrive o clicca *"Ordina le solite 5 latte EVO"*.
  * L'AI popola il carrello e mostra un unico pulsante verde ad alto contrasto: **"Conferma & Invia Ordine Express"**.
  * Un solo tap genera l'ordine e invia la notifica al venditore, riducendo il tempo di acquisto a meno di 5 secondi.

---

### **Fase 3: Gamification Loyalty, Profile Page & Catalogo Premi (4,5 ore)**

* **Profilo Cliente & Fidelity Card Dinamica:**
  * **Trigger:** Click sul badge del profilo ristorante nell'header (es. *"Ristorante Il Ponte"*).
  * **Modale/Pagina Account:** Apertura di una finestra dedicata contenente i dati anagrafici del profilo e il venditore assegnato (**Olio Italia s.r.l.**).
  * **Fidelity Card Grafica:** Una tessera virtuale colorata con design premium che mostra il livello attuale del cliente (*Bronzo / Argento / Oro / Platinum*) basato sui punti totali accumulati.
  * **Elementi Gamification:** Badge sbloccabili (es. *"Cliente Storico"*, *"Top Ordini EVO"*) e progress bar verso il livello successivo per incentivare la fidelizzazione personale.
* **Barra Punti Dinamica (`LoyaltyProgressBar`):** Posizionare sopra il totale del carrello l'avanzamento punti accumulati con l'ordine in corso:
  * *Calcolo:* 1€ speso = 1 Punto accumulato.
* **Pulsante & Modale "Catalogo Premi B2B":** Aggiungere un bottone affiancato alla barra punti per aprire il Catalogo Premi riscattabili:
  * *500 Punti:* Kit Assaggio Olii Aromatizzati (Omaggio)
  * *1000 Punti:* Dispenser in Acciaio Inox da Banco
  * *2000 Punti:* Buono Sconto 100€ sul prossimo riordino
* **Integrazione AI Premi:** L'assistente AI suggerisce in chat: *"Con questo ordine accumuli 225 punti e raggiungi quota 500! Vuoi aggiungere subito il 'Kit Assaggio Olii' in omaggio al carrello?"*

* **Modulo Sconto B2B Loyalty Dinamico:**
  * **Calcolo Automatico:** Applicazione percentuale sull'imponibile lordo in base al Tier dell'utente (Bronzo 0%, Argento 3%, Oro 5%, Platinum 10%).
  * **Rendering Documentale:** Aggiornamento dinamico della voce "Sconto B2B Loyalty" nella modale e nel PDF del documento di vendita, con ricalcolo in tempo reale di Imponibile Netto, IVA e Totale Ordine.
  * **Integrazione AI:** L'assistente segnala in chat l'avvenuto risparmio legato alla fedeltà del cliente.
---

### **Fase 4: Smistamento Ordine & Generazione PDF Venditore (COMPLETATA) ✅**

* **Routing Automatico dell'Ordine:** All'invio dell'ordine, il sistema smista la richiesta direttamente al venditore/distributore che gestisce quel determinato cliente.
* **Generazione PDF con Intestazione Personalizzata:** Il tasto **"Genera Ordine PDF"** produce un documento di riepilogo con layout ufficiale:
  * **Intestazione:** *Frantoio Ortuso - Ordine B2B #2026-89*
  * **Box Presa in Carico:** *"Ordine preso in carico da: Olio Italia s.r.l. - Rif. Agente M. Rossi"*
    * **NOTA BENE**: per ogni categoria di prodotto abbiamo un fornitore specifico, quindi se l'ordine prevede prodotti di tipo: pomodori e olio, allora i fornitori mostrati nel pdf saranno "Olearia Ortuso Srl", "RossoVerace Conservi S.p.A.".
  * **lista fornitori per categoria**:
    * **Olio:** *Olearica Valle D'Oro S.r.l.*
    * **Aceti:** *Acetai Modena & Tradizione S.r.l.*
    * **Pomodori:** *RossoVerace Conservi S.p.A.*
    * **Tartufo:** *Tuber & Co. Selezione Tartufo S.r.l.*
    * **Specialità:** *GustoItaliano Delizie S.r.l.*
  * **Dettaglio:** Elenco prodotti, Totale Punti Loyalty Guadagnati e Premi Riscattati (Stile scontrino supermercato).

---

### **Fase 5: Script di Presentazione per Ortuso (Golden Path - 2 ore)**

1. **Apertura:** Mostrare l'app già brandizzata Ortuso ed evidenziare come il cliente veda subito il suo agente di riferimento (**Olio Italia s.r.l.**).
2. **Demo Acquisto Fast:** Cliccare su **"Riordino Veloce"** o dettare all'AI l'ordine. Far vedere come il carrello si compili da solo senza digitare nulla.
3. **Demo Loyalty & Premi:** Mostrare l'incremento della barra punti, aprire il **Catalogo Premi** e far aggiungere un premio omaggio con un click.
4. **Demo Smistamento & Chiusura:** Cliccare su **"Invia Ordine Express"** e mostrare l'anteprima del **PDF generato** con l'indicazione esplicita del fornitore *"Olio Italia s.r.l."* pronto per la logistica.

---

### **Posizionamento Economico Revisionato**

* **Valore Percepito del Progetto:** **14.000 € – 18.000 €** (+ IVA)
* **Punti di Forza da vendere ad Ortuso:**
  * **Retention Ristoratori:** Il riordino in 5 secondi ed il catalogo premi azzerano il rischio che il cliente passi a un fornitore concorrente.
  * **Efficienza Agenti:** L'ordine arriva già strutturato e validato al singolo venditore (es. Olio Italia s.r.l.), eliminando errori di trascrizione via WhatsApp o telefono.