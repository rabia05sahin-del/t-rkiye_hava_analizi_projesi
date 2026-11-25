import { useState } from 'react';
import { Bell, BellRing, RefreshCw, Trash2, Zap } from 'lucide-react';
import type {
  CityWeatherData,
  NotificationAlertItem,
  TrackedCitySnapshot,
} from '../types/weather';

interface NotificationCenterTabProps {
  cities: CityWeatherData[];
  trackedCities: TrackedCitySnapshot[];
  alerts: NotificationAlertItem[];
  permissionState: NotificationPermission | 'unsupported';
  isCheckingNow: boolean;
  lastCheckMessage: string | null;
  onRequestPermission: () => void;
  onAddTrackedCity: (cityId: string) => void;
  onRemoveTrackedCity: (cityId: string) => void;
  onCheckNow: () => void;
  onSimulateChange: (cityId?: string) => void;
  onClearAlerts: () => void;
}

function getPermissionText(state: NotificationPermission | 'unsupported'): {
  label: string;
  toneClass: string;
} {
  if (state === 'granted') {
    return { label: 'İzin Verildi (Sistem Bildirimleri Açık)', toneClass: 'text-emerald-700' };
  }
  if (state === 'denied') {
    return {
      label: 'Tarayıcı İzni Engelli (Uygulama İçi Uyarılar Aktif)',
      toneClass: 'text-amber-700',
    };
  }
  if (state === 'unsupported') {
    return {
      label: 'Tarayıcı Bildirimi Kısıtlı (Uygulama İçi Uyarılar Aktif)',
      toneClass: 'text-amber-700',
    };
  }
  return { label: 'Bildirim İzni Bekleniyor', toneClass: 'text-sky-800' };
}

function getStatusColorClass(status: 'iyi' | 'orta' | 'kotu'): string {
  if (status === 'iyi') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'orta') return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function NotificationCenterTab({
  cities,
  trackedCities,
  alerts,
  permissionState,
  isCheckingNow,
  lastCheckMessage,
  onRequestPermission,
  onAddTrackedCity,
  onRemoveTrackedCity,
  onCheckNow,
  onSimulateChange,
  onClearAlerts,
}: NotificationCenterTabProps) {
  const availableCities = cities.filter(
    (c) => !trackedCities.some((tracked) => tracked.cityId === c.id)
  );
  const [selectedAddId, setSelectedAddId] = useState<string>(
    availableCities[0]?.id ?? cities[0]?.id ?? 'ankara'
  );

  const effectiveSelectId = availableCities.some((c) => c.id === selectedAddId)
    ? selectedAddId
    : availableCities[0]?.id ?? '';

  const permInfo = getPermissionText(permissionState);

  function handleAdd() {
    if (!effectiveSelectId) return;
    onAddTrackedCity(effectiveSelectId);
  }

  return (
    <section
      aria-label="Bildirim Merkezi"
      className="h-full w-full overflow-y-auto bg-slate-50"
    >
      <div className="max-w-[1440px] mx-auto min-h-full lg:h-full px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Permission + Controls + Tracked Provinces */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:h-full">
          {/* Permission, Check Now & Simulation Controls */}
          <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-lg font-bold text-slate-900">
                  Bildirim Merkezi
                </h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  81 ilden takip etmek istediklerinizi ekleyin; sıcaklık, PM2.5, PM10 veya
                  İyi/Orta/Kötü durumu değiştiğinde anında uyarı alın.
                </p>
              </div>
              <BellRing className="w-5 h-5 text-sky-700 shrink-0" aria-hidden="true" />
            </div>

            <div className="bg-sky-50/70 border border-sky-200 rounded-lg px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-700 font-medium">Bildirim Durumu:</span>
              <span className={`font-semibold text-right ${permInfo.toneClass}`}>
                {permInfo.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRequestPermission}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Bildirim İzni Ver</span>
              </button>

              <button
                type="button"
                onClick={onCheckNow}
                disabled={isCheckingNow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNow ? 'animate-spin' : ''}`} />
                <span>{isCheckingNow ? 'Kontrol Ediliyor...' : 'Şimdi Kontrol Et'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSimulateChange(trackedCities[0]?.cityId || effectiveSelectId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Değişim Bildirimini Test Et</span>
              </button>
            </div>

            {lastCheckMessage && (
              <p
                role="status"
                className="text-xs font-medium text-sky-900 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2"
              >
                {lastCheckMessage}
              </p>
            )}
          </div>

          {/* Add & List Tracked Provinces (all 81 provinces) */}
          <div className="flex-1 min-h-[260px] bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col overflow-hidden">
            <div className="shrink-0 space-y-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Takip Edilen İller ({trackedCities.length})
                </h2>
                <span className="text-xs text-slate-500">Tarayıcıda kalıcı kayıt</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Takibe eklenecek ili seçin"
                  value={effectiveSelectId}
                  onChange={(e) => setSelectedAddId(e.target.value)}
                  disabled={availableCities.length === 0}
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {availableCities.length === 0 ? (
                    <option value="">81 ilin tamamı takibe eklendi</option>
                  ) : (
                    availableCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} ({city.statusLabel} · PM2.5: {city.pm25.toFixed(1)} ·{' '}
                        {city.temperature.toFixed(1)}°C)
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!effectiveSelectId}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + Şehri Ekle
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pt-3">
              {trackedCities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Henüz takip edilen il yok
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Yukarıdaki listeden 81 ilden birini seçip &ldquo;+ Şehri Ekle&rdquo; butonuna
                    basarak takibi başlatabilirsiniz.
                  </p>
                </div>
              ) : (
                trackedCities.map((item) => {
                  const liveCity = cities.find((c) => c.id === item.cityId);
                  const displayTemp = liveCity ? liveCity.temperature : item.lastTemperature;
                  const displayPm25 = liveCity ? liveCity.pm25 : item.lastPm25 ?? 0;
                  const displayPm10 = liveCity ? liveCity.pm10 : item.lastPm10 ?? 0;
                  const displayStatus = liveCity ? liveCity.status : item.lastStatus ?? 'iyi';
                  const displayStatusLabel = liveCity
                    ? liveCity.statusLabel
                    : item.lastStatusLabel ?? 'İyi';

                  return (
                    <div
                      key={item.cityId}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{item.cityName}</span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getStatusColorClass(
                              displayStatus
                            )}`}
                          >
                            {displayStatusLabel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-mono-tabular">
                          {displayTemp.toFixed(1)} °C · PM2.5: {displayPm25.toFixed(1)} · PM10:{' '}
                          {displayPm10.toFixed(1)} µg/m³
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Son kontrol: {item.lastCheckedAt || item.addedAt}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveTrackedCity(item.cityId)}
                        aria-label={`${item.cityName} ilini sil`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Bildirim Geçmişi */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[320px] lg:h-full overflow-hidden">
          <div className="px-5 py-3.5 bg-sky-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900">
                Bildirim Geçmişi ({alerts.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Periyodik denetim ve &ldquo;Şimdi Kontrol Et&rdquo; ile saptanan tüm değişimler
                burada listelenir.
              </p>
            </div>
            {alerts.length > 0 && (
              <button
                type="button"
                onClick={onClearAlerts}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Geçmişi Temizle
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-6">
                <Bell className="w-8 h-8 text-sky-200 mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-800">
                  Henüz bildirim geçmişi kaydı yok
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Hemen denemek için soldaki{' '}
                  <strong className="text-slate-700">
                    &ldquo;Değişim Bildirimini Test Et&rdquo;
                  </strong>{' '}
                  düğmesine tıklayabilirsiniz.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 space-y-1 ${
                    alert.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-sky-50/60 border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900">{alert.title}</div>
                    <span className="font-mono-tabular text-xs text-slate-600 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {alert.cityName} ·{' '}
                    {alert.isSimulation ? 'Simülasyon Testi' : 'Otomatik Değişim Tespiti'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
