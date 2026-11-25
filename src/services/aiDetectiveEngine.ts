import type { CityWeatherData } from '../types/weather';

export const OUT_OF_SCOPE_RESPONSE = 'Bu konu hakkında bilgim yoktur.';

function normalizeTurkish(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/['’`]/g, ' ')
    .replace(/[?!.,;:()[\]{}"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function foldAscii(text: string): string {
  return normalizeTurkish(text)
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

const WEATHER_DOMAIN_KEYWORDS = [
  'hava',
  'havasi',
  'havası',
  'sicaklik',
  'sıcaklık',
  'derece',
  'soguk',
  'soğuk',
  'sicak',
  'sıcak',
  'don',
  'buzlanma',
  'ayaz',
  'nem',
  'basinc',
  'basınç',
  'ruzgar',
  'rüzgar',
  'firtina',
  'fırtına',
  'lodos',
  'poyraz',
  'yagis',
  'yağış',
  'yagmur',
  'yağmur',
  'saganak',
  'sağanak',
  'kar',
  'dolu',
  'sis',
  'pus',
  'bulut',
  'gunes',
  'güneş',
  'iklim',
  'mevsim',
  'kis',
  'kış',
  'yaz',
  'ilkbahar',
  'sonbahar',
  'kuraklik',
  'kuraklık',
  'sel',
  'meteoroloji',
  'tahmin',
  'erken uyari',
  'erken uyarı',
  'uyari',
  'uyarı',
  'hava kalitesi',
  'hava kirliligi',
  'hava kirliliği',
  'kirlilik',
  'kirli',
  'temiz',
  'partikul',
  'partikül',
  'pm10',
  'pm 10',
  'pm2.5',
  'pm2,5',
  'pm 2.5',
  'pm 2,5',
  'pm25',
  'toz',
  'duman',
  'egzoz',
  'emisyon',
  'solunum',
  'akciger',
  'akciğer',
  'astim',
  'astım',
  'koah',
  'alerji',
  'gorus mesafesi',
  'görüş mesafesi',
  'hissedilen',
  'acik hava',
  'açık hava',
  'spor',
  'yuruyus',
  'yürüyüş',
  'maske',
  'disari',
  'dışarı',
  'harita',
  'renk',
  'yesil',
  'yeşil',
  'turuncu',
  'kirmizi',
  'kırmızı',
  'bildirim',
  'open-meteo',
  'open meteo',
  'ozon',
  'inversiyon',
  'termometre',
  'en sicak',
  'en soguk',
  'en kirli',
  'en temiz',
  'karsilastir',
  'karşılaştır',
  'zarar',
  'saglik',
  'sağlık',
  'cevre',
  'çevre',
];

const OUT_OF_SCOPE_TRIGGERS = [
  'oksijen nedir',
  'hidrojen nedir',
  'azot nedir',
  'suyun formulu',
  'baskent',
  'başkent',
  'fetih',
  'fethedildi',
  'savas',
  'savaş',
  'nufus',
  'nüfus',
  'yuzolcumu',
  'yüzölçümü',
  'plaka',
  'matematik',
  'denklem',
  'integral',
  'turev',
  'türev',
  'tarih',
  'genel kultur',
  'genel kültür',
  'yemek',
  'tarif',
  'futbol',
  'mac',
  'maç',
  'film',
  'dizi',
  'muzik',
  'müzik',
  'sarki',
  'şarkı',
  'python',
  'javascript',
  'kod yaz',
  'programlama',
  'borsa',
  'dolar',
  'euro',
  'kripto',
  'bitcoin',
  'sinav',
  'sınav',
  'cumhuriyet',
  'osmanli',
  'osmanlı',
  'gezegen',
  'biyoloji',
  'kimya',
  'fizik kanunu',
  'siir',
  'şiir',
  'hikaye',
  'masal',
  'fıkra',
  'fikra',
  'şaka',
  'saka',
];

function hasWord(foldedText: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(^|\\s)${escaped}(da|de|ta|te|dan|den|tan|ten|in|un|nun|nin|a|e|ya|ye|i|u|li|lu|lar|ler)?(\\s|$)`
  ).test(foldedText);
}

function findCityInQuestion(question: string, cities: CityWeatherData[]): CityWeatherData | null {
  const folded = foldAscii(question);
  // Sort longest city names first to avoid partial collisions (e.g. Kahramanmaraş vs Maraş)
  const ordered = [...cities].sort((a, b) => b.name.length - a.name.length);
  for (const city of ordered) {
    const cityFolded = foldAscii(city.name);
    if (hasWord(folded, cityFolded)) {
      return city;
    }
  }
  return null;
}

function isQuestionInScope(question: string, cities: CityWeatherData[]): boolean {
  const norm = normalizeTurkish(question);
  const folded = foldAscii(question);

  if (!norm) return false;

  const shortBoundaryWords = new Set(['kar', 'sis', 'don', 'yaz', 'kis', 'sel', 'nem', 'toz', 'pus']);

  const hasWeatherKeyword = WEATHER_DOMAIN_KEYWORDS.some((kw) => {
    const kwFolded = foldAscii(kw);
    if (shortBoundaryWords.has(kwFolded)) {
      return hasWord(folded, kwFolded);
    }
    return norm.includes(kw) || folded.includes(kwFolded);
  });

  const hasExplicitOutOfScope = OUT_OF_SCOPE_TRIGGERS.some((trig) => {
    const trigFolded = foldAscii(trig);
    return norm.includes(trig) || folded.includes(trigFolded);
  });

  if (hasExplicitOutOfScope && !hasWeatherKeyword) {
    return false;
  }

  if (hasWeatherKeyword) {
    return true;
  }

  const mentionedCity = findCityInQuestion(question, cities);
  if (mentionedCity) {
    const statusHints = ['nasil', 'durum', 'veri', 'analiz', 'rapor', 'bilgi', 'bugun', 'simdi', 'nedir'];
    if (statusHints.some((hint) => folded.includes(hint)) && !hasExplicitOutOfScope) {
      return true;
    }
  }

  return false;
}

function formatCityOverview(city: CityWeatherData): string {
  const statusAdvice =
    city.status === 'kotu'
      ? 'Durum KÖTÜ (Kırmızı) seviyesindedir; hassas grupların ve solunum yolu rahatsızlığı olan bireylerin açık hava süresini sınırlandırması önerilir.'
      : city.status === 'orta'
      ? 'Durum ORTA (Turuncu) seviyesindedir; hassas grupların yoğun efor gerektiren açık hava aktivitelerinde dikkatli olması tavsiye edilir.'
      : 'Durum İYİ (Yeşil) seviyesindedir; genel hava kalitesi ve atmosferik koşullar açık hava etkinlikleri için uygundur.';

  return [
    `${city.name} (${city.region} Bölgesi) Anlık Hava Kalitesi ve Ölçüm Analizi:`,
    `• Sıcaklık: ${city.temperature.toFixed(1)} °C | Rüzgar Hızı: ${city.windSpeed.toFixed(1)} km/s`,
    `• Partikül Değerleri: PM2.5 = ${city.pm25.toFixed(1)} µg/m³ | PM10 = ${city.pm10.toFixed(1)} µg/m³`,
    `• Genel Değerlendirme: ${statusAdvice}`,
    `\nOlası Etkiler ve Riskler:\n${city.riskDetails.map((d) => `- ${d}`).join('\n')}`,
  ].join('\n');
}

export function analyzeWeatherQuestion(params: {
  question: string;
  cities: CityWeatherData[];
  selectedCityId: string;
}): { answer: string; isOutOfScope: boolean; resolvedCityName?: string } {
  const { question, cities, selectedCityId } = params;

  if (!isQuestionInScope(question, cities)) {
    return {
      answer: OUT_OF_SCOPE_RESPONSE,
      isOutOfScope: true,
    };
  }

  const folded = foldAscii(question);
  const cityInText = findCityInQuestion(question, cities);
  const selectedCity =
    selectedCityId !== 'all' ? cities.find((c) => c.id === selectedCityId) ?? null : null;
  const targetCity = cityInText ?? selectedCity;

  // 1. Comparison / Ranking across Turkey
  if (
    folded.includes('en kirli') ||
    folded.includes('en temiz') ||
    folded.includes('en sicak') ||
    folded.includes('en soguk') ||
    folded.includes('karsilastir') ||
    folded.includes('sirala') ||
    (selectedCityId === 'all' && !cityInText && (folded.includes('turkiye') || folded.includes('sehir') || folded.includes('il')))
  ) {
    const byPm25Desc = [...cities].sort((a, b) => b.pm25 - a.pm25);
    const byTempDesc = [...cities].sort((a, b) => b.temperature - a.temperature);
    const cleanest = byPm25Desc[byPm25Desc.length - 1];
    const dirtiest = byPm25Desc[0];
    const warmest = byTempDesc[0];
    const coldest = byTempDesc[byTempDesc.length - 1];

    const lines = [
      `Türkiye Geneli (81 İl) Güncel Karşılaştırma Özeti:`,
      `• En Temiz Hava (En Düşük PM2.5): ${cleanest.name} — PM2.5: ${cleanest.pm25.toFixed(
        1
      )} µg/m³, PM10: ${cleanest.pm10.toFixed(1)} µg/m³ (${cleanest.statusLabel})`,
      `• En Yüksek Partikül Yükü: ${dirtiest.name} — PM2.5: ${dirtiest.pm25.toFixed(
        1
      )} µg/m³, PM10: ${dirtiest.pm10.toFixed(1)} µg/m³ (${dirtiest.statusLabel})`,
      `• En Sıcak İl: ${warmest.name} (${warmest.temperature.toFixed(1)} °C)`,
      `• En Soğuk İl: ${coldest.name} (${coldest.temperature.toFixed(1)} °C)`,
    ];

    if (targetCity) {
      lines.push(
        `\nSeçili İl (${targetCity.name}): ${targetCity.temperature.toFixed(
          1
        )} °C, PM2.5 ${targetCity.pm25.toFixed(1)} µg/m³, PM10 ${targetCity.pm10.toFixed(
          1
        )} µg/m³, Durum: ${targetCity.statusLabel}.`
      );
    }

    return {
      answer: lines.join('\n'),
      isOutOfScope: false,
      resolvedCityName: targetCity?.name ?? 'Türkiye Geneli',
    };
  }

  // 2. Map colors / System rules explanation
  if (
    (folded.includes('renk') ||
      folded.includes('yesil') ||
      folded.includes('turuncu') ||
      folded.includes('kirmizi')) &&
    (folded.includes('harita') || folded.includes('anlam') || folded.includes('neden'))
  ) {
    const answer = [
      'Harita Renk Kodları ve Değerlendirme Mantığı:',
      '• Yeşil (İyi): PM2.5 ≤ 15 µg/m³, PM10 ≤ 35 µg/m³ ve sıcaklık/rüzgar değerleri güvenlidir. Temiz hava ve düşük risk düzeyini gösterir.',
      '• Turuncu (Orta): PM2.5 (15–35 µg/m³) veya PM10 (35–70 µg/m³) orta düzeydedir ya da kuvvetli rüzgar (≥ 30 km/s) / düşük-yüksek sıcaklık nedeniyle dikkat gerektirir.',
      '• Kırmızı (Kötü): PM2.5 > 35 µg/m³ veya PM10 > 70 µg/m³ seviyesindedir ya da aşırı sıcaklık / şiddetli rüzgar vardır.',
      targetCity
        ? `\n${targetCity.name} şu an ${targetCity.statusLabel.toLocaleUpperCase(
            'tr-TR'
          )} kategorisindedir (PM2.5: ${targetCity.pm25.toFixed(
            1
          )} µg/m³, PM10: ${targetCity.pm10.toFixed(1)} µg/m³, Sıcaklık: ${targetCity.temperature.toFixed(
            1
          )} °C).`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      answer,
      isOutOfScope: false,
      resolvedCityName: targetCity?.name ?? 'Türkiye Geneli',
    };
  }

  // 3. PM10 / PM2.5 / Health Effects explanation
  if (
    folded.includes('pm10') ||
    folded.includes('pm2.5') ||
    folded.includes('pm2,5') ||
    folded.includes('pm 10') ||
    folded.includes('pm 2.5') ||
    folded.includes('partikul') ||
    folded.includes('solunum') ||
    folded.includes('akciger')
  ) {
    const baseExplanation = [
      'PM10 ve PM2.5 Partikül Maddeleri ve Etkileri:',
      '• PM2.5 (İnce Partikül Madde): Çapı 2.5 mikrometreden küçük parçacıklardır. Fosil yakıt yanması, araç egzozları ve sanayiden oluşur; akciğer alveollerine ve kan dolaşımına ulaşabildiği için solunum ve kalp-damar sağlığı açısından en kritik göstergedir.',
      '• PM10 (Kaba Partikül Madde): Çapı 10 mikrometreden küçük toz, polen ve duman tanecikleridir. Burun, boğaz ve üst solunum yollarında birikerek öksürük, boğaz tahrişi ve alerjik semptomlara yol açar.',
    ];

    if (targetCity) {
      baseExplanation.push(
        `\n${targetCity.name} Ölçümü: PM2.5 = ${targetCity.pm25.toFixed(
          1
        )} µg/m³, PM10 = ${targetCity.pm10.toFixed(1)} µg/m³ (Durum: ${targetCity.statusLabel}).`,
        ...targetCity.riskDetails.map((d) => `- ${d}`)
      );
    }

    return {
      answer: baseExplanation.join('\n'),
      isOutOfScope: false,
      resolvedCityName: targetCity?.name ?? 'Türkiye Geneli',
    };
  }

  // 4. Outdoor activity / Sports / Mask advice
  if (
    folded.includes('spor') ||
    folded.includes('yuruyus') ||
    folded.includes('acik hava') ||
    folded.includes('disari') ||
    folded.includes('maske') ||
    folded.includes('egzersiz')
  ) {
    const city = targetCity ?? cities[0];
    let verdict = '';
    if (city.status === 'iyi') {
      verdict = `${city.name} için açık havada spor ve yürüyüş yapmak uygundur.`;
    } else if (city.status === 'orta') {
      verdict = `${city.name} için hafif açık hava yürüyüşü yapılabilir ancak hassas grupların (astım, KOAH, yaşlılar, çocuklar) yoğun tempolu egzersizi kapalı alanlarda yapması daha güvenlidir.`;
    } else {
      verdict = `${city.name} için açık havada yoğun spor önerilmez. Dışarı çıkılması gerekiyorsa koruyucu maske (N95/FFP2) tercih edilmeli ve dış ortam süresi kısa tutulmalıdır.`;
    }

    return {
      answer: [
        verdict,
        `Güncel Veriler (${city.name}): Sıcaklık ${city.temperature.toFixed(
          1
        )} °C, Rüzgar ${city.windSpeed.toFixed(1)} km/s, PM2.5 ${city.pm25.toFixed(
          1
        )} µg/m³, PM10 ${city.pm10.toFixed(1)} µg/m³.`,
        ...city.riskDetails.map((d) => `- ${d}`),
      ].join('\n'),
      isOutOfScope: false,
      resolvedCityName: city.name,
    };
  }

  // 5. Wind, Fog, Rain, Snow, Temperature / Frost / Heat meteorology questions
  const mentionsRuzgar = folded.includes('ruzgar');
  const mentionsSisOrNem =
    hasWord(folded, 'sis') || hasWord(folded, 'nem') || folded.includes('gorus mesafesi');
  const mentionsDonOrKar =
    hasWord(folded, 'don') || folded.includes('buzlanma') || hasWord(folded, 'kar');
  const mentionsYagis =
    folded.includes('yagmur') || folded.includes('yagis') || folded.includes('saganak');

  if (mentionsRuzgar || mentionsSisOrNem || mentionsDonOrKar || mentionsYagis) {
    const insights: string[] = [];
    if (mentionsRuzgar) {
      insights.push(
        'Rüzgar ve Hava Kalitesi İlişkisi: Rüzgar hızı arttıkça şehir merkezlerinde biriken PM2.5 ve PM10 partikülleri dağılır ve hava temizlenir. Ancak çok kuru ve tozlu bölgelerde 30 km/s üzerindeki rüzgar yerden toz kaldırarak PM10 değerini geçici olarak yükseltebilir.'
      );
    }
    if (mentionsSisOrNem) {
      insights.push(
        'Sis, Nem ve Görüş Mesafesi: Yüksek nem ve durgun hava koşullarında (özellikle sıcaklık inversiyonu oluştuğunda) kirleticiler yere yakın katmanda hapsolur. Bu durum hem görüş mesafesini düşürür hem de solunum yollarında partikül yükünü artırır.'
      );
    }
    if (mentionsDonOrKar) {
      insights.push(
        'Soğuk Hava, Don ve Kar Etkisi: Sıcaklık 1 °C ve altına düştüğünde yollarda gizli buzlanma başlar; ayrıca ısınma kaynaklı yakıt tüketimi arttığı için kış aylarında PM2.5 ve PM10 değerleri yükselebilir.'
      );
    }
    if (mentionsYagis) {
      insights.push(
        'Yağış ve Partikül Yıkanması: Yağış havadaki asılı toz ve partikülleri (özellikle PM10) yere indirerek atmosferi temizlemeye yardımcı olur.'
      );
    }

    if (targetCity) {
      insights.push(
        `\n${targetCity.name} Mevcut Ölçümü: Sıcaklık ${targetCity.temperature.toFixed(
          1
        )} °C, Rüzgar ${targetCity.windSpeed.toFixed(1)} km/s, PM2.5 ${targetCity.pm25.toFixed(
          1
        )} µg/m³, PM10 ${targetCity.pm10.toFixed(1)} µg/m³ (${targetCity.statusLabel}).`
      );
    }

    return {
      answer: insights.join('\n\n'),
      isOutOfScope: false,
      resolvedCityName: targetCity?.name ?? 'Türkiye Geneli',
    };
  }

  // 6. Notification & System guide question
  if (folded.includes('bildirim') || folded.includes('uyari') || folded.includes('nasil calisir')) {
    return {
      answer: [
        'Erken Uyarı ve Bildirim Sistemi Nasıl Çalışır?',
        '• Bildirim Merkezi sekmesinden Türkiye’nin 81 ilinden istediklerinizi "Şehri Ekle" ile takip listenize ekleyebilirsiniz; listeniz ve son bilinen ölçümler tarayıcı hafızasında (localStorage) saklanır.',
        '• Sistem arka planda periyodik olarak (ve "Şimdi Kontrol Et" butonuna bastığınızda) illerin sıcaklık, PM2.5, PM10 ve İyi/Orta/Kötü statü değişimlerini denetler.',
        '• Değişim algılandığında tarayıcı bildirimi (izin verilmişse) ve uygulama içi uyarı bannerı ile Bildirim Geçmişi kaydı oluşturulur.',
      ].join('\n'),
      isOutOfScope: false,
      resolvedCityName: targetCity?.name ?? 'Türkiye Geneli',
    };
  }

  // 7. General city air quality / status report
  if (targetCity) {
    return {
      answer: formatCityOverview(targetCity),
      isOutOfScope: false,
      resolvedCityName: targetCity.name,
    };
  }

  // 8. General Turkey-wide summary
  const avgTemp = cities.reduce((acc, c) => acc + c.temperature, 0) / Math.max(cities.length, 1);
  const avgPm25 = cities.reduce((acc, c) => acc + c.pm25, 0) / Math.max(cities.length, 1);
  const goodCount = cities.filter((c) => c.status === 'iyi').length;
  const modCount = cities.filter((c) => c.status === 'orta').length;
  const badCount = cities.filter((c) => c.status === 'kotu').length;

  return {
    answer: [
      'Türkiye Geneli (81 İl) Anlık Hava Kalitesi Özeti:',
      `• İzlenen ${cities.length} ilin ortalama sıcaklığı ${avgTemp.toFixed(
        1
      )} °C, ortalama PM2.5 yoğunluğu ${avgPm25.toFixed(1)} µg/m³ seviyesindedir.`,
      `• Dağılım: ${goodCount} il İyi (Yeşil), ${modCount} il Orta (Turuncu), ${badCount} il Kötü (Kırmızı) durumdadır.`,
      'Belirli bir il hakkında ayrıntı almak için sol panelden il seçebilir veya sorunuzda il adını (ör. "Ankara", "Eskişehir", "Trabzon") belirtebilirsiniz.',
    ].join('\n'),
    isOutOfScope: false,
    resolvedCityName: 'Türkiye Geneli',
  };
}
