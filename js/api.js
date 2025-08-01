// js/api.js
console.log('api.js yüklendi.');
import { getCurrentLang } from './i18n.js';

const TMDB_PROXY_BASE = '/api/tmdb';

export const TMDB_IMAGE_BASE_URL_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_URL_W185 = 'https://image.tmdb.org/t/p/w185';
export const TMDB_IMAGE_BASE_URL_W92 = 'https://image.tmdb.org/t/p/w92';
export const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

/**
 * GÜNCELLEME: Bu fonksiyon artık arayüzü doğrudan etkilemiyor.
 * Sadece popüler filmlerin verisini çeker ve bir dizi olarak döndürür.
 * @returns {Promise<Array>} Popüler filmlerin bir dizisini döndürür.
 * @throws {Error} Veri çekme sırasında bir hata olursa hata fırlatır.
 */
export async function fetchTrendingMovies() {
    try {
        const lang = getCurrentLang();
        const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
        const url = `${TMDB_PROXY_BASE}/trending/movie/week?language=${tmdbLang}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Proxy Hatası! Durum: ${response.status}`);
        }
        const data = await response.json();

        // Sadece ilk 10 filmin verisini döndür veya sonuç yoksa boş dizi döndür.
        return data.results ? data.results.slice(0, 10) : [];

    } catch (error) {
        console.error('Trend filmler yüklenirken hata oluştu:', error);
        // Hatanın üst katmanlarda yakalanabilmesi için tekrar fırlat.
        throw error;
    }
}

export async function fetchMovieDetailsFromApi(tmdbMovieId) {
    try {
        const lang = getCurrentLang();
        const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
        const movieDetailsUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}?language=${tmdbLang}`;
        const movieCreditsUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}/credits?language=${tmdbLang}`;
        const videosUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}/videos?language=en-US`;
        const providersUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}/watch/providers`;

        const movieResponse = await fetch(movieDetailsUrl);
        if (!movieResponse.ok) {
            throw new Error(`Film detayları proxy'den yüklenemedi. HTTP Hata: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();

        const creditsResponse = await fetch(movieCreditsUrl);
        const videoResponse = await fetch(videosUrl);
        const providersResponse = await fetch(providersUrl);

        let director = null;
        let cast = [];
        let trailerKey = null;
        let watchProviders = [];

        if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            director = creditsData.crew.find(member => member.job === 'Director') || null;
            cast = creditsData.cast
                .filter(member => member.known_for_department === 'Acting' && member.profile_path)
                .sort((a, b) => a.order - b.order)
                .slice(0, 10);
        } else {
            console.warn('Yönetmen/oyuncu bilgisi yüklenemedi. HTTP Hata:', creditsResponse.status);
        }

        if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            const trailer = videoData.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer' && vid.key);
            if (trailer) {
                trailerKey = trailer.key;
            }
        } else {
            console.warn('Film videoları yüklenemedi. HTTP Hata:', videoResponse.status);
        }

        if (providersResponse.ok) {
            const providersData = await providersResponse.json();
            if (providersData.results && providersData.results.TR && providersData.results.TR.flatrate) {
                watchProviders = providersData.results.TR.flatrate;
            }
        } else {
            console.warn('Yayın bilgisi yüklenemedi. HTTP Hata:', providersResponse.status);
        }

        return { movieData, director, cast, trailerKey, watchProviders };

    } catch (error) {
        console.error("fetchMovieDetailsFromApi Hatası:", error);
        throw error;
    }
}

export async function searchTmdbMovies(query, resultsDiv, messageElement, displayResultsFunction) {
    if (query.length < 2) {
        messageElement.textContent = 'En az 2 karakter giriniz.';
        messageElement.style.display = 'block';
        resultsDiv.classList.add('hidden');
        resultsDiv.innerHTML = '';
        return;
    }

    resultsDiv.innerHTML = '';
    messageElement.style.display = 'none';

    try {
        const lang = getCurrentLang();
        const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
        const url = `${TMDB_PROXY_BASE}/search/movie?query=${encodeURIComponent(query)}&language=${tmdbLang}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Proxy Hatası! Durum: ${response.status}`);
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            displayResultsFunction(data.results, resultsDiv);
        } else {
            messageElement.textContent = 'Film bulunamadı.';
            messageElement.style.display = 'block';
            resultsDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('TMDB arama sırasında proxy hatası oluştu:', error);
        messageElement.innerHTML = `
            <p class="text-red-400 font-bold text-base">Arama Hatası!</p>
            <p class="mt-1 text-sm text-gray-400">Film ararken bir sorun oluştu: ${error.message}.</p>
        `;
        messageElement.style.display = 'block';
    }
}

export async function fetchMoviesFromList(listObject) {
    const { type, tmdbId } = listObject;

    try {
        let movies = [];
        switch (type) {
            case 'list':
            case 'collection':
            case 'endpoint':
            case 'director': {
                let path = '';
                if (type === 'list') path = `/list/${tmdbId}`;
                else if (type === 'collection') path = `/collection/${tmdbId}`;
                else if (type === 'director') path = `/person/${tmdbId}/movie_credits`;
                else path = String(tmdbId);

                const separator = path.includes('?') ? '&' : '?';
                const lang = getCurrentLang();
                const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
                const url = `${TMDB_PROXY_BASE}${path}${separator}language=${tmdbLang}`;

                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP Hatası! Durum: ${response.status}`);
                const data = await response.json();

                if (type === 'director') {
                    movies = data.crew.filter(movie => movie.job === 'Director').sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                } else {
                    movies = data.results || data.parts || data.items || [];
                }
                break;
            }
            case 'manual': {
                const moviePromises = tmdbId.map(id => fetchMovieDetailsFromApi(id));
                const movieDetailsResponses = await Promise.all(moviePromises);
                movies = movieDetailsResponses.map(res => res.movieData);
                break;
            }
            default:
                throw new Error('Geçersiz liste tipi');
        }
        return movies;
    } catch (error) {
        console.error(`'${listObject.name}' listesi filmleri çekilirken hata oluştu:`, error);
        return [];
    }
}

export async function fetchSuggestedMovie(prompt, isRetry = false) {
    try {
        const response = await fetch('/api/suggest-movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt, isRetry: isRetry, lang: getCurrentLang() })
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `Film önerisi alınırken bir hata oluştu: ${response.status}`);
            } catch (e) {
                throw new Error(`Sunucu fonksiyonu bulunamadı veya bir hata oluştu (HTTP ${response.status}).`);
            }
        }
        return await response.json();
    } catch (error) {
        console.error('fetchSuggestedMovie hatası:', error);
        throw error;
    }
}

export async function fetchPersonDetailsAndCredits(personId) {
    const lang = getCurrentLang();
    const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
    const personDetailsUrl = `${TMDB_PROXY_BASE}/person/${personId}?language=${tmdbLang}`;
    const movieCreditsUrl = `${TMDB_PROXY_BASE}/person/${personId}/movie_credits?language=${tmdbLang}`;

    try {
        // İki isteği aynı anda gönderelim ki daha hızlı olsun
        const [detailsResponse, creditsResponse] = await Promise.all([
            fetch(personDetailsUrl),
            fetch(movieCreditsUrl)
        ]);

        if (!detailsResponse.ok) {
            throw new Error(`Kişi detayları yüklenemedi. HTTP Hata: ${detailsResponse.status}`);
        }
        if (!creditsResponse.ok) {
            throw new Error(`Kişi filmleri yüklenemedi. HTTP Hata: ${creditsResponse.status}`);
        }

        const personDetails = await detailsResponse.json();
        const movieCredits = await creditsResponse.json();

        // Gelen verileri tek bir pakette birleştirip geri döndürelim
        return {
            details: personDetails,
            movies: [...movieCredits.cast, ...movieCredits.crew] // Hem oynadığı hem yönettiği filmleri birleştir
        };

    } catch (error) {
        console.error(`Kişi bilgileri çekilirken hata oluştu (ID: ${personId}):`, error);
        throw error; // Hatanın üst katmanlarda yakalanabilmesi için tekrar fırlat
    }
}