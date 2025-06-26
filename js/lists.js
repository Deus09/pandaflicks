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
];

export function getCuratedLists() {
    return CURATED_LISTS;
}