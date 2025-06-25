// js/badges.js

// Tüm rozetlerin ana listesi ve tanımlamaları
const ALL_BADGES = [
    // Seviye 1: Başlangıç ve Miktar Rozetleri
    { id: 'first_step', name: 'İlk Adım', icon: '🚀', description: 'SineLog macerana ilk filmini ekleyerek başladın.', condition: (stats) => stats.totalMovies >= 1 },
    { id: 'curious_viewer', name: 'Meraklı İzleyici', icon: '🧐', description: 'Koleksiyonuna 10 film ekledin.', condition: (stats) => stats.totalMovies >= 10 },
    { id: 'cinephile', name: 'Sinefil', icon: '📚', description: 'Koleksiyonuna 50 film ekledin.', condition: (stats) => stats.totalMovies >= 50 },
    { id: 'film_gourmet', name: 'Film Gurmesi', icon: '🧑‍🍳', description: 'Koleksiyonuna 100 film ekledin.', condition: (stats) => stats.totalMovies >= 100 },
    { id: 'sinelog_elite', name: 'SineLog Eliti', icon: '👑', description: 'Tam 250 filmlik dev bir arşive ulaştın!', condition: (stats) => stats.totalMovies >= 250 },
    
    // Seviye 2: Süre ve Format Rozetleri
    { id: 'short_film_collector', name: 'Kısa Film Koleksiyoncusu', icon: '🎬', description: 'Süresi 1 saatin altında olan 5 film izledin.', condition: (stats) => stats.shortFilmCount >= 5 },
    { id: 'marathoner', name: 'Maratoncu', icon: '🏃‍♂️', description: '3 saatten daha uzun bir film izledin.', condition: (stats) => stats.hasMarathonMovie },
    { id: 'epic_viewer', name: 'Epik İzleyici', icon: '🗿', description: '4 saatten uzun, destansı bir film izledin.', condition: (stats) => stats.hasEpicMovie },
    { id: 'one_day_filmgoer', name: '1 Günlük Filmci', icon: '🗓️', description: 'Toplamda 24 saat film izleme süresini aştın.', condition: (stats) => stats.totalRuntimeMinutes >= 1440 },
    { id: '10_day_filmgoer', name: '10 Günlük Filmci', icon: '🎖️', description: 'Toplamda 240 saat film izleme süresini aştın.', condition: (stats) => stats.totalRuntimeMinutes >= 14400 },

    // Seviye 3: Puanlama ve Yorum Rozetleri
    { id: 'critic', name: 'Film Eleştirmeni', icon: '✍️', description: '25 farklı filme yorum yazdın.', condition: (stats) => stats.commentedMoviesCount >= 25 },
    { id: 'master_commentator', name: 'Usta Yorumcu', icon: '✒️', description: 'Tam 100 filme yorum yaparak düşüncelerini paylaştın.', condition: (stats) => stats.commentedMoviesCount >= 100 },
    { id: 'perfectionist', name: 'Mükemmeliyetçi', icon: '🌟', description: '5 farklı filme tam 5 yıldız verdin.', condition: (stats) => stats.fiveStarCount >= 5 },
    { id: 'hard_to_please', name: 'Zor Beğenen', icon: '🤨', description: 'En az 5 filme 1 yıldız veya daha az verdin.', condition: (stats) => stats.oneStarCount >= 5 },
    { id: 'perfect_streak', name: 'Mükemmel Seri', icon: '✨', description: 'Arka arkaya 3 filme 5 yıldız verdin.', condition: (stats) => stats.perfectStreakCount >= 3 },

    // Seviye 4: Tür ve Yönetmen Rozetleri
    { id: 'genre_enthusiast', name: 'Tür Meraklısı', icon: '🎭', description: 'Aynı türden 15 film izledin.', condition: (stats) => stats.maxFilmsInSingleGenre >= 15 },
    { id: 'genre_expert', name: 'Tür Uzmanı', icon: '🎓', description: 'Aynı türden 50 film izleyerek o türde uzmanlaştın.', condition: (stats) => stats.maxFilmsInSingleGenre >= 50 },
    { id: 'rainbow_palette', name: 'Gökkuşağı Paleti', icon: '🎨', description: 'En az 7 farklı ana türden film izledin.', condition: (stats) => stats.uniqueGenreCount >= 7 },
    { id: 'director_fan', name: 'Yönetmen Hayranı', icon: '🏆', description: 'Aynı yönetmenin 5 filmini izledin.', condition: (stats) => stats.maxFilmsFromSingleDirector >= 5 },
    { id: 'director_follower', name: 'Yönetmen Takipçisi', icon: '🎥', description: 'Aynı yönetmenin 10 filmini izleyerek sadakatini kanıtladın.', condition: (stats) => stats.maxFilmsFromSingleDirector >= 10 },

    // Seviye 5: Zaman ve Keşif Rozetleri
    { id: '80s_kid', name: '80\'ler Çocuğu', icon: '🕹️', description: '1980\'lerde yapılmış 10 film izledin.', condition: (stats) => stats.count80sFilms >= 10 },
    { id: '90s_spirit', name: '90\'lar Ruhu', icon: '📼', description: '1990\'larda yapılmış 15 film izledin.', condition: (stats) => stats.count90sFilms >= 15 },
    { id: 'millennium_cinephile', name: 'Milenyum Sinefili', icon: '💽', description: '2000\'lerde yapılmış 20 film izledin.', condition: (stats) => stats.count00sFilms >= 20 },
    { id: 'classic_master', name: 'Klasik Sinema Üstadı', icon: '🎞️', description: '1970 öncesi yapılmış 10 film izledin.', condition: (stats) => stats.countPre70sFilms >= 10 },
    { id: 'documentary_buff', name: 'Belgesel Meraklısı', icon: '🌍', description: '5 belgesel film izledin.', condition: (stats) => stats.documentaryCount >= 5 },

    // Seviye 6: Özel ve Meta Rozetler
    { id: 'weekend_warrior', name: 'Hafta Sonu Savaşçısı', icon: '🍿', description: 'Tek bir hafta sonunda (Cuma-Pazar) 5 film izledin.', condition: (stats) => stats.maxMoviesInWeekend >= 5 },
    { id: 'double_feature', name: 'Double Feature', icon: '✌️', description: 'Aynı gün içinde 2 film izledin.', condition: (stats) => stats.maxMoviesInDay >= 2 },
    { id: 'loyal_friend', name: 'Sadık Dost', icon: '🤝', description: 'Uygulamayı 1 yıldır aktif olarak kullanıyorsun.', condition: (stats) => stats.accountAgeInDays >= 365 },
    { id: 'animator', name: 'Renklerin Büyüsü', icon: '🦄', description: '5 animasyon filmi izledin.', condition: (stats) => stats.animationCount >= 5 },
    { id: 'collector', name: 'Koleksiyoner', icon: '💎', description: '15 farklı rozet kazanarak koleksiyonunu zenginleştirdin.', condition: (stats, earned) => earned.length >= 15 }
];

/**
 * Verilen istatistiklere göre kullanıcının kazandığı rozetleri belirler.
 * @param {object} stats - Rozet kontrolü için hesaplanmış ham istatistikler.
 * @returns {Array<object>} Kazanılan rozet nesnelerinin bir dizisi.
 */
export function awardBadges(stats) {
    // Meta rozetler hariç diğerlerini filtrele
    let earnedBadges = ALL_BADGES.filter(badge => {
        if (badge.id === 'collector') return false; // Meta rozeti şimdilik ayır
        return badge.condition(stats);
    });

    // Meta rozeti (Koleksiyoner) şimdi kontrol et
    const collectorBadge = ALL_BADGES.find(b => b.id === 'collector');
    if (collectorBadge && collectorBadge.condition(stats, earnedBadges)) {
        earnedBadges.push(collectorBadge);
    }
    
    return earnedBadges;
}

export { ALL_BADGES };