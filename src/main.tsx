import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety patch for DOM node removal and insertion
// Prevents React crashes ("removeChild" / "insertBefore" error) when browser extensions or auto-translations mutate DOM nodes
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch {
          // Node removed or altered by browser extension/translator
        }
      }
      return child;
    }
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch {
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        try {
          return child.parentNode.insertBefore(node, child) as T;
        } catch {
          // Node altered by browser extension/translator
        }
      }
      try {
        return this.appendChild(node) as T;
      } catch {
        return node;
      }
    }
    try {
      return originalInsertBefore.call(this, node, child) as T;
    } catch {
      return node;
    }
  };
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React App:', error, errorInfo);

    // Auto-recover if error is caused by DOM node removal mismatch (e.g. translation extensions)
    const errorMsg = error?.message || String(error);
    if (
      errorMsg.includes('removeChild') ||
      errorMsg.includes('insertBefore') ||
      errorMsg.includes('not a child of this node')
    ) {
      console.warn('Auto-recovering from DOM manipulation error boundary...');
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 50);
    }
  }

  render() {
    if (this.state.hasError) {
      const isDomError =
        this.state.error?.message.includes('removeChild') ||
        this.state.error?.message.includes('insertBefore') ||
        this.state.error?.message.includes('not a child of this node');

      // If it's a DOM mismatch error, attempt seamless auto-render or fallback
      if (isDomError) {
        return this.props.children;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ops! Algo deu errado</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ocorreu uma falha inesperada ao carregar a interface. Clique abaixo para reiniciar a aplicação com segurança.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-[10px] text-rose-300 font-mono text-left overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
