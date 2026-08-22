import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Download, 
  Camera, 
  Upload, 
  Check, 
  Copy, 
  ExternalLink, 
  Award, 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  Shield, 
  CheckCircle2,
  Sparkles,
  RefreshCw,
  RotateCw,
  Edit3,
  Save,
  MessageCircle,
  X,
  Gift
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Associate, AssociationConfig } from '../types';
import { AiapeLogo } from './AiapeLogo';

interface AssociateCardProps {
  associate: Associate;
  associationConfig: AssociationConfig;
  onUpdateAssociate?: (associate: Associate) => Promise<void> | void;
  isEditable?: boolean;
}

export function AssociateCard({
  associate,
  associationConfig,
  onUpdateAssociate,
  isEditable = true
}: AssociateCardProps) {
  const [cardSide, setCardSide] = useState<'frente' | 'verso'>('frente');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBirthDate, setEditBirthDate] = useState(associate.birthDate || '');
  const [editSenatran, setEditSenatran] = useState(associate.senatranCredential || '');
  const [editCnhCat, setEditCnhCat] = useState(associate.cnhCategory || 'AB');
  const [editRegNumber, setEditRegNumber] = useState(associate.registrationNumber || '');
  const [editValidity, setEditValidity] = useState(associate.validityDate || 'DEZ/2026');
  const [isSavingData, setIsSavingData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when associate changes
  React.useEffect(() => {
    setEditBirthDate(associate.birthDate || '');
    setEditSenatran(associate.senatranCredential || '');
    setEditCnhCat(associate.cnhCategory || 'AB');
    setEditRegNumber(associate.registrationNumber || '');
    setEditValidity(associate.validityDate || 'DEZ/2026');
  }, [associate]);

  const handleSaveCardDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateAssociate) return;
    setIsSavingData(true);
    try {
      const updated: Associate = {
        ...associate,
        birthDate: editBirthDate.trim(),
        senatranCredential: editSenatran.trim(),
        cnhCategory: editCnhCat,
        registrationNumber: editRegNumber.trim(),
        validityDate: editValidity.trim()
      };
      await onUpdateAssociate(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error('Erro ao salvar dados da carteira:', err);
      alert('Erro ao atualizar os dados. Tente novamente.');
    } finally {
      setIsSavingData(false);
    }
  };

  // Generate real validation URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aiape.org.br';
  const validationUrl = `${origin}/?validar=${encodeURIComponent(associate.id)}`;

  // Registration formatting
  const regNumber = associate.registrationNumber || `AIAPE-${associate.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '2026'}`;
  const senatranNumber = associate.senatranCredential || 'NÃO INFORMADA';
  const cnhCat = associate.cnhCategory || 'AB';
  const validityYear = associate.validityDate || 'DEZ/2026';

  const handleCopyValidationLink = () => {
    navigator.clipboard.writeText(validationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = (associate.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const text = `🪪 *CARTEIRA DIGITAL OFICIAL - AIAPE*\n\n` +
      `*Instrutor(a):* ${associate.name}\n` +
      `*Credencial SENATRAN:* ${senatranNumber}\n` +
      `*Categoria CNH:* ${cnhCat}\n` +
      `*Matrícula:* ${regNumber}\n` +
      `*Validade:* ${validityYear}\n` +
      `*Status:* ${associate.isExempt ? 'Ativo (Isento pela Diretoria)' : associate.status === 'ativo' ? 'Ativo / Regular' : 'Pendente'}\n\n` +
      `🔗 *Link de Validação com QR Code Oficial:*\n${validationUrl}\n\n` +
      `_AIAPE - Associação dos Instrutores de Autoescolas de Pernambuco_`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Optimize/compress image using canvas if large
        const img = new Image();
        img.src = base64;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400; // 3x4 photo optimized

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedPhotoUrl = canvas.toDataURL('image/jpeg', 0.85);

            const updated: Associate = {
              ...associate,
              photoUrl: optimizedPhotoUrl
            };

            if (onUpdateAssociate) {
              await onUpdateAssociate(updated);
            }
          }
          setIsUploadingPhoto(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao salvar foto 3x4:', err);
      setIsUploadingPhoto(false);
      alert('Não foi possível salvar a foto. Tente novamente.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl print:hidden">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCardSide('frente')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              cardSide === 'frente'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Frente do Cartão
          </button>
          <button
            onClick={() => setCardSide('verso')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              cardSide === 'verso'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Verso do Cartão
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                title="Editar Credencial SENATRAN e Dados da Carteira"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Editar Dados / SENATRAN</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                title="Alterar ou Enviar Foto 3x4 do Associado"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{associate.photoUrl ? 'Trocar Foto' : 'Adicionar Foto 3x4'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleShareWhatsApp}
            title="Compartilhar Carteira Digital via WhatsApp"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-950"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
            <span>Enviar WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            title="Imprimir Carteira em Alta Resolução"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleCopyValidationLink}
            title="Copiar Link de Autenticidade do QR Code"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>
      </div>

      {/* CARTEIRINHA DIGITAL - OFICIAL FRENTE E VERSO */}
      <div className="perspective-1000">
        <AnimatePresence mode="wait">
          {cardSide === 'frente' ? (
            /* FRENTE DA CARTEIRA */
            <motion.div
              key="frente"
              initial={{ opacity: 0, rotateY: -15, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 15, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-white select-none"
            >
              {/* Background watermark security texture */}
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header with AIAPE Logo & Official Identity */}
              <div className="relative z-10 border-b border-blue-500/30 pb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                    <AiapeLogo variant="icon" size="md" customLogoUrl={associationConfig.logoUrl} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black tracking-tight text-white line-clamp-1">
                      {associationConfig.name || 'AIAPE - ASSOCIAÇÃO DOS INSTRUTORES DE TRÂNSITO'}
                    </h3>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>Pernambuco</span>
                      <span>•</span>
                      <span>Instrutores de Trânsito Autônomos</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    OFICIAL
                  </span>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">Nº {regNumber}</p>
                </div>
              </div>

              {/* Card Title Ribbon */}
              <div className="relative z-10 my-3 text-center">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-blue-300 uppercase bg-blue-900/40 border border-blue-500/30 px-3.5 py-1 rounded-full inline-block">
                  CARTEIRA DE IDENTIDADE PROFISSIONAL DO INSTRUTOR
                </span>
              </div>

              {/* Main Body: Photo + Details + Real QR Code */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                
                {/* Left Column: Associate 3x4 Photo (sm: 4 cols) */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-slate-950 shadow-xl flex items-center justify-center relative">
                      {associate.photoUrl ? (
                        <img
                          src={associate.photoUrl}
                          alt={associate.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                          <User className="w-12 h-12 text-slate-600" />
                          <span className="text-[10px] text-slate-400 font-bold">Foto 3x4</span>
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[9px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                            >
                              + Enviar Foto
                            </button>
                          )}
                        </div>
                      )}

                      {/* Official security holographic corner mark */}
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400/30 border border-amber-300/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      </div>
                    </div>

                    {isEditable && associate.photoUrl && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-400 rounded-lg border border-amber-400/50 text-[10px] shadow-lg cursor-pointer transition-all"
                        title="Alterar Foto 3x4"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-400 font-mono mt-1.5 uppercase">
                    REGISTRO AIAPE
                  </span>
                </div>

                {/* Center Column: Official Personal & Professional Details (sm: 5 cols) */}
                <div className="sm:col-span-5 space-y-2 text-xs">
                  <div>
                    <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Nome do Instrutor(a):
                    </span>
                    <span className="font-black text-white text-sm tracking-tight line-clamp-2">
                      {associate.name}
                    </span>
                  </div>

                  {/* SENATRAN Credential - HIGHLIGHTED & CLICK-TO-EDIT */}
                  <div 
                    onClick={() => isEditable && setShowEditModal(true)}
                    className={`p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-0.5 transition-all ${
                      isEditable ? 'hover:bg-amber-500/20 hover:border-amber-400 cursor-pointer group' : ''
                    }`}
                    title={isEditable ? 'Clique para alterar a Credencial SENATRAN' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        Credencial SENATRAN:
                      </span>
                      {isEditable && (
                        <span className="text-[8px] text-amber-400/80 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                          <Edit3 className="w-2.5 h-2.5" /> Editar
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-white text-xs block">
                      {senatranNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        CPF / Doc:
                      </span>
                      <span className="font-mono font-bold text-blue-300 text-[11px]">
                        {associate.document || 'Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        Cat. CNH:
                      </span>
                      <span className="font-mono font-bold text-white text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 inline-block">
                        {cnhCat}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        Categoria:
                      </span>
                      <span className="font-bold text-slate-200 text-[10px] truncate block">
                        {associate.category}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        Validade:
                      </span>
                      <span className="font-bold text-emerald-400 text-[10px] block">
                        {validityYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Real Scannable QR Code (sm: 3 cols) */}
                <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl text-slate-900 text-center">
                  <div className="p-1 bg-white rounded-xl shadow-inner">
                    <QRCodeSVG
                      value={validationUrl}
                      size={95}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[8px] font-extrabold uppercase tracking-tight text-slate-800 mt-1.5 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    QR CODE OFICIAL
                  </span>
                  <span className="text-[7px] text-slate-600 font-mono">
                    VALIDAÇÃO AIAPE
                  </span>
                </div>

              </div>

              {/* Bottom Footer Bar: Status & Digital Signature */}
              <div className="relative z-10 mt-4 pt-3 border-t border-blue-500/30 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-black text-emerald-400 uppercase tracking-wide">
                    STATUS: {associate.status === 'ativo' ? 'ASSOCIADO REGULAR / ATIVO' : associate.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[9px]">
                  <span>Filiação: <strong>{associate.membershipDate || '2026-08-01'}</strong></span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setShowValidationModal(true)}
                    className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    Ver Certificado
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* VERSO DA CARTEIRA */
            <motion.div
              key="verso"
              initial={{ opacity: 0, rotateY: 15, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border-2 border-blue-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-white select-none space-y-4"
            >
              {/* Magnetic stripe simulation */}
              <div className="w-full h-8 bg-slate-950 border-y border-slate-800 -mx-5 sm:-mx-7 px-5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>AIAPE PERNAMBUCO • IDENTIDADE DO ASSOCIADO</span>
                <span>{associate.document}</span>
              </div>

              {/* Institutional Statement */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-[11px] leading-relaxed text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Declaração de Regularidade Profissional</span>
                </div>
                <p>
                  O portador deste documento é <strong>Instrutor de Trânsito Autônomo</strong> devidamente associado à <strong>AIAPE</strong>, cadastrado com credencial SENATRAN e habilitado a usufruir dos convênios, assessoria jurídica, assistência e descontos da associação.
                </p>
                <p className="text-[10px] text-slate-400">
                  Documento emitido com base no Estatuto Social da AIAPE e na legislação de trânsito em vigor (Lei Federal nº 9.503/1997 e Resoluções CONTRAN/SENATRAN).
                </p>
              </div>

              {/* Association Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Entidade Emissora:</span>
                  <span className="font-semibold text-white text-[11px] block">{associationConfig.name}</span>
                  <span className="text-[10px] text-slate-400">CNPJ: {associationConfig.cnpj || '24.810.192/0001-85'}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Contato e Suporte:</span>
                  <span className="font-semibold text-white text-[11px] block">{associationConfig.phone || '(81) 98888-7777'}</span>
                  <span className="text-[10px] text-slate-400">{associationConfig.email || 'contato@aiape.org.br'}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-2 grid grid-cols-2 gap-6 text-center text-xs">
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-white text-[11px]">{associationConfig.president || 'Presidência AIAPE'}</p>
                  <p className="text-[9px] text-slate-400">Presidente da AIAPE</p>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-white text-[11px]">{associationConfig.treasurer || 'Tesouraria / Diretoria'}</p>
                  <p className="text-[9px] text-slate-400">Diretoria Executiva</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="text-center pt-1 border-t border-slate-800/80">
                <span className="text-[9px] text-slate-500 font-mono">
                  Validação de Autenticidade Digital: {validationUrl}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DE CERTIFICADO DE VALIDAÇÃO OFICIAL */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white relative"
            >
              <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  AUTENTICIDADE CONFIRMADA
                </span>
                <h3 className="text-lg font-black text-white">Certificado Oficial de Validação</h3>
                <p className="text-xs text-slate-400">
                  Dados verificados diretamente no banco de associados da AIAPE.
                </p>
              </div>

              <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  {associate.photoUrl ? (
                    <img
                      src={associate.photoUrl}
                      alt={associate.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded-xl object-cover border border-amber-400"
                    />
                  ) : (
                    <div className="w-14 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-sm">{associate.name}</h4>
                    <p className="text-slate-400 text-xs">CPF: <strong className="text-blue-300">{associate.document}</strong></p>
                    <p className="text-amber-400 font-mono text-xs font-bold">Credencial SENATRAN: {senatranNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Categoria Associativa:</span>
                    <span className="font-semibold text-slate-200">{associate.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Categoria CNH:</span>
                    <span className="font-semibold text-slate-200">{cnhCat}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Matrícula AIAPE:</span>
                    <span className="font-mono text-slate-200">{regNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">{associate.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowValidationModal(false)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Certificado
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* MODAL DE EDIÇÃO RÁPIDA DA CREDENCIAL SENATRAN E DADOS DA CARTEIRA */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">Editar Dados da Carteira Digital</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCardDetails} className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Associado:</span>
                  <p className="text-xs font-black text-white">{associate.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">CPF: {associate.document || 'Não informado'}</p>
                </div>

                {/* Campo Credencial SENATRAN */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Número da Credencial SENATRAN / DETRAN
                  </label>
                  <input
                    type="text"
                    required
                    value={editSenatran}
                    onChange={(e) => setEditSenatran(e.target.value)}
                    placeholder="Ex: SENATRAN-PE: 489210 ou 489210"
                    className="w-full bg-slate-950 border border-amber-500/50 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Número oficial que constará no crachá da carteirinha e na validação do QR Code.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Categoria CNH */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Categoria CNH
                    </label>
                    <select
                      value={editCnhCat}
                      onChange={(e) => setEditCnhCat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="AB">AB (Carro e Moto)</option>
                      <option value="B">B (Carro / Automóvel)</option>
                      <option value="A">A (Moto / Motocicleta)</option>
                      <option value="AD">AD (Ônibus e Moto)</option>
                      <option value="AE">AE (Carreta e Moto)</option>
                      <option value="D">D (Ônibus / Coletivo)</option>
                      <option value="E">E (Carreta / Articulado)</option>
                      <option value="C">C (Caminhão)</option>
                    </select>
                  </div>

                  {/* Validade */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Validade
                    </label>
                    <input
                      type="text"
                      value={editValidity}
                      onChange={(e) => setEditValidity(e.target.value)}
                      placeholder="Ex: DEZ/2026"
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Matrícula AIAPE & Data de Nascimento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Matrícula AIAPE
                    </label>
                    <input
                      type="text"
                      value={editRegNumber}
                      onChange={(e) => setEditRegNumber(e.target.value)}
                      placeholder="Ex: AIAPE-8421"
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-amber-400" />
                      Nascimento
                    </label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingData ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar Dados</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
