import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Users, 
  Award, 
  AlertCircle, 
  Calendar, 
  Filter, 
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Associate, AssociationConfig } from '../types';
import { generateAssociatesPdf, GeneratePdfResult } from '../utils/generateAssociatesPdf';
import { AiapeLogo } from './AiapeLogo';

interface AssociatePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  associates: Associate[];
  filteredAssociates: Associate[];
  config: AssociationConfig;
  currentStatusFilter?: string;
  currentCategoryFilter?: string;
  currentSearchTerm?: string;
}

export function AssociatePdfModal({
  isOpen,
  onClose,
  associates,
  filteredAssociates,
  config,
  currentStatusFilter = 'todos',
  currentCategoryFilter = 'todas',
  currentSearchTerm = ''
}: AssociatePdfModalProps) {
  const [scope, setScope] = useState<'filtered' | 'all'>('all');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfResult, setPdfResult] = useState<GeneratePdfResult | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Determinar lista alvo
  const targetAssociates = scope === 'filtered' ? filteredAssociates : associates;

  // Limpar estado quando abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setDownloadSuccess(false);
      setPdfResult(null);
    } else {
      // Se houver filtro ativo, seleciona 'filtered' por conveniência
      if (currentStatusFilter !== 'todos' || currentCategoryFilter !== 'todas' || currentSearchTerm.trim() !== '') {
        setScope('filtered');
      } else {
        setScope('all');
      }
    }
  }, [isOpen, currentStatusFilter, currentCategoryFilter, currentSearchTerm]);

  if (!isOpen) return null;

  const totalCount = targetAssociates.length;
  const activeCount = targetAssociates.filter(a => a.status === 'ativo' && !a.isExempt).length;
  const exemptCount = targetAssociates.filter(a => a.isExempt).length;
  const overdueCount = targetAssociates.filter(a => a.status === 'inadimplente').length;
  const pendingCount = targetAssociates.filter(a => a.status === 'pendente').length;

  const handleGenerateAndDownload = async () => {
    setIsGenerating(true);
    setDownloadSuccess(false);
    try {
      const filterLabel = scope === 'filtered' 
        ? `${currentStatusFilter !== 'todos' ? `Status: ${currentStatusFilter}` : 'Filtrados'}`
        : 'Quadro Completo de Associados';

      const result = await generateAssociatesPdf(targetAssociates, config, {
        orientation,
        includeSignatures,
        statusFilterLabel: filterLabel,
        categoryFilterLabel: currentCategoryFilter !== 'todas' ? currentCategoryFilter : undefined,
        searchTerm: currentSearchTerm || undefined,
        title: 'RELATÓRIO OFICIAL DE QUADRO DE ASSOCIADOS E INSTRUTORES'
      });

      setPdfResult(result);

      // Dispara o download automático do arquivo PDF
      result.doc.save(result.fileName);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Erro ao gerar PDF dos associados:', err);
      alert('Ocorreu um erro ao gerar o relatório em PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPreviewOrPrint = async () => {
    setIsGenerating(true);
    try {
      const result = pdfResult || await generateAssociatesPdf(targetAssociates, config, {
        orientation,
        includeSignatures,
        statusFilterLabel: scope === 'filtered' ? `Filtrados (${currentStatusFilter})` : 'Todos',
        categoryFilterLabel: currentCategoryFilter !== 'todas' ? currentCategoryFilter : undefined,
        searchTerm: currentSearchTerm || undefined
      });

      setPdfResult(result);

      // Abre a URL do Blob numa nova aba para impressão nativa ou visualização
      const win = window.open(result.blobUrl, '_blank');
      if (!win) {
        // Fallback: se o navegador bloquear popup, força o download direto
        result.doc.save(result.fileName);
      }
    } catch (err) {
      console.error('Erro ao abrir visualização do PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header com Logo da AIAPE */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
              <AiapeLogo customLogoUrl={config.logoUrl} size="sm" variant="icon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Relatório Oficial de Associados em PDF
                </h3>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  Com Logo Oficial AIAPE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gere e baixe o relatório cadastral timbrado com cabeçalho institucional e métricas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message if Downloaded */}
          {downloadSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Download concluído!</strong> O arquivo PDF foi gerado e baixado com sucesso.
                </span>
              </div>
              {pdfResult && (
                <button
                  onClick={handleOpenPreviewOrPrint}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-[11px] font-bold rounded-lg border border-emerald-500/40 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir PDF
                </button>
              )}
            </div>
          )}

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              1. Selecione o Escopo dos Registros:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Todos os Associados
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {associates.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inclui todo o quadro de membros cadastrados no sistema
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                    Apenas Filtrados na Tela
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {filteredAssociates.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Respeita a busca atual e os filtros de status ({currentStatusFilter})
                </p>
              </button>
            </div>
          </div>

          {/* Target Summary Snapshot */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Resumo do que constará no relatório:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-slate-400 block">Total de Membros</span>
                <span className="text-sm font-bold text-white">{totalCount}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-emerald-400 block">Ativos Regulares</span>
                <span className="text-sm font-bold text-emerald-400">{activeCount}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-purple-300 block">Isentos (Diretoria)</span>
                <span className="text-sm font-bold text-purple-300">{exemptCount}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-rose-400 block">Inadimplentes/Pend.</span>
                <span className="text-sm font-bold text-rose-400">{overdueCount + pendingCount}</span>
              </div>
            </div>
          </div>

          {/* Orientation & Visual Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Formato da Página:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Paisagem (A4 Horizontal)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Retrato (A4 Vertical)
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                *O formato Paisagem é recomendado para comportar todas as colunas de dados (SENATRAN, CNH, CPF).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Elementos Institucionais:</label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>Logomarca Oficial AIAPE no cabeçalho</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSignatures}
                    onChange={(e) => setIncludeSignatures(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>Assinaturas do Presidente e Tesoureiro</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenPreviewOrPrint}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Visualizar / Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAndDownload}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF com Logo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Relatório em PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
