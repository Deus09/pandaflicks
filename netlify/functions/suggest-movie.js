const fetch = require('node-fetch');

// A helper to parse the movie titles from Gemini's response
function parseMovieTitles(rawText) {
    if (!rawText) return [];
    
    // Match lines that start with a number, a dot, and a space.
    const movieLines = rawText.match(/^(\d+\.\s.*)$/gm);
    if (!movieLines) return [];

    return movieLines
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering like "1. "
        .filter(line => line.length > 0); // Remove any empty lines
}

// Gemini'ye istek atıp film adlarını alan yardımcı fonksiyon
async function getMovieSuggestionsFromGemini(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
        attempt++;
        console.log(`[SUGGEST-MOVIE-LOG] Gemini Attempt #${attempt}`);

        // On the second attempt, be more strict with the prompt.
        const fullPrompt = attempt === 1
            ? `Lütfen kullanıcının şu isteğine göre bir birinden farklı 4 film öner: "${prompt}". Sadece numaralandırılmış bir liste halinde, her satırda bir tane olacak şekilde, filmlerin orijinal adını ve parantez içinde çıkış yılını döndür. Başka hiçbir açıklama, selamlama veya ek metin ekleme. Örneğin:
1. The Dark Knight (2008)
2. Inception (2010)
3. Pulp Fiction (1994)
4. The Matrix (1999)`
            : `YANLIŞ FORMAT. Lütfen SADECE numaralandırılmış bir liste olarak 4 film adı ve yılı döndür. Başka HİÇBİR METİN ekleme. Örneğin:
1. The Godfather (1972)
2. Forrest Gump (1994)
3. Fight Club (1999)
4. Interstellar (2014)`;
        
        const payload = { contents: [{ role: "user", parts: [{ text: fullPrompt }] }] };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[SUGGEST-MOVIE-LOG] Gemini API Error (Attempt ${attempt}):`, errorBody);
            // If it's a server error, don't retry.
            if (response.status >= 500) {
                 throw new Error("Gemini sunucusunda bir hata oluştu.");
            }
            continue; // For client errors, try again.
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        console.log(`[SUGGEST-MOVIE-LOG] Raw Gemini Response (Attempt ${attempt}):\n---\n${rawText}\n---`);

        const movieTitles = parseMovieTitles(rawText);

        if (movieTitles.length >= 4) {
            console.log("[SUGGEST-MOVIE-LOG] Successfully parsed titles:", movieTitles);
            return movieTitles; // Success!
        }
        
        console.warn(`[SUGGEST-MOVIE-LOG] Failed to parse titles on attempt ${attempt}. Retrying...`);
    }

    // If both attempts fail
    throw new Error('Gemini\'den beklenen formatta film listesi alınamadı.');
}

// TMDB'de arama yapıp ilk sonucu döndüren yardımcı fonksiyon
async function searchTmdb(query, apiKey) {
    let year = '';
    const yearMatch = query.match(/\((\d{4})\)/);
    if (yearMatch) {
        year = yearMatch[1];
    }
    const movieTitle = query.replace(/\s\(\d{4}\)$/, '').trim();
    
    let url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieTitle)}&language=tr-TR&api_key=${apiKey}`;
    if (year) {
        url += `&year=${year}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`[SUGGEST-MOVIE-LOG] TMDB search failed for query: ${query}`);
        return null; // Return null instead of throwing an error for a single failed search
    }
    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results[0] : null;
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { VITE_GEMINI_API_KEY, VITE_TMDB_API_KEY } = process.env;
    if (!VITE_GEMINI_API_KEY || !VITE_TMDB_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API anahtarları sunucuda ayarlanmamış.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt gerekli.' }) };
        }

        const movieTitles = await getMovieSuggestionsFromGemini(prompt, VITE_GEMINI_API_KEY);
        
        const moviePromises = movieTitles.map(title => searchTmdb(title, VITE_TMDB_API_KEY));
        const tmdbResults = await Promise.all(moviePromises);
        
        const foundMovies = tmdbResults.filter(movie => movie !== null);

        console.log(`[SUGGEST-MOVIE-LOG] Found ${foundMovies.length} movies on TMDB.`);

        if (foundMovies.length === 0) {
             return { 
                statusCode: 200, // It's not a server error, so return 200
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Önerilen filmlerin hiçbiri veritabanında bulunamadı. Lütfen tekrar deneyin.' })
             };
        }
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movies: foundMovies })
        };

    } catch (error) {
        console.error('[SUGGEST-MOVIE-LOG] Critical function error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};