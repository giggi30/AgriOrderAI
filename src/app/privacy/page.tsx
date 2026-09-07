import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Torna alla Dashboard
        </Link>

        <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
            Privacy Policy
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Ultimo aggiornamento: 2 settembre 2026</p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              1. Titolare del Trattamento dei Dati
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="font-bold text-slate-900 dark:text-white">Olearia Ortuso Srl</p>
              <p>Via Colle Delle Api, 44</p>
              <p>86100 Campobasso (CB) – Molise – Italy</p>
              <p className="mt-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">info@ortuso.com</span>
              </p>
              <p>Tel: +39 0874.62147</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              2. Tipologie di Dati raccolti
            </h2>
            <p className="mb-4">
              Fra i Dati Personali raccolti da questo sito, in modo autonomo o tramite terze parti, ci sono:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600 dark:text-slate-300">
              <li>Dati di utilizzo e Cookie (per il funzionamento tecnico del portale).</li>
              <li>Nome, Cognome ed Email (forniti volontariamente per la gestione degli ordini).</li>
              <li>Dati relativi alla transazione e alla logistica degli ordini B2B.</li>
              <li>Indirizzi IP e identificativi dei dispositivi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              3. Finalità del Trattamento
            </h2>
            <p className="mb-4">
              I Dati dell'Utente sono raccolti per consentire al Titolare di fornire i propri Servizi, nonché per le seguenti finalità:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Gestione Ordini</h3>
                <p className="text-sm">Esecuzione del contratto di vendita e logistica dei prodotti agroalimentari.</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Assistenza AI</h3>
                <p className="text-sm">Interazione con AgriOrder AI per facilitare il processo di ordinazione.</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Sicurezza</h3>
                <p className="text-sm">Prevenzione di frodi e protezione del sistema da accessi non autorizzati.</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Statistica</h3>
                <p className="text-sm">Analisi dei flussi di vendita (in forma aggregata e anonima).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Base giuridica del trattamento</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Il Titolare tratta Dati Personali relativi all’Utente in caso sussista una delle seguenti condizioni:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600 dark:text-slate-300 italic">
              <li>l’Utente ha prestato il consenso per una o più finalità specifiche;</li>
              <li>il trattamento è necessario all’esecuzione di un contratto con l’Utente;</li>
              <li>il trattamento è necessario per adempiere un obbligo legale al quale è soggetto il Titolare.</li>
            </ul>
          </section>

          <section className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
            <p className="text-slate-500 text-sm">
              Questa informativa è redatta sulla base di molteplici ordinamenti legislativi, inclusi gli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
