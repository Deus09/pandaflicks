// js/api.js
console.log('api.js yüklendi.');

// Proxy yolunu DOĞRUDAN burada tanımlıyoruz. Bu bir ortam değişkeni DEĞİLDİR.
const TMDB_PROXY_BASE = '/api/tmdb'; 

// İmaj URL'leri doğrudan TMDB'den çekilmeye devam edecek, bu yüzden bunlar kalıyor.
export const TMDB_IMAGE_BASE_URL_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_URL_W185 = 'https://image.tmdb.org/t/p/w185';
export const TMDB_IMAGE_BASE_URL_W92 = 'https://image.tmdb.org/t/p/w92';
export const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

export async function fetchTrendingMovies(gridElement, errorMessageElement, renderFunction, openDetailModalFunction) {
    errorMessageElement.style.display = 'none';

    try {
        const url = `${TMDB_PROXY_BASE}/trending/movie/week?language=tr-TR`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Proxy Hatası! Durum: ${response.status}`);
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            renderFunction(data.results.slice(0, 10), openDetailModalFunction);
        } else {
            gridElement.innerHTML = '';
            errorMessageElement.style.display = 'block';
            errorMessageElement.textContent = 'Popüler film bulunamadı.';
        }
    } catch (error) {
        console.error('Trend filmler yüklenirken proxy hatası oluştu:', error);
        gridElement.innerHTML = '';
        errorMessageElement.style.display = 'block';
        errorMessageElement.innerHTML = `
            <p class="text-red-400 font-bold text-lg">Yükleme Hatası!</p>
            <p class="mt-2 text-base text-gray-300">Popüler filmleri çekerken bir sorun oluştu.</p>
            <p class="mt-2 text-sm text-gray-400">Detay: ${error.message}. Lütfen site yöneticisi ile iletişime geçin.</p>
        `;
    }
}

export async function fetchMovieDetailsFromApi(tmdbMovieId) {
    try {
        const movieDetailsUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}?language=tr-TR`;
        const movieCreditsUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}/credits?language=tr-TR`;
        const videosUrl = `${TMDB_PROXY_BASE}/movie/${tmdbMovieId}/videos?language=en-US`;

        const movieResponse = await fetch(movieDetailsUrl);
        if (!movieResponse.ok) {
            throw new Error(`Film detayları proxy'den yüklenemedi. HTTP Hata: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();

        const creditsResponse = await fetch(movieCreditsUrl);
        let directorName = 'Bilinmiyor';
        let cast = [];
        if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            const director = creditsData.crew.find(member => member.job === 'Director');
            if (director) {
                directorName = director.name;
            }
            cast = creditsData.cast
                .filter(member => member.known_for_department === 'Acting' && member.profile_path)
                .sort((a, b) => a.order - b.order)
                .slice(0, 10);
        } else {
            console.warn('Yönetmen/oyuncu bilgisi yüklenemedi. HTTP Hata:', creditsResponse.status);
        }

        const videoResponse = await fetch(videosUrl);
        let trailerKey = null;
        if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            const trailer = videoData.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer' && vid.key);
            if (trailer) {
                trailerKey = trailer.key;
            }
        } else {
            console.warn('Film videoları yüklenemedi. HTTP Hata:', videoResponse.status);
        }
        return { movieData, directorName, cast, trailerKey };

    } catch (error) {
        console.error("fetchMovieDetailsFromApi Hatası:", error);
        throw error; // Hatanın daha üst katmanlarda da yakalanabilmesi için tekrar fırlat
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
        const url = `${TMDB_PROXY_BASE}/search/movie?query=${encodeURIComponent(query)}&language=tr-TR`;
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

/**
 * Belirli bir listenin film verilerini TMDB'den çeker. (YENİ: Buraya taşındı)
 * @param {object} listObject - Tipi ve ID'si/yolu olan liste nesnesi.
 * @returns {Promise<Array<object>>} Film nesnelerinin bir dizisi.
 */
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
                else path = String(tmdbId); // 'endpoint' için tmdbId doğrudan path'dir.
                
                const separator = path.includes('?') ? '&' : '?';
                const url = `${TMDB_PROXY_BASE}${path}${separator}language=tr-TR`;

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

/**
 * Backend üzerinden Gemini'dan film önerisi alır ve TMDB'den detaylarını çeker.
 * @param {string} prompt - Kullanıcının doğal dildeki film isteği.
 * @returns {Promise<object>} Bulunan filmin TMDB detayları.
 */
export async function fetchSuggestedMovie(prompt) {
    try {
        const response = await fetch('/api/suggest-movie', { // Netlify Function yolu
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            // 404 gibi durumlarda yanıt JSON olmayabilir, bu yüzden önce metin olarak okuyalım.
            const errorText = await response.text();
            try {
                // Yanıtın JSON olup olmadığını kontrol et
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `Film önerisi alınırken bir hata oluştu: ${response.status}`);
            } catch (e) {
                // Eğer JSON parse edilemezse, bu muhtemelen 404 hatasıdır.
                throw new Error(`Sunucu fonksiyonu bulunamadı veya bir hata oluştu (HTTP ${response.status}). Lütfen site yöneticisiyle iletişime geçin.`);
            }
        }
        return await response.json();
    } catch (error) {
        console.error('fetchSuggestedMovie hatası:', error);
        throw error;
    }
}