import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle, 
  Users, 
  RefreshCw, 
  ArrowRight, 
  FileCheck, 
  FileText,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Associate, AssociateCategory, AssociationConfig } from '../types';

interface AssociateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAssociates: Associate[];
  onBatchImport: (associates: Omit<Associate, 'id'>[], updateExisting: boolean) => Promise<{ imported: number; updated: number }>;
  associationConfig: AssociationConfig;
}

interface ParsedAssociateRow {
  selected: boolean;
  isValid: boolean;
  isExisting: boolean;
  existingAssociateId?: string;
  errorReason?: string;
  data: {
    name: string;
    document: string;
    cleanDocument: string;
    email: string;
    phone: string;
    address: string;
    category: AssociateCategory;
    cnhCategory: string;
    senatranCredential: string;
    birthDate?: string;
    monthlyFee: number;
    dueDay: number;
    password?: string;
    notes?: string;
  };
}

export function AssociateImportModal({
  isOpen,
  onClose,
  existingAssociates,
  onBatchImport,
  associationConfig
}: AssociateImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedAssociateRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{ imported: number; updated: number }>({ imported: 0, updated: 0 });
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Model Spreadsheet (Excel .xlsx)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nome Completo': 'Miquéias Silva Santos',
        'CPF': '123.456.789-00',
        'WhatsApp / Telefone': '(81) 98888-7777',
        'E-mail': 'miqueias.instrutor@gmail.com',
        'Categoria CNH': 'AB',
        'Credencial SENATRAN': 'SENATRAN: 584147',
        'Data de Nascimento': '13/10/1998',
        'Endereço Completo': 'Rua das Palmeiras, 120, Boa Viagem, Recife - PE',
        'Categoria Associado': 'Membro Efetivo',
        'Valor Mensalidade': 70,
        'Dia Vencimento': 30,
        'Senha de Acesso': '131098',
        'Observações': 'Instrutor Prático e Teórico CFC'
      },
      {
        'Nome Completo': 'Carla Oliveira Rodrigues',
        'CPF': '987.654.321-11',
        'WhatsApp / Telefone': '(81) 99999-1122',
        'E-mail': 'carla.instrutora@gmail.com',
        'Categoria CNH': 'AD',
        'Credencial SENATRAN': 'SENATRAN: 928371',
        'Data de Nascimento': '25/05/1985',
        'Endereço Completo': 'Av. Caxangá, 540, Cordeiro, Recife - PE',
        'Categoria Associado': 'Membro Efetivo',
        'Valor Mensalidade': 70,
        'Dia Vencimento': 30,
        'Senha de Acesso': '250585',
        'Observações': 'Instrutora de Ônibus e Articulados'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for friendly viewing in Excel
    worksheet['!cols'] = [
      { wch: 30 }, // Nome
      { wch: 18 }, // CPF
      { wch: 20 }, // WhatsApp
      { wch: 30 }, // E-mail
      { wch: 15 }, // CNH
      { wch: 22 }, // SENATRAN
      { wch: 18 }, // Nascimento
      { wch: 45 }, // Endereço
      { wch: 20 }, // Categoria
      { wch: 18 }, // Mensalidade
      { wch: 16 }, // Vencimento
      { wch: 18 }, // Senha
      { wch: 35 }, // Observações
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Instrutores AIAPE');

    XLSX.writeFile(workbook, 'Modelo_Cadastro_Instrutores_AIAPE.xlsx');
  };

  // Helper to format dates
  const formatDateValue = (raw: any): string | undefined => {
    if (!raw) return undefined;
    if (typeof raw === 'number') {
      // Excel serial date number
      const date = new Date((raw - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    const str = String(raw).trim();
    // Match DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
      const parts = str.split(/[\/\-]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    return undefined;
  };

  // Shared parser for array of objects (from Excel, CSV or Pasted Table)
  const processRawRowsToParsedAssociates = (rawJson: any[], sourceLabel: string) => {
    if (!rawJson || rawJson.length === 0) {
      setErrorMessage('Nenhum dado válido encontrado para importação.');
      return;
    }

    const rows: ParsedAssociateRow[] = rawJson.map((row: any) => {
      const keys = Object.keys(row);

      const findVal = (patterns: string[]): string => {
        for (const key of keys) {
          const cleanKey = key.toLowerCase().trim();
          for (const pattern of patterns) {
            if (cleanKey.includes(pattern)) {
              return String(row[key] || '').trim();
            }
          }
        }
        return '';
      };

      const rawName = findVal(['nome', 'instrutor', 'associado', 'membro', 'aluno', 'cliente']);
      const rawDoc = findVal(['cpf', 'documento', 'doc', 'identidade']);
      const rawPhone = findVal(['whatsapp', 'telefone', 'celular', 'contato', 'fone', 'tel']);
      const rawEmail = findVal(['email', 'e-mail', 'mail']);
      const rawCnh = findVal(['cnh', 'categoria cnh', 'cat']);
      const rawSenatran = findVal(['senatran', 'credencial', 'detran', 'registro']);
      const rawBirth = findVal(['nascimento', 'aniversario', 'data']);
      const rawAddress = findVal(['endereço', 'endereco', 'rua', 'bairro', 'cidade', 'logradouro', 'municipio']);
      const rawCategory = findVal(['categoria associado', 'tipo membro', 'tipo', 'plano']);
      const rawFee = findVal(['mensalidade', 'valor', 'taxa', 'preco', 'preço']);
      const rawDue = findVal(['vencimento', 'dia', 'data venc']);
      const rawPass = findVal(['senha', 'password', 'pin', 'chave']);
      const rawNotes = findVal(['observa', 'obs', 'mensagem', 'nota', 'coment']);

      const cleanDoc = rawDoc.replace(/\D/g, '');
      const cleanPhone = rawPhone.replace(/\D/g, '');

      // Check if valid
      let isValid = true;
      let errorReason = '';

      if (!rawName) {
        isValid = false;
        errorReason = 'Nome não informado';
      } else if (!cleanDoc || cleanDoc.length < 11) {
        isValid = false;
        errorReason = 'CPF inválido ou incompleto (mínimo 11 dígitos)';
      }

      // Format CPF
      let formattedDoc = rawDoc;
      if (cleanDoc.length === 11) {
        formattedDoc = `${cleanDoc.slice(0, 3)}.${cleanDoc.slice(3, 6)}.${cleanDoc.slice(6, 9)}-${cleanDoc.slice(9)}`;
      }

      // Format Phone
      let formattedPhone = rawPhone;
      if (cleanPhone.length === 11) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
      } else if (cleanPhone.length === 10) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
      }

      // Check if already in system
      const existing = existingAssociates.find(
        a => (a.document || '').replace(/\D/g, '') === cleanDoc
      );

      // Standardize senatran credential
      let senatranFormatted = rawSenatran;
      if (rawSenatran && !rawSenatran.toUpperCase().includes('SENATRAN')) {
        senatranFormatted = `SENATRAN: ${rawSenatran}`;
      }

      // Generate default password if missing (birthdate or 6 first digits of CPF)
      const birthDateFormatted = formatDateValue(rawBirth);
      let generatedPassword = rawPass;
      if (!generatedPassword) {
        if (birthDateFormatted) {
          const [y, m, d] = birthDateFormatted.split('-');
          generatedPassword = `${d}${m}${y.slice(-2)}`;
        } else if (cleanDoc.length >= 6) {
          generatedPassword = cleanDoc.slice(0, 6);
        } else {
          generatedPassword = '131098';
        }
      }

      return {
        selected: isValid,
        isValid,
        isExisting: Boolean(existing),
        existingAssociateId: existing?.id,
        errorReason,
        data: {
          name: rawName,
          document: formattedDoc,
          cleanDocument: cleanDoc,
          email: rawEmail || `${cleanDoc}@instrutor.aiape.org.br`,
          phone: formattedPhone || '(81) 98888-0000',
          address: rawAddress || '',
          category: (rawCategory as AssociateCategory) || 'Membro Efetivo',
          cnhCategory: rawCnh ? rawCnh.toUpperCase() : 'AB',
          senatranCredential: senatranFormatted || 'CADASTRADA NO SISTEMA',
          birthDate: birthDateFormatted,
          monthlyFee: Number(rawFee) > 0 ? Number(rawFee) : (associationConfig.defaultMonthlyFee || 70),
          dueDay: Number(rawDue) > 0 ? Number(rawDue) : (associationConfig.defaultDueDay || 30),
          password: generatedPassword,
          notes: rawNotes ? `Importado via ${sourceLabel}. ${rawNotes}` : `Importado via ${sourceLabel}`
        }
      };
    });

    setParsedRows(rows);
    setStep('preview');
  };

  // 2. Parse uploaded file buffer (XLSX, XLS, CSV)
  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage('A planilha enviada está vazia ou não possui linhas de dados.');
          return;
        }

        processRawRowsToParsedAssociates(rawJson, `Planilha Excel (${file.name})`);
      } catch (err: any) {
        console.error('Erro ao ler arquivo Excel:', err);
        setErrorMessage('Não foi possível ler o arquivo. Certifique-se de que é uma planilha válida (.xlsx, .xls ou .csv).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  // 3. Parse pasted text (Tab-separated from Excel or Comma-separated)
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor, cole as linhas copiadas do seu Excel ou Google Sheets no campo abaixo.');
      return;
    }

    try {
      // Use XLSX to parse the TSV / CSV text directly into a workbook
      const workbook = XLSX.read(pastedText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        setErrorMessage('Não foi possível identificar colunas válidas no texto colado. Copie os dados incluindo a primeira linha com os cabeçalhos (Nome, CPF, etc.).');
        return;
      }

      setFileName('Dados Colados do Excel / Google Sheets');
      processRawRowsToParsedAssociates(rawJson, 'Colagem Direta do Excel');
    } catch (err: any) {
      console.error('Erro ao processar texto colado:', err);
      setErrorMessage('Ocorreu um erro ao processar o texto colado. Verifique se copiou a tabela completa com cabeçalhos.');
    }
  };

  // 4. Load Sample Data to Test
  const handleLoadSampleData = () => {
    const sampleRows = [
      {
        'Nome Completo': 'Miquéias Silva Santos',
        'CPF': '123.456.789-00',
        'WhatsApp / Telefone': '(81) 98888-7777',
        'E-mail': 'miqueias.instrutor@gmail.com',
        'Categoria CNH': 'AB',
        'Credencial SENATRAN': 'SENATRAN: 584147',
        'Data de Nascimento': '13/10/1998',
        'Endereço Completo': 'Rua das Palmeiras, 120, Boa Viagem, Recife - PE',
        'Categoria Associado': 'Membro Efetivo',
        'Valor Mensalidade': 70,
        'Dia Vencimento': 30,
        'Senha de Acesso': '131098',
        'Observações': 'Instrutor Prático e Teórico CFC'
      },
      {
        'Nome Completo': 'Carla Oliveira Rodrigues',
        'CPF': '987.654.321-11',
        'WhatsApp / Telefone': '(81) 99999-1122',
        'E-mail': 'carla.instrutora@gmail.com',
        'Categoria CNH': 'AD',
        'Credencial SENATRAN': 'SENATRAN: 928371',
        'Data de Nascimento': '25/05/1985',
        'Endereço Completo': 'Av. Caxangá, 540, Cordeiro, Recife - PE',
        'Categoria Associado': 'Membro Efetivo',
        'Valor Mensalidade': 70,
        'Dia Vencimento': 30,
        'Senha de Acesso': '250585',
        'Observações': 'Instrutora de Ônibus e Articulados'
      },
      {
        'Nome Completo': 'Rodrigo Ferreira Lima',
        'CPF': '456.789.123-22',
        'WhatsApp / Telefone': '(81) 98765-4321',
        'E-mail': 'rodrigo.cfc@gmail.com',
        'Categoria CNH': 'AE',
        'Credencial SENATRAN': 'SENATRAN: 334190',
        'Data de Nascimento': '10/02/1990',
        'Endereço Completo': 'Rua da Aurora, 310, Santo Amaro, Recife - PE',
        'Categoria Associado': 'Membro Efetivo',
        'Valor Mensalidade': 70,
        'Dia Vencimento': 30,
        'Senha de Acesso': '100290',
        'Observações': 'Instrutor de Carreta e Veículos Pesados'
      }
    ];

    setFileName('Exemplo de Teste de Importação');
    processRawRowsToParsedAssociates(sampleRows, 'Dados de Exemplo');
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  // Toggle selection
  const toggleRowSelect = (index: number) => {
    setParsedRows(prev => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));
  };

  const selectAllValid = (selected: boolean) => {
    setParsedRows(prev => prev.map(r => r.isValid ? { ...r, selected } : r));
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    const selectedRows = parsedRows.filter(r => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      setErrorMessage('Nenhum registro válido selecionado para importação.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const itemsToImport: Omit<Associate, 'id'>[] = selectedRows.map(r => ({
        name: r.data.name,
        document: r.data.document,
        email: r.data.email,
        phone: r.data.phone,
        address: r.data.address,
        category: r.data.category,
        status: 'ativo',
        monthlyFee: r.data.monthlyFee,
        dueDay: r.data.dueDay,
        membershipDate: new Date().toISOString().split('T')[0],
        birthDate: r.data.birthDate,
        password: r.data.password,
        cnhCategory: r.data.cnhCategory,
        senatranCredential: r.data.senatranCredential,
        registrationNumber: `AIAPE-${Math.floor(1000 + Math.random() * 9000)}`,
        validityDate: 'DEZ/2026',
        notes: r.data.notes
      }));

      const stats = await onBatchImport(itemsToImport, updateExisting);
      setImportStats(stats);
      setStep('success');
    } catch (err: any) {
      console.error('Erro ao executar importação em lote:', err);
      setErrorMessage('Ocorreu um erro ao salvar os dados no banco de dados. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Importar Instrutores do Excel / Google Forms
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre dezenas de associados de uma só vez a partir de planilhas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Como usar Google Forms</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Forms Guide (Collapsible) */}
        {showHelpGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 text-xs text-blue-200 space-y-2 shrink-0"
          >
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <Info className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Passo a Passo: Como vincular ao Google Forms</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
              <li>Crie um formulário no <strong>Google Forms</strong> contendo as perguntas: <em>Nome Completo, CPF, WhatsApp, E-mail, Categoria CNH, Credencial SENATRAN, Data de Nascimento e Endereço</em>.</li>
              <li>Envie o link do Google Forms para os instrutores preencherem.</li>
              <li>Na aba <strong>Respostas</strong> do seu Google Forms, clique no ícone verde <strong>"Vincular às Planilhas" (Google Sheets)</strong>.</li>
              <li>Na planilha do Google, clique em <strong>Arquivo &gt; Fazer o download &gt; Microsoft Excel (.xlsx)</strong> ou <strong>CSV</strong>.</li>
              <li>Arraste o arquivo baixado para a caixa de upload abaixo e pronto! O sistema reconhece e cadastra todos no banco.</li>
            </ol>
          </motion.div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-semibold shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD & INPUT SELECTION */}
        {step === 'upload' && (
          <div className="space-y-5 overflow-y-auto pr-1">
            {/* Method Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => { setImportMethod('file'); setErrorMessage(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importMethod === 'file'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>1. Carregar Arquivo Excel (.xlsx / .csv)</span>
              </button>

              <button
                type="button"
                onClick={() => { setImportMethod('paste'); setErrorMessage(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importMethod === 'paste'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Colar Linhas Copiadas (Ctrl+V)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleData}
                className="ml-auto hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Carrega 3 associados de teste para visualizar o funcionamento sem precisar de arquivo"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Carregar Exemplo de Teste</span>
              </button>
            </div>

            {/* Download Template Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Baixar Planilha Modelo (.xlsx)</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Baixe o modelo com cabeçalhos prontos (Nome, CPF, WhatsApp, CNH, SENATRAN, etc.) para preencher no Excel ou Google Forms
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Modelo Excel</span>
              </button>
            </div>

            {/* TAB 1: File Upload & Drag-and-Drop */}
            {importMethod === 'file' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Arraste ou Selecione sua Planilha (.xlsx, .xls ou .csv)
                  </label>
                  <span className="text-[11px] text-slate-400">Suporta arquivos exportados do Google Sheets e Excel</span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3 ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/15 scale-[1.01]'
                      : 'border-slate-700 hover:border-emerald-500/70 bg-slate-800/40 hover:bg-emerald-500/5'
                  }`}
                >
                  <div className="p-4 bg-slate-800 rounded-full text-emerald-400 border border-slate-700 shadow-md">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {isDragging ? 'Solte o arquivo da planilha aqui...' : 'Clique para selecionar o arquivo da planilha'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Formatos suportados: Microsoft Excel (.xlsx, .xls) ou Valores separados por vírgula (.csv)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Mapeamento inteligente de colunas automático
                    </span>
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                      Reconhece CPF, Telefone, CNH e SENATRAN
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Direct Paste from Excel / Google Sheets */}
            {importMethod === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Copie as linhas da sua planilha no Excel e cole (Ctrl+V) aqui:
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                  >
                    Usar dados de exemplo
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={7}
                    placeholder={`Exemplo de dados copiados do Excel (com cabeçalhos na primeira linha):
Nome Completo	CPF	WhatsApp	Categoria CNH	Credencial SENATRAN	Mensalidade
Carlos Silva	123.456.789-00	(81) 98888-7777	AB	SENATRAN: 584147	70
Ana Pereira	987.654.321-11	(81) 99999-2233	AD	SENATRAN: 928371	70`}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Dica: No Excel, selecione as células com os cabeçalhos, aperte <strong>Ctrl+C</strong> e cole no campo acima com <strong>Ctrl+V</strong>.
                  </span>

                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={!pastedText.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Processar Dados Colados</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION */}
        {step === 'preview' && (
          <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Overview Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-xs shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {fileName}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300">
                  Total Encontrado: <strong className="text-white">{parsedRows.length}</strong>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-emerald-400">
                  Válidos: <strong>{parsedRows.filter(r => r.isValid).length}</strong>
                </span>
                {parsedRows.some(r => !r.isValid) && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span className="text-rose-400">
                      Inválidos: <strong>{parsedRows.filter(r => !r.isValid).length}</strong>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded-md border-slate-700 text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900"
                  />
                  <span>Atualizar registros se CPF já existir</span>
                </label>

                <button
                  type="button"
                  onClick={() => selectAllValid(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
                >
                  Marcar Todos
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700 z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={parsedRows.length > 0 && parsedRows.filter(r => r.isValid).every(r => r.selected)}
                        onChange={(e) => selectAllValid(e.target.checked)}
                        className="rounded-md border-slate-700 text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900"
                      />
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Nome do Instrutor</th>
                    <th className="p-3">CPF</th>
                    <th className="p-3">WhatsApp</th>
                    <th className="p-3">CNH / SENATRAN</th>
                    <th className="p-3">Senha de Acesso</th>
                    <th className="p-3">Mensalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {parsedRows.map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-800/40 transition-colors ${!row.isValid ? 'bg-rose-950/20' : row.isExisting ? 'bg-amber-950/10' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={!row.isValid}
                          onChange={() => toggleRowSelect(idx)}
                          className="rounded-md border-slate-700 text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900 disabled:opacity-30"
                        />
                      </td>

                      <td className="p-3">
                        {!row.isValid ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold" title={row.errorReason}>
                            <AlertCircle className="w-3 h-3" /> Inválido
                          </span>
                        ) : row.isExisting ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold" title="CPF já existe no banco. Será atualizado se a opção estiver marcada.">
                            <RefreshCw className="w-3 h-3" /> Já Cadastrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Novo
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-semibold text-white">
                        <div>{row.data.name || '<Nome não informado>'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.data.email}</div>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {row.data.document || '<CPF inválido>'}
                      </td>

                      <td className="p-3 text-slate-300">
                        {row.data.phone}
                      </td>

                      <td className="p-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded-sm font-bold text-[10px] border border-slate-700">
                            Cat. {row.data.cnhCategory}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={row.data.senatranCredential}>
                            {row.data.senatranCredential}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-amber-300 text-xs font-bold">
                        {row.data.password}
                      </td>

                      <td className="p-3 font-bold text-emerald-400">
                        R$ {row.data.monthlyFee.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 shrink-0 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Voltar e Escolher Outro Arquivo
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || parsedRows.filter(r => r.selected && r.isValid).length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Cadastrando no Banco de Dados...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Importar {parsedRows.filter(r => r.selected && r.isValid).length} Instrutores Selecionados</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Importação Concluída com Sucesso!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Os dados dos instrutores foram importados, validados e sincronizados em tempo real com o banco de dados.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 max-w-md mx-auto grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-slate-900/80 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Novos Cadastrados</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{importStats.imported}</p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Atualizados / Mesclados</span>
                <p className="text-xl font-bold text-blue-400 font-mono mt-0.5">{importStats.updated}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                Concluir e Voltar à Lista
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
