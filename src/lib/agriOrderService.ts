import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { updateCartTool } from "./tools";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `Sei AgriOrder AI, l'assistente B2B intelligente di 'Frantoio Ortuso'.
Il tuo compito è assistere i clienti nell'ordinazione di prodotti agroalimentari.
Quando l'utente chiede di ordinare o aggiungere prodotti, devi SEMPRE eseguire la funzione 'update_cart' passando gli ID corretti e le quantità basate sulle unità di vendita del catalogo.

UNITA' DI VENDITA E PREZZI:
- olio-evo-5l: Latta Olio EVO Biologico 5L (€ 45.00 a LATTA)
- olio-vetro-1lt: Olio d’Oliva Vetro 1 LT (€ 90.00 a CARTONE da 12) - Vendita solo a cartoni.
- girasole-pet-1lt: Olio di Semi di Girasole Pet 1 LT (€ 26.40 a CARTONE da 12) - Vendita solo a cartoni.
- girasole-pet-5lt: Olio di Semi di Girasole Pet 5 LT (€ 22.00 a CARTONE da 2) - Vendita solo a cartoni.
- aceto-6-stelle: Aceto Balsamico Modena IGP 6 stelle 250ml (€ 6.17 a BOTTIGLIA)
- aceto-4-stelle: Aceto Balsamico Modena IGP 4 stelle 500ml (€ 6.17 a BOTTIGLIA)
- passata-750ml: Passata di Pomodoro 100% Ital. 750 ml (€ 33.60 a CARTONE da 12) - Vendita solo a cartoni.
- datterini-500ml: Pomodori Datterini 100% Ital. 500 ml (€ 28.80 a CARTONE da 24) - Vendita solo a cartoni.
- olio-tartufo-250ml: Olio al Tartufo Bianco 250 ml (€ 10.77 a BOTTIGLIA)
- salsa-tartufata-500g: Salsa Tartufata 500g (€ 15.73 a BARATTOLO)
- box-ristorazione: Box Degustazione Ristorazione (6 Bott.) (€ 65.00 a BOX)

REGOLE IMPORTANTI:
1. Se l'utente chiede "2 bottiglie di olio vetro 1lt", la quantità per 'olio-vetro-1lt' deve essere 1 (perché vendiamo a cartoni da 12). prima di selezionare chiedi all'utente se è sicuro di prendere il cartone e spiegagli che vendiamo solo il cartone'
2. Se chiede "10 latte di olio EVO", la quantità per 'olio-evo-5l' deve essere 10.
3. Se chiede "un cartone di passata", la quantità per 'passata-750ml' deve essere 1.
4. Se chiede "2 box degustazione", la quantità è 2.
5. Sii preciso con le unità di misura. Se l'utente chiede una quantità non divisibile esattamente per il pacchetto (es. "5 bottiglie di passata"), informa l'utente che il prodotto è venduto solo in cartoni da 12.

PROMOZIONE EXPRESS CHECKOUT:
Quando aggiungi prodotti al carrello, invita SEMPRE l'utente a usare il pulsante 'CONFERMA & INVIA ORDINE EXPRESS' che appare sotto la chat per completare l'acquisto in un click.

Sii cortese, sintetico e professionale. Menziona sempre 'Ortuso' come brand.`;

export interface AIResponse {
  type: "TEXT" | "FUNCTION_CALL" | "ERROR";
  responseText: string;
  data?: any;
}

export async function processUserMessage(userMessage: string, chatHistory: Content[] = []): Promise<AIResponse> {
  if (!apiKey) {
    return {
      type: "ERROR",
      responseText: "⚠️ La chiave API di Gemini non è configurata. Aggiungi NEXT_PUBLIC_GEMINI_API_KEY al tuo file .env.local."
    };
  }

  try {
    // Robust history validation for Gemini: must start with 'user' and alternate roles
    let validatedHistory: Content[] = [];
    let lastRole: string | null = null;

    for (const item of chatHistory) {
      if (validatedHistory.length === 0 && item.role === 'model') continue;
      if (item.role !== lastRole) {
        validatedHistory.push(item);
        lastRole = item.role;
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [updateCartTool]
    });

    const chat = model.startChat({
      history: validatedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2,
      }
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;

    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "update_cart") {
        return {
          type: "FUNCTION_CALL",
          data: call.args,
          responseText: `Ottimo! Ho aggiunto i prodotti Ortuso al carrello per ${call.args.customerName || 'il tuo ristorante'}. Puoi procedere al controllo nella lista a destra.`
        };
      }
    }

    return {
      type: "TEXT",
      responseText: response.text()
    };
  } catch (error) {
    console.error("Errore Gemini 3.5 Flash Lite:", error);
    return {
      type: "ERROR",
      responseText: "⚠️ Si è verificato un errore nella comunicazione con l'AI. Riprova."
    };
  }
}

export async function askAgriOrderAI(userMessage: string, chatHistory: Content[] = []): Promise<string> {
    const res = await processUserMessage(userMessage, chatHistory);
    return res.responseText;
}
