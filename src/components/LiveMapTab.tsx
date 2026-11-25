import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  Search,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react';
import { TURKEY_BORDER_GEOJSON } from '../data/turkeyOutline';
import type { AirStatus, CityWeatherData } from '../types/weather';

interface LiveMapTabProps {
  cities: CityWeatherData[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  dataSource: 'live' | 'fallback';
}

const STATUS_STYLE: Record<
  AirStatus,
  {
    hex: string;
    fillHex: string;
    badgeClass: string;
    textClass: string;
    label: string;
  }
> = {
  iyi: {
    hex: '#16a34a',
    fillHex: '#22c55e',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    textClass: 'text-emerald-700',
    label: 'İyi',
  },
  orta: {
    hex: '#d97706',
    fillHex: '#f59e0b',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    textClass: 'text-amber-700',
    label: 'Orta',
  },
  kotu: {
    hex: '#dc2626',
    fillHex: '#ef4444',
    badgeClass: 'bg-red-50 text-red-800 border-red-300',
    textClass: 'text-red-700',
    label: 'Kötü',
  },
};

function StatusIcon({ status }: { status: AirStatus }) {
  if (status === 'iyi') return <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />;
  if (status === 'orta') return <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />;
  return <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />;
}

export function LiveMapTab({
  cities,
  selectedCityId,
  onSelectCity,
  dataSource,
}: LiveMapTabProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [cityQuery, setCityQuery] = useState('');

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? cities[0];

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLocaleLowerCase('tr-TR').includes(q) ||
        c.region.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [cities, cityQuery]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const turkeyBounds = L.latLngBounds([35.75, 25.8], [42.25, 44.85]);

    const map = L.map(container, {
      center: [39.0, 35.2],
      zoom: 6,
      minZoom: 5,
      maxZoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    map.fitBounds(turkeyBounds, { padding: [14, 14] });

    L.geoJSON(TURKEY_BORDER_GEOJSON as GeoJSON.GeoJsonObject, {
      style: {
        color: '#64748b',
        weight: 1.5,
        fillColor: '#f8fafc',
        fillOpacity: 0.7,
      },
    }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap katkıda bulunanlar',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(turkeyBounds, { padding: [14, 14] });
    }, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layerGroup = markersLayerRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    cities.forEach((city) => {
      const style = STATUS_STYLE[city.status];
      const isSelected = city.id === selectedCityId;

      const marker = L.circleMarker([city.lat, city.lon], {
        radius: isSelected ? 11 : 6.5,
        color: isSelected ? '#1e3a8a' : style.hex,
        weight: isSelected ? 3 : 1.75,
        fillColor: style.fillHex,
        fillOpacity: isSelected ? 1 : 0.9,
      });

      marker.bindTooltip(
        `${city.name} · PM2.5: ${city.pm25.toFixed(1)} · ${city.temperature.toFixed(1)}°C`,
        {
          direction: 'top',
          offset: [0, -8],
          permanent: isSelected,
          className: 'city-map-tooltip',
        }
      );

      marker.on('click', () => {
        onSelectCity(city.id);
      });

      marker.addTo(layerGroup);
      if (isSelected) {
        marker.bringToFront();
      }
    });
  }, [cities, selectedCityId, onSelectCity]);

  const selectedStyle = selectedCity ? STATUS_STYLE[selectedCity.status] : STATUS_STYLE.iyi;

  return (
    <section
      aria-label="Canlı Harita"
      className="h-full w-full overflow-y-auto bg-slate-50"
    >
      <div className="max-w-[1440px] mx-auto min-h-full lg:h-full px-4 sm:px-6 py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 81-Province Turkey Leaflet Map + Color Legend + Selected Province Detail */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 min-h-0 lg:h-full">
          {/* Interactive Map Card */}
          <div className="relative flex-1 min-h-[260px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 flex items-center gap-2 pointer-events-none">
              <span className="font-semibold text-sky-900">
                {dataSource === 'live' ? 'Canlı Open-Meteo Verisi' : 'Varsayılan İl Verileri'}
              </span>
              <span aria-hidden="true">·</span>
              <span>81 il haritası · Tıklayarak analiz görün</span>
            </div>
            <div ref={mapContainerRef} className="w-full h-full min-h-[260px]" />
          </div>

          {/* Renk Tanımları Bar Directly Below Map */}
          <div className="shrink-0 bg-sky-50/80 border border-sky-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-display font-bold text-slate-900">Renk Tanımları:</span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full bg-emerald-600 shrink-0"
                />
                <span className="font-semibold text-emerald-800">Yeşil = İyi</span>
                <span className="text-slate-600 hidden sm:inline">(Temiz ve elverişli)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0"
                />
                <span className="font-semibold text-amber-800">Turuncu = Orta</span>
                <span className="text-slate-600 hidden sm:inline">(Hassas gruplar için dikkat)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0"
                />
                <span className="font-semibold text-red-800">Kırmızı = Kötü</span>
                <span className="text-slate-600 hidden sm:inline">(Yüksek partikül veya risk)</span>
              </div>
            </div>
          </div>

          {/* Selected Province Detail Panel Directly Below Map */}
          {selectedCity && (
            <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-none">
                      {selectedCity.name}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      {selectedCity.region} Bölgesi · Durum:{' '}
                      <span className="font-semibold text-slate-800">
                        {selectedCity.statusLabel}
                      </span>{' '}
                      · Güncelleme: {selectedCity.updatedAt}
                    </p>
                  </div>
                </div>

                {/* İyi / Orta / Kötü Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${selectedStyle.badgeClass}`}
                >
                  <StatusIcon status={selectedCity.status} />
                  <span>{selectedCity.statusLabel}</span>
                </div>
              </div>

              {/* 4 Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Thermometer className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                    <span>Sıcaklık</span>
                  </div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedCity.temperature.toFixed(1)} °C
                  </div>
                </div>

                <div className="bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Wind className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                    <span>Rüzgar</span>
                  </div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedCity.windSpeed.toFixed(1)} km/s
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-600">PM2.5</div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedCity.pm25.toFixed(1)} <span className="text-xs font-normal">µg/m³</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-600">PM10</div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedCity.pm10.toFixed(1)} <span className="text-xs font-normal">µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Health & Environmental Impact Analysis */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <h3 className="text-xs font-bold text-slate-900">
                  Bu Değerler Neden Zararlı / Ne Gibi Etkiler Yapabilir?
                </h3>
                <p className="text-xs text-slate-800 font-medium">{selectedCity.riskSummary}</p>
                <ul className="space-y-0.5 text-xs text-slate-600 list-disc pl-4">
                  {selectedCity.riskDetails.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metrics Guide Box + Searchable 81-Province List */}
        <aside className="lg:col-span-4 flex flex-col gap-2.5 min-h-0 lg:h-full">
          {/* Separate Info Box Explaining PM10, PM2.5, Temperature, and Wind */}
          <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-slate-900">
                PM10, PM2.5, Sıcaklık (°C) ve Rüzgar (km/s) Ne Anlama Gelir?
              </h2>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">PM2.5 (µg/m³):</strong> Çapı 2.5 mikrondan küçük
                ince partiküllerdir. Akciğer derinliklerine ve kana karışarak solunum ile kalp-damar
                riski oluşturabilir.
              </p>
              <p>
                <strong className="text-slate-900">PM10 (µg/m³):</strong> Çapı 10 mikrona kadar olan
                toz, polen ve duman parçacıklarıdır. Üst solunum yollarında tahrişe ve öksürüğe yol
                açabilir.
              </p>
              <p>
                <strong className="text-slate-900">Sıcaklık (°C):</strong> Aşırı düşük değerler (≤ 1
                °C) don ve buzlanmaya, yüksek değerler (≥ 32 °C) ise sıcak stresine neden olur.
              </p>
              <p>
                <strong className="text-slate-900">Rüzgar (km/s):</strong> Hafif-orta rüzgar
                partikülleri dağıtırken 30 km/s üzeri toz taşınımını artırır.
              </p>
            </div>
          </div>

          {/* Searchable 81-Province List */}
          <div className="flex-1 min-h-[220px] bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-3.5 py-2.5 bg-sky-50/70 border-b border-slate-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-bold text-slate-900">
                  Türkiye İlleri ({filteredCities.length}/{cities.length})
                </h2>
                <span className="text-xs text-slate-600">İl seçin</span>
              </div>
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="İl veya bölge ara (ör. Ankara, Rize)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
              {filteredCities.map((city) => {
                const isSelected = city.id === selectedCity?.id;
                const st = STATUS_STYLE[city.status];
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onSelectCity(city.id)}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-50 text-sky-950' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{city.name}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-500 font-mono-tabular">
                        PM2.5: {city.pm25.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono-tabular">
                      <span className="text-slate-900 font-medium">
                        {city.temperature.toFixed(1)}°C
                      </span>
                      <span className={`font-sans font-bold w-10 text-right ${st.textClass}`}>
                        {st.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
