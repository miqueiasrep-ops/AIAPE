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
  pixKey = 'contato@aiape.org.br',
  pixCopiaCola = '',
  pixQrCodeImageUrl = '',
  merchantName = 'Alberto Cavalcanti Barbosa Junior',
  merchantCity = 'RECIFE',
  onOpenExtractor,
  className = ''
}: PixPaymentCardProps) {
  const [copied, setCopied] = useState(false);
  const [currentPixKey, setCurrentPixKey] = useState(pixKey);
  const [currentCopiaCola, setCurrentCopiaCola] = useState(pixCopiaCola);
  const [currentQrImage, setCurrentQrImage] = useState(pixQrCodeImageUrl);
  
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [configTab, setConfigTab] = useState<'copiaCola' | 'chave' | 'imagem'>('copiaCola');

  const [inputCopiaCola, setInputCopiaCola] = useState(pixCopiaCola);
  const [inputKey, setInputKey] = useState(pixKey);

  // Determinar qual é o payload final do PIX
  const effectivePayload = currentCopiaCola.trim().startsWith('000201')
    ? currentCopiaCola.trim()
    : generatePixPayload({
        pixKey: currentPixKey,
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

            <div className="space-y-1 pt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                currentCopiaCola || (currentPixKey && currentPixKey !== 'contato@aiape.org.br')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentCopiaCola || (currentPixKey && currentPixKey !== 'contato@aiape.org.br')
                  ? '✓ QR Code PIX Ativo'
                  : '⚠️ Chave Demonstrativa'}
              </span>
              <p className="text-[11px] text-slate-500 font-semibold pt-1">
                Aponte a câmera do aplicativo do seu banco para pagar instantaneamente
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Instructions & Pix Copia e Cola */}
        <div className="md:col-span-7 space-y-5">
          {(!currentCopiaCola && currentPixKey === 'contato@aiape.org.br') && (
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
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Como realizar o pagamento:
            </h4>
            <ol className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Abra o aplicativo do seu banco ou instituição financeira.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Escolha a opção <strong>PIX</strong> e selecione <strong>PIX Copia e Cola</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Cole o código do campo abaixo no seu aplicativo bancário.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Confirme o valor de <strong>R$ {amount.toFixed(2).replace('.', ',')}</strong> e o recebedor <strong>{merchantName}</strong>.</span>
              </li>
            </ol>
          </div>

          {/* Pix Copia e Cola Input Field */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Código PIX Copia e Cola Oficial:</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {currentCopiaCola ? 'PIX Mercado Pago Ativo' : `Chave: ${currentPixKey}`}
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={effectivePayload}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono truncate select-all focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar PIX</span>
                  </>
                )}
              </button>
            </div>
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

