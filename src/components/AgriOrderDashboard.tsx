"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CATALOG_PRODUCTS } from '@/lib/productsData';
import { processUserMessage } from '@/lib/agriOrderService';
import { Send, Bot, Sparkles, ShoppingBag, FileText, RefreshCw, CheckCheck, Minus, Trash2, Plus, X, Printer, Mail, Sun, Moon, Trophy, Maximize2, PlusCircle, History, LogOut } from 'lucide-react';
import { Content } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { User as AuthUser, updateLoyalty as updateLoyaltyAction } from '@/lib/auth';
import { saveOrder as saveOrderAction, getOrders as getOrdersAction } from '@/lib/orderService';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface Order {
  id: string;
  date: string;
  items: Record<string, number>;
  total: number;
}

interface AgriOrderDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function AgriOrderDashboard({ user, onLogout }: AgriOrderDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: `👋 Ciao! Sono l'assistente AI di **Frantoio Ortuso**.\n\nBenvenuto **${user.companyName}**. Puoi ordinare scrivendo in chat (es. *\"Ordina 5 latte d'olio EVO e un box degustazione\"*) oppure cliccando direttamente sulle schede del catalogo a destra.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Stato del carrello condiviso (Single Source of Truth)
  const [cart, setCart] = useState<Record<string, number>>({}); // es: { 'chianti-docg': 5, 'olio-evo': 2 }
  const [lastOrderItems, setLastOrderItems] = useState<Record<string, number> | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [redemptions, setRedemptions] = useState<Record<string, number>>({});
  const [celebration, setCelebration] = useState<{ type: 'level' | 'reward', name: string } | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: user.companyName, notes: '' });
  const [zoomedProduct, setZoomedProduct] = useState<any | null>(null);
  const [isAiOrder, setIsAiOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'catalog'>('chat');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Inizializza il tema al caricamento
    const savedTheme = localStorage.getItem('theme');
    const initialDark = savedTheme ? savedTheme === 'dark' : false;
    setIsDarkMode(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Inizializza loyalty dai dati utente (già caricati da Supabase)
    if (user) {
      setLoyaltyPoints(user.loyaltyPoints || 0);
      setBadges(user.badges || []);
      setRedemptions(user.redemptions || {});
    }

    // Forza lo scroll all'inizio al montaggio del componente
    window.scrollTo(0, 0);

    // Carica lo storico ordini da Supabase
    async function loadOrders() {
      const dbOrders = await getOrdersAction(user.id);
      if (dbOrders) {
        setOrders(dbOrders.map(o => ({
          id: o.id,
          date: o.created_at,
          items: o.items,
          total: Number(o.total_amount)
        })));
      }
    }
    loadOrders();
  }, [user]);

  const saveLoyalty = async (points: number, newBadges: string[], newRedemptions: Record<string, number> = redemptions) => {
    setLoyaltyPoints(points);
    setBadges(newBadges);
    setRedemptions(newRedemptions);

    // Persistenza su Supabase tramite Server Action
    await updateLoyaltyAction(user.id, points, newBadges, newRedemptions);
  };

  const saveOrder = async (newOrder: Order) => {
    // 1. Salva l'ordine su Supabase
    const { success, order: savedDbOrder } = await saveOrderAction(user.id, newOrder.total, newOrder.items);

    if (!success) {
      console.error("Errore durante il salvataggio dell'ordine su DB");
      // Opzionale: gestire il fallback o errore UI
    }

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // Update loyalty points (1€ = 1 point)
    const pointsGained = Math.floor(newOrder.total);
    const oldTotalPoints = loyaltyPoints;
    const newTotalPoints = loyaltyPoints + pointsGained;

    const oldLevel = getLoyaltyLevel(orders.length);
    const newLevel = getLoyaltyLevel(updatedOrders.length);

    // Logic for badges
    const newBadges = [...badges];
    if (updatedOrders.length >= 1 && !newBadges.includes('Cliente Storico')) {
      newBadges.push('Cliente Storico');
    }
    const evoProducts = Object.keys(newOrder.items).filter(id => id.includes('olio-evo'));
    if (evoProducts.length > 0 && !newBadges.includes('Top Ordini EVO')) {
      newBadges.push('Top Ordini EVO');
    }

    await saveLoyalty(newTotalPoints, newBadges);

    const kitThreshold = 500 * ((redemptions['reward-kit'] || 0) + 1);
    const dispenserThreshold = 1000 * ((redemptions['reward-dispenser'] || 0) + 1);
    const discountThreshold = 2000 * ((redemptions['reward-discount'] || 0) + 1);

    // Trigger celebration for Level Up
    if (newLevel.name !== oldLevel.name) {
      setCelebration({ type: 'level', name: newLevel.name });
      setTimeout(() => setCelebration(null), 5000);
    }
    // Trigger celebration for Reward Unlock
    else if (newTotalPoints >= kitThreshold && oldTotalPoints < kitThreshold) {
      setCelebration({ type: 'reward', name: 'Kit Assaggio Olii Aromatizzati' });
      setTimeout(() => setCelebration(null), 5000);
    }
    else if (newTotalPoints >= dispenserThreshold && oldTotalPoints < dispenserThreshold) {
      setCelebration({ type: 'reward', name: 'Dispenser Inox da Banco' });
      setTimeout(() => setCelebration(null), 5000);
    }
    else if (newTotalPoints >= discountThreshold && oldTotalPoints < discountThreshold) {
      setCelebration({ type: 'reward', name: 'Buono Sconto 100€' });
      setTimeout(() => setCelebration(null), 5000);
    }

    // AI suggestion for rewards
    if (newTotalPoints >= kitThreshold && oldTotalPoints < kitThreshold) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `✨ **Congratulazioni!** Hai raggiunto quota **${kitThreshold} punti**! 🏆\n\nHai sbloccato il **Kit Assaggio Olii Aromatizzati** in omaggio. Vuoi aggiungerlo subito al tuo prossimo ordine?`
        }]);
      }, 1500);
    }
  };

  const getRecurringOrder = () => {
    if (orders.length < 2) return null;

    // Raggruppa ordini uguali (stessa combinazione di prodotti e quantità)
    const patterns: Record<string, { items: Record<string, number>, count: number }> = {};

    orders.forEach(order => {
      // Crea una chiave univoca per la combinazione di prodotti
      const sortedKeys = Object.keys(order.items).sort();
      const patternKey = sortedKeys.map(k => `${k}:${order.items[k]}`).join('|');

      if (patterns[patternKey]) {
        patterns[patternKey].count++;
      } else {
        patterns[patternKey] = { items: order.items, count: 1 };
      }
    });

    // Trova il pattern con almeno 2 occorrenze
    const recurringPattern = Object.values(patterns).find(p => p.count >= 2);
    return recurringPattern ? recurringPattern.items : null;
  };

  const handleRecurringOrder = async () => {
    const itemsToLoad = orders.length > 0 ? orders[0].items : null;

    if (!itemsToLoad) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Non ho ancora uno storico ordini per caricare l'ultimo ordine. Inizia ad ordinare!" }]);
      return;
    }

    // Popola il carrello
    setCart(itemsToLoad);
    setIsAiOrder(true);

    const itemsList = Object.entries(itemsToLoad)
      .map(([id, qty]) => {
        const p = CATALOG_PRODUCTS.find(prod => prod.id === id);
        return `- ${qty}x ${p?.name || id}`;
      })
      .join('\n');

    setMessages(prev => [...prev, { sender: 'user', text: `Carica il mio ultimo ordine:\n${itemsList}` }]);

    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `Ho caricato i prodotti del tuo ultimo ordine:\n\n${itemsList}\n\n**Vuoi confermare l'ordine?**`
      }]);
      setLoading(false);
    }, 1000);
  };

  const handleSolitoOrder = async () => {
    const recurringItems = getRecurringOrder();

    if (!recurringItems) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Non ho ancora individuato un 'solito' (ordine ricorrente effettuato almeno 2-3 volte). Continua ad ordinare i tuoi preferiti!" }]);
      return;
    }

    setCart(recurringItems);
    setIsAiOrder(true);

    const itemsList = Object.entries(recurringItems)
      .map(([id, qty]) => {
        const p = CATALOG_PRODUCTS.find(prod => prod.id === id);
        return `- ${qty}x ${p?.name || id}`;
      })
      .join('\n');

    setMessages(prev => [...prev, { sender: 'user', text: `Carica il mio ordine ricorrente (il solito):\n${itemsList}` }]);

    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `Ho caricato i prodotti del tuo ordine abituale (il solito):\n\n${itemsList}\n\n**Vuoi confermare l'ordine?**`
      }]);
      setLoading(false);
    }, 1000);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Esegui lo scroll solo se abbiamo aggiunto messaggi oltre a quello iniziale
    if (messages.length > 1 || loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Gestione aggiunta manuale dal catalogo
  const handleManualToggle = (productId: string) => {
    setIsAiOrder(false);
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleDecrease = (productId: string) => {
    setIsAiOrder(false);
    setCart(prev => {
      if (!prev[productId]) return prev;
      const newQty = prev[productId] - 1;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleRemove = (productId: string) => {
    setIsAiOrder(false);
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const handleClearChat = () => {
    setMessages([
      { sender: 'ai', text: "👋 Ciao! Sono l'assistente AI di **Frantoio Ortuso**.\n\nPuoi ordinare scrivendo in chat (es. *\"Ordina 5 latte d'olio EVO e un box degustazione\"*) oppure cliccando direttamente sulle schede del catalogo a destra." }
    ]);
  };

  const handleClearCart = () => {
    setCart({});
    setIsAiOrder(false);
  };

  const handleSend = async (customText?: string) => {
    const query = customText || input;
    if (!query.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    // Prepare history: ensure it starts with 'user' and alternates roles
    const history: Content[] = [];
    let lastRole: 'user' | 'model' | null = null;

    messages.forEach((m, i) => {
      // Skip the very first welcome message if it's from AI
      if (i === 0 && m.sender === 'ai') return;

      const currentRole = m.sender === 'user' ? 'user' : 'model';

      // Gemini history must start with 'user'
      if (history.length === 0 && currentRole === 'model') return;

      // Gemini history must alternate roles
      if (currentRole !== lastRole) {
        history.push({
          role: currentRole,
          parts: [{ text: m.text }]
        });
        lastRole = currentRole;
      }
    });

    const res = await processUserMessage(query, history);
    setLoading(false);

    if (res.type === "FUNCTION_CALL") {
      // Aggiorna lo stato del carrello tramite i dati estrapolati da Gemini
      const newCartUpdates: Record<string, number> = {};
      res.data.items.forEach((item: { productId: string, quantity: number }) => {
        newCartUpdates[item.productId] = item.quantity;
      });

      setCart(prev => {
        const updatedCart = { ...prev, ...newCartUpdates };

        // Calcolo punti potenziali per suggerimento AI
        const newTotal = Object.entries(updatedCart).reduce((sum, [id, qty]) => {
          const p = CATALOG_PRODUCTS.find(prod => prod.id === id);
          return sum + (p ? p.price * qty : 0);
        }, 0);

        const potPoints = Math.floor(newTotal);
        const kitThreshold = 500 * ((redemptions['reward-kit'] || 0) + 1);
        if (loyaltyPoints + potPoints >= kitThreshold && loyaltyPoints < kitThreshold) {
          res.responseText += `\n\n✨ **Nota Loyalty**: Con questo ordine raggiungerai **${kitThreshold} punti**! Potrai riscattare subito il **Kit Assaggio Olii** nel catalogo premi.`;
        }

        return updatedCart;
      });
      setIsAiOrder(true);

      // Aggiorna le info cliente se presenti
      if (res.data.customerName || res.data.notes) {
        setCustomerInfo({
          name: res.data.customerName || '',
          notes: res.data.notes || ''
        });
      }
    }

    setMessages(prev => [...prev, { sender: 'ai', text: res.responseText }]);
  };

  // Calcolo totale ordine
  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = CATALOG_PRODUCTS.find(p => p.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const filteredProducts = activeCategory === 'Tutti'
    ? CATALOG_PRODUCTS
    : CATALOG_PRODUCTS.filter(p => p.category === activeCategory);

  const getLoyaltyLevel = (orderCount: number) => {
    if (orderCount >= 11) return { name: 'Leggenda del Frantoio', color: 'bg-indigo-600', textColor: 'text-indigo-600', next: null, min: 11, discountPct: 10 };
    if (orderCount >= 6) return { name: 'Mastro Oleario', color: 'bg-amber-500', textColor: 'text-amber-500', next: 11, min: 6, discountPct: 5 };
    if (orderCount >= 3) return { name: 'Chef della Domenica', color: 'bg-slate-400', textColor: 'text-slate-400', next: 6, min: 3, discountPct: 3 };
    return { name: 'Novizio dell\'Olio', color: 'bg-orange-700', textColor: 'text-orange-700', next: 3, min: 0, discountPct: 0 };
  };

  const currentLevel = getLoyaltyLevel(orders.length);
  const potentialPoints = Math.floor(totalAmount);
  const totalPointsAfterOrder = loyaltyPoints + potentialPoints;
  const levelAfterOrder = getLoyaltyLevel(orders.length + 1);

  const REWARDS = [
    { id: 'reward-kit', name: 'Kit Assaggio Olii Aromatizzati', basePoints: 500, image: '/images/premio1.png', description: 'Selezione di bottigliette aromatizzate' },
    { id: 'reward-dispenser', name: 'Dispenser Inox da Banco', basePoints: 1000, image: '/images/premio2.png', description: 'Elegante dispenser professionale da 3L' },
    { id: 'reward-discount', name: 'Buono Sconto 100€', basePoints: 2000, icon: '🎫', description: 'Valido su tutto il catalogo Ortuso' },
  ].map(r => ({
    ...r,
    points: r.basePoints * ((redemptions[r.id] || 0) + 1)
  }));

  return (
    <div className="w-full h-screen md:h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans md:p-6 flex flex-col transition-colors duration-300">
      {/* MOBILE HEADER (Screenshot style) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="flex flex-col">
          <img
            src="/images/logo_ortuso.png"
            alt="Ortuso Logo"
            className={`h-8 w-auto object-contain transition-all ${isDarkMode ? 'brightness-110 contrast-125' : 'brightness-100 contrast-100'}`}
          />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Smart B2B Portal</p>
        </div>
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-1 pr-3 py-1 rounded-full shadow-sm active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-[#707E3D]/10 border border-[#707E3D]/20 flex items-center justify-center text-[#707E3D] dark:text-[#A1B06B] text-[10px] font-black">
            {user.companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.companyName}</span>
        </div>
      </div>

      {/* MOBILE TABS SWITCHER */}
      <div className="md:hidden px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 flex-none transition-colors">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-700 text-[#707E3D] dark:text-[#A1B06B] shadow-md ring-2 ring-[#707E3D]/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Bot className="w-4 h-4" /> Assistente AI
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-700 text-[#707E3D] dark:text-[#A1B06B] shadow-md ring-2 ring-[#707E3D]/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Catalogo
          </button>
        </div>
      </div>

      {/* Top Header (Desktop Only) */}
      <div className="hidden md:flex max-w-[1800px] w-full mx-auto mb-4 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 flex-none">

        {/* Sinistra: Logo Ortuso */}
        <div className="flex flex-col items-start">
          <img
            src="/images/logo_ortuso.png"
            alt="Ortuso Logo"
            className={`h-12 w-auto object-contain transition-all ${isDarkMode ? 'brightness-110 contrast-125' : 'brightness-100 contrast-100'}`}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#707E3D] dark:text-[#A1B06B] mt-1">Smart B2B Portal</span>
        </div>

        {/* Destra: Azioni e Profilo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="text-[10px] text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors uppercase tracking-widest font-black mr-2"
            >
              Logout
            </button>
            <Link href="/privacy" className="text-[10px] text-slate-400 hover:text-[#707E3D] dark:text-slate-500 dark:hover:text-[#A1B06B] transition-colors uppercase tracking-widest font-black">
              Privacy
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#707E3D] dark:hover:text-[#A1B06B] transition-all shadow-sm"
              title={isDarkMode ? 'Passa alla Light Mode' : 'Passa alla Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-[#707E3D] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#707E3D]/10 border border-[#707E3D]/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.companyName)}&background=707E3D&color=fff&bold=true`}
                alt="Cliente Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5 group-hover:text-[#707E3D] transition-colors">Cliente Attivo</p>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.companyName}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid 50 / 50 */}
      <div className="max-w-[1800px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 relative px-0 lg:px-6">

        {/* COLONNA SINISTRA: CHATBOT AI */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-xl ${
          activeTab === 'chat' ? 'flex h-full' : 'hidden lg:flex'
        } ${activeTab === 'chat' ? 'rounded-none border-0 shadow-none md:border md:rounded-2xl md:shadow-xl' : ''}`}>

          {/* Mobile Chat Title Bar */}
          <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#707E3D]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#707E3D] dark:text-[#A1B06B]" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter transition-colors">Ortuso AI Assistant</h3>
            </div>
            <button onClick={handleClearChat} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg transition-colors">Resetta</button>
          </div>
          {/* Chat Header (Desktop Only) */}
          <div className="hidden md:flex p-4 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#707E3D]/10 dark:bg-[#707E3D]/20 border border-[#707E3D]/30 dark:border-[#707E3D]/40 flex items-center justify-center text-[#707E3D] dark:text-[#A1B06B]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Ortuso AI Assistant <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scrivi o seleziona uno scenario rapido</p>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Resetta
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-6 bg-slate-50/30 dark:bg-slate-950/40 md:bg-slate-50/30 md:dark:bg-slate-950/40">
            <div className="md:hidden absolute inset-0 bg-[#F8FAFC] dark:bg-slate-950 pointer-events-none -z-10 transition-colors" />
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* Mobile Style Bubble */}
                <div className={`md:hidden max-w-[95%] p-4 rounded-3xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#5A6531] text-white rounded-tr-none shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-50 dark:border-slate-700/60 rounded-tl-none shadow-sm'
                }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ ...props }) => <strong className={`font-black ${m.sender === 'ai' ? 'text-slate-900 dark:text-white' : 'text-white'}`} {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({ ...props }) => <li className="mb-1" {...props} />,
                      table: ({ ...props }) => (
                        <div className="w-full bg-slate-50/80 p-3 rounded-2xl border border-slate-100 mt-3 space-y-2">
                          <table className="w-full text-left text-sm" {...props} />
                          <p className="text-[10px] text-slate-400 font-medium italic pt-2 border-t border-slate-100">
                            Tocca 'Conferma' per aggiornare il totale in basso.
                          </p>
                        </div>
                      ),
                      td: ({ ...props }) => <td className="py-1.5 px-1 font-medium" {...props} />,
                      tr: ({ ...props }) => <tr className="border-b border-slate-100 last:border-none" {...props} />,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                </div>

                {/* Desktop Style Bubble (Reverted) */}
                <div className={`hidden md:block max-w-[85%] p-3.5 rounded-2xl text-base leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#707E3D] dark:bg-[#5A6531] text-white rounded-br-none shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-none shadow-sm'
                }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ ...props }) => <strong className={`font-bold ${m.sender === 'ai' ? 'text-[#707E3D] dark:text-[#A1B06B]' : 'text-white'}`} {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({ ...props }) => <li className="mb-1" {...props} />,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-[#707E3D] dark:text-[#A1B06B] flex items-center gap-2 italic bg-white dark:bg-slate-800/50 p-3 rounded-xl w-max border border-slate-200 dark:border-slate-700/40 animate-pulse shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> L'assistente sta elaborando l'ordine...
              </div>
            )}

            {/* Pulsante Express Checkout in Chat */}
            {!loading && totalAmount > 0 && isAiOrder && (
              <div className="flex justify-center my-4 animate-in zoom-in duration-300">
                <button
                  onClick={() => {
                    const discountAmount = totalAmount * (currentLevel.discountPct / 100);
                    const netSubtotal = totalAmount - discountAmount;
                    const finalTotal = netSubtotal * 1.22;

                    const newOrder: Order = {
                      id: `ORD-${Date.now()}`,
                      date: new Date().toISOString(),
                      items: { ...cart },
                      total: totalAmount
                    };
                    saveOrder(newOrder);
                    setLastOrderItems({ ...cart });

                    setMessages(prev => [...prev, {
                      sender: 'ai',
                      text: `🚀 **ORDINE EXPRESS INVIATO!**\n\nAbbiamo ricevuto il tuo ordine.\n\n💰 **Risparmio Fedeltà**: Grazie al tuo livello **${currentLevel.name}**, hai risparmiato **€ ${discountAmount.toFixed(2)}** (${currentLevel.discountPct}%).\n\nSto generando il tuo documento di riepilogo a tutto schermo...`
                    }]);

                    setIsPdfOpen(true);
                    setCart({});
                  }}
                  className="group relative bg-[#707E3D] hover:bg-[#5A6531] text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_10px_30px_rgba(112,126,61,0.3)] hover:shadow-[0_15px_40px_rgba(112,126,61,0.4)] transition-all transform hover:-translate-y-1 active:scale-95 border-2 border-[#A1B06B]/20"
                >
                  <div className="absolute -top-3 -right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce">
                    FAST CHECKOUT
                  </div>
                  <CheckCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  CONFERMA & INVIA ORDINE EXPRESS
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts (Mobile) */}
          <div className="md:hidden px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 transition-colors">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Comandi Rapidi</h4>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={handleRecurringOrder}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-[#707E3D]/30 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-full whitespace-nowrap transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] font-bold flex items-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Ultimo Ordine
              </button>
              <button
                onClick={handleSolitoOrder}
                className={`text-xs px-4 py-2.5 rounded-full whitespace-nowrap transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] font-bold flex items-center gap-2 active:scale-95 ${
                  getRecurringOrder()
                    ? 'bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-500 hover:border-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800 opacity-50 border border-slate-100 dark:border-slate-700 text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Il Solito
              </button>
              <button
                onClick={() => handleSend("Aggiungi 3 cartoni di Passata di Pomodoro e 2 barattoli di Salsa Tartufata")}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-[#707E3D]/30 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-full whitespace-nowrap transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] font-bold flex items-center gap-2 active:scale-95"
              >
                🍅 Conserve & Tartufo
              </button>
              <button
                onClick={() => handleSend("Vorrei creare un nuovo comando rapido personalizzato con i miei prodotti preferiti")}
                className="text-xs bg-[#707E3D] border border-[#707E3D] text-white px-4 py-2.5 rounded-full whitespace-nowrap transition-all shadow-lg shadow-[#707E3D]/20 font-black flex items-center gap-2 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Crea il tuo comando rapido
              </button>
            </div>
          </div>

          {/* Quick Prompts (Desktop - Reverted) */}
          <div className="hidden md:flex p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={handleRecurringOrder}
              className="text-sm bg-[#707E3D]/5 dark:bg-[#707E3D]/10 hover:bg-[#707E3D]/10 dark:hover:bg-[#707E3D]/20 border border-[#707E3D]/20 dark:border-[#707E3D]/30 text-[#707E3D] dark:text-[#A1B06B] px-3 py-1.5 rounded-lg whitespace-nowrap transition shadow-sm font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Ultimo Ordine
            </button>
            <button
              onClick={handleSolitoOrder}
              className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition shadow-sm font-bold flex items-center gap-1.5 border ${
                getRecurringOrder()
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Il Solito
            </button>
            <button
              onClick={() => handleSend("Aggiungi 3 cartoni di Passata di Pomodoro e 2 barattoli di Salsa Tartufata")}
              className="text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap transition shadow-sm"
            >
              🍅 Conserve & Tartufo
            </button>
          </div>

          {/* Chat Input Bar (Mobile) */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="md:hidden p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 mb-20 md:mb-0 transition-colors">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi il tuo ordine in linguaggio naturale..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#707E3D]/10 focus:border-[#707E3D] transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#5A6531] hover:bg-[#46501E] text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Chat Input Bar (Desktop - Reverted) */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="hidden md:flex p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi qui il tuo ordine in linguaggio naturale..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#707E3D] transition-colors"
            />
            <button type="submit" className="bg-[#707E3D] hover:bg-[#5A6531] text-white px-4 py-2 rounded-xl text-base font-semibold flex items-center gap-1.5 transition shadow-lg shadow-[#707E3D]/20">
              Invia <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* COLONNA DESTRA: CATALOGO REATTIVO */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-xl p-0 md:p-6 ${
          activeTab === 'catalog' ? 'flex h-full' : 'hidden lg:flex'
        } ${activeTab === 'catalog' ? 'rounded-none border-0 shadow-none md:border md:rounded-2xl md:shadow-xl' : ''}`}>

          {/* Categoria Filters (Mobile Header Style) */}
          <div className="md:hidden px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 flex flex-col gap-3 transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2 px-2">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Catalogo Prodotti B2B
            </h3>
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { name: 'Tutti', icon: null },
                { name: 'Olio', icon: null },
                { name: 'Aceti', icon: null },
                { name: 'Pomodori', icon: null },
                { name: 'Tartufo', icon: null }
              ].map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex-1 text-[11px] px-3 py-2 rounded-lg transition-all font-bold whitespace-nowrap flex items-center justify-center gap-1 ${
                    activeCategory === cat.name
                      ? 'bg-[#5A6531] text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria Filters (Desktop - Reverted) */}
          <div className="hidden md:flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#707E3D] dark:text-[#A1B06B]" /> Catalogo Prodotti B2B
            </h3>
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {['Tutti', 'Olio', 'Aceti', 'Pomodori', 'Tartufo', 'Specialità'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition ${
                    activeCategory === cat ? 'bg-[#707E3D] text-white font-semibold shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products List (Mobile Style) */}
          <div className="flex-1 overflow-y-auto px-4 md:px-2 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 mb-20 md:mb-0">
            {filteredProducts.map(product => {
              const qty = cart[product.id] || 0;
              const isSelected = qty > 0;

              return (
                <div
                  key={product.id}
                  className={`relative p-4 rounded-3xl border transition-all duration-500 flex items-center gap-3 h-[155px] ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-[#707E3D]/20 dark:border-[#707E3D]/40 shadow-[0_12px_30px_rgba(112,126,61,0.1)] ring-1 ring-[#707E3D]/5'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
                  } md:hidden`}
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); setZoomedProduct(product); }}
                    className="relative w-28 h-28 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform"
                  >
                    {isSelected && (
                      <span className="absolute -top-2 -left-2 bg-[#5A6531] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-30 border-2 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                        {qty}
                      </span>
                    )}
                    <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-[130px] pr-2 h-full justify-center gap-2">
                    <div>
                      {product.id.includes('bio') && (
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800 inline-block mb-1">Bio</span>
                      )}
                      <h4 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight">{product.name}</h4>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xl font-black text-[#5A6531] dark:text-[#A1B06B]">€ {product.price.toFixed(2)}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">/ {product.unit}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 tracking-tight">{product.packageInfo}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 shrink-0 self-center w-12">
                    {qty > 0 ? (
                      <div className="flex flex-col items-center w-full gap-1">
                        <button
                          onClick={() => handleManualToggle(product.id)}
                          className="w-9 h-9 rounded-xl bg-[#5A6531] text-white flex items-center justify-center shadow-md shadow-[#5A6531]/20 active:scale-90 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDecrease(product.id)}
                          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-200 active:scale-90 transition-transform animate-in fade-in slide-in-from-top-2 duration-500 delay-75 fill-mode-both"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(product.id)}
                          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-rose-100 dark:border-rose-900/30 text-rose-400 dark:text-rose-400 flex items-center justify-center shadow-sm active:scale-90 transition-transform animate-in fade-in slide-in-from-top-4 duration-500 delay-150 mt-1 fill-mode-both"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleManualToggle(product.id)}
                        className="w-12 h-12 rounded-2xl bg-[#5A6531] text-white flex items-center justify-center shadow-lg shadow-[#5A6531]/20 active:scale-90 transition-transform animate-in fade-in zoom-in duration-300"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Desktop View (Unchanged) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
              {filteredProducts.map(product => {
                const qty = cart[product.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => handleManualToggle(product.id)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-500 flex flex-col h-[340px] group z-0 hover:z-50 hover:scale-[1.02] hover:shadow-2xl hover:bg-white dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-[#707E3D]/50 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-[#707E3D] ring-2 ring-[#707E3D]/10 shadow-xl'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50 shadow-sm'
                    }`}
                  >
                    {/* Badge quantità */}
                    {isSelected && (
                      <span className="absolute top-4 left-4 bg-[#707E3D] dark:bg-[#A1B06B] text-white dark:text-slate-950 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white dark:border-slate-900">
                        {qty}
                      </span>
                    )}

                    {/* Azioni Rapide (Top Right) */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-20 animate-in fade-in slide-in-from-right-4 duration-300">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecrease(product.id); }}
                          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 rounded-xl text-slate-500 hover:text-rose-500 shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 hover:shadow-lg active:scale-95"
                          title="Diminuisci quantità"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(product.id); }}
                          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 rounded-xl text-rose-500 hover:text-rose-600 shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 hover:shadow-lg active:scale-95"
                          title="Rimuovi prodotto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Immagine Prodotto Area */}
                    <div className="h-36 w-full flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/40 p-2 shrink-0 border border-slate-100 dark:border-slate-800/50">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-125 duration-700 scale-110"
                      />
                    </div>

                    <div className="flex flex-col flex-1 px-1">
                      <div className="mb-2">
                        <h4 className="text-[18px] font-bold leading-[1.2] text-[#46501E] dark:text-[#F4F7E6] tracking-tight">
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex-1" />

                      {/* Separatore Faint */}
                      <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800/60 mb-3" />

                      <div className="mt-auto flex flex-col">
                        <span className="text-[20px] font-black text-[#707E3D] dark:text-[#DCE5B9] tracking-tighter leading-none whitespace-nowrap mb-1">
                          € {product.price.toFixed(2)}
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium whitespace-nowrap">
                            {product.unit}
                          </span>
                          <span className="text-[12px] font-black text-[#707E3D] dark:text-[#A9B876] whitespace-nowrap">
                            {product.packageInfo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
           
          {/* Footer Order Summary (Desktop Only) */}
          <div className="hidden md:block mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
            {/* Barra Punti Dinamica */}
            {totalAmount > 0 && (
              <div className="bg-[#707E3D]/5 dark:bg-[#707E3D]/10 p-3 rounded-xl border border-[#707E3D]/20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Punti Loyalty con questo ordine: <span className="text-[#707E3D] dark:text-[#A1B06B]">+{potentialPoints}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">
                    Prossimo Premio: {totalPointsAfterOrder} / {Math.min(...REWARDS.map(r => r.points).filter(p => p > loyaltyPoints)) || 'Max'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-amber-500 transition-all duration-1000`}
                    style={{
                      width: `${Math.min(100, (totalPointsAfterOrder / (Math.min(...REWARDS.map(r => r.points).filter(p => p > loyaltyPoints)) || totalPointsAfterOrder)) * 100)}%`
                    }}
                  />
                </div>
                {levelAfterOrder.name !== currentLevel.name && (
                  <p className="text-[9px] text-[#707E3D] dark:text-[#A1B06B] font-bold mt-1 animate-pulse text-center uppercase tracking-tighter">
                    🔥 Con questo ordine raggiungerai il Livello {levelAfterOrder.name}!
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Totale Ordine (IVA Esclusa)</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">€ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRewardsOpen(true)}
                  className="bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 border border-slate-200 dark:border-slate-800 hover:border-amber-200 text-sm font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                >
                  <Trophy className="w-3.5 h-3.5" /> Premi
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={totalAmount === 0}
                  className="bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Svuota
                </button>
                <button
                  onClick={() => setIsPdfOpen(true)}
                  disabled={totalAmount === 0}
                  className="bg-[#707E3D] hover:bg-[#5A6531] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition"
                >
                  <FileText className="w-4 h-4" /> Ordina
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY FOOTER (Screenshot Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] transition-colors">
        <div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Totale Ordine (IVA Excl.)</p>
          <p className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">€ {totalAmount.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCart}
            disabled={totalAmount === 0}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-colors bg-white dark:bg-slate-800 disabled:opacity-30"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsRewardsOpen(true)}
            className="w-10 h-10 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors bg-white dark:bg-slate-800 shadow-sm shadow-amber-50 dark:shadow-none"
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPdfOpen(true)}
            disabled={totalAmount === 0}
            className="bg-[#5A6531] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#5A6531]/20 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
          >
            <ShoppingBag className="w-4 h-4" /> Ordina
          </button>
        </div>
      </div>

      {/* OVERLAY PDF DOCUMENTO DI VENDITA */}
      {isPdfOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 w-full max-w-4xl h-full max-h-[95vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative">

            {/* Header / Toolbar del PDF */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 no-print">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Documento di Vendita #2026-001</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="p-1.5 hover:bg-white rounded-md transition text-slate-600" title="Stampa">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPdfOpen(false);
                  setLastOrderItems(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-100 text-rose-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenuto del "Foglio Bianco" */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 font-serif bg-white shadow-inner">
              {/* Intestazione Aziendale */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 md:gap-0">
                <div>
                  <img src="/images/logo_ortuso.png" alt="Ortuso Logo" className="h-12 w-auto object-contain mb-2" />
                  <p className="text-[10px] text-slate-500 font-sans uppercase tracking-widest leading-none">Olearia Ortuso Srl • Italia</p>
                  <div className="mt-4 text-xs font-sans text-slate-600 space-y-0.5">
                    <p>Via Colle Delle Api, 44</p>
                    <p>86100 Campobasso (CB)</p>
                    <p>P.IVA: IT 01234567890</p>
                    <p>Tel: +39 0874.62147</p>
                  </div>
                </div>
                <div className="text-right self-end">
                  <div className="inline-block px-4 py-2 border-2 border-slate-900 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Commessa d'Acquisto</h3>
                  </div>
                  <div className="text-xs font-sans text-slate-600">
                    <p>Data: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</span></p>
                    <p>Rif. Ordine: <span className="text-slate-900 font-bold">#2026-{Math.floor(Math.random() * 1000)}</span></p>
                  </div>
                </div>
              </div>

              {/* Dati Cliente */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 font-sans">
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Destinatario</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{user.companyName}</p>
                  <p className="text-xs text-slate-600 mt-1 italic">Indirizzo di spedizione verificato B2B</p>
                </div>
                <div className="p-4 bg-slate-50 md:bg-transparent border border-slate-100 md:border-0 rounded-lg md:rounded-none">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Fornitori Coinvolti</p>
                  <div className="text-[10px] text-slate-600 space-y-1">
                    {(() => {
                      const items = lastOrderItems || cart;
                      const categories = new Set(Object.keys(items).map(id => CATALOG_PRODUCTS.find(p => p.id === id)?.category));
                      const vendors: Record<string, string> = {
                        'Olio': 'Olearica Valle D\'Oro S.r.l.',
                        'Aceti': 'Acetai Modena & Tradizione S.r.l.',
                        'Pomodori': 'RossoVerace Conservi S.p.A.',
                        'Conserve': 'RossoVerace Conservi S.p.A.',
                        'Tartufo': 'Tuber & Co. Selezione Tartufo S.r.l.',
                        'Specialità': 'GustoItaliano Delizie S.r.l.'
                      };
                      return Array.from(categories).map(cat => cat ? (
                        <p key={cat}>• {cat}: <span className="font-bold text-slate-900">{vendors[cat] || 'Ortuso Logistics'}</span></p>
                      ) : null);
                    })()}
                  </div>
                </div>
              </div>

              {/* Tabella Prodotti */}
              <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0 mb-8">
                <table className="w-full text-left border-collapse font-sans min-w-[600px] md:min-w-0">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900">Descrizione Prodotto</th>
                      <th className="py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 text-center px-2">Unità</th>
                      <th className="py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 text-right px-2">Prezzo Unit.</th>
                      <th className="py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 text-center px-2">Q.tà</th>
                      <th className="py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 text-right">Totale Riga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {Object.entries(lastOrderItems || cart).map(([id, qty]) => {
                    const product = CATALOG_PRODUCTS.find(p => p.id === id);
                    if (!product) return null;
                    return (
                      <tr key={id} className="group">
                        <td className="py-4 pr-4">
                          <p className="text-xs md:text-sm font-bold text-slate-900 uppercase leading-tight">{product.name}</p>
                          <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5">{product.packageInfo}</p>
                        </td>
                        <td className="py-4 text-center text-[10px] text-slate-600 uppercase px-2">{product.unit}</td>
                        <td className="py-4 text-right text-xs text-slate-600 whitespace-nowrap px-2">€{product.price.toFixed(2)}</td>
                        <td className="py-4 text-center text-xs font-bold text-slate-900 px-2">{qty}</td>
                        <td className="py-4 text-right text-xs md:text-sm font-black text-slate-900 whitespace-nowrap">€{(product.price * qty).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>

              {/* Riepilogo Totali */}
              <div className="flex justify-end font-sans">
                <div className="w-full md:w-64 space-y-2">
                  {(() => {
                    const items = lastOrderItems || cart;
                    const subtotal = Object.entries(items).reduce((sum, [id, qty]) => {
                      const p = CATALOG_PRODUCTS.find(prod => prod.id === id);
                      return sum + (p ? p.price * qty : 0);
                    }, 0);
                    const discountPct = currentLevel.discountPct;
                    const discountAmount = subtotal * (discountPct / 100);
                    const netSubtotal = subtotal - discountAmount;
                    const vatAmount = netSubtotal * 0.22;
                    const totalDoc = netSubtotal + vatAmount;

                    return (
                      <>
                        <div className="flex justify-between text-xs text-slate-500 whitespace-nowrap">
                          <span>Imponibile Lordo:</span>
                          <span>€{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 whitespace-nowrap">
                          <span>Sconto B2B Loyalty ({discountPct}%):</span>
                          <span className="text-[#707E3D] font-bold">- €{discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 whitespace-nowrap font-bold border-t border-slate-100 pt-1 mt-1">
                          <span>Imponibile Netto:</span>
                          <span>€{netSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-2 whitespace-nowrap">
                          <span>IVA (22%):</span>
                          <span>€{vatAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline text-lg md:text-xl font-black text-slate-900 pt-2 whitespace-nowrap">
                          <span className="uppercase tracking-tighter">Totale Documento:</span>
                          <span className="flex items-baseline">
                            <span className="text-lg md:text-xl">&nbsp;€{totalDoc.toFixed(2)}</span>
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-10 md:mt-20 pt-8 border-t border-slate-100 text-[9px] text-slate-400 font-sans leading-relaxed text-center">
                Il presente documento non costituisce fattura. La merce viaggia con Documento di Trasporto accompagnatorio.
                Termini e condizioni di vendita e <a href="/privacy" className="underline text-[#707E3D]">Privacy Policy</a> disponibili sul portale B2B di Ortuso.
              </div>
            </div>

            {/* Footer Azione Finale */}
            <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-center items-center gap-4 no-print">
              {lastOrderItems ? (
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-[#707E3D] font-bold animate-pulse text-center">
                    <CheckCheck className="w-5 h-5 md:w-6 md:h-6" /> <span className="text-xs md:text-sm">ORDINE TRASMESSO CON SUCCESSO</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsPdfOpen(false);
                      setLastOrderItems(null);
                    }}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg w-full md:w-auto text-sm"
                  >
                    Chiudi Anteprima
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const discountAmount = totalAmount * (currentLevel.discountPct / 100);
                    const newOrder: Order = {
                      id: `ORD-${Date.now()}`,
                      date: new Date().toISOString(),
                      items: { ...cart },
                      total: totalAmount
                    };
                    saveOrder(newOrder);

                    setMessages(prev => [...prev, {
                      sender: 'ai',
                      text: `🚀 **Ordine Inviato con Successo!**\n\nAbbiamo ricevuto il tuo ordine per **${user.companyName}**.\n\n💰 **Risparmio Fedeltà**: Grazie al tuo livello **${currentLevel.name}**, hai risparmiato **€ ${discountAmount.toFixed(2)}**.\n\nPuoi scaricare il riepilogo PDF se necessario.`
                    }]);
                    setIsPdfOpen(false);
                    setCart({});
                  }}
                  className="bg-[#707E3D] hover:bg-[#5A6531] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-[#707E3D]/20 transition-all transform hover:-translate-y-0.5 w-full md:w-auto text-sm md:text-base"
                >
                  <CheckCheck className="w-5 h-5" /> Conferma & Invia Ordine Express
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      {/* OVERLAY CELEBRAZIONE A TUTTO SCHERMO */}
      {celebration && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Confetti Effect */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                backgroundColor: ['#707E3D', '#A1B06B', '#F59E0B', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
              }}
            />
          ))}

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-4 border-[#707E3D] p-12 rounded-[3rem] shadow-[0_0_100px_rgba(112,126,61,0.5)] flex flex-col items-center animate-celebrate pointer-events-auto relative max-w-[90vw]">
            <div className="absolute -top-16 bg-white dark:bg-slate-900 border-4 border-[#707E3D] p-6 rounded-full shadow-2xl">
              <Sparkles className="w-16 h-16 text-amber-500 animate-pulse" />
            </div>

            <h2 className="text-5xl font-black text-slate-900 dark:text-white mt-8 mb-2 text-center uppercase tracking-tighter">
              {celebration.type === 'level' ? 'Nuovo Livello!' : 'Premio Sbloccato!'}
            </h2>

            <p className="text-2xl font-bold text-[#707E3D] dark:text-[#A1B06B] mb-8 text-center italic tracking-tight">
              {celebration.type === 'level' ? `Benvenuto nel livello ${celebration.name}` : `Hai sbloccato: ${celebration.name}`}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setCelebration(null)}
                className="bg-[#707E3D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl hover:scale-105 transition-transform"
              >
                Fantastico!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY PROFILO CLIENTE & FIDELITY CARD */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => {
              setIsProfileOpen(false);
              setShowLogoutConfirm(false);
            }}
          />
          <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col relative border border-slate-200 dark:border-slate-800 animate-modal-enter max-h-[90vh] overflow-y-auto">
            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
              <button
                onClick={() => {
                  const newMode = !isDarkMode;
                  setIsDarkMode(newMode);
                  localStorage.setItem('theme', newMode ? 'dark' : 'light');
                  if (newMode) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                }}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setShowLogoutConfirm(false);
                }}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-[#707E3D]/10 border-2 border-[#707E3D]/20 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.companyName)}&background=707E3D&color=fff&size=128`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter break-words leading-tight">{user.companyName}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Account ID: <span className="font-mono text-xs">{user.id.substring(0, 8)}</span></p>
                  <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 bg-[#707E3D]/10 text-[#707E3D] dark:text-[#A1B06B] text-[10px] font-black uppercase rounded-full border border-[#707E3D]/20">
                      Ristorazione Partner
                    </span>
                  </div>
                </div>
              </div>

              {/* Fidelity Card Premium */}
              <div className={`relative w-full h-44 md:h-48 rounded-[2rem] p-6 md:p-8 overflow-hidden shadow-2xl transition-all duration-700 ${currentLevel.color} text-white group mb-6 md:mb-8`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Ortuso Fidelity Card</p>
                      <h4 className="text-2xl md:text-3xl font-black tracking-tighter italic leading-none mt-1">Livello {currentLevel.name}</h4>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Punti Accumulati</p>
                      <p className="text-3xl md:text-4xl font-black">{loyaltyPoints}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Sconto Riservato</p>
                      <p className="text-2xl md:text-3xl font-black italic">{currentLevel.discountPct}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge & Statistiche */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">I Tuoi Badge</h5>
                  <div className="flex flex-wrap gap-2">
                    {badges.length > 0 ? badges.map(b => (
                      <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-s font-bold text-[#707E3D] dark:text-[#A1B06B] shadow-sm">
                        {b === 'Cliente Storico' ? (
                          <img src="/images/customer-loyalty.png" alt="Loyalty Icon" className="w-5 h-5 object-contain" />
                        ) : b === 'Top Ordini EVO' ? (
                          <img src="/images/olive-oil-icon.png" alt="EVO Icon" className="w-5 h-5 object-contain" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                        <span className="text-xs">{b}</span>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-500 italic">Inizia ad ordinare per sbloccare badge esclusivi!</p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Prossimo Obiettivo</h5>
                  {currentLevel.next ? (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-500">Ordini Mancanti</span>
                        <span className={currentLevel.textColor}>{currentLevel.next - orders.length}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${currentLevel.color}`}
                          style={{ width: `${(orders.length / currentLevel.next) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-3 font-medium leading-relaxed">Al raggiungimento di {currentLevel.next} ordini totali sbloccherai il livello {getLoyaltyLevel(currentLevel.next).name}.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#707E3D] font-bold uppercase tracking-tighter">🏆 Hai raggiunto il massimo livello: {currentLevel.name}!</p>
                  )}
                </div>
              </div>

              {/* Separatore */}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-8" />

              {/* Storico Ordini */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storico Ordini</h5>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{orders.length} Ordini Totali</span>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {[...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
                      <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-[#707E3D]/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#707E3D]">
                            <History className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Ordine #{order.id.substring(0, 8)}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{new Date(order.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white italic">€{order.total.toFixed(2)}</p>
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="text-[9px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-[#707E3D] transition-colors"
                          >
                            Dettagli
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 italic">Non hai ancora effettuato ordini.</p>
                  </div>
                )}
              </div>

              {/* Pulsante Logout (Mobile/Generale) */}
              <div className="mt-12 mb-8">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-4 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-200 dark:border-rose-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout Account
                  </button>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950 p-6 rounded-[2rem] border border-rose-200 dark:border-rose-900 animate-in zoom-in duration-300">
                    <p className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tighter text-center mb-4">Sei sicuro di voler uscire?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="py-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={onLogout}
                        className="py-3 bg-rose-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20 text-xs"
                      >
                        Sì, Esci
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
      )}

      {/* OVERLAY CATALOGO PREMI */}
      {isRewardsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full md:max-w-4xl h-full max-h-[90vh] md:h-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setIsRewardsOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 bg-[#707E3D]/5 border-b border-[#707E3D]/10">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                Catalogo Premi B2B Ortuso
              </h3>
              <p className="text-[11px] md:text-sm text-slate-600 dark:text-slate-400 mt-1">Utilizza i tuoi punti fedeltà per riscattare premi esclusivi per la tua attività.</p>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {REWARDS.map(reward => {
                const canAfford = loyaltyPoints >= reward.points;
                return (
                  <div key={reward.id} className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 flex flex-col ${
                    canAfford
                      ? 'bg-white dark:bg-slate-900 border-[#707E3D]/30 shadow-xl hover:-translate-y-2'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-80'
                  }`}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl md:text-4xl mb-4 overflow-hidden">
                      {reward.image ? (
                        <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                      ) : (
                        reward.icon
                      )}
                    </div>
                    <div className="mb-4">
                      <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{reward.name}</h4>
                      <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">{reward.description}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punti</span>
                        <span className={`text-lg md:text-xl font-black ${canAfford ? 'text-[#707E3D] dark:text-[#A1B06B]' : 'text-slate-400'}`}>
                          {reward.points}
                        </span>
                      </div>
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          const newPoints = loyaltyPoints - reward.points;
                          const newRedemptions = { ...redemptions, [reward.id]: (redemptions[reward.id] || 0) + 1 };
                          saveLoyalty(newPoints, badges, newRedemptions);

                          setMessages(prev => [...prev, {
                            sender: 'ai',
                            text: `🎁 **Premio Riscattato!**\nHai riscattato **${reward.name}**. I punti sono stati detratti dal tuo saldo.\n\nIl premio verrà incluso nella tua prossima spedizione logistica. La soglia per questo premio è ora aumentata a **${reward.basePoints * (newRedemptions[reward.id] + 1)} punti**.`
                          }]);
                          setCelebration({ type: 'reward', name: reward.name });
                          setTimeout(() => setCelebration(null), 5000);
                          setIsRewardsOpen(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          canAfford
                            ? 'bg-[#707E3D] hover:bg-[#5A6531] text-white shadow-lg'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Riscatta' : 'Bloccato'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[100px] text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">I Tuoi Punti</p>
                  <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">{loyaltyPoints}</p>
                </div>
                <div className="flex-1 md:w-48 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (loyaltyPoints / Math.max(1, ...REWARDS.map(r => r.points))) * 100)}%` }} />
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 italic md:max-w-xs text-center md:text-right font-medium leading-relaxed">
                I premi fisici verranno consegnati insieme al tuo prossimo ordine logistico gestito da Ortuso.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY DETTAGLI ORDINE */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setSelectedOrderDetails(null)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#707E3D]/10 flex items-center justify-center text-[#707E3D]">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dettagli Ordine</h3>
                  <p className="text-xs text-slate-500 font-medium">ID: <span className="font-mono text-[10px]">{selectedOrderDetails.id}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-2">
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data Ordine</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {new Date(selectedOrderDetails.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stato</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Confermato</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Prodotti Ordinati</h5>
              <div className="space-y-4">
                {Object.entries(selectedOrderDetails.items).map(([productId, quantity]) => {
                  const product = CATALOG_PRODUCTS.find(p => p.id === productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xl overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            product.icon
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{product.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{product.unit} × {quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white italic">€{(product.price * quantity).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">€{product.price.toFixed(2)} / unit</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Totale Ordine</p>
                  <p className="text-[10px] text-slate-500 font-medium">IVA 22% inclusa ove applicabile</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#707E3D] italic leading-none">€{selectedOrderDetails.total.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl"
              >
                Chiudi Dettagli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY ZOOM IMMAGINE PRODOTTO */}
      {zoomedProduct && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500"
          onClick={() => setZoomedProduct(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
            onClick={() => setZoomedProduct(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-2xl w-full bg-white rounded-[40px] p-8 md:p-12 shadow-2xl animate-in zoom-in-50 duration-700 ease-out"
            onClick={e => e.stopPropagation()}
          >
            <img src={zoomedProduct.image} alt={zoomedProduct.name} className="w-full h-auto object-contain max-h-[70vh] rounded-3xl" />
            <div className="mt-8 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{zoomedProduct.packageInfo}</p>
              <h3 className="text-2xl font-black text-[#46501E] tracking-tight">{zoomedProduct.name}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
