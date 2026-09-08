import { SchemaType, Tool } from "@google/generative-ai";

export const updateCartTool: Tool = {
  functionDeclarations: [
    {
      name: "update_cart",
      description: "Sincronizza e aggiorna le quantità dei prodotti selezionati nel catalogo a destra in base alle richieste del cliente.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          items: {
            type: SchemaType.ARRAY,
            description: "Lista di prodotti identificati e relative quantità da aggiungere al carrello",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                productId: {
                  type: SchemaType.STRING,
                  description: "ID esatto del prodotto. Valori ammessi: 'olio-evo-5l', 'olio-vetro-1lt', 'girasole-pet-1lt', 'girasole-pet-5lt', 'aceto-6-stelle', 'aceto-4-stelle', 'passata-750ml', 'datterini-500ml', 'olio-tartufo-250ml', 'salsa-tartufata-500g', 'box-ristorazione'"
                },
                quantity: {
                  type: SchemaType.NUMBER,
                  description: "Quantità di casse, unità o kg ordinati"
                }
              },
              required: ["productId", "quantity"]
            }
          },
          customerName: { type: SchemaType.STRING, description: "Nome del cliente o ristorante citato (es. 'Ristorante Il Pino')" },
          notes: { type: SchemaType.STRING, description: "Eventuali note su allergeni o consegne" }
        },
        required: ["items"]
      }
    }
  ]
};
