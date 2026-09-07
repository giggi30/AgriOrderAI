export const updateCartTool = {
  functionDeclarations: [
    {
      name: "update_cart",
      description: "Sincronizza e aggiorna le quantità dei prodotti selezionati nel catalogo a destra in base alle richieste del cliente.",
      parameters: {
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            description: "Lista di prodotti identificati e relative quantità da aggiungere al carrello",
            items: {
              type: "OBJECT",
              properties: {
                productId: {
                  type: "STRING",
                  description: "ID esatto del prodotto. Valori ammessi: 'chianti-docg', 'vermentino', 'olio-evo', 'parmigiano', 'salsa-ciliegino', 'prosciutto-parma'"
                },
                quantity: {
                  type: "NUMBER",
                  description: "Quantità di casse, unità o kg ordinati"
                }
              },
              required: ["productId", "quantity"]
            }
          },
          customerName: { type: "STRING", description: "Nome del cliente o ristorante citato (es. 'Ristorante Il Pino')" },
          notes: { type: "STRING", description: "Eventuali note su allergeni o consegne" }
        },
        required: ["items"]
      }
    }
  ]
};
