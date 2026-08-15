import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  Send, 
  CreditCard, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  HeartHandshake,
  DollarSign,
  Key,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  FileText,
  Upload,
  AlertCircle,
  FileCheck,
  Search,
  Loader2
} from 'lucide-react';
import { Associate, AssociateCategory, AssociationConfig } from '../types';
import { AiapeLogo } from './AiapeLogo';

interface PublicRegisterProps {
  associationConfig: AssociationConfig;
  onRegisterSuccess: (associate: Omit<Associate, 'id'>) => Associate;
  onBackToDashboard?: () => void;
  onEnterPortalDirectly?: (associate: Associate) => void;
}

export function PublicRegister({
  associationConfig,
  onRegisterSuccess,
  onBackToDashboard,
  onEnterPortalDirectly
}: PublicRegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    category: 'Membro Efetivo' as AssociateCategory,
    birthDate: '',
    password: '',
    notes: ''
  });

  // State for CEP lookup
  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const formatCep = (val: string) => {
    const numeric = val.replace(/\D/g, '').slice(0, 8);
    if (numeric.length > 5) {
      return `${numeric.slice(0, 5)}-${numeric.slice(5)}`;
    }
    return numeric;
  };

  const handleCepSearch = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('Por favor, digite um CEP válido com 8 dígitos.');
      return;
    }

    setCepLoading(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado. Por favor, verifique o CEP ou digite o endereço manualmente.');
      } else {
        const parts = [];
        if (data.logradouro) parts.push(data.logradouro);
        if (data.bairro) parts.push(data.bairro);
        if (data.localidade && data.uf) parts.push(`${data.localidade} - ${data.uf}`);

        const fullAddr = parts.join(', ');
        setFormData(prev => ({
          ...prev,
          address: fullAddr ? `${fullAddr}${data.logradouro ? ', Nº ' : ''}` : prev.address
        }));
        setCepError(null);
      }
    } catch {
      setCepError('Não foi possível buscar o CEP automaticamente. Digite o endereço manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      handleCepSearch(clean);
    }
  };

  // State for required PDF files
  const [docCnh, setDocCnh] = useState<{ name: string; url: string; size: string } | null>(null);
  const [docCrlv, setDocCrlv] = useState<{ name: string; url: string; size: string } | null>(null);
  const [docSenatran, setDocSenatran] = useState<{ name: string; url: string; size: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [createdAssociate, setCreatedAssociate] = useState<Associate | null>(null);
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'cnh' | 'crlv' | 'senatran'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Formato inválido! É OBRIGATÓRIO enviar o documento em formato PDF.');
      e.target.value = '';
      return;
    }

    setUploadError(null);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const item = { name: file.name, url: dataUrl, size: sizeMb };
      if (type === 'cnh') setDocCnh(item);
      if (type === 'crlv') setDocCrlv(item);
      if (type === 'senatran') setDocSenatran(item);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    // Validate mandatory PDF documents
    if (!docCnh || !docCrlv || !docSenatran) {
      setUploadError('Atenção: É OBRIGATÓRIO anexar os 3 documentos em PDF (1. CNH, 2. CRLV do veículo e 3. Credencial SENATRAN) para concluir o cadastro.');
      return;
    }

    // Use password entered or fallback to default
    const finalPassword = formData.password.trim() || `Aiape@${new Date().getFullYear()}`;

    const newAssociateData: Omit<Associate, 'id'> = {
      name: formData.name.trim(),
      document: formData.document.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      category: formData.category,
      status: 'ativo', // Allow immediate access upon registration
      monthlyFee: associationConfig.defaultMonthlyFee || 70,
      dueDay: associationConfig.defaultDueDay || 30,
      membershipDate: new Date().toISOString().split('T')[0],
      birthDate: formData.birthDate || undefined,
      password: finalPassword,
      documents: {
        cnhName: docCnh.name,
        cnhUrl: docCnh.url,
        crlvName: docCrlv.name,
        crlvUrl: docCrlv.url,
        senatranName: docSenatran.name,
        senatranUrl: docSenatran.url
      },
      notes: formData.notes ? `Auto-cadastro via portal. Mensagem: ${formData.notes}` : 'Auto-cadastro com documentação anexada (CNH, CRLV e Credencial SENATRAN)'
    };

    const created = onRegisterSuccess(newAssociateData);
    setCreatedAssociate(created);
  };

  const handleCopyPix = () => {
    const info = `Dados Bancários - ${associationConfig.name}\nBanco: ${associationConfig.primaryBank}\nCNPJ: ${associationConfig.cnpj}\nValor Mensalidade: R$ ${associationConfig.defaultMonthlyFee.toFixed(2)}`;
    navigator.clipboard.writeText(info);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Banner */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AiapeLogo variant="icon" size="lg" customLogoUrl={associationConfig.logoUrl} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              {associationConfig.name || 'Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)'}
            </h1>
            <p className="text-xs text-slate-400">Associação sem fins lucrativos • Instrutores de Pernambuco</p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Início
          </button>
        )}
      </div>

      <main className="max-w-2xl mx-auto w-full my-auto">
        <AnimatePresence mode="wait">
          {!createdAssociate ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header Box */}
              <div className="p-6 bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border-b border-slate-800">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full mb-3">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Seja Bem-vindo(a) à Nossa Associação
                </div>
                <h2 className="text-xl font-extrabold text-white">Formulário de Auto Cadastro de Novo Membro</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Preencha seus dados abaixo para se associar formalmente. Sua contribuição fortalece nossos projetos e ações comunitárias.
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria das Graças Silva"
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CPF ou CNPJ
                    </label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(81) 98765-4321"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Data de Nascimento (Para Aniversariantes do Mês)
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                {/* Password for Portal Access */}
                <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-400" />
                      Crie sua Senha de Acesso à Área do Associado
                    </label>
                    <span className="text-[10px] text-blue-400 font-semibold">Liberado na Hora</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Ex: MinhaSenha@2026 (ou deixe em branco para gerar auto)"
                      className="w-full bg-slate-900 border border-blue-700/60 text-xs text-white pl-3.5 pr-10 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Com este login e senha você poderá acessar a área restrita, pedir empréstimos com juros baixos e ver os benefícios.
                  </p>
                </div>

                {/* CEP e Endereço com Busca Automática */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          CEP (Busca Automática)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full bg-slate-800 border border-slate-700 text-xs text-white pl-3.5 pr-9 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleCepSearch(cep)}
                          disabled={cepLoading || cep.replace(/\D/g, '').length !== 8}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:opacity-30 cursor-pointer"
                          title="Buscar CEP na API ViaCEP"
                        >
                          {cepLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Endereço Residencial / Comercial
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, Bairro, Cidade - PE"
                        className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {cepLoading && (
                    <p className="text-[11px] text-blue-400 font-semibold flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando endereço automaticamente pelo CEP...
                    </p>
                  )}

                  {cepError && (
                    <p className="text-[11px] text-amber-400 font-medium">
                      ⚠️ {cepError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria Desejada
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AssociateCategory })}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Membro Efetivo">Membro Efetivo (Contribuição Regular - R$ {associationConfig.defaultMonthlyFee}/mês)</option>
                    <option value="Membro Doador">Membro Doador (Doações Espontâneas)</option>
                    <option value="Estudante / Especial">Estudante / Categoria Especial</option>
                    <option value="Voluntário">Voluntário (Participação Sem Custos)</option>
                  </select>
                </div>

                {/* Área de Anexo Obrigatório de Documentos em PDF */}
                <div className="bg-slate-800/80 border border-blue-500/30 p-4 sm:p-5 rounded-2xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Documentação Obrigatória (Anexar em PDF) *</h3>
                        <p className="text-[11px] text-slate-400">É obrigatório o envio dos 3 documentos abaixo em formato PDF para cadastramento.</p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                      3 PDFs Obrigatórios
                    </span>
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* CNH Box */}
                    <div className={`p-3.5 rounded-xl border transition-all ${docCnh ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          1. CNH (PDF) *
                        </span>
                        {docCnh && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      
                      {docCnh ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-emerald-300 font-semibold truncate" title={docCnh.name}>
                            ✓ {docCnh.name} ({docCnh.size})
                          </p>
                          <button
                            type="button"
                            onClick={() => setDocCnh(null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                          >
                            Remover e Alterar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl cursor-pointer bg-slate-950/40 hover:bg-blue-500/5 transition-all text-center">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] font-semibold text-blue-400">Selecionar PDF CNH</span>
                            <span className="text-[9px] text-slate-500">Formato .pdf</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'cnh')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* CRLV Box */}
                    <div className={`p-3.5 rounded-xl border transition-all ${docCrlv ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          2. CRLV Veículo (PDF) *
                        </span>
                        {docCrlv && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      
                      {docCrlv ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-emerald-300 font-semibold truncate" title={docCrlv.name}>
                            ✓ {docCrlv.name} ({docCrlv.size})
                          </p>
                          <button
                            type="button"
                            onClick={() => setDocCrlv(null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                          >
                            Remover e Alterar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl cursor-pointer bg-slate-950/40 hover:bg-blue-500/5 transition-all text-center">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] font-semibold text-blue-400">Selecionar PDF CRLV</span>
                            <span className="text-[9px] text-slate-500">Formato .pdf</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'crlv')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* SENATRAN Box */}
                    <div className={`p-3.5 rounded-xl border transition-all ${docSenatran ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          3. SENATRAN (PDF) *
                        </span>
                        {docSenatran && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      
                      {docSenatran ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-emerald-300 font-semibold truncate" title={docSenatran.name}>
                            ✓ {docSenatran.name} ({docSenatran.size})
                          </p>
                          <button
                            type="button"
                            onClick={() => setDocSenatran(null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                          >
                            Remover e Alterar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl cursor-pointer bg-slate-950/40 hover:bg-blue-500/5 transition-all text-center">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] font-semibold text-blue-400">Selecionar PDF SENATRAN</span>
                            <span className="text-[9px] text-slate-500">Credencial .pdf</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'senatran')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mensagem ou Observações (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Conte-nos como gostaria de colaborar com a associação..."
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>Mensalidade Social Sugerida:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(associationConfig.defaultMonthlyFee || 70)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    • Vencimento todo dia <strong>{associationConfig.defaultDueDay || 30}</strong>.
                    <br />
                    • Ao enviar o cadastro, seu acesso à Área do Associado será liberado imediatamente!
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Cadastrar e Liberar Acesso ao Portal
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Cadastro Realizado & Acesso Liberado!</h2>
                <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  Bem-vindo(a) à <strong className="text-white">{associationConfig.name}</strong>. Seus dados de acesso à Área do Associado foram criados e liberados com sucesso.
                </p>
              </div>

              {/* Login Credentials Box */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-500/40 rounded-xl p-5 text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                  <h3 className="text-xs font-extrabold text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Key className="w-4 h-4 text-blue-400" />
                    Suas Credenciais de Acesso ao Portal do Associado
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Acesso Ativo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Login de Acesso (CPF ou E-mail):</span>
                    <span className="font-extrabold text-white text-sm">
                      {createdAssociate.document || createdAssociate.email || createdAssociate.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Senha de Acesso:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {createdAssociate.password || 'Aiape@2026'}
                    </span>
                  </div>
                </div>

                {onEnterPortalDirectly && (
                  <button
                    onClick={() => onEnterPortalDirectly(createdAssociate)}
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Entrar na Área do Associado Agora
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-left space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-700 pb-2">
                  Resumo do Cadastro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nome:</span>
                    <span className="font-semibold text-white">{createdAssociate.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Categoria:</span>
                    <span className="font-semibold text-blue-400">{createdAssociate.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Telefone:</span>
                    <span className="font-semibold text-white">{createdAssociate.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mensalidade Padrão:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(createdAssociate.monthlyFee)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info Box */}
              <div className="bg-slate-800/80 border border-blue-500/30 rounded-xl p-5 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Dados Bancários da Associação para Pagamento
                  </h3>
                  <button
                    onClick={handleCopyPix}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-colors cursor-pointer"
                  >
                    {copiedBankInfo ? '✓ Dados Copiados!' : 'Copiar Dados Pix'}
                  </button>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>• <strong>Banco:</strong> {associationConfig.primaryBank || 'Banco do Brasil'}</p>
                  <p>• <strong>Favorecido:</strong> {associationConfig.name}</p>
                  <p>• <strong>Valor da Contribuição:</strong> {formatCurrency(createdAssociate.monthlyFee)}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCreatedAssociate(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cadastrar Outra Pessoa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center text-[10px] text-slate-500 mt-6 pt-4 border-t border-slate-900">
        {associationConfig.name} • {associationConfig.address || 'Sede Social'} • Contato: {associationConfig.phone || associationConfig.email}
      </footer>
    </div>
  );
}
