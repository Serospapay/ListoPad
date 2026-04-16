import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  isDarkMode: boolean;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Невідома помилка' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const dark = this.props.isDarkMode;
      return (
        <div
          className={`max-w-xl mx-auto p-8 border text-center space-y-4 ${
            dark ? 'border-rose-900/50 bg-rose-950/20 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em]">Помилка інтерфейсу</p>
          <p className="text-sm font-serif italic">{this.state.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border ${
                dark ? 'border-stone-600 text-stone-200 hover:bg-stone-800' : 'border-stone-300 text-stone-900 hover:bg-stone-100'
              }`}
            >
              Спробувати знову
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border ${
                dark ? 'border-amber-200/35 text-stone-100 hover:bg-amber-200/10' : 'border-stone-500 text-stone-900 hover:bg-stone-100'
              }`}
            >
              На головну
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border ${
                dark ? 'border-stone-500 text-stone-300 hover:bg-stone-900/40' : 'border-stone-300 text-stone-800 hover:bg-stone-100'
              }`}
            >
              Перезавантажити
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
