import { TURKEY_CITIES } from '../data/cities';
import type { AirStatus, CityBase, CityWeatherData } from '../types/weather';

export function evaluateAirAndWeatherStatus(params: {
  pm25: number;
  pm10: number;
  windSpeed: number;
  temperature: number;
}): { status: AirStatus; statusLabel: string } {
  const { pm25, pm10, windSpeed, temperature } = params;

  if (pm25 > 35 || pm10 > 70 || windSpeed >= 50 || temperature <= -5 || temperature >= 38) {
    return { status: 'kotu', statusLabel: 'Kötü' };
  }

  if (pm25 > 15 || pm10 > 35 || windSpeed >= 30 || temperature <= 1 || temperature >= 32) {
    return { status: 'orta', statusLabel: 'Orta' };
  }

  return { status: 'iyi', statusLabel: 'İyi' };
}

export function buildRiskExplanation(params: {
  cityName: string;
  pm25: number;
  pm10: number;
  windSpeed: number;
  temperature: number;
  status: AirStatus;
}): { riskSummary: string; riskDetails: string[] } {
  const { cityName, pm25, pm10, windSpeed, temperature, status } = params;
  const details: string[] = [];

  if (pm25 > 35) {
    details.push(
      `Yüksek PM2.5 (${pm25.toFixed(1)} µg/m³): İnce partiküller akciğerlerin derin kesimlerine ve kan dolaşımına ulaşabilir; astım, KOAH ve kalp-damar hastaları için ciddi solunum riski oluşturur.`
    );
  } else if (pm25 > 15) {
    details.push(
      `Orta düzey PM2.5 (${pm25.toFixed(1)} µg/m³): Uzun süreli açık hava eforunda hassas grupların (çocuklar, yaşlılar, solunum hastaları) nefes darlığı yaşamasına yol açabilir.`
    );
  }

  if (pm10 > 70) {
    details.push(
      `Yüksek PM10 (${pm10.toFixed(1)} µg/m³): Yoğun kaba toz ve partikül yükü üst solunum yollarında tahrişe, öksürüğe ve göz yanmasına neden olabilir.`
    );
  } else if (pm10 > 35) {
    details.push(
      `Orta düzey PM10 (${pm10.toFixed(1)} µg/m³): Trafik ve yüzey tozlarına bağlı olarak hassas bireylerde boğaz kuruluğu ve alerjik tepkiler tetiklenebilir.`
    );
  }

  if (temperature <= 1) {
    details.push(
      `Düşük sıcaklık ve don riski (${temperature.toFixed(1)} °C): Soğuk hava solunum yollarını kurutabilir; sabah ve gece saatlerinde gizli buzlanma ve ısınma kaynaklı emisyon artışı görülebilir.`
    );
  } else if (temperature >= 32) {
    details.push(
      `Yüksek sıcaklık stresi (${temperature.toFixed(1)} °C): Sıvı kaybı, güneş çarpması ve yüksek partikülle birleşen solunum yükü artışı oluşabilir.`
    );
  }

  if (windSpeed >= 30) {
    details.push(
      `Kuvvetli rüzgar (${windSpeed.toFixed(1)} km/s): Çatı ve ağaç devrilmesi riski yaratabilir; kuru zeminlerden kalkan tozlarla PM10 seviyesini geçici olarak yükseltebilir.`
    );
  }

  if (details.length === 0) {
    details.push(
      `${cityName} için ölçülen PM2.5 (${pm25.toFixed(1)} µg/m³) ve PM10 (${pm10.toFixed(1)} µg/m³) değerleri temiz hava sınırları içindedir; açık hava etkinlikleri için elverişli koşullar hakimdir.`
    );
    details.push(
      `Mevcut sıcaklık (${temperature.toFixed(1)} °C) ve rüzgar (${windSpeed.toFixed(1)} km/s) atmosferik partiküllerin sağlıklı dağılımını desteklemektedir.`
    );
  }

  const riskSummary =
    status === 'kotu'
      ? `${cityName} ilinde hava kalitesi veya atmosferik koşullar olumsuz seviyededir; açık hava aktiviteleri sınırlandırılmalıdır.`
      : status === 'orta'
      ? `${cityName} ili için orta düzey uyarı mevcuttur; hassas grupların dış ortam süresini dengelemesi önerilir.`
      : `${cityName} ilinde hava kalitesi ve ölçüm değerleri sağlıklı düzeydedir.`;

  return { riskSummary, riskDetails: details };
}

function buildCityData(
  city: CityBase,
  values: {
    temperature: number;
    windSpeed: number;
    pm25: number;
    pm10: number;
  },
  dataSource: 'live' | 'fallback',
  updatedAt: string
): CityWeatherData {
  const { status, statusLabel } = evaluateAirAndWeatherStatus(values);
  const { riskSummary, riskDetails } = buildRiskExplanation({
    cityName: city.name,
    ...values,
    status,
  });

  return {
    id: city.id,
    name: city.name,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    temperature: Number(values.temperature.toFixed(1)),
    windSpeed: Number(values.windSpeed.toFixed(1)),
    pm25: Number(values.pm25.toFixed(1)),
    pm10: Number(values.pm10.toFixed(1)),
    status,
    statusLabel,
    riskSummary,
    riskDetails,
    dataSource,
    updatedAt,
  };
}

export function getFallbackCitiesData(): CityWeatherData[] {
  const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return TURKEY_CITIES.map((city) => buildCityData(city, city.fallback, 'fallback', now));
}

interface OpenMeteoCurrentForecast {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
  };
}

interface OpenMeteoCurrentAir {
  current?: {
    pm10?: number;
    pm2_5?: number;
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchChunk(chunk: CityBase[]): Promise<{
  forecasts: (OpenMeteoCurrentForecast | null)[];
  airs: (OpenMeteoCurrentAir | null)[];
}> {
  const latitudes = chunk.map((c) => c.lat).join(',');
  const longitudes = chunk.map((c) => c.lon).join(',');

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,wind_speed_10m&timezone=Europe%2FIstanbul`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}&longitude=${longitudes}&current=pm10,pm2_5&timezone=Europe%2FIstanbul`;

  const [forecastRes, airRes] = await Promise.allSettled([
    fetchWithTimeout(forecastUrl, 4000),
    fetchWithTimeout(airUrl, 4000),
  ]);

  let forecasts: (OpenMeteoCurrentForecast | null)[] = chunk.map(() => null);
  let airs: (OpenMeteoCurrentAir | null)[] = chunk.map(() => null);

  if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
    const raw = (await forecastRes.value.json()) as
      | OpenMeteoCurrentForecast[]
      | OpenMeteoCurrentForecast;
    forecasts = Array.isArray(raw) ? raw : [raw];
  }

  if (airRes.status === 'fulfilled' && airRes.value.ok) {
    const raw = (await airRes.value.json()) as OpenMeteoCurrentAir[] | OpenMeteoCurrentAir;
    airs = Array.isArray(raw) ? raw : [raw];
  }

  return { forecasts, airs };
}

export async function fetchAllTurkishCitiesWeather(): Promise<{
  cities: CityWeatherData[];
  source: 'live' | 'fallback';
}> {
  try {
    const midpoint = Math.ceil(TURKEY_CITIES.length / 2);
    const chunkA = TURKEY_CITIES.slice(0, midpoint);
    const chunkB = TURKEY_CITIES.slice(midpoint);

    const [resA, resB] = await Promise.all([fetchChunk(chunkA), fetchChunk(chunkB)]);
    const allForecasts = [...resA.forecasts, ...resB.forecasts];
    const allAirs = [...resA.airs, ...resB.airs];

    const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    let anyLive = false;

    const cities = TURKEY_CITIES.map((city, idx) => {
      const fCurrent = allForecasts[idx]?.current;
      const aCurrent = allAirs[idx]?.current;

      const hasForecast =
        typeof fCurrent?.temperature_2m === 'number' &&
        typeof fCurrent?.wind_speed_10m === 'number';
      const hasAir = typeof aCurrent?.pm2_5 === 'number' && typeof aCurrent?.pm10 === 'number';

      if (hasForecast || hasAir) {
        anyLive = true;
      }

      const values = {
        temperature: hasForecast ? fCurrent!.temperature_2m! : city.fallback.temperature,
        windSpeed: hasForecast ? fCurrent!.wind_speed_10m! : city.fallback.windSpeed,
        pm25: hasAir ? aCurrent!.pm2_5! : city.fallback.pm25,
        pm10: hasAir ? aCurrent!.pm10! : city.fallback.pm10,
      };

      return buildCityData(city, values, hasForecast || hasAir ? 'live' : 'fallback', now);
    });

    return { cities, source: anyLive ? 'live' : 'fallback' };
  } catch {
    return { cities: getFallbackCitiesData(), source: 'fallback' };
  }
}
