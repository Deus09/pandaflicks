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
async function getMovieSuggestionsFromGemini(prompt, apiKey, isRetry = false) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    // If this is a retry, modify the prompt to ask for different suggestions.
    const retryText = isRetry ? " Lütfen daha önceki önerilerden TAMAMEN FARKLI olacak şekilde " : " ";
    
    const fullPrompt = `Lütfen kullanıcının şu isteğine göre${retryText}birbirinden farklı 4 film öner: "${prompt}". Sadece numaralandırılmış bir liste halinde, her satırda bir tane olacak şekilde, filmlerin orijinal adını ve parantez içinde çıkış yılını döndür. Başka hiçbir açıklama, selamlama veya ek metin ekleme. Örneğin:
1. The Dark Knight (2008)
2. Inception (2010)
3. Pulp Fiction (1994)
4. The Matrix (1999)`;
    
    // Add the generationConfig to increase creativity (temperature)
    const payload = {
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 1.0, // Increased from default for more variety
          topK: 40,
          topP: 0.95,
        },
    };

    console.log(`[SUGGEST-MOVIE-LOG] Sending prompt to Gemini (Retry: ${isRetry}):\n${fullPrompt}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("[SUGGEST-MOVIE-LOG] Gemini API Error:", errorBody);
        throw new Error("Gemini API'sinden film adı alınamadı.");
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log(`[SUGGEST-MOVIE-LOG] Raw Gemini Response:\n---\n${rawText}\n---`);
    
    const movieTitles = parseMovieTitles(rawText);

    if (movieTitles.length < 4) {
        console.warn("[SUGGEST-MOVIE-LOG] Gemini did not return 4 valid titles. Parsed:", movieTitles);
        throw new Error('Gemini\'den beklenen formatta film listesi alınamadı.');
    }
    
    return movieTitles;
}

// TMDB'de arama yapıp ilk sonucu döndüren yardımcı fonksiyon (No changes here)
async function searchTmdb(query, apiKey, lang = 'tr') { // lang parametresini ekledik
    let year = '';
    const yearMatch = query.match(/\((\d{4})\)/);
    if (yearMatch) year = yearMatch[1];
    const movieTitle = query.replace(/\s\(\d{4}\)$/, '').trim();

    // Gelen 'tr' veya 'en' bilgisine göre doğru TMDB dil kodunu seçiyoruz
    const tmdbLang = lang === 'en' ? 'en-US' : 'tr-TR';

    let url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieTitle)}&language=${tmdbLang}&api_key=${apiKey}`;
    if (year) url += `&year=${year}`;

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`[SUGGEST-MOVIE-LOG] TMDB search failed for query: ${query}`);
        return null;
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
        // Check if this is a retry attempt from the frontend
        const { prompt, isRetry, lang } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt gerekli.' }) };
        }

        const movieTitles = await getMovieSuggestionsFromGemini(prompt, VITE_GEMINI_API_KEY, isRetry);
        
        const moviePromises = movieTitles.map(title => searchTmdb(title, VITE_TMDB_API_KEY, lang));
        const tmdbResults = await Promise.all(moviePromises);
        
        const foundMovies = tmdbResults.filter(movie => movie !== null);

        console.log(`[SUGGEST-MOVIE-LOG] Found ${foundMovies.length} movies on TMDB.`);

        if (foundMovies.length === 0) {
             return { 
                statusCode: 200,
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