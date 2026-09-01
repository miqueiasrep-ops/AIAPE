import React, { useState } from 'react';
import { QrCode, Copy, Check, Sparkles, ArrowRight, Smartphone, Key, Upload, Link, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { generatePixPayload } from '../utils/pix';

interface PixPaymentCardProps {
  amount?: number;
  associateName?: string;
  pixKey?: string;
  pixCopiaCola?: string;
  pixQrCodeImageUrl?: string;
  merchantName?: string;
  merchantCity?: string;
  onOpenExtractor?: () => void;
  className?: string;
}

export function PixPaymentCard({
  amount = 70,
  associateName,
  pixKey = '8a0fa350-4511-4eab-a06f-6cc3bf44475c',
  pixCopiaCola = '',
  pixQrCodeImageUrl = '',
  merchantName = 'Alberto Cavalcanti Barbosa Junior',
  merchantCity = 'RECIFE',
  onOpenExtractor,
  className = ''
}: PixPaymentCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [currentPixKey, setCurrentPixKey] = useState(pixKey || '8a0fa350-4511-4eab-a06f-6cc3bf44475c');
  const [currentCopiaCola, setCurrentCopiaCola] = useState(pixCopiaCola);
  const [currentQrImage, setCurrentQrImage] = useState(pixQrCodeImageUrl);
  
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [configTab, setConfigTab] = useState<'copiaCola' | 'chave' | 'imagem'>('copiaCola');

  const [inputCopiaCola, setInputCopiaCola] = useState(pixCopiaCola);
  const [inputKey, setInputKey] = useState(pixKey || '8a0fa350-4511-4eab-a06f-6cc3bf44475c');

  // Keep state in sync with props
  React.useEffect(() => {
    if (pixKey) {
      setCurrentPixKey(pixKey);
      setInputKey(pixKey);
    }
    if (pixCopiaCola !== undefined) {
      setCurrentCopiaCola(pixCopiaCola);
      setInputCopiaCola(pixCopiaCola);
    }
    if (pixQrCodeImageUrl !== undefined) {
      setCurrentQrImage(pixQrCodeImageUrl);
    }
  }, [pixKey, pixCopiaCola, pixQrCodeImageUrl]);

  const activePixKey = currentPixKey || pixKey || '8a0fa350-4511-4eab-a06f-6cc3bf44475c';

  // Determinar qual é o payload final do PIX
  const effectivePayload = currentCopiaCola.trim().startsWith('000201')
    ? currentCopiaCola.trim()
    : generatePixPayload({
        pixKey: activePixKey,
        merchantName,
        merchantCity,
        amount,
        description: `MENSALIDADE ${associateName ? associateName.slice(0, 12) : 'AIAPE'}`,
        txid: '***'
      });

  const handleCopy = () => {
    navigator.clipboard.writeText(effectivePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(activePixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCurrentQrImage(dataUrl);

          // Tentar extrair a string do QR Code com jsQR
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code && code.data && code.data.startsWith('000201')) {
                setCurrentCopiaCola(code.data);
                setInputCopiaCola(code.data);
              }
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (configTab === 'copiaCola' && inputCopiaCola.trim()) {
      setCurrentCopiaCola(inputCopiaCola.trim());
    } else if (configTab === 'chave' && inputKey.trim()) {
      setCurrentPixKey(inputKey.trim());
      setCurrentCopiaCola(''); // Limpa copia e cola prévio para usar a chave
    }
    setIsEditingKey(false);
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${className}`}>
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-extrabold rounded-full">
            <QrCode className="w-3.5 h-3.5" />
            Pagamento Oficial da Mensalidade
          </div>
          <h3 className="text-lg font-black text-white">
            QR Code PIX - AIAPE Pernambuco
          </h3>
          <p className="text-xs text-slate-300">
            {associateName ? `Associado(a): ${associateName}` : 'Pague sua mensalidade de forma instantânea em qualquer banco'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor da Contribuição</span>
            <span className="text-xl font-black text-emerald-400">R$ {amount.toFixed(2).replace('.', ',')}</span>
          </div>

          <button
            onClick={() => setIsEditingKey(!isEditingKey)}
            title="Ajustar QR Code / Chave PIX"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Configurar QR Code</span>
          </button>
        </div>
      </div>

      {/* Editing Panel Collapsible */}
      {isEditingKey && (
        <div className="bg-slate-950/90 border border-amber-500/40 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Personalizar QR Code PIX para Validação nos Bancos:</span>
            </div>
            
            {/* Tabs for Config */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setConfigTab('copiaCola')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  configTab === 'copiaCola' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Copiar e Colar Banco
              </button>
              <button
                type="button"
                onClick={() => setConfigTab('chave')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  configTab === 'chave' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chave PIX
              </button>
              <button
                type="button"
                onClick={() => setConfigTab('imagem')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  configTab === 'imagem' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Subir Foto QR
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            {configTab === 'copiaCola' && (
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">
                  Cole o Código "PIX Copia e Cola" Oficial do Mercado Pago / Banco (Inicia com <code className="text-amber-300">000201...</code>):
                </label>
                <textarea
                  rows={2}
                  value={inputCopiaCola}
                  onChange={(e) => setInputCopiaCola(e.target.value)}
                  placeholder="00020126580014BR.GOV.BCB.PIX..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400">
                  💡 <strong>Dica Pro:</strong> Abra o app do seu banco ou do Mercado Pago, gere a cobrança e copie o PIX Copia e Cola. Cole aqui para gerar o QR Code exatamente idêntico ao do seu banco!
                </p>
              </div>
            )}

            {configTab === 'chave' && (
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">
                  Informe a Chave PIX cadastrada no Banco Central (E-mail, CNPJ, CPF, Telefone ou Aleatória):
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Ex: contato@aiape.org.br ou 12.345.678/0001-90"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400">
                  Sua chave PIX deve estar ativa na instituição financeira para que a transferência ocorra sem erros.
                </p>
              </div>
            )}

            {configTab === 'imagem' && (
              <div className="space-y-3">
                <label className="text-xs text-slate-300 font-semibold block">
                  Carregue a imagem / print do seu QR Code Oficial do Mercado Pago ou Banco:
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Selecionar Imagem do QR Code</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {currentQrImage && (
                    <button
                      type="button"
                      onClick={() => setCurrentQrImage('')}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Remover foto e usar QR SVG
                    </button>
                  )}
                </div>
              </div>
            )}

            {configTab !== 'imagem' && (
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Salvar e Atualizar QR Code
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Visual QR Code Card */}
        <div className="md:col-span-5 flex justify-center">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 w-full max-w-xs text-center space-y-4 transform transition-transform hover:scale-[1.02]">
            
            {/* Mercado Pago 4-Diamonds Logo */}
            <div className="flex justify-center pt-1">
              <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15L75 40L50 65L25 40L50 15Z" fill="#009EE3" />
                <path d="M75 40L100 65L75 90L50 65L75 40Z" fill="#0082C5" />
                <path d="M25 40L50 65L25 90L0 65L25 40Z" fill="#00B1EA" />
                <path d="M50 65L75 90L50 100L25 90L50 65Z" fill="#0073B7" />
              </svg>
            </div>

            {/* Title & Amount */}
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-[#009EE3] tracking-tight">
                Seu QR code<br />de cobrança:
              </h4>
              <p className="text-xs text-slate-500 font-medium pt-1">Valor cobrado:</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                R$ {amount.toFixed(2).replace('.', ',')}
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block font-semibold">Recebedor:</span>
                <span className="text-xs font-extrabold text-slate-800 block">{merchantName}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 flex justify-center shadow-inner relative group">
              {currentQrImage ? (
                <img
                  src={currentQrImage}
                  alt="QR Code Oficial de Pagamento PIX"
                  className="w-full h-auto max-w-[200px] object-contain rounded-lg"
                />
              ) : (
                <QRCodeSVG
                  value={effectivePayload}
                  size={220}
                  level="M"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  className="w-full h-auto max-w-[200px] bg-white p-1 rounded"
                />
              )}
            </div>

            {/* Direct PIX Key box under QR Code */}
            <div className="bg-slate-100/90 border border-slate-200 p-2.5 rounded-2xl text-left space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Chave PIX Oficial (EVP):</span>
                <span className="text-emerald-700 font-extrabold">Banco Central</span>
              </div>
              <div className="flex items-center justify-between gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-black text-slate-900 break-all select-all tracking-tight">
                  {activePixKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                    copiedKey
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#009EE3] hover:bg-[#0082C5] text-white'
                  }`}
                  title="Copiar Chave PIX"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copiada!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                currentCopiaCola || (activePixKey && activePixKey !== 'contato@aiape.org.br')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentCopiaCola || (activePixKey && activePixKey !== 'contato@aiape.org.br')
                  ? '✓ QR Code PIX Ativo'
                  : '⚠️ Chave Demonstrativa'}
              </span>
              <p className="text-[11px] text-slate-500 font-semibold pt-1">
                Aponte a câmera do app do banco ou use as opções de cópia ao lado
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Instructions & Pix Copia e Cola / Direct Key */}
        <div className="md:col-span-7 space-y-5">
          {(!currentCopiaCola && activePixKey === 'contato@aiape.org.br') && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Por que o banco dá "QR Code Inválido"?</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Para qualquer banco (Mercado Pago, Nubank, Itaú) aceitar o pagamento, a <strong>Chave PIX precisa existir no Banco Central</strong> ou usar o código <strong>PIX Copia e Cola</strong> gerado no seu app do banco.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfigTab('copiaCola');
                    setIsEditingKey(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-md"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Colar código Copia e Cola do Seu Banco</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Chave PIX Oficial (Aleatória / EVP) */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <Key className="w-4 h-4" />
                <span>Chave PIX Oficial da AIAPE</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Chave Aleatória (EVP)
              </span>
            </div>

            <p className="text-xs text-slate-300">
              No app do seu banco, escolha <strong>Transferir via PIX</strong> &gt; <strong>Chave Aleatória</strong> e cole a chave abaixo:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono font-bold truncate select-all">
                {activePixKey}
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg ${
                  copiedKey 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {copiedKey ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Chave Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Chave PIX</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              Instruções de pagamento & conferência:
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li>• <strong>Chave PIX:</strong> <span className="font-mono text-emerald-400 select-all">{activePixKey}</span></li>
              <li>• <strong>Favorecido / Recebedor:</strong> {merchantName} (AIAPE)</li>
              <li>• <strong>Valor da Mensalidade:</strong> R$ {amount.toFixed(2).replace('.', ',')}</li>
              <li>• <strong>Cidade:</strong> {merchantCity} - PE</li>
            </ul>
          </div>

          {/* Action to submit receipt directly */}
          {onOpenExtractor && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Já efetuou o PIX? Suba o comprovante no leitor de IA para dar baixa automática na mensalidade:
              </div>
              <button
                onClick={onOpenExtractor}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enviar Comprovante (IA)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
      </div>
    </div>
  </div>
);
}

