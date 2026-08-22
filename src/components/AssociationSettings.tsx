import React, { useState } from 'react';
import { Building, Save, CheckCircle, ShieldCheck, Lock, Upload, Image as ImageIcon, QrCode, Cloud, CloudUpload, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';
import { AssociationConfig } from '../types';

interface AssociationSettingsProps {
  config: AssociationConfig;
  onSaveConfig: (config: AssociationConfig) => void;
  onOpenSyncModal?: () => void;
  syncStatus?: 'sincronizado' | 'sincronizando' | 'erro';
}

export function AssociationSettings({
  config,
  onSaveConfig,
  onOpenSyncModal,
  syncStatus = 'sincronizado'
}: AssociationSettingsProps) {
  const [formData, setFormData] = useState<AssociationConfig>({ 
    ...config,
    financePin: config.financePin || '1234'
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          
          // Tentar decodificar o código PIX automaticamente com jsQR
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
                setFormData(prev => ({
                  ...prev,
                  pixQrCodeImageUrl: dataUrl,
                  pixCopiaCola: code.data
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  pixQrCodeImageUrl: dataUrl
                }));
              }
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-400" />
          Configurações da Associação
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Dados institucionais, corpo diretivo e valores de mensalidades
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-xl">
        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Configurações da associação salvas com sucesso!
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2">
            1. Dados Institucionais
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome / Razão Social da Associação</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)"
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
            />
            <p className="text-[10px] text-amber-400 font-medium mt-1">
              📌 Status Jurídico: Em processo de formalização e abertura (Associação sem CNPJ ativo no momento).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Logomarca Oficial (Upload de Imagem ou URL)</label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, logoUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              {formData.logoUrl && (
                <div className="flex items-center gap-2 shrink-0">
                  <img src={formData.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-700 bg-slate-900" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                    className="text-[10px] text-rose-400 hover:underline font-semibold"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Envie a imagem da logomarca oficial da associação se desejar substituir o vetor padrão.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço da Sede Social</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Oficial</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@associacao.org.br"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2">
            2. Corpo Diretivo (Para Assinatura de Recibos e Balancetes)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do(a) Presidente</label>
              <input
                type="text"
                value={formData.president}
                onChange={(e) => setFormData({ ...formData, president: e.target.value })}
                placeholder="Ex: Carlos Alberto Gomes"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do(a) Tesoureiro(a)</label>
              <input
                type="text"
                value={formData.treasurer}
                onChange={(e) => setFormData({ ...formData, treasurer: e.target.value })}
                placeholder="Ex: Ana Lucia Santos"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            3. Parâmetros Financeiros & Chave PIX Oficial
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                Chave PIX Recebedora (CNPJ, E-mail, Telefone ou Aleatória)
              </label>
              <input
                type="text"
                value={formData.pixKey || ''}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="Ex: contato@aiape.org.br ou 12.345.678/0001-90"
                className="w-full bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 font-mono px-3 py-2 rounded-lg focus:outline-hidden focus:border-emerald-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Chave oficial do Banco Central.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Ou código "PIX Copia e Cola" Oficial do Mercado Pago / Banco
              </label>
              <input
                type="text"
                value={formData.pixCopiaCola || ''}
                onChange={(e) => setFormData({ ...formData, pixCopiaCola: e.target.value })}
                placeholder="Inicia com 00020126580014BR.GOV.BCB.PIX..."
                className="w-full bg-slate-900 border border-amber-500/40 text-xs text-amber-300 font-mono px-3 py-2 rounded-lg focus:outline-hidden focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Cole a string PIX gerada no seu app bancário para ter 100% de precisão nos pagamentos.
              </p>
            </div>
          </div>

          {/* Upload de Imagem do QR Code Oficial */}
          <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Imagem Oficial do QR Code PIX da Associação</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-md">
                <Upload className="w-4 h-4" />
                <span>Carregar Print / Imagem do QR Code</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="hidden"
                />
              </label>
              {formData.pixQrCodeImageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={formData.pixQrCodeImageUrl}
                    alt="QR Code da Associação"
                    className="w-12 h-12 object-contain bg-white p-1 rounded-lg border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pixQrCodeImageUrl: '' })}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Remover Imagem
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Nenhuma imagem personalizada carregada</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              O leitor de IA tentará extrair o código PIX Copia e Cola automaticamente assim que você selecionar a imagem!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mensalidade Padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultMonthlyFee}
                onChange={(e) => setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Vencimento Padrão</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.defaultDueDay}
                onChange={(e) => setFormData({ ...formData, defaultDueDay: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Banco Principal da Associação</label>
              <select
                value={formData.primaryBank}
                onChange={(e) => setFormData({ ...formData, primaryBank: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Itaú">Itaú</option>
                <option value="Banco do Brasil">Banco do Brasil</option>
                <option value="Bradesco">Bradesco</option>
                <option value="Caixa Econômica">Caixa Econômica</option>
                <option value="Sicoob">Sicoob</option>
                <option value="Sicredi">Sicredi</option>
                <option value="Nubank">Nubank</option>
                <option value="Inter">Inter</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            4. Segurança & Proteção PIN da Diretoria Financeira
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PIN de Acesso ao Fluxo de Caixa (4 ou mais dígitos)
              </label>
              <input
                type="password"
                maxLength={10}
                required
                value={formData.financePin || ''}
                onChange={(e) => setFormData({ ...formData, financePin: e.target.value })}
                placeholder="Ex: 1234"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-blue-300 font-mono tracking-widest px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Apenas pessoas com este PIN conseguirão abrir a aba de Fluxo de Caixa. (PIN Padrão: 1234)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2 flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            5. Banco de Dados Firestore & Sincronização em Nuvem
          </h3>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${syncStatus === 'sincronizado' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h4 className="text-xs font-bold text-white">
                  {syncStatus === 'sincronizado' ? 'Nuvem Conectada e Operando em Tempo Real' : 'Sincronização em Andamento...'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Seus dados (associados, pagamentos, recibos e relatórios) são salvos de forma centralizada no Firestore e sincronizados entre todos os notebooks, tablets e celulares da diretoria.
              </p>
            </div>

            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Gerenciar Sincronização</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
