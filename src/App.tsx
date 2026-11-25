import { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { AiDetectiveTab } from './components/AiDetectiveTab';
import { IntroTab } from './components/IntroTab';
import { LiveMapTab } from './components/LiveMapTab';
import { Navbar } from './components/Navbar';
import { NotificationCenterTab } from './components/NotificationCenterTab';
import {
  fetchAllTurkishCitiesWeather,
  getFallbackCitiesData,
} from './services/weatherService';
import type {
  CityWeatherData,
  NotificationAlertItem,
  TabKey,
  TrackedCitySnapshot,
} from './types/weather';

const STORAGE_KEY_TRACKED = 'tr_hava_tracked_cities_v3';
const STORAGE_KEY_ALERTS = 'tr_hava_alerts_v3';
const POLL_INTERVAL_MS = 45000;
const TEMP_DELTA_THRESHOLD = 1.0;
const PM25_DELTA_THRESHOLD = 5.0;
const PM10_DELTA_THRESHOLD = 10.0;

function loadTrackedCities(): TrackedCitySnapshot[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TRACKED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedCitySnapshot[]) : [];
  } catch {
    return [];
  }
}

function loadAlerts(): NotificationAlertItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NotificationAlertItem[]) : [];
  } catch {
    return [];
  }
}

function getInitialPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const [cities, setCities] = useState<CityWeatherData[]>(() => getFallbackCitiesData());
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMapCityId, setSelectedMapCityId] = useState<string>('ankara');
  const [detectiveCityId, setDetectiveCityId] = useState<string>('ankara');

  const [trackedCities, setTrackedCities] = useState<TrackedCitySnapshot[]>(loadTrackedCities);
  const [alerts, setAlerts] = useState<NotificationAlertItem[]>(loadAlerts);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    getInitialPermission
  );
  const [toastAlert, setToastAlert] = useState<NotificationAlertItem | null>(null);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const trackedRef = useRef<TrackedCitySnapshot[]>(trackedCities);
  trackedRef.current = trackedCities;

  const activeTabRef = useRef<TabKey>(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_TRACKED, JSON.stringify(trackedCities));
    } catch {
      // Ignore storage quota errors
    }
  }, [trackedCities]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts.slice(0, 40)));
    } catch {
      // Ignore storage quota errors
    }
  }, [alerts]);

  const dispatchWebNotification = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // In-app banner always renders visibly
      }
    }
  }, []);

  const pushAlert = useCallback(
    (item: NotificationAlertItem) => {
      setAlerts((prev) => [item, ...prev].slice(0, 40));
      setToastAlert(item);
      if (activeTabRef.current !== 'notifications') {
        setUnreadAlertCount((c) => c + 1);
      }
      dispatchWebNotification(item.title, item.message);
    },
    [dispatchWebNotification]
  );

  const checkTrackedChanges = useCallback(
    (freshCities: CityWeatherData[], isManualCheck = false) => {
      const currentTracked = trackedRef.current;
      const nowTime = formatTimeNow();

      if (currentTracked.length === 0) {
        if (isManualCheck) {
          setLastCheckMessage('Takip edilen il bulunmuyor. Listeden il ekleyebilirsiniz.');
        }
        return;
      }

      const updatedSnapshots: TrackedCitySnapshot[] = [];
      let detectedChangeCount = 0;

      currentTracked.forEach((snap) => {
        const latest = freshCities.find((c) => c.id === snap.cityId);
        if (!latest) {
          updatedSnapshots.push({ ...snap, lastCheckedAt: nowTime });
          return;
        }

        const tempDiff = latest.temperature - snap.lastTemperature;
        const pm25Diff = latest.pm25 - (snap.lastPm25 ?? latest.pm25);
        const pm10Diff = latest.pm10 - (snap.lastPm10 ?? latest.pm10);
        const statusChanged = latest.status !== snap.lastStatus;
        const tempChanged = Math.abs(tempDiff) >= TEMP_DELTA_THRESHOLD;
        const pmChanged =
          Math.abs(pm25Diff) >= PM25_DELTA_THRESHOLD ||
          Math.abs(pm10Diff) >= PM10_DELTA_THRESHOLD;

        if (statusChanged || tempChanged || pmChanged) {
          detectedChangeCount += 1;
          const reasons: string[] = [];
          if (statusChanged) {
            reasons.push(
              `Durum "${snap.lastStatusLabel}" iken "${latest.statusLabel}" seviyesine geçti`
            );
          }
          if (tempChanged) {
            const sign = tempDiff > 0 ? '+' : '';
            reasons.push(
              `Sıcaklık ${snap.lastTemperature.toFixed(1)} °C'den ${latest.temperature.toFixed(
                1
              )} °C'ye (${sign}${tempDiff.toFixed(1)} °C) değişti`
            );
          }
          if (pmChanged) {
            reasons.push(
              `PM2.5: ${latest.pm25.toFixed(1)} µg/m³, PM10: ${latest.pm10.toFixed(1)} µg/m³`
            );
          }

          pushAlert({
            id: `alert-${latest.id}-${Date.now()}-${detectedChangeCount}`,
            cityId: latest.id,
            cityName: latest.name,
            title: `${latest.name}: Hava Kalitesi / Sıcaklık Değişimi`,
            message: `${reasons.join('. ')}.`,
            timestamp: nowTime,
            isSimulation: false,
            severity: latest.status === 'kotu' ? 'warning' : 'info',
          });
        }

        updatedSnapshots.push({
          ...snap,
          lastTemperature: latest.temperature,
          lastPm25: latest.pm25,
          lastPm10: latest.pm10,
          lastStatus: latest.status,
          lastStatusLabel: latest.statusLabel,
          lastCheckedAt: nowTime,
        });
      });

      setTrackedCities(updatedSnapshots);

      if (isManualCheck) {
        setLastCheckMessage(
          detectedChangeCount > 0
            ? `${nowTime} itibarıyla ${detectedChangeCount} ilde değişim tespit edildi ve bildirim oluşturuldu.`
            : `${nowTime} itibarıyla ${currentTracked.length} il kontrol edildi; yeni bir değişim saptanmadı.`
        );
      }
    },
    [pushAlert]
  );

  const loadWeatherData = useCallback(
    async (isManualCheck = false) => {
      setIsLoading(true);
      const result = await fetchAllTurkishCitiesWeather();
      setCities(result.cities);
      setDataSource(result.source);
      setIsLoading(false);
      checkTrackedChanges(result.cities, isManualCheck);
    },
    [checkTrackedChanges]
  );

  useEffect(() => {
    void loadWeatherData(false);
    const timer = window.setInterval(() => {
      void loadWeatherData(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadWeatherData]);

  useEffect(() => {
    if (!toastAlert) return;
    const timer = window.setTimeout(() => setToastAlert(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toastAlert]);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setUnreadAlertCount(0);
    }
  }

  async function handleRequestPermission() {
    const nowTime = formatTimeNow();

    if (typeof Notification === 'undefined') {
      setPermissionState('unsupported');
      const msg =
        'Bu tarayıcı ortamında sistem bildirimi kısıtlı; uygulama içi uyarı bannerı ve Bildirim Geçmişi aktif olarak çalışmaktadır.';
      setLastCheckMessage(msg);
      setToastAlert({
        id: `perm-${Date.now()}`,
        cityId: 'system',
        cityName: 'Sistem',
        title: 'Uygulama İçi Bildirimler Aktif',
        message: msg,
        timestamp: nowTime,
        isSimulation: false,
        severity: 'info',
      });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result === 'granted') {
        const msg = 'Tarayıcı bildirim izni verildi. Sistem bildirimleri aktif.';
        setLastCheckMessage(msg);
        dispatchWebNotification(
          'Bildirimler Aktif',
          'Türkiye Hava Analizi erken uyarı bildirimleri başarıyla etkinleştirildi.'
        );
        setToastAlert({
          id: `perm-${Date.now()}`,
          cityId: 'system',
          cityName: 'Sistem',
          title: 'Tarayıcı Bildirimleri Açıldı',
          message: msg,
          timestamp: nowTime,
          isSimulation: false,
          severity: 'info',
        });
      } else {
        const msg =
          'Tarayıcı sistem bildirimi önizleme ortamında engellendi; uyarılar uygulama içi banner ve Bildirim Geçmişi üzerinden gösterilecektir.';
        setLastCheckMessage(msg);
        setToastAlert({
          id: `perm-${Date.now()}`,
          cityId: 'system',
          cityName: 'Sistem',
          title: 'Uygulama İçi Uyarılar Aktif',
          message: msg,
          timestamp: nowTime,
          isSimulation: false,
          severity: 'info',
        });
      }
    } catch {
      const currentPerm = Notification.permission;
      setPermissionState(currentPerm);
      setLastCheckMessage(
        'Bildirim izni ortam tarafından kısıtlandı; uygulama içi uyarılar aktif olarak çalışmaktadır.'
      );
    }
  }

  function handleAddTrackedCity(cityId: string) {
    const city = cities.find((c) => c.id === cityId);
    if (!city) return;
    const nowTime = formatTimeNow();
    setTrackedCities((prev) => {
      if (prev.some((item) => item.cityId === city.id)) return prev;
      return [
        ...prev,
        {
          cityId: city.id,
          cityName: city.name,
          lastTemperature: city.temperature,
          lastPm25: city.pm25,
          lastPm10: city.pm10,
          lastStatus: city.status,
          lastStatusLabel: city.statusLabel,
          lastCheckedAt: nowTime,
          addedAt: nowTime,
        },
      ];
    });
    setLastCheckMessage(`${city.name} takip listesine eklendi.`);
  }

  function handleRemoveTrackedCity(cityId: string) {
    const target = trackedCities.find((t) => t.cityId === cityId);
    setTrackedCities((prev) => prev.filter((item) => item.cityId !== cityId));
    if (target) {
      setLastCheckMessage(`${target.cityName} takip listesinden çıkarıldı.`);
    }
  }

  function handleSimulateChange(preferredCityId?: string) {
    const targetCity =
      (preferredCityId ? cities.find((c) => c.id === preferredCityId) : null) ??
      (trackedCities[0] ? cities.find((c) => c.id === trackedCities[0].cityId) : null) ??
      cities.find((c) => c.id === 'ankara') ??
      cities[0];
    if (!targetCity) return;

    const simulatedNewTemp = Number((targetCity.temperature - 3.4).toFixed(1));
    const simulatedPm25 = Number((targetCity.pm25 + 22.5).toFixed(1));
    const simulatedPm10 = Number((targetCity.pm10 + 34.0).toFixed(1));
    const nowTime = formatTimeNow();

    setLastCheckMessage(`${targetCity.name} için test değişim bildirimi oluşturuldu.`);

    pushAlert({
      id: `sim-${targetCity.id}-${Date.now()}`,
      cityId: targetCity.id,
      cityName: targetCity.name,
      title: `${targetCity.name}: Ani Partikül ve Sıcaklık Değişimi (Test)`,
      message: `PM2.5 ${targetCity.pm25.toFixed(1)} → ${simulatedPm25.toFixed(
        1
      )} µg/m³, PM10 ${targetCity.pm10.toFixed(1)} → ${simulatedPm10.toFixed(
        1
      )} µg/m³ yükseldi; sıcaklık ${targetCity.temperature.toFixed(
        1
      )} °C'den ${simulatedNewTemp.toFixed(1)} °C'ye (-3.4 °C) düştü.`,
      timestamp: nowTime,
      isSimulation: true,
      severity: 'warning',
    });
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={() => void loadWeatherData(false)}
        isLoading={isLoading}
        trackedCount={trackedCities.length}
        unreadAlertCount={unreadAlertCount}
      />

      {/* Active Tab Content */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'intro' && (
          <IntroTab cities={cities} dataSource={dataSource} onNavigate={handleTabChange} />
        )}

        {activeTab === 'map' && (
          <LiveMapTab
            cities={cities}
            selectedCityId={selectedMapCityId}
            onSelectCity={setSelectedMapCityId}
            dataSource={dataSource}
          />
        )}

        {activeTab === 'detective' && (
          <AiDetectiveTab
            cities={cities}
            selectedCityId={detectiveCityId}
            onSelectCity={setDetectiveCityId}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationCenterTab
            cities={cities}
            trackedCities={trackedCities}
            alerts={alerts}
            permissionState={permissionState}
            isCheckingNow={isLoading}
            lastCheckMessage={lastCheckMessage}
            onRequestPermission={() => void handleRequestPermission()}
            onAddTrackedCity={handleAddTrackedCity}
            onRemoveTrackedCity={handleRemoveTrackedCity}
            onCheckNow={() => void loadWeatherData(true)}
            onSimulateChange={handleSimulateChange}
            onClearAlerts={() => setAlerts([])}
          />
        )}

        {/* Prominent Top-Right In-App Warning Banner */}
        {toastAlert && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-16 right-4 z-[950] max-w-md bg-white border-2 border-sky-600 shadow-lg rounded-xl p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 text-sky-700" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900">{toastAlert.title}</div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">{toastAlert.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastAlert(null)}
              aria-label="Bildirimi kapat"
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
