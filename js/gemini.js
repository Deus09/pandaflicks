// js/gemini.js
import { showNotification } from './utils.js';

/**
 * Gemini proxy fonksiyonuna güvenli bir şekilde istek gönderen merkezi fonksiyon.
 * @param {string} path Kullanılacak modelin yolu (örn: '/gemini-1.5-flash-latest:generateContent').
 * @param {object} payload Gemini API'sine gönderilecek asıl içerik.
 * @returns {Promise<object>} API'den gelen JSON yanıtı.
 */
async function callGemini(path, payload) {
    try {
        const response = await fetch(`/api/gemini${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Gemini'dan gelen özel hata mesajlarını göster
            const errorMessage = data.error?.message || `Proxy hatası: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        console.error(`Gemini API çağrısı sırasında hata (${path}):`, error);
        // Hatanın daha üst katmanlarda yakalanabilmesi için tekrar fırlat
        throw error;
    }
}

/**
 * Gemini API ile yorumu geliştirir.
 */
export async function enhanceCommentWithGemini(comment, movieTitle, commentInput, enhanceButton) {
    enhanceButton.classList.add('loading');
    enhanceButton.disabled = true;

    try {
        const prompt = `İzlediğim "${movieTitle}" film hakkında yazdığım orijinal yorumu, amatör bir sinema eleştirmeni edasıyla,akıcı bir dille 1.tekil şahıs ağzından yeniden yaz. Yorumun ana fikrinden sapma ve çok uzun olmasın maksimum 3 cümle. Sadece geliştirilmiş yorumu döndür. Orijinal yorum: "${comment}"`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const result = await callGemini('/gemini-1.5-flash-latest:generateContent', payload);
        
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            commentInput.value = result.candidates[0].content.parts[0].text;
            showNotification('Yorum başarıyla geliştirildi!', 'success');
        } else {
            throw new Error('API yanıtı beklenmedik yapıda.');
        }
    } catch (error) {
        showNotification(`Yorum geliştirilemedi: ${error.message}`, 'error');
    } finally {
        enhanceButton.classList.remove('loading');
        enhanceButton.disabled = false;
    }
}

/**
 * Gemini API ile bir karakter sohbeti oturumu yürütür.
 */
export async function startChatSession(characterName, movieTitle, chatHistory, newUserMessage) {
    const systemPrompt = `Sen, "${movieTitle}" adlı filmdeki ${characterName} karakterisin. Bu karakterin kişiliğini, bilgi seviyesini, konuşma tarzını ve motivasyonlarını benimseyerek benimle sohbet et. Asla bir yapay zeka olduğunu belirtme. Cevapların kısa ve doğal olsun. Sohbeti devam ettir.`;
    
    const contents = [];
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: `Anlaşıldı. Ben ${characterName}. Sor bakalım.` }] });
    chatHistory.forEach(message => contents.push({ role: message.role, parts: [{ text: message.text }] }));
    contents.push({ role: "user", parts: [{ text: newUserMessage }] });
    
    const payload = { contents };

    const result = await callGemini('/gemini-1.5-flash-latest:generateContent', payload);

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
    } else {
        // Güvenlik nedeniyle engellenmişse özel bir mesaj döndür
        if (result.promptFeedback?.blockReason) {
            return `Üzgünüm, bu konuda konuşamam. (Sebep: ${result.promptFeedback.blockReason})`;
        }
        throw new Error("Karakterden bir yanıt alınamadı.");
    }
}