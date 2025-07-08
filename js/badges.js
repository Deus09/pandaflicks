// js/badges.js

// Tüm rozetlerin ana listesi ve tanımlamaları
// js/badges.js

// Tüm rozetlerin ana listesi ve tanımlamaları
const ALL_BADGES = [
    // Seviye 1: Başlangıç ve Miktar Rozetleri
    { id: 'first_step', name: 'badge_first_step_name', icon: '🚀', description: 'badge_first_step_desc', condition: (stats) => stats.totalMovies >= 1 },
    { id: 'curious_viewer', name: 'badge_curious_viewer_name', icon: '🧐', description: 'badge_curious_viewer_desc', condition: (stats) => stats.totalMovies >= 10 },
    { id: 'cinephile', name: 'badge_cinephile_name', icon: '📚', description: 'badge_cinephile_desc', condition: (stats) => stats.totalMovies >= 50 },
    { id: 'film_gourmet', name: 'badge_film_gourmet_name', icon: '🧑‍🍳', description: 'badge_film_gourmet_desc', condition: (stats) => stats.totalMovies >= 100 },
    { id: 'sinelog_elite', name: 'badge_sinelog_elite_name', icon: '👑', description: 'badge_sinelog_elite_desc', condition: (stats) => stats.totalMovies >= 250 },
    
    // Seviye 2: Süre ve Format Rozetleri
    { id: 'short_film_collector', name: 'badge_short_film_collector_name', icon: '🎬', description: 'badge_short_film_collector_desc', condition: (stats) => stats.shortFilmCount >= 5 },
    { id: 'marathoner', name: 'badge_marathoner_name', icon: '🏃‍♂️', description: 'badge_marathoner_desc', condition: (stats) => stats.hasMarathonMovie },
    { id: 'epic_viewer', name: 'badge_epic_viewer_name', icon: '🗿', description: 'badge_epic_viewer_desc', condition: (stats) => stats.hasEpicMovie },
    { id: 'one_day_filmgoer', name: 'badge_one_day_filmgoer_name', icon: '🗓️', description: 'badge_one_day_filmgoer_desc', condition: (stats) => stats.totalRuntimeMinutes >= 1440 },
    { id: '10_day_filmgoer', name: 'badge_10_day_filmgoer_name', icon: '🎖️', description: 'badge_10_day_filmgoer_desc', condition: (stats) => stats.totalRuntimeMinutes >= 14400 },

    // Seviye 3: Puanlama ve Yorum Rozetleri
    { id: 'critic', name: 'badge_critic_name', icon: '✍️', description: 'badge_critic_desc', condition: (stats) => stats.commentedMoviesCount >= 25 },
    { id: 'master_commentator', name: 'badge_master_commentator_name', icon: '✒️', description: 'badge_master_commentator_desc', condition: (stats) => stats.commentedMoviesCount >= 100 },
    { id: 'perfectionist', name: 'badge_perfectionist_name', icon: '🌟', description: 'badge_perfectionist_desc', condition: (stats) => stats.fiveStarCount >= 5 },
    { id: 'hard_to_please', name: 'badge_hard_to_please_name', icon: '🤨', description: 'badge_hard_to_please_desc', condition: (stats) => stats.oneStarCount >= 5 },
    { id: 'perfect_streak', name: 'badge_perfect_streak_name', icon: '✨', description: 'badge_perfect_streak_desc', condition: (stats) => stats.perfectStreakCount >= 3 },

    // Seviye 4: Tür ve Yönetmen Rozetleri
    { id: 'genre_enthusiast', name: 'badge_genre_enthusiast_name', icon: '🎭', description: 'badge_genre_enthusiast_desc', condition: (stats) => stats.maxFilmsInSingleGenre >= 15 },
    { id: 'genre_expert', name: 'badge_genre_expert_name', icon: '🎓', description: 'badge_genre_expert_desc', condition: (stats) => stats.maxFilmsInSingleGenre >= 50 },
    { id: 'rainbow_palette', name: 'badge_rainbow_palette_name', icon: '🎨', description: 'badge_rainbow_palette_desc', condition: (stats) => stats.uniqueGenreCount >= 7 },
    { id: 'director_fan', name: 'badge_director_fan_name', icon: '🏆', description: 'badge_director_fan_desc', condition: (stats) => stats.maxFilmsFromSingleDirector >= 5 },
    { id: 'director_follower', name: 'badge_director_follower_name', icon: '🎥', description: 'badge_director_follower_desc', condition: (stats) => stats.maxFilmsFromSingleDirector >= 10 },

    // Seviye 5: Zaman ve Keşif Rozetleri
    { id: '80s_kid', name: 'badge_80s_kid_name', icon: '🕹️', description: 'badge_80s_kid_desc', condition: (stats) => stats.count80sFilms >= 10 },
    { id: '90s_spirit', name: 'badge_90s_spirit_name', icon: '📼', description: 'badge_90s_spirit_desc', condition: (stats) => stats.count90sFilms >= 15 },
    { id: 'millennium_cinephile', name: 'badge_millennium_cinephile_name', icon: '💽', description: 'badge_millennium_cinephile_desc', condition: (stats) => stats.count00sFilms >= 20 },
    { id: 'classic_master', name: 'badge_classic_master_name', icon: '🎞️', description: 'badge_classic_master_desc', condition: (stats) => stats.countPre70sFilms >= 10 },
    { id: 'documentary_buff', name: 'badge_documentary_buff_name', icon: '🌍', description: 'badge_documentary_buff_desc', condition: (stats) => stats.documentaryCount >= 5 },

    // Seviye 6: Özel ve Meta Rozetler
    { id: 'weekend_warrior', name: 'badge_weekend_warrior_name', icon: '🍿', description: 'badge_weekend_warrior_desc', condition: (stats) => stats.maxMoviesInWeekend >= 5 },
    { id: 'double_feature', name: 'badge_double_feature_name', icon: '✌️', description: 'badge_double_feature_desc', condition: (stats) => stats.maxMoviesInDay >= 2 },
    { id: 'loyal_friend', name: 'badge_loyal_friend_name', icon: '🤝', description: 'badge_loyal_friend_desc', condition: (stats) => stats.accountAgeInDays >= 365 },
    { id: 'animator', name: 'badge_animator_name', icon: '🦄', description: 'badge_animator_desc', condition: (stats) => stats.animationCount >= 5 },
    { id: 'collector', name: 'badge_collector_name', icon: '💎', description: 'badge_collector_desc', condition: (stats, earned) => earned.length >= 15 }
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