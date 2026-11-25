import { useState, useRef, useEffect } from 'react';
import { Bot, Send, ShieldCheck, User } from 'lucide-react';
import { analyzeWeatherQuestion } from '../services/aiDetectiveEngine';
import type { CityWeatherData, DetectiveMessage } from '../types/weather';

interface AiDetectiveTabProps {
  cities: CityWeatherData[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'Seçili ilde bugün açık havada spor yapmak uygun mu?',
  'PM10 ve PM2.5 değerleri solunum sağlığını nasıl etkiler?',
  'Rüzgar hızı hava kalitesini nasıl değiştirir?',
  'Türkiye genelinde en temiz ve en kirli iller hangileri?',
];

export function AiDetectiveTab({
  cities,
  selectedCityId,
  onSelectCity,
}: AiDetectiveTabProps) {
  const [messages, setMessages] = useState<DetectiveMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Merhaba, ben AI Dedektifi. Türkiye’nin 81 ilinden seçtiğiniz veya sorunuzda belirttiğiniz ilin güncel PM2.5, PM10, sıcaklık, rüzgar ve hava kalitesi analizlerini paylaşabilirim.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const selectedCity =
    selectedCityId === 'all' ? null : cities.find((c) => c.id === selectedCityId) ?? null;

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question) return;

    const nowTime = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: DetectiveMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
      cityName: selectedCity?.name ?? 'Türkiye Geneli',
      timestamp: nowTime,
    };

    const result = analyzeWeatherQuestion({
      question,
      cities,
      selectedCityId,
    });

    const assistantMsg: DetectiveMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      text: result.answer,
      cityName: result.isOutOfScope ? undefined : result.resolvedCityName,
      timestamp: nowTime,
      isOutOfScope: result.isOutOfScope,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendQuestion(input);
  }

  return (
    <section
      aria-label="AI Dedektifi"
      className="h-full w-full overflow-y-auto bg-slate-50"
    >
      <div className="max-w-[1440px] mx-auto min-h-full lg:h-full px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Context & Province Selector Column */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">
                AI Hava Analizi Dedektifi
              </h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                81 ilden birini seçin veya sorunuzda il adı yazın; sıcaklık, rüzgar, iklim ve PM10 /
                PM2.5 verilerine dayalı anlık analiz alın.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="detective-city-select"
                className="block text-xs font-semibold text-slate-800"
              >
                Analiz Edilecek İl (81 İl)
              </label>
              <select
                id="detective-city-select"
                value={selectedCityId}
                onChange={(e) => onSelectCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                <option value="all">Türkiye Geneli (81 İl)</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.statusLabel} · PM2.5: {city.pm25.toFixed(1)} ·{' '}
                    {city.temperature.toFixed(1)}°C)
                  </option>
                ))}
              </select>
            </div>

            {selectedCity && (
              <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-sky-200/70 pb-2">
                  <span className="font-bold text-slate-900">{selectedCity.name} Verisi</span>
                  <span className="text-sky-900 font-semibold">{selectedCity.statusLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 font-mono-tabular text-slate-800">
                  <div>
                    <span className="font-sans text-slate-600">Sıcaklık: </span>
                    <span className="font-semibold">{selectedCity.temperature.toFixed(1)} °C</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-600">Rüzgar: </span>
                    <span className="font-semibold">{selectedCity.windSpeed.toFixed(1)} km/s</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-600">PM2.5: </span>
                    <span className="font-semibold">{selectedCity.pm25.toFixed(1)} µg/m³</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-600">PM10: </span>
                    <span className="font-semibold">{selectedCity.pm10.toFixed(1)} µg/m³</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-800">Hızlı Analiz Soruları</div>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-800 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Kapsam Koruması: Asistan yalnızca hava analizi, iklim, hava kalitesi ve bu proje
              hakkında yanıt verir; konu dışı soruları reddeder.
            </span>
          </div>
        </div>

        {/* Right Chat Workspace */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[420px] lg:h-full overflow-hidden">
          <div className="px-5 py-3 bg-sky-50/50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span className="font-display text-sm font-bold text-slate-900">
                Analiz Sohbeti
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-600">
                Aktif İl: {selectedCity ? selectedCity.name : 'Türkiye Geneli'}
              </span>
            </div>
          </div>

          {/* Scrollable Message History */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-white">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-sky-700" aria-hidden="true" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-sky-700 text-white'
                        : msg.isOutOfScope
                        ? 'bg-slate-100 border border-slate-200 text-slate-900 font-semibold'
                        : 'bg-sky-50/50 border border-sky-100 text-slate-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div
                      className={`text-[11px] mt-1.5 ${
                        isUser ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {msg.cityName ? `${msg.cityName} · ` : ''}
                      {msg.timestamp}
                    </div>
                  </div>
                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={feedEndRef} />
          </div>

          {/* Question Input Form */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-200 p-3.5 bg-slate-50 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="PM10, PM2.5, sıcaklık, rüzgar veya il analizi hakkında sorunuzu yazın..."
              className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gönder</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
