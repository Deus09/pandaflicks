// js/chat.js
import { fetchMovieDetailsFromApi, TMDB_IMAGE_BASE_URL_W185 } from './api.js';
import { startChatSession } from './gemini.js';
import { showNotification } from './utils.js';

// DOM Elementleri
let chatWithCharacterButton;
let characterSelectionModal, closeCharacterSelectionModalBtn, characterListContainer, characterListLoader;
let chatInterfaceModal, closeChatInterfaceModalBtn, chatHeaderAvatar, chatHeaderName, chatMessagesContainer, chatForm, chatMessageInput, chatSendBtn;

// Durum Değişkenleri (State)
let currentMovie = {
    tmdbId: null,
    title: null,
};
let currentCharacter = null;
let chatHistory = []; // { role: 'user' | 'model', text: '...' }
const CHAT_HISTORY_LIMIT = 10; // Son 10 mesajı tut (5 soru-cevap)

/**
 * Sohbet özelliğini ve olay dinleyicilerini başlatır.
 */
export function initChat() {
    // Ana modal üzerindeki buton
    chatWithCharacterButton = document.getElementById('chat-with-character-button');
    
    // Karakter seçim modalı
    characterSelectionModal = document.getElementById('character-selection-modal');
    closeCharacterSelectionModalBtn = document.getElementById('close-character-selection-modal-btn');
    characterListContainer = document.getElementById('character-list-container');
    characterListLoader = document.getElementById('character-list-loader');

    // Sohbet arayüzü modalı
    chatInterfaceModal = document.getElementById('chat-interface-modal');
    closeChatInterfaceModalBtn = document.getElementById('close-chat-interface-modal-btn');
    chatHeaderAvatar = document.getElementById('chat-header-character-avatar');
    chatHeaderName = document.getElementById('chat-header-character-name');
    chatMessagesContainer = document.getElementById('chat-messages-container');
    chatForm = document.getElementById('chat-form');
    chatMessageInput = document.getElementById('chat-message-input');
    chatSendBtn = document.getElementById('chat-send-btn');

    // Olay Dinleyicileri
    if (chatWithCharacterButton) {
        chatWithCharacterButton.addEventListener('click', handleOpenCharacterSelection);
    }
    if (closeCharacterSelectionModalBtn) {
        closeCharacterSelectionModalBtn.addEventListener('click', () => closeCharacterSelectionModal());
    }
    if(characterSelectionModal) {
        characterSelectionModal.addEventListener('click', (e) => {
            if (e.target === characterSelectionModal) closeCharacterSelectionModal();
        });
    }

    if (closeChatInterfaceModalBtn) {
        closeChatInterfaceModalBtn.addEventListener('click', () => closeChatInterfaceModal());
    }
    if (chatInterfaceModal) {
        chatInterfaceModal.addEventListener('click', (e) => {
            if (e.target === chatInterfaceModal) closeChatInterfaceModal();
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
}

/**
 * Karakter seçim modalını açmak için olay yöneticisi.
 */
function handleOpenCharacterSelection() {
    const tmdbId = document.getElementById('movie-tmdb-id').value;
    const title = document.getElementById('movie-title-input').value;

    if (!tmdbId) {
        showNotification("Sohbet için filmin TMDB verisi gerekli.", "error");
        return;
    }
    
    currentMovie.tmdbId = tmdbId;
    currentMovie.title = title;

    openCharacterSelectionModal();
    loadAndRenderCharacters(tmdbId);
}

/**
 * Karakter seçimi modalını DOM'da görünür hale getirir.
 */
function openCharacterSelectionModal() {
    characterListContainer.innerHTML = ''; // Önceki listeyi temizle
    characterListLoader.style.display = 'flex';
    characterListContainer.appendChild(characterListLoader);
    characterSelectionModal.classList.add('visible');
    document.body.classList.add('no-scroll');
}

/**
 * Karakter seçimi modalını gizler.
 */
function closeCharacterSelectionModal() {
    characterSelectionModal.classList.remove('visible');
    if (!chatInterfaceModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
}

/**
 * API'den karakterleri yükler ve ekranda listeler.
 * @param {string} tmdbId - Filmin TMDB ID'si.
 */
async function loadAndRenderCharacters(tmdbId) {
    try {
        const { cast } = await fetchMovieDetailsFromApi(tmdbId);
        characterListLoader.style.display = 'none';

        if (!cast || cast.length === 0) {
            characterListContainer.innerHTML = '<p class="text-center text-gray-500">Bu film için karakter bilgisi bulunamadı.</p>';
            return;
        }

        cast.forEach(character => {
            const charItem = document.createElement('div');
            charItem.className = 'character-item';
            charItem.innerHTML = `
                <img src="${character.profile_path ? TMDB_IMAGE_BASE_URL_W185 + character.profile_path : 'https://placehold.co/60x60/2A2A2A/AAAAAA?text=?'}" alt="${character.name}" class="character-avatar">
                <div class="character-info">
                    <div class="character-name">${character.character || character.name}</div>
                    <div class="character-actor">${character.name}</div>
                </div>
            `;
            charItem.addEventListener('click', () => handleCharacterSelect(character));
            characterListContainer.appendChild(charItem);
        });

    } catch (error) {
        console.error("Karakterler yüklenirken hata oluştu:", error);
        characterListLoader.style.display = 'none';
        characterListContainer.innerHTML = '<p class="text-center text-red-400">Karakterler yüklenemedi. Lütfen tekrar deneyin.</p>';
    }
}

/**
 * Bir karakter seçildiğinde sohbet arayüzünü başlatır.
 * @param {object} character - Seçilen karakter nesnesi.
 */
function handleCharacterSelect(character) {
    currentCharacter = character;
    closeCharacterSelectionModal();
    openChatInterfaceModal();
}

/**
 * Sohbet arayüzü modalını açar ve hazırlar.
 */
function openChatInterfaceModal() {
    chatHistory = [];
    chatMessagesContainer.innerHTML = '';
    chatMessageInput.value = '';
    
    const characterName = currentCharacter.character || currentCharacter.name;
    chatHeaderName.textContent = characterName;
    chatHeaderAvatar.src = currentCharacter.profile_path ? TMDB_IMAGE_BASE_URL_W185 + currentCharacter.profile_path : 'https://placehold.co/60x60/2A2A2A/AAAAAA?text=?';

    chatInterfaceModal.classList.add('visible');
    document.body.classList.add('no-scroll');

    // İlk AI mesajını ekle
    const welcomeMessage = `Merhaba, ben ${characterName}. Senin için ne yapabilirim?`;
    addMessageToUI('model', welcomeMessage);
}

/**
 * Sohbet arayüzü modalını gizler.
 */
function closeChatInterfaceModal() {
    chatInterfaceModal.classList.remove('visible');
    if (!characterSelectionModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
    currentCharacter = null;
    currentMovie = { tmdbId: null, title: null };
}

/**
 * Kullanıcı mesaj gönderdiğinde tetiklenir.
 * @param {Event} e - Form submit olayı.
 */
async function handleSendMessage(e) {
    e.preventDefault();
    const userMessage = chatMessageInput.value.trim();
    if (!userMessage) return;

    // Kullanıcı mesajını UI'a ve geçmişe ekle
    addMessageToUI('user', userMessage);
    updateChatHistory({ role: 'user', text: userMessage });
    chatMessageInput.value = '';

    // AI düşünme animasyonunu göster
    const thinkingBubble = addMessageToUI('model', '', true);
    chatSendBtn.disabled = true;

    try {
        const aiResponse = await startChatSession(
            currentCharacter.character || currentCharacter.name,
            currentMovie.title,
            chatHistory,
            userMessage // FIXED: Added the missing userMessage argument
        );
        
        // Düşünme animasyonunu gerçek cevapla değiştir
        thinkingBubble.innerHTML = aiResponse;
        thinkingBubble.classList.remove('thinking');
        
        // AI cevabını geçmişe ekle
        updateChatHistory({ role: 'model', text: aiResponse });

    } catch (error) {
        thinkingBubble.innerHTML = `Bir hata oluştu: ${error.message}`;
        thinkingBubble.classList.remove('thinking');
    } finally {
        chatSendBtn.disabled = false;
        chatMessageInput.focus();
    }
}

/**
 * Bir mesajı sohbet arayüzüne ekler.
 * @param {'user' | 'model'} role - Mesajı gönderen (kullanıcı veya yapay zeka).
 * @param {string} text - Mesajın içeriği.
 * @param {boolean} isThinking - Mesajın "düşünüyor" balonu olup olmadığı.
 * @returns {HTMLElement} Oluşturulan mesaj balonu elementi.
 */
function addMessageToUI(role, text, isThinking = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (isThinking) {
        bubble.classList.add('thinking');
        bubble.innerHTML = `<span></span><span></span><span></span>`;
    } else {
        bubble.textContent = text;
    }
    
    messageWrapper.appendChild(bubble);
    chatMessagesContainer.appendChild(messageWrapper);
    
    // Konuşma alanını en alta kaydır
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    return bubble;
}

/**
 * Sohbet geçmişini günceller ve limiti uygular.
 * @param {object} newMessage - Eklenen yeni mesaj.
 */
function updateChatHistory(newMessage) {
    chatHistory.push(newMessage);
    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.splice(0, chatHistory.length - CHAT_HISTORY_LIMIT);
    }
}