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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              1. Titolare e Responsabile del Trattamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Controller */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block mb-2">Titolare del Trattamento (Controller)</span>
                <p className="font-bold text-slate-900 dark:text-white text-lg">Olearia Ortuso Srl</p>
                <p className="text-sm text-slate-500">Via Colle Delle Api, 44</p>
                <p className="text-sm text-slate-500">86100 Campobasso (CB) – Molise – Italy</p>
                <p className="mt-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">info@ortuso.com</span>
                </p>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed italic">
                  Il Titolare raccoglie ed elabora i dati per finalità di vendita, fatturazione e gestione dei programmi fedeltà.
                </p>
              </div>

              {/* Data Processor */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 block mb-2">Responsabile del Trattamento (Processor)</span>
                <p className="font-bold text-slate-900 dark:text-white text-lg">I-MARK Srl</p>
                <p className="text-sm text-slate-500">Via M. Bologna, 15</p>
                <p className="text-sm text-slate-500">86100 CAMPOBASSO</p>
                <p className="text-xs text-slate-500 font-mono">P.IVA 01782790701</p>
                <p className="mt-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-600 dark:text-blue-400">info@i-mark.it</span>
                </p>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed italic">
                  I-MARK tratta i dati esclusivamente per conto del Titolare al fine di garantire il funzionamento tecnico dell'infrastruttura web/app.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              2. Finalità e Modalità del Trattamento
            </h2>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Frantoio Ortuso, in qualità di Titolare, decide le finalità e le modalità del trattamento dei dati per i seguenti scopi:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase text-xs tracking-widest">Vendita & Logistica</h3>
                <p className="text-sm">Gestione dell'ordine, spedizione della merce e adempimenti contabili/fiscali.</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase text-xs tracking-widest">Fidelity & Profilazione</h3>
                <p className="text-sm">Gestione dei punti fedeltà, sconti personalizzati e analisi delle abitudini di acquisto.</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-500 italic">
              L'infrastruttura tecnologica è fornita da I-MARK Srl, che opera come Responsabile del Trattamento garantendo la sicurezza tecnica dei dati.
            </p>
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
