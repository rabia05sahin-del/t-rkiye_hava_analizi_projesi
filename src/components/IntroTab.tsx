import { ArrowRight, BellRing, Bot, Compass, MapPinned } from 'lucide-react';
import type { CityWeatherData, TabKey } from '../types/weather';

interface IntroTabProps {
  cities: CityWeatherData[];
  dataSource: 'live' | 'fallback';
  onNavigate: (tab: TabKey) => void;
}

export function IntroTab({ cities, dataSource, onNavigate }: IntroTabProps) {
  const goodCount = cities.filter((c) => c.status === 'iyi').length;
  const moderateCount = cities.filter((c) => c.status === 'orta').length;
  const poorCount = cities.filter((c) => c.status === 'kotu').length;

  return (
    <section
      aria-label="Giriş ve Hakkında"
      className="h-full w-full overflow-y-auto bg-slate-50"
    >
      <div className="max-w-[1440px] mx-auto min-h-full px-4 sm:px-6 py-5 lg:py-6 flex flex-col justify-between gap-5">
        {/* Hero / Opening Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium text-sky-700">
              Türkiye Hava Analizi ve Erken Uyarı Sistemi · {cities.length} İl İzleme Ağı
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
              Türkiye&apos;nin 81 İli İçin Anlık Hava Kalitesi ve Erken Uyarı Merkezi
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Bu platform, Türkiye&apos;deki tüm illerin PM2.5 ve PM10 partikül madde yoğunlukları
              ile sıcaklık ve rüzgar verilerini tek ekranda analiz eder; olası sağlık ve çevre
              risklerini açıklar, seçtiğiniz illerde değişim oluştuğunda sizi anında uyarır.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer"
              >
                <span>Canlı Haritaya Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('detective')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>AI Dedektifi ile Sor</span>
              </button>
            </div>
          </div>

          {/* Right Summary Matrix */}
          <div className="lg:w-[360px] shrink-0 bg-sky-50/70 border border-sky-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 border-b border-sky-200/70 pb-2.5">
              <span className="font-bold text-slate-900">Anlık 81 İl Özeti</span>
              <span>{dataSource === 'live' ? 'Canlı Open-Meteo' : 'Varsayılan Veri Aktif'}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="py-2">
                <div className="font-mono-tabular text-2xl font-bold text-emerald-700">
                  {goodCount}
                </div>
                <div className="text-xs font-medium text-slate-700 mt-0.5">İyi (Yeşil)</div>
              </div>
              <div className="py-2 border-x border-sky-200/70">
                <div className="font-mono-tabular text-2xl font-bold text-amber-600">
                  {moderateCount}
                </div>
                <div className="text-xs font-medium text-slate-700 mt-0.5">Orta (Turuncu)</div>
              </div>
              <div className="py-2">
                <div className="font-mono-tabular text-2xl font-bold text-red-600">
                  {poorCount}
                </div>
                <div className="text-xs font-medium text-slate-700 mt-0.5">Kötü (Kırmızı)</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-sky-200/70">
              Sınıflandırma; her ilin güncel PM2.5, PM10 konsantrasyonu ile sıcaklık ve rüzgar
              değerleri birlikte değerlendirilerek hesaplanır.
            </p>
          </div>
        </div>

        {/* 4 Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700">01 · Amaç ve Kapsam</span>
                <Compass className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Program Ne İşe Yarar?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Türkiye genelindeki 81 ilin hava kalitesi ve atmosferik ölçüm değerlerini eşzamanlı
                izler. Her il için solunum sağlığı, don ve sıcak stresi risklerini sade bir dille
                özetler.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
              Hedef: Günlük planlama ve hassas gruplar için erken koruma.
            </p>
          </article>

          <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700">02 · Veri Analizi</span>
                <MapPinned className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">
                PM10, PM2.5 ve Ölçüm Verileri
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ücretsiz Open-Meteo Air Quality ve Forecast API servislerinden PM2.5, PM10,
                sıcaklık ve rüzgar verilerini çeker. Bağlantı yavaşladığında sistem donmadan
                varsayılan il verilerine geçer.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
              Birimler: Sıcaklık (°C), Rüzgar (km/s), Partikül (µg/m³).
            </p>
          </article>

          <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700">03 · Renk Kodları</span>
                <Bot className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Harita Renk Mantığı
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Haritada <strong className="text-emerald-700">Yeşil (İyi)</strong> temiz ve güvenli
                havayı; <strong className="text-amber-600">Turuncu (Orta)</strong> hassas gruplar
                için dikkati; <strong className="text-red-600">Kırmızı (Kötü)</strong> yüksek
                partikül veya atmosferik riski gösterir.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
              AI Dedektifi sekmesinden il bazlı analiz sorabilirsiniz.
            </p>
          </article>

          <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700">04 · Erken Uyarı</span>
                <BellRing className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Bildirim Sistemi Nasıl Çalışır?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bildirim Merkezi sekmesinden 81 ilden istediklerinizi tarayıcı belleğine ekleyin.
                Sistem periyodik kontrol yaparak sıcaklık, PM veya durum değiştiğinde anlık uyarı
                oluşturur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-left text-xs font-semibold text-sky-700 hover:text-sky-800 pt-3 mt-3 border-t border-slate-100 cursor-pointer"
            >
              Bildirim Merkezini Aç →
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
