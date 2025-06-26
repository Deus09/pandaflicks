// js/gemini.js
console.log('gemini.js yüklendi.');

import { showNotification } from './utils.js';

// Proxy sunucumuzun ana yolu
const GEMINI_PROXY_URL = '/api/gemini-proxy';

/**
 * Gemini proxy fonksiyonuna güvenli bir şekilde istek gönderen yardımcı fonksiyon.
 * @param {string} model Kullanılacak Gemini modelinin adı (örn: 'gemini-2.0-flash:generateContent').
 * @param {object} payload Gemini API'sine gönderilecek asıl içerik.
 * @returns {Promise<object>} API'den gelen JSON yanıtı.
 */
async function callGeminiProxy(model, payload) {
    const response = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Proxy'nin hangi modeli ve payload'ı kullanacağını bilmesi için gövdeyi yapılandırıyoruz.
        body: JSON.stringify({ model, payload }) 
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Proxy hatası: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Gemini API ile yorumu geliştirir.
 * @param {string} comment - Geliştirilecek orijinal yorum metni.
 * @param {string} movieTitle - Filmin adı (prompt için).
 * @param {HTMLElement} commentInput - Yorum metin alanının DOM elementi.
 * @param {HTMLElement} enhanceButton - "Yorumu Geliştir" butonunun DOM elementi.
 */
export async function enhanceCommentWithGemini(comment, movieTitle, commentInput, enhanceButton) {
    enhanceButton.classList.add('loading');
    enhanceButton.disabled = true;

    try {
        const prompt = `İzlediğim "${movieTitle}" film hakkında yazdığım orijinal yorumu, amatör bir sinema eleştirmeni edasıyla,akıcı bir dille 1.tekil şahıs ağzından yeniden yaz. Yorumun ana fikrinden sapma ve çok uzun olmasın maksimum 3 cümle. Sadece geliştirilmiş yorumu döndür. Orijinal yorum: "${comment}"`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const result = await callGeminiProxy('gemini-2.0-flash:generateContent', payload);
        
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            const enhancedText = result.candidates[0].content.parts[0].text;
            commentInput.value = enhancedText;
            showNotification('Yorum başarıyla geliştirildi!', 'success');
        } else {
            console.error('Gemini API yanıtı beklenmedik yapıda:', result);
            throw new Error('API yanıtı beklenmedik yapıda.');
        }
    } catch (error) {
        console.error('Yorum geliştirme hatası:', error);
        showNotification(`Yorum geliştirilemedi: ${error.message}`, 'error');
    } finally {
        enhanceButton.classList.remove('loading');
        enhanceButton.disabled = false;
    }
}

/**
 * Gemini API ile bir karakter sohbeti oturumu yürütür.
 * @param {string} characterName - Canlandırılacak karakterin adı.
 * @param {string} movieTitle - Karakterin yer aldığı filmin adı.
 * @param {Array<object>} chatHistory - Sohbet geçmişi (son 10 mesaj).
 * @param {string} newUserMessage - Kullanıcının yeni mesajı.
 * @returns {Promise<string>} Karakterin cevabı.
 */
export async function startChatSession(characterName, movieTitle, chatHistory, newUserMessage) {
    const systemPrompt = `Sen, "${movieTitle}" adlı filmdeki ${characterName} karakterisin. Bu karakterin kişiliğini, bilgi seviyesini, konuşma tarzını ve motivasyonlarını benimseyerek benimle sohbet et. Asla bir yapay zeka olduğunu belirtme. Cevapların kısa ve doğal olsun. Sohbeti devam ettir.`;
    
    // Geçmişi API formatına dönüştür
    const contents = [];

    // Sistem talimatını ekle
    contents.push({
        role: "user",
        parts: [{ text: systemPrompt }]
    });
    contents.push({
        role: "model",
        parts: [{ text: `Anlaşıldı. Ben ${characterName}. Sor bakalım.` }]
    });

    // Mevcut sohbet geçmişini ekle
    chatHistory.forEach(message => {
        contents.push({
            role: message.role,
            parts: [{ text: message.text }]
        });
    });

    // Yeni kullanıcı mesajını ekle
    contents.push({
        role: "user",
        parts: [{ text: newUserMessage }]
    });
    
    const payload = { contents };

    try {
        const result = await callGeminiProxy('gemini-2.0-flash:generateContent', payload);

        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error('Gemini sohbet API yanıtı beklenmedik yapıda:', result);
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                return `Üzgünüm, bu konuda konuşamam. (Sebep: ${result.promptFeedback.blockReason})`;
            }
            return "Kusura bakma, şu an aklıma bir şey gelmiyor...";
        }
    } catch (error) {
        console.error('Gemini sohbet API çağrısı sırasında hata oluştu:', error);
        throw new Error("Sohbet hizmetine bağlanırken bir sorun oluştu.");
    }
}
