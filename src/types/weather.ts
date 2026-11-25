export type TabKey = 'intro' | 'map' | 'detective' | 'notifications';

export type AirStatus = 'iyi' | 'orta' | 'kotu';

export interface CityBase {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  fallback: {
    temperature: number;
    windSpeed: number;
    pm25: number;
    pm10: number;
  };
}

export interface CityWeatherData {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  temperature: number;
  windSpeed: number;
  pm25: number;
  pm10: number;
  status: AirStatus;
  statusLabel: string;
  riskSummary: string;
  riskDetails: string[];
  dataSource: 'live' | 'fallback';
  updatedAt: string;
}

export interface TrackedCitySnapshot {
  cityId: string;
  cityName: string;
  lastTemperature: number;
  lastPm25: number;
  lastPm10: number;
  lastStatus: AirStatus;
  lastStatusLabel: string;
  lastCheckedAt: string;
  addedAt: string;
}

export interface NotificationAlertItem {
  id: string;
  cityId: string;
  cityName: string;
  title: string;
  message: string;
  timestamp: string;
  isSimulation: boolean;
  severity: 'info' | 'warning';
}

export interface DetectiveMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cityName?: string;
  timestamp: string;
  isOutOfScope?: boolean;
}
