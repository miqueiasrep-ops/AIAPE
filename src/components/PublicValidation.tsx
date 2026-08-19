import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Building2, 
  Calendar, 
  FileText, 
  ExternalLink, 
  ArrowLeft,
  Lock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { Associate, AssociationConfig } from '../types';
import { AiapeLogo } from './AiapeLogo';

interface PublicValidationProps {
  associateId: string;
  associates: Associate[];
  associationConfig: AssociationConfig;
  onBack: () => void;
}

export function PublicValidation({
  associateId,
  associates,
  associationConfig,
  onBack
}: PublicValidationProps) {
  const associate = associates.find(
    a => a.id === associateId || a.registrationNumber === associateId || a.document === associateId
  );

  const regNumber = associate?.registrationNumber || `AIAPE-${associate?.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '2026'}`;
  const senatranNumber = associate?.senatranCredential || 'CADASTRADA NO SISTEMA';
  const cnhCat = associate?.cnhCategory || 'AB';
  const validityYear = associate?.validityDate || 'DEZ/2026';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl space-y-0"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 text-center space-y-3">
          <div className="flex justify-center">
            <AiapeLogo variant="full" size="md" customLogoUrl={associationConfig.logoUrl} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase block">
              PORTAL PÚBLICO DE VALIDAÇÃO DIGITAL
            </span>
            <h1 className="text-base sm:text-lg font-black text-white mt-1">
              Verificação Oficial de Credencial AIAPE
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {associate ? (
            <>
              {/* Authenticity Badge */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {associate.status === 'ativo' ? 'Associado Regular / Ativo' : associate.status.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Credencial digital autêntica, cadastrada e validada no banco de dados da AIAPE.
                  </p>
                </div>
              </div>

              {/* Exemption Highlight if applicable */}
              {associate.isExempt && (
                <div className="p-3.5 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-purple-200">
                  <Gift className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Beneficiário de Isenção da Diretoria</span>
                    <span className="text-[11px] text-purple-300">
                      Motivo: {associate.exemptionInfo?.reason || 'Reconhecimento / Diretoria'}
                    </span>
                  </div>
                </div>
              )}

              {/* Associate Profile & Photo */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                {associate.photoUrl ? (
                  <img
                    src={associate.photoUrl}
                    alt={associate.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-black text-2xl text-blue-400 shrink-0">
                    {associate.name.charAt(0)}
                    <span className="text-[9px] text-slate-500 font-normal mt-1">SEM FOTO</span>
                  </div>
                )}

                <div className="space-y-1 overflow-hidden">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Instrutor(a) de Trânsito:
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-white truncate">
                    {associate.name}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">{associate.category}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    CPF: {associate.document ? `${associate.document.slice(0, 7)}***-**` : 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Technical / Professional Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-amber-400 block flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    Credencial SENATRAN:
                  </span>
                  <span className="font-mono font-black text-white text-xs block">
                    {senatranNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">
                    Categoria CNH:
                  </span>
                  <span className="font-mono font-bold text-white text-xs block">
                    {cnhCat}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">
                    Registro AIAPE:
                  </span>
                  <span className="font-mono font-bold text-blue-300 text-xs block">
                    {regNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">
                    Validade da Carteira:
                  </span>
                  <span className="font-bold text-emerald-400 text-xs block">
                    {validityYear}
                  </span>
                </div>
              </div>

              {/* Institutional Statement */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                <p>
                  <strong>Entidade Emissora:</strong> {associationConfig.name}
                </p>
                <p>
                  Certificado digital emitido com base no Estatuto Social da AIAPE e na Lei Federal nº 9.503/1997 (Código de Trânsito Brasileiro).
                </p>
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Associado Não Encontrado</h3>
              <p className="text-xs text-slate-400">
                O código de validação informado não corresponde a nenhum associado ativo no momento.
              </p>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Acessar Portal da Associação</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
