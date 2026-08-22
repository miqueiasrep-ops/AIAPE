import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CloudUpload, 
  CloudCheck, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  HardDrive, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import { Associate, Transaction, AssociationEvent, AssociateRequest, AssociationConfig } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  associates: Associate[];
  transactions: Transaction[];
  events: AssociationEvent[];
  requests: AssociateRequest[];
  config: AssociationConfig;
  syncStatus: 'sincronizado' | 'sincronizando' | 'erro';
  isQuotaExceeded?: boolean;
  onForceSyncAll: () => Promise<{ associates: number; transactions: number; events: number; requests: number }>;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  associates,
  transactions,
  events,
  requests,
  syncStatus,
  isQuotaExceeded = false,
  onForceSyncAll
}: CloudSyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    associates: number;
    transactions: number;
    events: number;
    requests: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Read local storage counts
  const getLocalCount = (key: string): number => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed.length : 1;
      }
    } catch {
      return 0;
    }
    return 0;
  };

  const localAssociatesCount = getLocalCount('assoc_associates');
  const localTransactionsCount = getLocalCount('assoc_transactions');
  const localEventsCount = getLocalCount('assoc_events');
  const localRequestsCount = getLocalCount('assoc_requests');

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      const result = await onForceSyncAll();
      setSyncResult({
        success: true,
        ...result
      });
    } catch (err: any) {
      console.error('Erro ao sincronizar com nuvem:', err);
      setErrorMessage('Falha ao enviar registros para o banco de dados. Verifique a conexão com a internet e tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Sincronização com o Banco de Dados
            </h2>
            <p className="text-xs text-slate-400">
              Sincronize registros em memória local (cache) com o Firestore na Nuvem
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          syncStatus === 'sincronizado'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : syncStatus === 'sincronizando'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {syncStatus === 'sincronizado' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : syncStatus === 'sincronizando' ? (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <p className="text-xs font-bold">
                {syncStatus === 'sincronizado'
                  ? 'Banco de Dados Firestore Conectado & Operante'
                  : syncStatus === 'sincronizando'
                  ? 'Sincronizando dados em segundo plano...'
                  : 'Falha na conexão ou operando com cache local'}
              </p>
              <p className="text-[11px] opacity-80">
                Disponível em tempo real para todos os computadores, notebooks e celulares.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Cards: Local vs Cloud */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Local Cache */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-700 pb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" />
                Memória Local (Este Dispositivo)
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Associados:
                </span>
                <span className="font-bold text-white font-mono">{localAssociatesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Transações:
                </span>
                <span className="font-bold text-white font-mono">{localTransactionsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Eventos:
                </span>
                <span className="font-bold text-white font-mono">{localEventsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Solicitações:
                </span>
                <span className="font-bold text-white font-mono">{localRequestsCount}</span>
              </div>
            </div>
          </div>

          {/* Cloud Database */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-700 pb-2">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Nuvem (Firestore Oficial)
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Associados:
                </span>
                <span className="font-bold text-emerald-300 font-mono">{associates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Transações:
                </span>
                <span className="font-bold text-emerald-300 font-mono">{transactions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Eventos:
                </span>
                <span className="font-bold text-emerald-300 font-mono">{events.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Solicitações:
                </span>
                <span className="font-bold text-emerald-300 font-mono">{requests.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quota Exceeded & Blaze Plan Notice */}
        {isQuotaExceeded && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Limite de Cota Gratuita (Spark) Atingido</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              O limite gratuito diário de operações do plano Spark foi temporariamente atingido. Seu sistema continua operando com segurança usando o <strong>armazenamento local (cache)</strong>.
            </p>

            <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-lg space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Como funciona o Plano Blaze (Pay-as-you-go)?</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                <li>Você <strong>mantém a mesma cota gratuita de 20.000 gravações e 50.000 leituras por dia</strong> sem nenhum custo.</li>
                <li>Se ultrapassar a cota em dias de alto movimento (como importação de grandes planilhas), o custo é de apenas <strong>frações de centavos</strong> por milhar de operações adicionais.</li>
                <li>Você pode definir alertas de orçamento (ex: R$ 5,00/mês) no painel do Google Cloud para total controle.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0135824596/usage?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Ativar Plano Blaze no Firebase Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://firebase.google.com/pricing?hl=pt-br"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                <span>Ver Tabela de Preços do Firebase</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message if any */}
        {syncResult && syncResult.success && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sincronização com o Banco Concluída com Sucesso!</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 pl-6">
              Foram enviados e consolidados: {syncResult.associates} associados, {syncResult.transactions} transações, {syncResult.events} eventos e {syncResult.requests} solicitações.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sincronizando com Firestore...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Sincronizar Tudo com a Nuvem</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
