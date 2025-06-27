// js/lists.js

// type: 'endpoint' -> Genel bir TMDB API endpoint'i.
// type: 'director' -> Belirli bir yönetmenin filmlerini çeker.
// type: 'collection' -> Resmi bir film serisini çeker.
// type: 'manual' -> Film ID'lerinin manuel olarak girildiği özel liste.
const CURATED_LISTS = [
    {
        id: 'top_rated_all_time',
        name: 'Tüm Zamanların En İyileri',
        description: 'Sinema tarihinin en yüksek puanlı, unutulmaz başyapıtları.',
        type: 'endpoint',
        tmdbId: '/movie/top_rated'
    },
    {
        id: 'harry_potter_collection',
        name: 'Harry Potter Serisi',
        description: 'Büyücülük dünyasının kapılarını aralayan bu efsanevi serinin tüm filmleri bir arada.',
        type: 'collection',
        tmdbId: '1241'
    },
    {
        id: 'oscars_2024_winners',
        name: '2024 Oscar Ödülleri',
        description: 'Geçtiğimiz yıla damgasını vuran ve Akademi tarafından onurlandırılan filmler.',
        type: 'manual',
        tmdbId: [
            872585, // Oppenheimer
            792307, // Poor Things
            915935, // Anatomy of a Fall
            840430, // The Holdovers
            467244, // The Zone of Interest
            363215, // American Fiction
            508883, // The Boy and the Heron
        ]
    },
    {
        id: 'christopher_nolan_films',
        name: 'Christopher Nolan Filmografisi',
        description: 'Zihin büken senaryoların ve görsel şölenlerin usta yönetmeninin kariyerine bir bakış.',
        type: 'director',
        tmdbId: '525',
    },
    {
        id: 'ghibli_magic',
        name: 'Ghibli Stüdyosu Büyüsü',
        description: 'Hayao Miyazaki ve Isao Takahata\'nın eşsiz dünyasından animasyon harikaları.',
        type: 'endpoint',
        tmdbId: '/discover/movie?with_companies=10342&sort_by=vote_average.desc', // Studio Ghibli filmleri
    },
    {
        id: 'action_packed_adrenaline',
        name: 'Aksiyon Dolu Adrenalin',
        description: 'Nefes kesen sahneleriyle akıllarda yer etmiş modern aksiyon filmleri.',
        type: 'endpoint',
        tmdbId: '/discover/movie?with_genres=28&sort_by=popularity.desc&primary_release_date.gte=2015-01-01' // 2015 sonrası popüler aksiyonlar
    },
    {
        id: 'mcu_phase_one',
        name: 'Marvel: Faz 1',
        description: 'Her şeyin başladığı yer: Marvel Sinematik Evreni\'nin ilk süper kahraman filmleri.',
        type: 'collection',
        tmdbId: '86311' // Marvel Cinematic Universe: Phase One Collection ID'si
    },
    {
        name: "Quentin Tarantino Sineması",
        description: "Diyalogların ve stilin ustası Tarantino'nun filmografisine dalın.",
        type: 'director',
        tmdbId: '138' // Quentin Tarantino'nun yönetmen ID'si
    },
    {
        name: "90'ların Kült Filmleri",
        description: "Bir nesle damgasını vuran, zamanının ötesindeki unutulmaz filmler.",
        type: 'list',
        tmdbId: '8292275' // 90'lar Kült Klasikleri listesi
    },
    {
        name: "21. Yüzyılın En İyileri (BBC)",
        description: "Dünyanın dört bir yanından eleştirmenlerin seçtiği modern başyapıtlar.",
        type: 'list',
        tmdbId: '8221516' // BBC'nin 21. Yüzyılın En İyi 100 Filmi listesi
    },
    {
        name: "Akıl Oyunları ve Sürpriz Sonlar",
        description: "Finaliyle sizi koltuğunuza çivileyecek, zekanızı zorlayan filmler.",
        type: 'list',
        tmdbId: '7066929' // Mind-Bending & Twist-Ending filmler listesi
    },

    // --- SİNEMA TARİHİNDEN ALTIN SEÇKİLER ---
    {
        name: "Film Noir'ın Karanlık Sokakları",
        description: "Kara filmin gölgelerle dolu, gizemli ve tehlikeli dünyası.",
        type: 'list',
        tmdbId: '1267' // En İyi Film Noir'lar listesi
    },
    {
        name: "Hollywood'un Altın Çağı",
        description: "Sinemanın büyüsünü yaratan 1930'lar ve 40'ların unutulmaz klasikleri.",
        type: 'list',
        tmdbId: '8284583' // Hollywood'un Altın Çağı listesi
    },
    {
        name: "70'ler Sineması: Yeni Hollywood",
        description: "Kuralları yıkan yönetmenlerin ve anti-kahramanların yükseldiği cesur dönem.",
        type: 'list',
        tmdbId: '8244131' // New Hollywood (1967-1979) filmleri listesi
    },
    {
        name: "Sessiz Sinemanın Büyüsü",
        description: "Sözsüz anlatımın gücünü kanıtlayan, sinemanın temellerindeki eserler.",
        type: 'list',
        tmdbId: '8293433' // Sessiz Dönem Başyapıtları listesi
    },

    // --- DÜNYA SİNEMASINDAN İNCİLER ---
    {
        name: "Fransız Yeni Dalgası",
        description: "Sinemada devrim yaratan, özgür ve entelektüel bir akımın öncü filmleri.",
        type: 'list',
        tmdbId: '8281313' // Fransız Yeni Dalgası filmleri listesi
    },
    {
        name: "Uzak Doğu Sinemasının En İyileri",
        description: "Asya'dan çıkan, görsel ve anlatımsal olarak büyüleyici filmler.",
        type: 'list',
        tmdbId: '9373' // En İyi Asya Filmleri listesi
    },
    
    // --- ANİMASYON VE BİLİM KURGU KLASİKLERİ ---
    {
        name: "Pixar Stüdyoları Koleksiyonu",
        description: "Animasyon dünyasını değiştiren, kalplere dokunan Pixar maceraları.",
        type: 'collection',
        tmdbId: '10634' // Pixar Koleksiyonu
    },
    {
        name: "Distopik Bilim Kurgu Başyapıtları",
        description: "Karanlık gelecek tasvirleriyle günümüzü sorgulatan ikonik filmler.",
        type: 'list',
        tmdbId: '8210360' // Distopik Filmler listesi
    }

];

/**
 * Tüm kürate edilmiş listeleri döndürür.
 * @returns {Array<object>} Liste nesnelerinin bir dizisi.
 */

export function getCuratedLists() {
    return CURATED_LISTS;
}