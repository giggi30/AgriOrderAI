export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  packageInfo: string;
  stock: number;
  icon: string;
  image: string;
}

export const CATALOG_PRODUCTS: Product[] = [
  {
    id: 'olio-evo-5l',
    name: 'Latta Olio EVO Biologico 5L',
    category: 'Olio',
    price: 36.00,
    unit: 'latta da 5L',
    packageInfo: '€ 7,20 / LT',
    stock: 100,
    icon: '🫒',
    image: '/images/olio1.png'
  },
  {
    id: 'olio-vetro-1lt',
    name: 'Olio d’Oliva Vetro 1 LT',
    category: 'Olio',
    price: 90.00,
    unit: 'cartone da 12',
    packageInfo: '€ 7,50 / LT',
    stock: 50,
    icon: '🍾',
    image: '/images/olio-di-oliva-vetro-1lt.png'
  },
  {
    id: 'girasole-pet-1lt',
    name: 'Olio di Semi di Girasole Pet 1 LT',
    category: 'Olio',
    price: 26.40,
    unit: 'cartone da 12',
    packageInfo: '€ 2,20 / LT',
    stock: 200,
    icon: '🌻',
    image: '/images/olio-di-semi-di-girasole-pet-1lt.png'
  },
  {
    id: 'girasole-pet-5lt',
    name: 'Olio di Semi di Girasole Pet 5 LT',
    category: 'Olio',
    price: 22.00,
    unit: 'cartone da 2',
    packageInfo: '€ 2,20 / LT',
    stock: 150,
    icon: '🌻',
    image: '/images/olio-di-semi-di-girasole-pet-5lt.png'
  },
  {
    id: 'aceto-6-stelle',
    name: 'Aceto Balsamico Modena IGP 6 stelle 250ml',
    category: 'Aceti',
    price: 6.17,
    unit: 'bottiglia',
    packageInfo: '€ 24,68 / LT',
    stock: 80,
    icon: '🍯',
    image: '/images/aceto-balsamico-250ml-6-stelle.png'
  },
  {
    id: 'aceto-4-stelle',
    name: 'Aceto Balsamico Modena IGP 4 stelle 500ml',
    category: 'Aceti',
    price: 6.17,
    unit: 'bottiglia',
    packageInfo: '€ 12,34 / LT',
    stock: 100,
    icon: '🍯',
    image: '/images/aceto-balsamico-500ml-4-stelle.png'
  },
  {
    id: 'passata-750ml',
    name: 'Passata di Pomodoro 100% Ital. 750 ml',
    category: 'Pomodori',
    price: 33.60,
    unit: 'cartone da 12',
    packageInfo: '€ 3,73 / LT',
    stock: 300,
    icon: '🍅',
    image: '/images/passata-di-pomodoro-100_-pomodoro-italiano-ml.-750.png'
  },
  {
    id: 'datterini-500ml',
    name: 'Pomodori Datterini 100% Ital. 500 ml',
    category: 'Pomodori',
    price: 28.80,
    unit: 'cartone da 24',
    packageInfo: '€ 2,40 / LT',
    stock: 250,
    icon: '🍅',
    image: '/images/pomodori-datterini-100_-pomodoro-italiano-ml.-500.png'
  },
  {
    id: 'olio-tartufo-250ml',
    name: 'Olio al Tartufo Bianco 250 ml',
    category: 'Tartufo',
    price: 10.77,
    unit: 'bottiglia',
    packageInfo: '€ 43,08 / LT',
    stock: 40,
    icon: '🍄',
    image: '/images/olio-tartufo-250-ml_bottiglia.png'
  },
  {
    id: 'salsa-tartufata-500g',
    name: 'Salsa Tartufata 500g',
    category: 'Tartufo',
    price: 15.73,
    unit: 'barattolo',
    packageInfo: '€ 31,46 / KG',
    stock: 60,
    icon: '🍄',
    image: '/images/salsa-tartufata-barattolo-grande.png'
  },
  {
    id: 'box-ristorazione',
    name: 'Box Degustazione Ristorazione',
    category: 'Specialità',
    price: 65.00,
    unit: 'box da 6 bott.',
    packageInfo: '€ 65,00 / box',
    stock: 30,
    icon: '🎁',
    image: '/images/box-degustazione-ristorazione.png'
  }
];
