import { RefreshCw } from 'lucide-react';
import type { TabKey } from '../types/weather';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh: () => void;
  isLoading: boolean;
  trackedCount: number;
  unreadAlertCount: number;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'intro', label: 'Giriş & Hakkında' },
  { key: 'map', label: 'Canlı Harita' },
  { key: 'detective', label: 'AI Dedektifi' },
  { key: 'notifications', label: 'Bildirim Merkezi' },
];

export function Navbar({
  activeTab,
  onTabChange,
  onRefresh,
  isLoading,
  trackedCount,
  unreadAlertCount,
}: NavbarProps) {
  return (
    <header className="shrink-0 bg-white border-b border-slate-200 z-30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('intro')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-sky-600 shrink-0"
          >
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M6.5 13.5C8.5 11.5 10.5 11.5 12 13C13.5 14.5 15.5 14.5 17.5 12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <circle cx="12" cy="8" r="1.75" fill="currentColor" />
          </svg>
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Türkiye Hava Analizi
          </span>
        </button>

        {/* Zone 2: Desktop 4-tab Navigation */}
        <nav
          aria-label="Ana sekmeler"
          role="tablist"
          className="hidden md:flex items-center gap-6 h-full"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const showCount =
              tab.key === 'notifications' && (unreadAlertCount > 0 || trackedCount > 0);
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.key)}
                className={`relative h-full px-1 flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isActive
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {showCount && (
                  <span className="font-mono-tabular text-xs text-slate-500">
                    ({unreadAlertCount > 0 ? unreadAlertCount : trackedCount})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-60 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Güncelleniyor' : 'Veriyi Yenile'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Compact Tab Bar */}
      <nav
        aria-label="Mobil sekmeler"
        role="tablist"
        className="flex md:hidden items-center justify-between border-t border-slate-100 px-2 overflow-x-auto"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={`relative py-2.5 px-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive ? 'text-sky-700 font-semibold' : 'text-slate-600'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-600"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
