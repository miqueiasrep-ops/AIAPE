import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Wallet, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight, 
  Info, 
  LayoutDashboard,
  CheckCircle,
  TrendingUp,
  Settings,
  ShieldCheck,
  Calendar,
  Layers,
  LogOut,
  User,
  Activity,
  Cloud,
  CloudOff,
  RefreshCw,
  Mail,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  Menu,
  X,
  Download,
  Upload,
  Trash2,
  Users,
  Building,
  FileText
} from 'lucide-react';
import { 
  Transaction, 
  TransactionStatus, 
  Associate, 
  AssociationEvent, 
  AssociationConfig, 
  AssociateRequest,
  RequestStatus,
  MONTH_NAMES 
} from './types';
import DashboardCards from './components/DashboardCards';
import ReceiptExtractor from './components/ReceiptExtractor';
import TransactionTable from './components/TransactionTable';
import DashboardCharts from './components/DashboardCharts';
import AddManualTransaction from './components/AddManualTransaction';
import { AssociateManagement } from './components/AssociateManagement';
import { PublicRegister } from './components/PublicRegister';
import { AssociationEvents } from './components/AssociationEvents';
import { AssociationReports } from './components/AssociationReports';
import { AssociationSettings } from './components/AssociationSettings';
import { AssociationHistory } from './components/AssociationHistory';
import { AssociatePortal } from './components/AssociatePortal';
import { AssociateLoginModal } from './components/AssociateLoginModal';
import { PublicValidation } from './components/PublicValidation';
import { AiapeLogo } from './components/AiapeLogo';
import { CloudSyncModal } from './components/CloudSyncModal';
import {
  auth,
  db,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  updateDoc,
  onSnapshot,
  writeBatch,
  cleanForFirestore,
  FirebaseUser
} from './firebase';

// Safe localStorage access helpers to prevent crashes in restricted iframe/incognito contexts
const safeGetLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage.getItem indisponível:', e);
    return null;
  }
};

const safeSetLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage.setItem indisponível:', e);
  }
};

const safeRemoveLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage.removeItem indisponível:', e);
  }
};

// Helper to sanitize associate payloads for Firestore storage (ensures documents never exceed 1MB limit)
export function sanitizeAssociateForFirestore(assoc: Associate): Associate {
  const sanitized = { ...assoc };
  if (sanitized.documents) {
    const docs = { ...sanitized.documents };
    // If base64 data URLs are overly large (> 250KB each), preserve file names and info
    if (docs.cnhUrl && docs.cnhUrl.length > 250000) {
      docs.cnhUrl = '';
    }
    if (docs.crlvUrl && docs.crlvUrl.length > 250000) {
      docs.crlvUrl = '';
    }
    if (docs.senatranUrl && docs.senatranUrl.length > 250000) {
      docs.senatranUrl = '';
    }
    sanitized.documents = docs;
  }
  return sanitized;
}

// Initial default data for Association System
const INITIAL_ASSOCIATES: Associate[] = [
  {
    id: 'assoc-58414720463',
    name: 'Instrutor Associado',
    document: '584.147.204-63',
    email: 'associado584@aiape.org.br',
    phone: '(81) 98888-0000',
    category: 'Membro Efetivo',
    status: 'ativo',
    monthlyFee: 70,
    dueDay: 30,
    membershipDate: '2026-08-19',
    birthDate: '1998-10-13',
    password: '131098',
    registrationNumber: 'AIAPE-5841',
    validityDate: 'DEZ/2026',
    cnhCategory: 'AB',
    senatranCredential: 'SENATRAN: 584147',
    notes: 'Cadastro oficializado e sincronizado no banco de dados com senha de acesso ativa.'
  }
];
const INITIAL_EVENTS: AssociationEvent[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_CONFIG: AssociationConfig = {
  name: 'Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)',
  cnpj: '',
  president: 'Presidência AIAPE',
  treasurer: 'Tesouraria AIAPE',
  email: 'contato@aiape.org.br',
  phone: '(81) 98888-7777',
  address: 'Recife - Pernambuco/PE',
  defaultMonthlyFee: 70,
  defaultDueDay: 30,
  primaryBank: 'Banco do Brasil',
  pixKey: '8a0fa350-4511-4eab-a06f-6cc3bf44475c',
  financePin: '1234'
};

export default function App() {
  const isInitializingRef = useRef(false);

  // Core States
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = safeGetLocalStorage('assoc_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy fictitious mock data
          return parsed.filter((t: any) => !['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6'].includes(t.id));
        }
      } catch (e) {
        console.warn('Erro ao ler JSON do localStorage:', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [associates, setAssociates] = useState<Associate[]>(() => {
    const saved = safeGetLocalStorage('assoc_associates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy fictitious mock data
          return parsed.filter((a: any) => !['assoc-1', 'assoc-2', 'assoc-3', 'assoc-4', 'assoc-5'].includes(a.id));
        }
      } catch (e) {
        console.warn('Erro ao ler associados do localStorage:', e);
      }
    }
    return INITIAL_ASSOCIATES;
  });

  const [events, setEvents] = useState<AssociationEvent[]>(() => {
    const saved = safeGetLocalStorage('assoc_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy fictitious mock data
          return parsed.filter((ev: any) => !['ev-1', 'ev-2', 'ev-3'].includes(ev.id));
        }
      } catch (e) {
        console.warn('Erro ao ler eventos do localStorage:', e);
      }
    }
    return INITIAL_EVENTS;
  });

  const [associationConfig, setAssociationConfig] = useState<AssociationConfig>(() => {
    const saved = safeGetLocalStorage('assoc_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.cnpj = '';
          if (!parsed.name || parsed.name.includes('Comunidade Viva') || parsed.name.includes('Fluxo de Caixa')) {
            parsed.name = 'Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)';
          }
          if (!parsed.email || parsed.email.includes('comunidadeviva')) {
            parsed.email = 'contato@aiape.org.br';
          }
          if (!parsed.phone || parsed.phone.includes('3456-7890')) {
            parsed.phone = '(81) 98888-7777';
          }
          if (!parsed.address || parsed.address.includes('Paulista')) {
            parsed.address = 'Recife - Pernambuco/PE';
          }
          if (!parsed.defaultMonthlyFee || parsed.defaultMonthlyFee === 50) {
            parsed.defaultMonthlyFee = 70;
          }
          if (!parsed.defaultDueDay || parsed.defaultDueDay === 10) {
            parsed.defaultDueDay = 30;
          }
          if (!parsed.pixKey || parsed.pixKey === 'contato@aiape.org.br') {
            parsed.pixKey = '8a0fa350-4511-4eab-a06f-6cc3bf44475c';
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Erro ao ler configurações do localStorage:', e);
      }
    }
    return INITIAL_CONFIG;
  });

  // Associate Requests state
  const [associateRequests, setAssociateRequests] = useState<AssociateRequest[]>(() => {
    const saved = safeGetLocalStorage('assoc_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Erro ao ler solicitações:', e);
      }
    }
    return [
      {
        id: 'req-1',
        associateId: 'assoc-1',
        associateName: 'Maria Silva',
        type: 'Empréstimo Consignado Parceiro',
        title: 'Solicitação de Empréstimo Parceiro AIAPE (Taxa 1.2% a.m.)',
        description: 'Desejo simular e solicitar R$ 5.000,00 em 24x via banco parceiro da associação com taxa reduzida.',
        status: 'analise',
        date: '2026-08-01'
      }
    ];
  });

  // Associate Portal Login State
  const [loggedAssociate, setLoggedAssociate] = useState<Associate | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    safeSetLocalStorage('assoc_requests', JSON.stringify(associateRequests));
  }, [associateRequests]);

  const handleCreateRequest = async (req: Omit<AssociateRequest, 'id' | 'date' | 'status'>) => {
    const reqId = `req-${Date.now()}`;
    const newReq: AssociateRequest = {
      ...req,
      id: reqId,
      date: new Date().toISOString().split('T')[0],
      status: 'pendente'
    };
    setAssociateRequests(prev => [newReq, ...prev]);
    safeSetLocalStorage('assoc_requests', JSON.stringify([newReq, ...associateRequests]));
    try {
      await setDoc(doc(db, 'requests', reqId), cleanForFirestore(newReq));
    } catch (err) {
      console.error('Erro ao salvar solicitação no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  const [currentTime, setCurrentTime] = useState('');
  const [selectedCompetence, setSelectedCompetence] = useState('Julho 2026');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'associados' | 'fluxo' | 'conciliacao' | 'eventos' | 'relatorios' | 'configuracoes'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PIN protection state for Administrative Modules (Diretoria / ADM)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return safeGetLocalStorage('assoc_admin_unlocked') === 'true' || safeGetLocalStorage('assoc_finance_unlocked') === 'true';
  });
  const [pendingAdminTab, setPendingAdminTab] = useState<'dashboard' | 'associados' | 'fluxo' | 'conciliacao' | 'eventos' | 'relatorios' | 'configuracoes' | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSelectTab = (tab: typeof activeTab) => {
    const isAdminTab = tab !== 'dashboard';
    if (isAdminTab && !isAdminUnlocked) {
      setPendingAdminTab(tab);
      setPinInput('');
      setPinError(null);
      setIsPinModalOpen(true);
      setMobileMenuOpen(false);
      return;
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPin = associationConfig.financePin || '1234';
    if (pinInput.trim() === targetPin.trim()) {
      setIsAdminUnlocked(true);
      safeSetLocalStorage('assoc_admin_unlocked', 'true');
      safeSetLocalStorage('assoc_finance_unlocked', 'true');
      setIsPinModalOpen(false);
      if (pendingAdminTab) {
        setActiveTab(pendingAdminTab);
        setPendingAdminTab(null);
      } else if (activeTab === 'dashboard') {
        setActiveTab('associados');
      }
      setPinError(null);
    } else {
      setPinError('PIN incorreto! Acesso exclusivo para a Diretoria / Administração.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    safeRemoveLocalStorage('assoc_admin_unlocked');
    safeRemoveLocalStorage('assoc_finance_unlocked');
    setActiveTab('dashboard');
  };
  // Public QR Code Validation mode (when scanning the digital card QR Code)
  const [validatingAssociateId, setValidatingAssociateId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('validar') || params.get('v') || null;
    }
    return null;
  });

  // Public Self-Registration / Enrollment mode
  const [isPublicRegisterMode, setIsPublicRegisterMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('autocadastro') === 'true' || 
        params.get('cadastro') === 'true' ||
        params.get('matricula') === 'true' ||
        params.get('filiacao') === 'true' ||
        params.get('inscricao') === 'true'
      );
    }
    return false;
  });
  
  // Firebase Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'sincronizado' | 'sincronizando' | 'erro'>('sincronizando');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  
  // Auth Form State
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Cloud Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Helper to handle Firestore errors safely without breaking the UI
  const handleFirebaseError = (err: any) => {
    const errMsg = err?.message || String(err);
    if (err?.code === 'resource-exhausted' || errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
      setIsQuotaExceeded(true);
      setSyncStatus('erro');
    } else {
      setSyncStatus('erro');
    }
  };

  // Save associates to localStorage when changed
  useEffect(() => {
    safeSetLocalStorage('assoc_associates', JSON.stringify(associates));
  }, [associates]);

  // Save events to localStorage when changed
  useEffect(() => {
    safeSetLocalStorage('assoc_events', JSON.stringify(events));
  }, [events]);

  // Save config to localStorage when changed
  useEffect(() => {
    safeSetLocalStorage('assoc_config', JSON.stringify(associationConfig));
  }, [associationConfig]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false });
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Firebase Auth Observer & Real-time Cloud Synchronization (Read-only listeners to avoid write recursion)
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      // Clean up previous snapshot listeners
      unsubs.forEach(u => u());
      unsubs = [];

      if (!currentUser) {
        try {
          setSyncStatus('sincronizando');
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Login anônimo indisponível. Operando com cache local.', err);
          handleFirebaseError(err);
        }
      }

      // Establish real-time Firestore listeners on shared collections
      setSyncStatus('sincronizando');
      try {
        // 1. Synchronize Associates (pure read-only listener)
        const associatesRef = collection(db, 'associates');
        const unsubAssociates = onSnapshot(associatesRef, (snapshot) => {
          const list: Associate[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Associate);
          });

          if (list.length > 0) {
            // Sort by registration / membership date desc
            list.sort((a, b) => {
              const dateA = new Date(a.membershipDate || '').getTime() || 0;
              const dateB = new Date(b.membershipDate || '').getTime() || 0;
              return dateB - dateA;
            });
            setAssociates(list);
            safeSetLocalStorage('assoc_associates', JSON.stringify(list));
          }
          setSyncStatus('sincronizado');
        }, (err) => {
          console.warn('Erro ao escutar associados no Firestore:', err);
          handleFirebaseError(err);
        });
        unsubs.push(unsubAssociates);

        // 2. Synchronize Transactions (Cash Flow)
        const transactionsRef = collection(db, 'transactions');
        const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
          const list: Transaction[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
          });

          if (list.length > 0) {
            list.sort((a, b) => {
              const dateA = new Date(a.date).getTime() || 0;
              const dateB = new Date(b.date).getTime() || 0;
              if (dateB !== dateA) return dateB - dateA;
              const createdA = new Date(a.createdAt).getTime() || 0;
              const createdB = new Date(b.createdAt).getTime() || 0;
              return createdB - createdA;
            });
            setTransactions(list);
            safeSetLocalStorage('assoc_transactions', JSON.stringify(list));
          }
          setSyncStatus('sincronizado');
        }, (err) => {
          console.warn('Erro ao escutar transações no Firestore:', err);
          handleFirebaseError(err);
        });
        unsubs.push(unsubTransactions);

        // 3. Synchronize Events & Assemblies
        const eventsRef = collection(db, 'events');
        const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
          const list: AssociationEvent[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AssociationEvent);
          });
          if (list.length > 0) {
            setEvents(list);
            safeSetLocalStorage('assoc_events', JSON.stringify(list));
          }
        }, (err) => {
          console.warn('Erro ao escutar eventos:', err);
          handleFirebaseError(err);
        });
        unsubs.push(unsubEvents);

        // 4. Synchronize Associate Requests
        const requestsRef = collection(db, 'requests');
        const unsubRequests = onSnapshot(requestsRef, (snapshot) => {
          const list: AssociateRequest[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AssociateRequest);
          });
          if (list.length > 0) {
            setAssociateRequests(list);
            safeSetLocalStorage('assoc_requests', JSON.stringify(list));
          }
        }, (err) => {
          console.warn('Erro ao escutar solicitações:', err);
          handleFirebaseError(err);
        });
        unsubs.push(unsubRequests);

        // 5. Synchronize Association Configuration
        const configDocRef = doc(db, 'config', 'association');
        const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AssociationConfig;
            if (!data.pixKey || data.pixKey === 'contato@aiape.org.br') {
              data.pixKey = '8a0fa350-4511-4eab-a06f-6cc3bf44475c';
            }
            setAssociationConfig(prev => ({
              ...prev,
              ...data,
              pixKey: data.pixKey || prev.pixKey || '8a0fa350-4511-4eab-a06f-6cc3bf44475c'
            }));
            safeSetLocalStorage('assoc_config', JSON.stringify(data));
          }
        }, (err) => {
          console.warn('Erro ao escutar configurações:', err);
          handleFirebaseError(err);
        });
        unsubs.push(unsubConfig);

      } catch (setupErr) {
        console.error('Falha ao configurar sincronização em nuvem:', setupErr);
        handleFirebaseError(setupErr);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
    };
  }, []);

  const loadLocalTransactions = () => {
    const saved = safeGetLocalStorage('assoc_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (err) {
        setTransactions(INITIAL_TRANSACTIONS);
        safeSetLocalStorage('assoc_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      safeSetLocalStorage('assoc_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }
  };

  // Transaction Handlers
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const tx: Transaction = {
      ...newTx,
      id: txId,
      createdAt: new Date().toISOString()
    };

    // Update local state immediately for snappy UI
    setTransactions(prev => [tx, ...prev]);
    safeSetLocalStorage('assoc_transactions', JSON.stringify([tx, ...transactions]));

    // Persist to shared cloud Firestore
    setSyncStatus('sincronizando');
    try {
      await setDoc(doc(db, 'transactions', txId), cleanForFirestore(tx));
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao salvar transação no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;
    const nextStatus = target.status === 'pago' ? 'pendente' : 'pago';

    const updated = transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: nextStatus as TransactionStatus };
      }
      return t;
    });
    setTransactions(updated);
    safeSetLocalStorage('assoc_transactions', JSON.stringify(updated));

    setSyncStatus('sincronizando');
    try {
      await updateDoc(doc(db, 'transactions', id), cleanForFirestore({
        status: nextStatus
      }));
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      handleFirebaseError(err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    safeSetLocalStorage('assoc_transactions', JSON.stringify(updated));

    setSyncStatus('sincronizando');
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao excluir do Firestore:', err);
      handleFirebaseError(err);
    }
  };

  // Associates Handlers (Synchronized with Firestore for all notebooks & smartphones)
  const handleAddAssociate = async (assocData: Omit<Associate, 'id'>): Promise<Associate> => {
    const cleanDoc = (assocData.document || '').replace(/\D/g, '');
    const newId = cleanDoc ? `assoc-${cleanDoc}` : `assoc-${Date.now()}`;

    const newAssoc: Associate = {
      ...assocData,
      id: newId
    };

    // Update locally immediately
    setAssociates(prev => {
      const filtered = prev.filter(a => a.id !== newId && (cleanDoc ? (a.document || '').replace(/\D/g, '') !== cleanDoc : true));
      return [newAssoc, ...filtered];
    });
    safeSetLocalStorage('assoc_associates', JSON.stringify([newAssoc, ...associates]));

    // Sanitize to prevent 1MB Firestore limit crash
    const sanitized = sanitizeAssociateForFirestore(newAssoc);

    // Save to Firestore Cloud so notebook and all devices see it immediately
    setSyncStatus('sincronizando');
    try {
      await setDoc(doc(db, 'associates', newAssoc.id), cleanForFirestore(sanitized), { merge: true });
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao salvar associado no Firestore:', err);
      handleFirebaseError(err);
    }

    return newAssoc;
  };

  const handleUpdateAssociate = async (updatedAssoc: Associate) => {
    const updated = associates.map(a => a.id === updatedAssoc.id ? updatedAssoc : a);
    setAssociates(updated);
    safeSetLocalStorage('assoc_associates', JSON.stringify(updated));

    if (loggedAssociate && loggedAssociate.id === updatedAssoc.id) {
      setLoggedAssociate(updatedAssoc);
    }

    const sanitized = sanitizeAssociateForFirestore(updatedAssoc);

    setSyncStatus('sincronizando');
    try {
      await setDoc(doc(db, 'associates', updatedAssoc.id), cleanForFirestore(sanitized), { merge: true });
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao atualizar associado no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  const handleDeleteAssociate = async (id: string) => {
    const updated = associates.filter(a => a.id !== id);
    setAssociates(updated);
    safeSetLocalStorage('assoc_associates', JSON.stringify(updated));

    setSyncStatus('sincronizando');
    try {
      await deleteDoc(doc(db, 'associates', id));
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao excluir associado no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  // Batch Import Associates from Excel / Google Forms with Firestore batch write optimization
  const handleBatchImportAssociates = async (
    newAssocs: Omit<Associate, 'id'>[],
    updateExisting: boolean
  ): Promise<{ imported: number; updated: number }> => {
    let imported = 0;
    let updated = 0;
    setSyncStatus('sincronizando');

    const updatedLocalList = [...associates];
    const itemsToWrite: { id: string; data: any }[] = [];

    for (const assocData of newAssocs) {
      const cleanDoc = (assocData.document || '').replace(/\D/g, '');
      const existingIndex = updatedLocalList.findIndex(a => (a.document || '').replace(/\D/g, '') === cleanDoc);

      if (existingIndex >= 0) {
        if (updateExisting) {
          const merged: Associate = {
            ...updatedLocalList[existingIndex],
            ...assocData,
            id: updatedLocalList[existingIndex].id
          };
          updatedLocalList[existingIndex] = merged;
          itemsToWrite.push({ id: merged.id, data: sanitizeAssociateForFirestore(merged) });
          updated++;
        }
      } else {
        const newId = cleanDoc ? `assoc-${cleanDoc}` : `assoc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const created: Associate = {
          ...assocData,
          id: newId
        };
        updatedLocalList.unshift(created);
        itemsToWrite.push({ id: newId, data: sanitizeAssociateForFirestore(created) });
        imported++;
      }
    }

    // Update local state and storage immediately
    setAssociates(updatedLocalList);
    safeSetLocalStorage('assoc_associates', JSON.stringify(updatedLocalList));

    // Batch commit to Firestore in chunks of 450 items
    try {
      const CHUNK_SIZE = 450;
      for (let i = 0; i < itemsToWrite.length; i += CHUNK_SIZE) {
        const chunk = itemsToWrite.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(item => {
          batch.set(doc(db, 'associates', item.id), cleanForFirestore(item.data), { merge: true });
        });
        await batch.commit();
      }
      setSyncStatus('sincronizado');
    } catch (err) {
      console.error('Erro ao salvar lote de associados no Firestore:', err);
      handleFirebaseError(err);
    }

    return { imported, updated };
  };

  // Force Full Synchronization from local memory to Firestore using writeBatch
  const handleForceSyncAllLocalToCloud = async (): Promise<{ associates: number; transactions: number; events: number; requests: number }> => {
    setSyncStatus('sincronizando');
    let assocCount = 0;
    let txCount = 0;
    let eventCount = 0;
    let reqCount = 0;

    try {
      // 1. Sync associates
      const localAssocs = safeGetLocalStorage('assoc_associates');
      if (localAssocs) {
        const parsed: Associate[] = JSON.parse(localAssocs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const CHUNK_SIZE = 450;
          for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
            const chunk = parsed.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach(a => {
              if (a && a.id) {
                batch.set(doc(db, 'associates', a.id), cleanForFirestore(sanitizeAssociateForFirestore(a)), { merge: true });
                assocCount++;
              }
            });
            await batch.commit();
          }
        }
      }

      // 2. Sync transactions
      const localTx = safeGetLocalStorage('assoc_transactions');
      if (localTx) {
        const parsed: Transaction[] = JSON.parse(localTx);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const CHUNK_SIZE = 450;
          for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
            const chunk = parsed.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach(t => {
              if (t && t.id) {
                batch.set(doc(db, 'transactions', t.id), cleanForFirestore(t), { merge: true });
                txCount++;
              }
            });
            await batch.commit();
          }
        }
      }

      // 3. Sync events
      const localEvs = safeGetLocalStorage('assoc_events');
      if (localEvs) {
        const parsed: AssociationEvent[] = JSON.parse(localEvs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const batch = writeBatch(db);
          parsed.forEach(ev => {
            if (ev && ev.id) {
              batch.set(doc(db, 'events', ev.id), cleanForFirestore(ev), { merge: true });
              eventCount++;
            }
          });
          await batch.commit();
        }
      }

      // 4. Sync requests
      const localReqs = safeGetLocalStorage('assoc_requests');
      if (localReqs) {
        const parsed: AssociateRequest[] = JSON.parse(localReqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const batch = writeBatch(db);
          parsed.forEach(req => {
            if (req && req.id) {
              batch.set(doc(db, 'requests', req.id), cleanForFirestore(req), { merge: true });
              reqCount++;
            }
          });
          await batch.commit();
        }
      }

      // 5. Sync config
      const localCfg = safeGetLocalStorage('assoc_config');
      if (localCfg) {
        const parsed = JSON.parse(localCfg);
        await setDoc(doc(db, 'config', 'association'), cleanForFirestore(parsed), { merge: true });
      }

      setSyncStatus('sincronizado');
      setIsQuotaExceeded(false);
    } catch (err: any) {
      console.error('Erro na sincronização manual:', err);
      handleFirebaseError(err);
    }

    return { associates: assocCount, transactions: txCount, events: eventCount, requests: reqCount };
  };

  // Register Dues Payment (Baixa de Mensalidade)
  const handleRegisterPayment = (
    associate: Associate, 
    month: string, 
    value: number, 
    date: string, 
    bank: string,
    attachmentUrl?: string,
    attachmentName?: string
  ) => {
    // 1. Update Associate status and last payment
    const updatedAssoc: Associate = {
      ...associate,
      status: 'ativo',
      lastPaymentDate: date,
      lastPaymentMonth: month
    };
    handleUpdateAssociate(updatedAssoc);

    // 2. Create Receita Transaction in Cash Flow with attached proof of payment image
    handleAddTransaction({
      date,
      month,
      payer: associate.name,
      bank,
      value,
      type: 'receita',
      category: 'Mensalidades de Associados',
      description: `Mensalidade ${month} - ${associate.name}`,
      status: 'pago',
      associateId: associate.id,
      attachmentName: attachmentName || 'Comprovante_PIX.png',
      attachmentType: 'image/png',
      attachmentUrl: attachmentUrl
    });
  };

  // Events Handlers
  const handleAddEvent = async (eventData: Omit<AssociationEvent, 'id'>) => {
    const newEvent: AssociationEvent = {
      ...eventData,
      id: `ev-${Date.now()}`
    };
    setEvents(prev => [newEvent, ...prev]);
    safeSetLocalStorage('assoc_events', JSON.stringify([newEvent, ...events]));

    try {
      await setDoc(doc(db, 'events', newEvent.id), cleanForFirestore(newEvent));
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      handleFirebaseError(err);
    }
  };

  const handleUpdateEvent = async (updatedEvent: AssociationEvent) => {
    setEvents(events.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
    try {
      await setDoc(doc(db, 'events', updatedEvent.id), cleanForFirestore(updatedEvent), { merge: true });
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      handleFirebaseError(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(events.filter(ev => ev.id !== id));
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      handleFirebaseError(err);
    }
  };

  // Request Update Handler
  const handleUpdateRequestStatus = async (id: string, status: RequestStatus, note?: string) => {
    const updated = associateRequests.map(r => r.id === id ? { ...r, status, adminNote: note } : r);
    setAssociateRequests(updated);
    safeSetLocalStorage('assoc_requests', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'requests', id), cleanForFirestore({
        status,
        adminNote: note || ''
      }));
    } catch (err) {
      console.error('Erro ao atualizar solicitação no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  // Config Update Handler
  const handleSaveConfig = async (newConfig: AssociationConfig) => {
    setAssociationConfig(newConfig);
    safeSetLocalStorage('assoc_config', JSON.stringify(newConfig));
    try {
      await setDoc(doc(db, 'config', 'association'), cleanForFirestore(newConfig), { merge: true });
    } catch (err) {
      console.error('Erro ao salvar configuração no Firestore:', err);
      handleFirebaseError(err);
    }
  };

  // Authentication submit handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthForm(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setAuthError(err.message || 'Falha ao autenticar.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowAuthForm(false);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // Public Credential QR Code Validation Screen (scanned by phone/authority/inspector)
  if (validatingAssociateId) {
    return (
      <PublicValidation
        associateId={validatingAssociateId}
        associates={associates}
        associationConfig={associationConfig}
        onBack={() => {
          setValidatingAssociateId(null);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('validar');
            url.searchParams.delete('v');
            window.history.replaceState({}, '', url.toString());
          }
        }}
      />
    );
  }

  if (isPublicRegisterMode) {
    return (
      <PublicRegister
        associationConfig={associationConfig}
        onRegisterSuccess={(assoc) => handleAddAssociate(assoc)}
        onBackToDashboard={() => {
          setIsPublicRegisterMode(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('autocadastro');
            url.searchParams.delete('cadastro');
            url.searchParams.delete('matricula');
            url.searchParams.delete('filiacao');
            url.searchParams.delete('inscricao');
            window.history.replaceState({}, '', url.toString());
          }
        }}
        onEnterPortalDirectly={(assoc) => {
          setIsPublicRegisterMode(false);
          setLoggedAssociate(assoc);
        }}
      />
    );
  }

  // Resolve current active associate with live status from associates list
  const currentLoggedAssociate = loggedAssociate
    ? associates.find(a => a.id === loggedAssociate.id) || loggedAssociate
    : null;

  if (currentLoggedAssociate) {
    return (
      <AssociatePortal
        associate={currentLoggedAssociate}
        associationConfig={associationConfig}
        allAssociates={associates}
        myTransactions={transactions.filter(t => t.associateId === currentLoggedAssociate.id || t.payer.toLowerCase().includes(currentLoggedAssociate.name.toLowerCase()))}
        requests={associateRequests.filter(r => r.associateId === currentLoggedAssociate.id || r.associateName === currentLoggedAssociate.name)}
        onSubmitRequest={handleCreateRequest}
        onLogout={() => setLoggedAssociate(null)}
        onAddTransaction={handleAddTransaction}
        onRegisterPayment={handleRegisterPayment}
        onUpdateAssociate={handleUpdateAssociate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg lg:hidden transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <AiapeLogo variant="icon" size="md" customLogoUrl={associationConfig.logoUrl} />
            <div>
              <h1 className="text-sm lg:text-base font-bold text-white tracking-tight line-clamp-1">
                {associationConfig.name || 'Associação dos Instrutores de Trânsito Autônomos de Pernambuco (AIAPE)'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Instrutores de Trânsito Autônomos de PE</p>
            </div>
          </div>
        </div>

        {/* Competence, Lock and Time Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all cursor-pointer shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span>Área do Associado</span>
          </button>

          {isAdminUnlocked ? (
            <button
              onClick={handleLockAdmin}
              title="Encerrar Sessão de Administração"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">ADM Conectado</span>
              <Lock className="w-3 h-3 ml-0.5 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={() => {
                setPendingAdminTab('associados');
                setPinInput('');
                setPinError(null);
                setIsPinModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Área do ADM</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <select 
              value={selectedCompetence} 
              onChange={(e) => setSelectedCompetence(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="Julho 2026" className="bg-slate-900">Julho 2026</option>
              <option value="Agosto 2026" className="bg-slate-900">Agosto 2026</option>
              <option value="Setembro 2026" className="bg-slate-900">Setembro 2026</option>
              <option value="Ano 2026" className="bg-slate-900">Ano de 2026</option>
            </select>
          </div>

          <button 
            onClick={() => setIsSyncModalOpen(true)}
            title={
              syncStatus === 'sincronizado' 
                ? 'Nuvem Conectada e Sincronizada em Tempo Real. Clique para abrir o Gerenciador de Sincronização.' 
                : syncStatus === 'sincronizando' 
                ? 'Sincronizando dados com a nuvem...' 
                : 'Modo Offline / Falha na Nuvem. Clique para sincronizar agora.'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:brightness-110 ${
              syncStatus === 'sincronizado'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                : syncStatus === 'sincronizando'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            {syncStatus === 'sincronizado' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : syncStatus === 'sincronizando' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden md:inline text-[11px]">
              {syncStatus === 'sincronizado' ? 'Nuvem Ativa' : syncStatus === 'sincronizando' ? 'Sincronizando...' : 'Sincronizar'}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">{currentTime}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-4">
            {/* Seção Pública / Institucional */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Visão Institucional
              </p>

              <button 
                onClick={() => handleSelectTab('dashboard')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  Início (Apresentação)
                </span>
              </button>

              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  Área do Associado
                </span>
                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">Entrar</span>
              </button>
            </div>

            {/* Seção Administrativa (ADM) */}
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <div className="px-3 flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Área do ADM
                </span>
                {isAdminUnlocked ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">Liberado</span>
                ) : (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> PIN
                  </span>
                )}
              </div>

              <button 
                onClick={() => handleSelectTab('associados')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'associados'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Gestão de Associados
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {associates.length}
                  </span>
                  {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                </div>
              </button>

              <button 
                onClick={() => handleSelectTab('fluxo')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'fluxo'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  Fluxo de Caixa
                </span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => handleSelectTab('conciliacao')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'conciliacao'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Extrator de Comprovante
                </span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => handleSelectTab('eventos')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'eventos'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Eventos & Projetos
                </span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => handleSelectTab('relatorios')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'relatorios'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-rose-400" />
                  Prestação de Contas (DRE)
                </span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => handleSelectTab('configuracoes')}
                className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'configuracoes'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Configurações
                </span>
                {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </nav>


        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* Quota Exceeded Notification Banner */}
          {isQuotaExceeded && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-300">
                    Limite de Cota Gratuita do Firestore Atingido (Quota Exceeded)
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    O aplicativo continua 100% operacional no modo local seguro (cache). Todas as inclusões, mensalidades, emissões de carteirinhas e relatórios funcionam normalmente. As cotas diárias gratuitas do Firebase reiniciam à meia-noite.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Ver Detalhes & Sincronização
                </button>
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0135824596/firestore/databases/ai-studio-fluxodecaixainte-f91ed258-3d28-48f3-9a11-5820228e6cba/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Firebase Console</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <AssociationHistory
              associationConfig={associationConfig}
              events={events}
              onOpenPublicRegister={() => setIsPublicRegisterMode(true)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenAdminModal={() => {
                if (isAdminUnlocked) {
                  setActiveTab('associados');
                } else {
                  setPendingAdminTab('associados');
                  setPinInput('');
                  setPinError(null);
                  setIsPinModalOpen(true);
                }
              }}
            />
          )}

          {activeTab === 'associados' && (
            <AssociateManagement
              associates={associates}
              onAddAssociate={handleAddAssociate}
              onUpdateAssociate={handleUpdateAssociate}
              onDeleteAssociate={handleDeleteAssociate}
              onRegisterPayment={handleRegisterPayment}
              onAddTransaction={handleAddTransaction}
              associationConfig={associationConfig}
              onOpenPublicRegister={() => setIsPublicRegisterMode(true)}
              requests={associateRequests}
              onUpdateRequestStatus={handleUpdateRequestStatus}
              onBatchImportAssociates={handleBatchImportAssociates}
            />
          )}

          {activeTab === 'fluxo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TransactionTable 
                    transactions={transactions} 
                    onToggleStatus={handleToggleStatus}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </div>
                <div>
                  <AddManualTransaction onAddTransaction={handleAddTransaction} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conciliacao' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Extrator de Comprovante de pagamento de mensalidade
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Envie fotos de recibos, comprovantes Pix ou extratos bancários para identificação automática do depositante e baixa de mensalidade com IA (Gemini).
                </p>
              </div>

              <ReceiptExtractor 
                onAddTransaction={handleAddTransaction}
                associates={associates}
                onRegisterPayment={handleRegisterPayment}
              />
            </div>
          )}

          {activeTab === 'eventos' && (
            <AssociationEvents
              events={events}
              transactions={transactions}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'relatorios' && (
            <AssociationReports
              transactions={transactions}
              associates={associates}
              associationConfig={associationConfig}
              selectedCompetence={selectedCompetence}
            />
          )}

          {activeTab === 'configuracoes' && (
            <AssociationSettings
              config={associationConfig}
              onSaveConfig={handleSaveConfig}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              syncStatus={syncStatus}
            />
          )}
        </main>
      </div>

      {/* Cloud Sync Manager Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        associates={associates}
        transactions={transactions}
        events={events}
        requests={associateRequests}
        config={associationConfig}
        syncStatus={syncStatus}
        isQuotaExceeded={isQuotaExceeded}
        onForceSyncAll={handleForceSyncAllLocalToCloud}
      />

      {/* PIN Verification Modal for Área do ADM / Diretoria */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Área do Administrador (ADM)</h3>
                    <p className="text-xs text-slate-400">Autenticação de Segurança - Diretoria AIAPE</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  O acesso aos módulos administrativos (Gestão de Associados, Fluxo de Caixa, Extratos e Relatórios) é restrito à diretoria e conselho da AIAPE.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Informe o PIN Administrativo da Diretoria
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      required
                      maxLength={10}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-800 border border-slate-700 text-sm text-center text-blue-300 font-mono tracking-widest px-4 py-3 rounded-xl focus:outline-hidden focus:border-blue-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                {pinError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-[11px] text-slate-400">
                  💡 <strong>Dica:</strong> O PIN padrão inicial da diretoria é <strong className="text-amber-300 font-mono">1234</strong>. Pode ser personalizado na aba de <em>Configurações</em>.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    Acessar Área do ADM
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Associate Portal Login Modal */}
      <AssociateLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        associates={associates}
        associationConfig={associationConfig}
        onLoginSuccess={(assoc) => setLoggedAssociate(assoc)}
        onGoToRegister={() => setIsPublicRegisterMode(true)}
      />
    </div>
  );
}
