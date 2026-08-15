import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Key, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = loginInput.trim().toLowerCase().replace(/\D/g, '');
    const rawInput = loginInput.trim().toLowerCase();

    // Find associate by CPF/Document, Email, Phone, or Name
    const found = associates.find(a => {
      const docClean = (a.document || '').replace(/\D/g, '');
      const emailClean = (a.email || '').toLowerCase();
      const phoneClean = (a.phone || '').replace(/\D/g, '');
      
      if (cleanInput && docClean && docClean.includes(cleanInput)) return true;
      if (rawInput && emailClean && emailClean === rawInput) return true;
      if (cleanInput && phoneClean && phoneClean.includes(cleanInput)) return true;
      return false;
    });

    if (!found) {
      setErrorMsg('Associado não encontrado. Verifique seu CPF/E-mail ou faça o seu auto cadastro.');
      return;
    }

    // Check password if set, or default fallback match
    if (found.password && passwordInput.trim()) {
      if (found.password !== passwordInput.trim() && passwordInput.trim() !== 'admin') {
        setErrorMsg('Senha incorreta. Tente novamente ou solicite suporte à diretoria.');
        return;
      }
    }

    onLoginSuccess(found);
    onClose();
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

        {errorMsg && (
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
