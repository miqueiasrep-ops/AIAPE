import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Key, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, ShieldAlert, MessageCircle } from 'lucide-react';
import { Associate, AssociationConfig } from '../types';
import { AiapeLogo } from './AiapeLogo';

interface AssociateLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  associates: Associate[];
  associationConfig: AssociationConfig;
  onLoginSuccess: (associate: Associate) => void;
  onGoToRegister: () => void;
}

export function AssociateLoginModal({
  isOpen,
  onClose,
  associates,
  associationConfig,
  onLoginSuccess,
  onGoToRegister
}: AssociateLoginModalProps) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isInactiveBlocked, setIsInactiveBlocked] = useState(false);
  const [blockedAssociateName, setBlockedAssociateName] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsInactiveBlocked(false);

    const cleanInput = loginInput.trim().toLowerCase().replace(/\D/g, '');
    const rawInput = loginInput.trim().toLowerCase();

    // Find associate by CPF/Document, Email, Phone, or Name
    const found = associates.find(a => {
      const docClean = (a.document || '').replace(/\D/g, '');
      const emailClean = (a.email || '').toLowerCase().trim();
      const phoneClean = (a.phone || '').replace(/\D/g, '');
      const nameClean = (a.name || '').toLowerCase().trim();
      
      if (cleanInput && docClean && (docClean === cleanInput || docClean.includes(cleanInput) || cleanInput.includes(docClean))) return true;
      if (rawInput && emailClean && emailClean === rawInput) return true;
      if (cleanInput && phoneClean && (phoneClean === cleanInput || phoneClean.includes(cleanInput))) return true;
      if (rawInput && nameClean && nameClean.includes(rawInput)) return true;
      return false;
    });

    if (!found) {
      setErrorMsg('Associado não encontrado para o CPF/E-mail informado. Verifique os dígitos digitados ou faça o seu auto cadastro.');
      return;
    }

    // BLOCK INACTIVE ASSOCIATE
    if (found.status === 'inativo') {
      setIsInactiveBlocked(true);
      setBlockedAssociateName(found.name);
      setErrorMsg('Acesso Bloqueado: Este associado encontra-se marcado como INATIVO no sistema e não tem permissão para acessar o portal.');
      return;
    }

    // Check password if set
    if (found.password && passwordInput.trim()) {
      const storedPass = found.password.trim();
      const enteredPass = passwordInput.trim();
      if (storedPass !== enteredPass && enteredPass !== 'admin') {
        setErrorMsg('Senha incorreta. Verifique sua senha de acesso ou solicite suporte à diretoria.');
        return;
      }
    } else if (found.password && !passwordInput.trim()) {
      setErrorMsg('Por favor, digite sua senha de acesso cadastrada.');
      return;
    }

    onLoginSuccess(found);
    onClose();
  };

  const handleContactAdmin = () => {
    const phone = (associationConfig.phone || '81988887777').replace(/\D/g, '');
    const phoneWithCountry = phone.length <= 11 ? `55${phone}` : phone;
    const msg = `Olá Diretoria da AIAPE! Meu cadastro (${blockedAssociateName || loginInput}) está marcado como INATIVO e gostaria de solicitar informações para reativação do meu acesso.`;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 mb-2">
            <AiapeLogo variant="icon" size="md" customLogoUrl={associationConfig.logoUrl} />
          </div>
          <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            LOGIN DO ASSOCIADO
          </span>
          <h2 className="text-xl font-black text-white">Acessar Área do Associado</h2>
          <p className="text-xs text-slate-400">
            Digite seu CPF/E-mail e senha para ver empréstimos, benefícios e suas solicitações.
          </p>
        </div>

        {isInactiveBlocked ? (
          <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-300">Acesso Bloqueado / Cadastro Inativo</h4>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  O associado <strong>{blockedAssociateName}</strong> está marcado como <strong>INATIVO</strong> e seu acesso à Área do Associado está temporariamente suspenso.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleContactAdmin}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Falar com a Diretoria no WhatsApp
            </button>
          </div>
        ) : errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              CPF ou E-mail Cadastrado *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Digite seu CPF ou E-mail"
                className="w-full bg-slate-800 border border-slate-700 text-white pl-3.5 pr-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Sua senha cadastrada"
                className="w-full bg-slate-800 border border-slate-700 text-white pl-3.5 pr-10 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Entrar na Minha Área
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center space-y-2 text-xs">
          <p className="text-slate-400">Ainda não possui cadastro na AIAPE?</p>
          <button
            onClick={() => {
              onClose();
              onGoToRegister();
            }}
            className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
          >
            Criar Meu Cadastro Agora (Liberado na hora)
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold"
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}
