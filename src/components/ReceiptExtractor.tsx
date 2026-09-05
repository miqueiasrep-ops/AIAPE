import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  Sparkles, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  User,
  Tag,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Maximize2,
  Download,
  ZoomIn
} from 'lucide-react';
import { 
  ExtractionResult, 
  Transaction, 
  Associate,
  MONTH_NAMES, 
  CATEGORIES, 
  BANKS,
  TransactionType,
  TransactionStatus 
} from '../types';

interface ReceiptExtractorProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  associates?: Associate[];
  onRegisterPayment?: (associate: Associate, month: string, value: number, date: string, bank: string, attachmentUrl?: string, attachmentName?: string) => void;
}

export default function ReceiptExtractor({ 
  onAddTransaction,
  associates = [],
  onRegisterPayment
}: ReceiptExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isFullscreenImage, setIsFullscreenImage] = useState<boolean>(false);

  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  
  // State for extracted data review
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractionResult>({
    pagador: '',
    banco: '',
    valor: 0,
    data: '',
    mes: '',
    tipo: 'receita',
    categoria: 'Mensalidades de Associados',
    descricao: ''
  });
  const [paymentStatus, setPaymentStatus] = useState<TransactionStatus>('pago');

  // Associate Auto-Matching State
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>('');
  const [autoDischarge, setAutoDischarge] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to match associate by name or document
  const findMatchingAssociate = (pagadorStr: string, descStr: string): Associate | null => {
    if (!associates || associates.length === 0) return null;
    const combined = `${pagadorStr || ''} ${descStr || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!combined) return null;

    for (const assoc of associates) {
      const cleanName = (assoc.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      
      // Check full or partial string overlap
      if (cleanName && (combined.includes(cleanName) || cleanName.includes(combined))) {
        return assoc;
      }
      
      // Check by first and last name combination
      const parts = cleanName.split(' ').filter(p => p.length > 2);
      if (parts.length >= 2) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        if (combined.includes(firstName) && combined.includes(lastName)) {
          return assoc;
        }
      }

      // Check CPF/Document match
      if (assoc.document) {
        const cleanDoc = assoc.document.replace(/\D/g, '');
        if (cleanDoc && cleanDoc.length >= 5 && combined.replace(/\D/g, '').includes(cleanDoc)) {
          return assoc;
        }
      }
    }
    return null;
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Process and extract receipt
  const processFile = async (selectedFile: File) => {
    let resolvedMime = selectedFile.type;
    if (!resolvedMime || resolvedMime === 'application/octet-stream') {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') resolvedMime = 'image/jpeg';
      else if (ext === 'png') resolvedMime = 'image/png';
      else if (ext === 'webp') resolvedMime = 'image/webp';
      else if (ext === 'pdf') resolvedMime = 'application/pdf';
      else resolvedMime = 'image/jpeg';
    }
    if (resolvedMime === 'image/jpg') {
      resolvedMime = 'image/jpeg';
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(resolvedMime) && !selectedFile.type.startsWith('image/')) {
      setError('Formato não suportado. Por favor, envie uma imagem (JPG, PNG, WEBP) ou documento PDF.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('O arquivo excede o limite de 15MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccessNotice(null);
    setLoading(true);
    setExtraction(null);
    setIsReviewing(false);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setFilePreviewUrl(base64String);
        const base64Data = base64String.split(',')[1];
        
        try {
          const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType: resolvedMime,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Erro na extração com IA');
          }

          let sanitizedDate = result.data;
          if (result.data && result.data.includes('/')) {
            const parts = result.data.split('/');
            if (parts.length === 3) {
              sanitizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          let capitalizedMonth: string = MONTH_NAMES[0];
          if (result.mes) {
            const foundMonth = MONTH_NAMES.find(m => m.toLowerCase() === result.mes.toLowerCase().trim());
            if (foundMonth) {
              capitalizedMonth = foundMonth;
            } else {
              const dateObj = new Date((sanitizedDate || new Date().toISOString().split('T')[0]) + 'T12:00:00');
              if (!isNaN(dateObj.getTime())) {
                capitalizedMonth = MONTH_NAMES[dateObj.getMonth()];
              }
            }
          }

          const transType: TransactionType = result.tipo === 'despesa' ? 'despesa' : 'receita';
          const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === result.categoria?.toLowerCase()?.trim()) || 'Mensalidades de Associados';

          const finalExtraction: ExtractionResult = {
            pagador: result.pagador || '',
            banco: result.banco || 'Nubank',
            valor: Number(result.valor) || 0,
            data: sanitizedDate || new Date().toISOString().split('T')[0],
            mes: capitalizedMonth,
            tipo: transType,
            categoria: matchedCategory,
            descricao: result.descricao || 'Comprovante PIX Mensalidade'
          };

          // Try matching associate automatically
          const matchedAssoc = findMatchingAssociate(finalExtraction.pagador, finalExtraction.descricao);
          if (matchedAssoc) {
            setSelectedAssociateId(matchedAssoc.id);
            setAutoDischarge(true);
            finalExtraction.tipo = 'receita';
            finalExtraction.categoria = 'Mensalidades de Associados';
            finalExtraction.pagador = matchedAssoc.name;
          } else {
            setSelectedAssociateId('');
            setAutoDischarge(false);
          }

          setExtraction(finalExtraction);
          setEditedData(finalExtraction);
          setFallbackNotice(result.fallbackNotice || null);
          setIsReviewing(true);
        } catch (err: any) {
          console.warn('Erro ao processar comprovante com IA:', err);
          setError(err.message || 'Houve uma falha na leitura automática por IA.');
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError('Não foi possível ler o arquivo. Tente novamente.');
      setLoading(false);
    }
  };

  const handleStartManualReview = () => {
    const now = new Date();
    const currentMonth = MONTH_NAMES[now.getMonth()];
    const dateStr = now.toISOString().split('T')[0];
    const fallbackData: ExtractionResult = {
      pagador: '',
      banco: 'Nubank',
      valor: 0,
      data: dateStr,
      mes: currentMonth,
      tipo: 'receita',
      categoria: 'Mensalidades de Associados',
      descricao: 'Comprovante PIX Mensalidade'
    };
    setExtraction(fallbackData);
    setEditedData(fallbackData);
    setIsReviewing(true);
    setError(null);
  };

  const handleFieldChange = (field: keyof ExtractionResult, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: field === 'valor' ? Number(value) : value
    }));
  };

  const handleDateChange = (dateVal: string) => {
    const dateObj = new Date(dateVal + 'T12:00:00');
    if (!isNaN(dateObj.getTime())) {
      const computedMonth = MONTH_NAMES[dateObj.getMonth()];
      setEditedData(prev => ({
        ...prev,
        data: dateVal,
        mes: computedMonth
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        data: dateVal
      }));
    }
  };

  const handleAssociateSelectionChange = (assocId: string) => {
    setSelectedAssociateId(assocId);
    if (assocId) {
      const found = associates.find(a => a.id === assocId);
      if (found) {
        setEditedData(prev => ({
          ...prev,
          pagador: found.name,
          tipo: 'receita',
          categoria: 'Mensalidades de Associados'
        }));
        setAutoDischarge(true);
      }
    } else {
      setAutoDischarge(false);
    }
  };

  const handleConfirmSave = () => {
    const selectedAssoc = associates.find(a => a.id === selectedAssociateId);

    if (autoDischarge && selectedAssoc && onRegisterPayment) {
      // 1. Give automatic fee discharge for associate with image proof
      onRegisterPayment(
        selectedAssoc,
        editedData.mes,
        editedData.valor || selectedAssoc.monthlyFee,
        editedData.data,
        editedData.banco,
        filePreviewUrl || undefined,
        file?.name
      );

      setSuccessNotice(
        `🎉 BAIXA DE MENSALIDADE REALIZADA COM SUCESSO!\nDepositante: ${selectedAssoc.name}\nMensalidade: ${editedData.mes} | Valor: R$ ${editedData.valor.toFixed(2)}\nComprovante vinculado e salvo para conferência do conselho.`
      );
    } else {
      // 2. Regular Cash Flow Transaction
      onAddTransaction({
        date: editedData.data,
        month: editedData.mes,
        payer: editedData.pagador || 'Sem Identificação',
        bank: editedData.banco || 'Outros',
        value: editedData.valor || 0,
        type: editedData.tipo,
        category: editedData.categoria,
        description: editedData.descricao || 'Importado via Comprovante PIX',
        status: paymentStatus,
        attachmentName: file?.name,
        attachmentType: file?.type,
        attachmentUrl: filePreviewUrl || undefined,
        associateId: selectedAssociateId || undefined
      });

      if (selectedAssoc) {
        setSuccessNotice(
          `✅ Lançamento e comprovante registrados com vínculo ao associado ${selectedAssoc.name} no valor de R$ ${editedData.valor.toFixed(2)}.`
        );
      } else {
        setSuccessNotice(
          `✅ Transação de R$ ${editedData.valor.toFixed(2)} registrada com comprovante no Fluxo de Caixa!`
        );
      }
    }

    resetUploader();
  };

  const resetUploader = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setExtraction(null);
    setIsReviewing(false);
    setLoading(false);
    setIsFullscreenImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentMatchedAssoc = associates.find(a => a.id === selectedAssociateId);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 overflow-hidden space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Extrator de Comprovante de Pagamento de Mensalidade
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifica automaticamente o depositante, salva o comprovante para conferência e dá baixa na mensalidade.
          </p>
        </div>
        {file && (
          <button 
            onClick={resetUploader}
            className="text-xs text-slate-400 hover:text-rose-500 font-medium transition-colors cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Success Notification Alert Banner */}
      {successNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-800 text-xs shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm text-emerald-900">Comprovante Processado e Salvo!</p>
            <p className="whitespace-pre-line leading-relaxed">{successNotice}</p>
          </div>
          <button 
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!isReviewing && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                isDragActive 
                  ? 'border-purple-500 bg-purple-50/60 scale-[0.99]' 
                  : 'border-slate-200 hover:border-purple-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp, application/pdf"
                onChange={handleFileChange}
              />
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl mb-3 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Arraste a foto do comprovante PIX ou clique para <span className="text-purple-600 underline font-bold">selecionar o arquivo</span>
              </p>
              <p className="text-xs text-slate-400 mt-1.5">
                O comprovante fica salvo no cadastro do lançamento para fácil conferência e auditoria (PNG, JPG, PDF)
              </p>
            </div>

            {error && (
              <div className="mt-3 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col gap-3 text-xs text-rose-800 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-rose-900">Aviso na Leitura com IA</p>
                    <p className="opacity-90 mt-0.5">{error}</p>
                  </div>
                </div>

                {filePreviewUrl && (
                  <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-700">
                      O comprovante foi carregado! Você pode preencher os campos visualizando o comprovante:
                    </span>
                    <button
                      type="button"
                      onClick={handleStartManualReview}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Conferir & Preencher com esta Imagem</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Visualização e Conferência de Comprovante:</strong>
                <p className="mt-0.5">
                  A imagem do comprovante é exibida na tela de conferência para você comparar os valores, pagador e banco antes de dar a baixa final na mensalidade do associado.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading Spinner with Visual Laser Animation */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 relative overflow-hidden"
          >
            <div className="w-24 h-28 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col justify-between mb-4 relative shadow-sm overflow-hidden">
              {filePreviewUrl && file?.type.startsWith('image/') ? (
                <img src={filePreviewUrl} alt="Comprovante" className="w-full h-full object-cover rounded-md opacity-80" />
              ) : (
                <FileText className="w-10 h-10 text-purple-500 mx-auto mt-3" />
              )}
              <div className="text-[9px] text-center text-slate-600 truncate font-mono bg-white/90 p-0.5 rounded">
                {file?.name}
              </div>
              <motion.div 
                className="absolute left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_2px_rgba(168,85,247,0.8)]"
                animate={{ 
                  top: ['10%', '90%', '10%']
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <p className="text-sm font-bold text-slate-800">Lendo Comprovante & Gerando Imagem para Conferência...</p>
            </div>
            <p className="text-xs text-slate-500 text-center max-w-[280px]">
              O Gemini está analisando os dados e preparando a visualização do comprovante.
            </p>
          </motion.div>
        )}

        {/* Review Form & Associate Identification + VISUAL COMPROVANTE PREVIEW */}
        {isReviewing && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {fallbackNotice && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <p>
                  <strong>Modo de Conferência Direta:</strong> {fallbackNotice}
                </p>
              </div>
            )}

            {/* VISUAL RECEIPT IMAGE PREVIEW FOR CONFERÊNCIA */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Comprovante de Pagamento (Visualização para Conferência)
                  </h4>
                </div>
                {filePreviewUrl && file?.type.startsWith('image/') && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreenImage(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Ampliar / Zoom</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Image Container */}
                <div className="md:col-span-1 bg-slate-950/80 rounded-xl p-2 border border-slate-800 flex flex-col items-center justify-center min-h-[160px] relative group">
                  {filePreviewUrl && file?.type.startsWith('image/') ? (
                    <div 
                      onClick={() => setIsFullscreenImage(true)}
                      className="relative cursor-pointer overflow-hidden rounded-lg w-full h-40 group-hover:opacity-90 transition-opacity flex items-center justify-center bg-slate-900"
                    >
                      <img 
                        src={filePreviewUrl} 
                        alt="Foto do Comprovante PIX" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>Clique para Ampliar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4">
                      <FileText className="w-12 h-12 text-purple-400 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-200">{file?.name || 'Documento PDF'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Comprovante em formato PDF anexo</p>
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-full">
                    {file?.name} ({(file?.size ? (file.size / 1024).toFixed(0) : 0)} KB)
                  </span>
                </div>

                {/* Direct Comparison Badges */}
                <div className="md:col-span-2 space-y-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-700/60 pb-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Conferência de Dados da Transação:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nome lido no comprovante:</span>
                      <strong className="text-white">{editedData.pagador || 'Não lido'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Valor extraído:</span>
                      <strong className="text-emerald-400 text-xs font-mono">R$ {Number(editedData.valor || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Data do pagamento:</span>
                      <strong className="text-white">{editedData.data} ({editedData.mes})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Banco emissor:</span>
                      <strong className="text-purple-300">{editedData.banco}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-300/90 pt-1 flex items-center gap-1 border-t border-slate-700/40">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    Confira se os valores da foto coincidem com o formulário abaixo antes de confirmar.
                  </p>
                </div>
              </div>
            </div>

            {/* ASSOCIATE IDENTIFICATION CARD */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentMatchedAssoc 
                ? 'bg-blue-50/80 border-blue-200/90 text-blue-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl font-bold shrink-0 ${
                    currentMatchedAssoc ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {currentMatchedAssoc ? <UserCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {currentMatchedAssoc ? '✨ Depositante Identificado pela IA' : '⚠️ Depositante Não Localizado Automaticamente'}
                    </h4>
                    {currentMatchedAssoc ? (
                      <div className="mt-1">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {currentMatchedAssoc.name}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            currentMatchedAssoc.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {currentMatchedAssoc.status}
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {currentMatchedAssoc.category} • CPF/Doc: {currentMatchedAssoc.document || 'Não informado'} • Mensalidade: <strong>R$ {currentMatchedAssoc.monthlyFee.toFixed(2)}</strong>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 mt-1">
                        Nome no comprovante: <strong className="font-semibold text-slate-900">{editedData.pagador || 'Não identificado'}</strong>. Selecione manualmente o associado abaixo para dar baixa na mensalidade.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Associate Dropdown Select */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vincular a um Associado Cadastrado:
                  </label>
                  <select
                    value={selectedAssociateId}
                    onChange={(e) => handleAssociateSelectionChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="">-- Não vincular (Lançar como receita genérica) --</option>
                    {associates.map((assoc) => (
                      <option key={assoc.id} value={assoc.id}>
                        {assoc.name} {assoc.document ? `(${assoc.document})` : ''} - Status: {assoc.status}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAssociateId && onRegisterPayment && (
                  <div className="flex items-center gap-2 pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900 bg-white/80 p-2 rounded-lg border border-purple-200 w-full">
                      <input
                        type="checkbox"
                        checked={autoDischarge}
                        onChange={(e) => setAutoDischarge(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Dar baixa automática na mensalidade ({editedData.mes})</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* FORM FIELDS FOR VERIFICATION & EDITING */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              {/* Type selection */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Fluxo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('tipo', 'receita')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      editedData.tipo === 'receita'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    Receita / Entrada (PIX / Depósito)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('tipo', 'despesa')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      editedData.tipo === 'despesa'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              {/* Pagador */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Pagador / Nome no Comprovante
                </label>
                <input
                  type="text"
                  value={editedData.pagador}
                  onChange={(e) => handleFieldChange('pagador', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs font-medium"
                  placeholder="Nome do pagador no comprovante"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Valor Extraído (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-medium font-mono text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.valor || ''}
                    onChange={(e) => handleFieldChange('valor', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors font-mono font-bold text-slate-900 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Banco */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Banco
                </label>
                <select
                  value={editedData.banco}
                  onChange={(e) => handleFieldChange('banco', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs font-medium"
                >
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  {!BANKS.includes(editedData.banco as any) && (
                    <option value={editedData.banco}>{editedData.banco}</option>
                  )}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data da Transação
                </label>
                <input
                  type="date"
                  value={editedData.data}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs font-medium"
                />
              </div>

              {/* Mês Contábil */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Mês de Referência (Mensalidade)
                </label>
                <select
                  value={editedData.mes}
                  onChange={(e) => handleFieldChange('mes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs font-bold text-purple-700"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Categoria
                </label>
                <select
                  value={editedData.categoria}
                  onChange={(e) => handleFieldChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors font-bold text-slate-800 text-xs"
                >
                  <option value="pago" className="text-emerald-600 font-bold">Pago / Confirmado</option>
                  <option value="pendente" className="text-amber-600 font-bold">Pendente</option>
                </select>
              </div>

              {/* Descrição */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Observações</label>
                <input
                  type="text"
                  value={editedData.descricao}
                  onChange={(e) => handleFieldChange('descricao', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-purple-500 transition-colors text-xs"
                  placeholder="Ex: Comprovante PIX Mensalidade"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetUploader}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {autoDischarge && selectedAssociateId ? 'Dar Baixa & Salvar Comprovante' : 'Confirmar Lançamento'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN RECEIPT IMAGE MODAL FOR AUDIT & CONFERÊNCIA */}
      <AnimatePresence>
        {isFullscreenImage && filePreviewUrl && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-sm">Conferência de Comprovante Original</h3>
                    <p className="text-[11px] text-slate-400">{file?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFullscreenImage(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-auto bg-slate-950 flex items-center justify-center min-h-[300px]">
                {file?.type.startsWith('image/') ? (
                  <img
                    src={filePreviewUrl}
                    alt="Comprovante de pagamento"
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-slate-800"
                  />
                ) : (
                  <div className="text-center text-slate-300">
                    <FileText className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                    <p className="font-bold">{file?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Documento PDF pronto para conferência</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
                <span>Conferido via Extrator de Comprovantes</span>
                <button
                  onClick={() => setIsFullscreenImage(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

