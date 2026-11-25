import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface CityContextPayload {
  name: string;
  region: string;
  temperature: number;
  windSpeed: number;
  weatherLabel: string;
  pm25: number;
  pm10: number;
  statusLabel: string;
  dataSource: 'live' | 'fallback';
}

interface HistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

interface DetectiveRequestBody {
  question?: string;
  cityContext?: CityContextPayload | null;
  history?: HistoryItem[];
}

const SYSTEM_INSTRUCTION = `Sen "Türkiye Hava Analizi ve Erken Uyarı Sistemi" içindeki "AI Dedektifi" adlı uzman meteoroloji, iklim ve hava kalitesi asistanısın.

GÖREVİN VE UZMANLIK ALANIN:
- Yalnızca şu konular hakkında Türkçe, detaylı, bilimsel temelli ve anlaşılır cevaplar ver:
  1. Hava durumu olayları (sıcaklık, rüzgar, yağış, kar, fırtına, sis, don, nem, basınç, güneşlenme, hissedilen sıcaklık).
  2. İklim bilimi, mevsimsel değişimler ve Türkiye şehirlerinin iklim özellikleri.
  3. Hava kalitesi, hava kirliliği, PM10, PM2.5 partikül maddeleri, solunum ve çevre sağlığı etkileri, korunma önerileri.
  4. Türkiye Hava Analizi ve Erken Uyarı Sistemi'nin çalışma mantığı, renk kodları (Yeşil: İyi, Turuncu: Orta, Kırmızı: Kötü), Open-Meteo verileri ve şehir bazlı analizler.

KRİTİK KAPSAM KONTROLÜ KURALI (KESİNLİKLE UYULACAK):
- Kullanıcı yukarıdaki konuların DIŞINDA herhangi bir soru sorarsa — örneğin: "oksijen nedir", "suyun formülü nedir", "2+2 kaç eder", "matematik sorusu", "tarih", "coğrafya başkenti", "genel kültür", "yemek tarifi", "kod yaz", "film öner", "spor", "siyaset", "kimya elementi tanımı" vb. — BAŞKA HİÇBİR KELİME, AÇIKLAMA, SELAMLAMA VEYA YORUM EKLEMEDEN TAM OLARAK SADECE ŞU CÜMLEYİ DÖNDÜR:
Bu konu hakkında bilgim yoktur.

ÖNEMLİ ÖRNEKLER:
- Kullanıcı: "Oksijen nedir?" -> Yanıt: Bu konu hakkında bilgim yoktur.
- Kullanıcı: "İkinci Dünya Savaşı ne zaman bitti?" -> Yanıt: Bu konu hakkında bilgim yoktur.
- Kullanıcı: "3x + 5 = 20 denklemini çöz" -> Yanıt: Bu konu hakkında bilgim yoktur.
- Kullanıcı: "İstanbul'da PM2.5 yüksekse ne yapmalıyım?" -> Yanıt: (Detaylı hava kalitesi ve sağlık önerisi)
- Kullanıcı: "Sis neden oluşur ve görüş mesafesini nasıl etkiler?" -> Yanıt: (Detaylı meteorolojik açıklama)
- Kullanıcı: "Türkiye'de rüzgar hızı PM10 kirliliğini nasıl etkiler?" -> Yanıt: (Detaylı atmosferik dağılım açıklaması)

Kapsam içi sorularda net, yapılandırılmış, anlaşılır paragraflar veya kısa maddeler kullan; gereksiz süsleme yapma. Kullanıcının seçili şehrine ait güncel ölçüm verileri paylaşılmışsa cevabında bu değerlere atıfta bulun.`;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/ai-detective', async (req: Request, res: Response) => {
    const body = req.body as DetectiveRequestBody;
    const question = typeof body?.question === 'string' ? body.question.trim() : '';

    if (!question) {
      res.status(400).json({ error: 'Lütfen analiz edilecek bir soru yazın.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'AI servisi şu anda yapılandırılmamış. Lütfen GEMINI_API_KEY ortam değişkenini Secrets panelinden tanımlayın.',
      });
      return;
    }

    const cityContext = body.cityContext;
    const contextBlock = cityContext
      ? [
          `Seçili Şehir: ${cityContext.name} (${cityContext.region})`,
          `Güncel Hava Durumu: ${cityContext.weatherLabel}`,
          `Sıcaklık: ${cityContext.temperature.toFixed(1)} °C`,
          `Rüzgar Hızı: ${cityContext.windSpeed.toFixed(1)} km/s`,
          `PM2.5: ${cityContext.pm25.toFixed(1)} µg/m³`,
          `PM10: ${cityContext.pm10.toFixed(1)} µg/m³`,
          `Sistem Durumu: ${cityContext.statusLabel}`,
          `Veri Kaynağı: ${cityContext.dataSource === 'live' ? 'Canlı Open-Meteo Verisi' : 'Yedek Veri Modeli'}`,
        ].join('\n')
      : 'Şehir seçilmedi (Türkiye geneli soru).';

    const historyLines = Array.isArray(body.history)
      ? body.history
          .slice(-4)
          .map((item) => `${item.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${item.text}`)
          .join('\n')
      : '';

    const prompt = [
      'GÜNCEL ŞEHİR VERİLERİ:',
      contextBlock,
      historyLines ? `\nÖNCEKİ KONUŞMA BAĞLAMI:\n${historyLines}` : '',
      `\nKULLANICI SORUSU:\n${question}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const answerText = (response.text ?? '').trim();
      if (!answerText) {
        res.status(502).json({ error: 'AI servisinden boş yanıt alındı. Lütfen tekrar deneyin.' });
        return;
      }

      res.json({ answer: answerText });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen sunucu hatası';
      console.error('Gemini API error:', message);
      res.status(502).json({
        error: 'AI analiz servisine bağlanırken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
