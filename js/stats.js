// js/stats.js
import { awardBadges, ALL_BADGES } from './badges.js';
import { getTranslation } from './i18n.js';

function formatRuntime(totalMinutes) {
    if (totalMinutes === 0) return getTranslation("time_zero_minutes");
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = "";
    if (hours > 0) {
        result += `${hours} ${getTranslation("time_hours")} `;
    }
    if (minutes > 0) {
        result += `${minutes} ${getTranslation("time_minutes")}`;
    }
    return result.trim();
}

function getCinematicIdentity(stats) {
    if (stats.totalMovies < 5) return getTranslation('identity_newbie');
    if (stats.topGenres.length > 0) {
        const topGenre = stats.topGenres[0].name;
        switch (topGenre) {
            case 'Aksiyon': return getTranslation('identity_action_lover');
            case 'Bilim-Kurgu': return getTranslation('identity_sci_fi_explorer');
            case 'Komedi': return getTranslation('identity_comedy_fan');
            case 'Dram': return getTranslation('identity_dramatic_soul');
            default: return getTranslation('identity_eclectic_taste');
        }
    }
    return getTranslation('identity_diverse_taste');
}

export function calculateStats(movies) {
    if (!movies || movies.length === 0) {
        return {
            totalMovies: 0, avgRating: 0, watchedThisYear: 0, topRatedMovie: null, totalWatchTime: "0 dakika", topGenres: [], topDirectors: [], ratingDistribution: {}, cinematicIdentity: getTranslation('identity_awaiting_discovery'), timeCapsule: null,
            badges: { all: ALL_BADGES, earned: [] }
        };
    }

    // --- TÜM SAYIMLAMALAR İÇİN DEĞİŞKENLER ---
    let totalRating = 0, ratedMoviesCount = 0, topRatedMovie = null, totalMinutes = 0,
        shortFilmCount = 0, commentedMoviesCount = 0, fiveStarCount = 0, oneStarCount = 0,
        perfectStreakCount = 0, maxPerfectStreak = 0,
        hasMarathonMovie = false, hasEpicMovie = false,
        count80sFilms = 0, count90sFilms = 0, count00sFilms = 0, countPre70sFilms = 0,
        animationCount = 0, documentaryCount = 0;

    const genreCounts = {}, directorCounts = {}, ratingDistribution = {}, monthlyCounts = {}, dailyCounts = {};
    const sortedMovies = [...movies].sort((a, b) => new Date(a.watchedDate) - new Date(b.watchedDate));

    // --- TEK DÖNGÜDE TÜM VERİLERİ İŞLE ---
    sortedMovies.forEach(movie => {
        // Puan & Yorum Sayımları
        if (movie.rating && movie.rating > 0) {
            totalRating += parseFloat(movie.rating); 
            ratedMoviesCount++;
            if (!topRatedMovie || movie.rating > topRatedMovie.rating) topRatedMovie = movie;
            ratingDistribution[movie.rating.toString()] = (ratingDistribution[movie.rating.toString()] || 0) + 1;
            
            if (movie.rating === 5) {
                fiveStarCount++;
                perfectStreakCount++;
            } else {
                if (perfectStreakCount > maxPerfectStreak) maxPerfectStreak = perfectStreakCount;
                perfectStreakCount = 0;
            }
            if (movie.rating <= 1) oneStarCount++;
        }
        if (movie.comment && movie.comment.trim() !== '') commentedMoviesCount++;

        // Süre Sayımları
        if (typeof movie.runtime === 'number' && movie.runtime > 0) {
            totalMinutes += movie.runtime;
            if (movie.runtime < 60) shortFilmCount++;
            if (movie.runtime >= 180) hasMarathonMovie = true;
            if (movie.runtime >= 240) hasEpicMovie = true;
        }

        // Tür & Yönetmen Sayımları
        const movieGenres = movie.genres?.map(g => g.name) || [];
        movieGenres.forEach(name => genreCounts[name] = (genreCounts[name] || 0) + 1);
        if (movie.director && movie.director !== "Bilinmiyor") directorCounts[movie.director] = (directorCounts[movie.director] || 0) + 1;
        if (movieGenres.includes('Animasyon')) animationCount++;
        if (movieGenres.includes('Belgesel')) documentaryCount++;
        
        // Tarih Sayımları
        if (movie.watchedDate) {
            const d = new Date(movie.watchedDate);
            const monthYear = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
            monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
            const dateString = d.toDateString();
            dailyCounts[dateString] = (dailyCounts[dateString] || 0) + 1;
            
            const releaseYear = movie.release_date ? parseInt(movie.release_date.substring(0, 4), 10) : 0;
            if (releaseYear >= 1980 && releaseYear <= 1989) count80sFilms++;
            else if (releaseYear >= 1990 && releaseYear <= 1999) count90sFilms++;
            else if (releaseYear >= 2000 && releaseYear <= 2009) count00sFilms++;
            else if (releaseYear < 1970) countPre70sFilms++;
        }
    });
    // Döngü bittikten sonra son seriyi de kontrol et
    if (perfectStreakCount > maxPerfectStreak) maxPerfectStreak = perfectStreakCount;
    
    // Hafta sonu filmlerini hesapla
    let maxMoviesInWeekend = 0;
    const checkedWeekends = new Set();
    Object.keys(dailyCounts).forEach(dateStr => {
        const date = new Date(dateStr);
        const day = date.getDay(); // 0=Pazar, 5=Cuma, 6=Ctesi
        if (day === 0 || day === 5 || day === 6) {
            const d = new Date(date);
            d.setDate(d.getDate() - (day === 0 ? -5 : day - 5)); // Haftanın Cuma gününü bul
            const weekendKey = d.toDateString();
            if (!checkedWeekends.has(weekendKey)) {
                let currentWeekendCount = 0;
                for (let i = 0; i < 3; i++) { // Cuma, Cumartesi, Pazar
                    const checkD = new Date(d);
                    checkD.setDate(d.getDate() + i);
                    currentWeekendCount += dailyCounts[checkD.toDateString()] || 0;
                }
                if (currentWeekendCount > maxMoviesInWeekend) maxMoviesInWeekend = currentWeekendCount;
                checkedWeekends.add(weekendKey);
            }
        }
    });

    // --- ROZETLER İÇİN TÜM İSTATİSTİKLERİ BİR ARAYA GETİR ---
    const statsForBadges = {
        totalMovies: movies.length, totalRuntimeMinutes: totalMinutes, shortFilmCount, hasMarathonMovie, hasEpicMovie,
        maxFilmsFromSingleDirector: Math.max(0, ...Object.values(directorCounts)),
        maxFilmsInSingleGenre: Math.max(0, ...Object.values(genreCounts)),
        uniqueGenreCount: Object.keys(genreCounts).length,
        count80sFilms, count90sFilms, count00sFilms, countPre70sFilms,
        commentedMoviesCount, fiveStarCount, oneStarCount, perfectStreakCount: maxPerfectStreak,
        animationCount, documentaryCount,
        maxMoviesInDay: Math.max(0, ...Object.values(dailyCounts)),
        maxMoviesInWeekend,
        accountAgeInDays: (new Date() - new Date(sortedMovies[0].watchedDate)) / (1000 * 60 * 60 * 24)
    };
    
    // --- SONUÇLARI HESAPLA ---
    const earnedBadges = awardBadges(statsForBadges);
    const topGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count }));
    const timeCapsuleData = {
        onThisDay: sortedMovies.find(movie => { const d = new Date(movie.watchedDate); const today = new Date(); return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() < today.getFullYear(); }),
        firstLogged: sortedMovies[0] || null,
        firstFiveStar: sortedMovies.find(m => m.rating === 5) || null,
        mostWatchedMonth: Object.entries(monthlyCounts).sort(([,a],[,b]) => b-a)[0] ? { month: Object.entries(monthlyCounts).sort(([,a],[,b]) => b-a)[0][0], count: Object.entries(monthlyCounts).sort(([,a],[,b]) => b-a)[0][1] } : null
    };

    // --- TÜM VERİLERİ DÖNDÜR ---
    return {
        totalMovies: movies.length,
        avgRating: ratedMoviesCount > 0 ? (totalRating / ratedMoviesCount) : 0,
        watchedThisYear: sortedMovies.filter(m => new Date(m.watchedDate).getFullYear() === new Date().getFullYear()).length,
        topRatedMovie,
        totalWatchTime: formatRuntime(totalMinutes),
        topGenres,
        topDirectors: Object.entries(directorCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count })),
        ratingDistribution,
        cinematicIdentity: getCinematicIdentity({ totalMovies: movies.length, topGenres }),
        timeCapsule: timeCapsuleData,
        badges: { all: ALL_BADGES, earned: earnedBadges }
    };
}