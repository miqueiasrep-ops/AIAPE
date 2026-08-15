import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Eye, 
  HeartHandshake, 
  ShieldCheck, 
  Award, 
  Users, 
  CheckCircle2, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  UserPlus, 
  User,
  Building2,
  Calendar
} from 'lucide-react';
import { AssociationConfig, AssociationEvent } from '../types';

interface AssociationHistoryProps {
  associationConfig: AssociationConfig;
  events?: AssociationEvent[];
  onOpenPublicRegister: () => void;
  onOpenLoginModal: () => void;
  onOpenAdminModal?: () => void;
}

export function AssociationHistory({ 
  associationConfig, 
  events = [], 
  onOpenPublicRegister, 
  onOpenLoginModal,
  onOpenAdminModal
}: AssociationHistoryProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner / Hero Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Entidade Representativa de Pernambuco
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {associationConfig.name || 'Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Unindo, fortalecendo e valorizando os instrutores de trânsito autônomos em todo o Estado de Pernambuco. Compromisso com a educação no trânsito, salvamento de vidas e dignidade profissional.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Área do Associado</span>
            </button>

            {onOpenAdminModal && (
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-600/20 border border-amber-400/30 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Área do ADM (Diretoria)</span>
              </button>
            )}

            <button
              onClick={onOpenPublicRegister}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Criar Meu Cadastro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Histórico Institucional */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Histórico da Associação</h2>
            <p className="text-xs text-slate-400">Tradição, Luta e União pela Categoria dos Instrutores de Trânsito PE</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
          <p>
            A <strong>Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)</strong> nasceu da urgente necessidade de organizar, integrar e representar judicial e institucionalmente os profissionais autônomos que atuam na formação e aperfeiçoamento de condutores de veículos automotores em todo o Estado de Pernambuco.
          </p>
          <p>
            Em meio às constantes transformações da legislação do trânsito brasileiro e das exigências operacionais do DETRAN-PE e SENATRAN, a AIAPE consolidou-se como o porto seguro dos instrutores autônomos, garantindo suporte institucional, assessoria, treinamentos contínuos e promovendo parcerias estratégicas para o desenvolvimento da profissão.
          </p>
          <p>
            Com foco incansável na qualidade do ensino e na conscientização sobre a segurança viária, a AIAPE atua em benefício de todos os seus associados, defendendo a soberania do trabalho autônomo e promovendo ações sociais e educacionais em Pernambuco.
          </p>
        </div>
      </motion.div>

      {/* Seção Missão, Visão e Valores (Cards Institucionais Sem Valores Financeiros) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Missão */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-6 rounded-2xl space-y-3 flex flex-col justify-between transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl w-fit">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Nossa Missão</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Representar, defender e integrar os instrutores autônomos de trânsito de Pernambuco, assegurando suporte legal, valorização profissional, constante aperfeiçoamento pedagógico e excelência na formação de condutores conscientes.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Foco na Categoria e na Sociedade
          </div>
        </motion.div>

        {/* Visão */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-6 rounded-2xl space-y-3 flex flex-col justify-between transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Nossa Visão</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ser reconhecida como a principal entidade de referência em Pernambuco na representatividade, inovação tecnológica no ensino e defesa dos direitos do instrutor autônomo de trânsito até 2030.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Liderança e Inovação Contínua
          </div>
        </motion.div>

        {/* Valores */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl space-y-3 flex flex-col justify-between transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl w-fit">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Nossos Valores</h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Ética e Transparência:</strong> Gestão aberta e compromisso com a verdade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>União e Solidariedade:</strong> Cooperação ativa entre os profissionais.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Respeito à Vida:</strong> Foco absoluto na segurança no trânsito.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Dignidade Profissional:</strong> Valorização do trabalho autônomo.</span>
              </li>
            </ul>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-purple-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pilares da Nossa Atuação
          </div>
        </motion.div>
      </div>

      {/* Pilares Institucionais & Benefícios */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Pilares da Atuação da AIAPE</h3>
            <p className="text-xs text-slate-400">O suporte que transforma a rotina do instrutor autônomo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h4 className="text-xs font-bold text-white">Representação Institucional</h4>
            <p className="text-[11px] text-slate-400">
              Atuação firme junto ao DETRAN-PE, SENATRAN e órgãos reguladores para resguardar as atribuições do instrutor.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Qualificação e Cursos</h4>
            <p className="text-[11px] text-slate-400">
              Workshops, reciclagens e encontros pedagógicos focados em novas metodologias de ensino de trânsito.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Rede de Benefícios</h4>
            <p className="text-[11px] text-slate-400">
              Descontos em oficinas, renovação de seguro do veículo de instrução e parcerias comerciais exclusivas.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h4 className="text-xs font-bold text-white">Carteira Digital do Associado</h4>
            <p className="text-[11px] text-slate-400">
              Acesso facilitado à credencial virtual para validação rápida com empresas parceiras.
            </p>
          </div>
        </div>
      </div>

      {/* Próximos Eventos Institucionais (Se Houver) */}
      {events && events.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Próximos Eventos e Reuniões Institucionais</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.slice(0, 4).map((event) => (
              <div key={event.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{event.title}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                  </span>
                </div>
                {event.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{event.description}</p>
                )}
                {event.location && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {event.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chamada para Cadastro de Novos Associados */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-extrabold text-white">Faça Parte da AIAPE</h3>
          <p className="text-xs text-slate-300">
            Associe-se para fortalecer a categoria dos instrutores de trânsito de Pernambuco e ter acesso à carteira digital e benefícios.
          </p>
        </div>

        <button
          onClick={onOpenPublicRegister}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Cadastre-se na AIAPE Hoje</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
