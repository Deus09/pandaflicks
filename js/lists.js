// js/lists.js

// type: 'endpoint' -> Genel bir TMDB API endpoint'i.
// type: 'director' -> Belirli bir yönetmenin filmlerini çeker.
// type: 'collection' -> Resmi bir film serisini çeker.
// type: 'manual' -> Film ID'lerinin manuel olarak girildiği özel liste.
// js/lists.js
const CURATED_LISTS = [
    {
        id: 'top_rated_all_time',
        name: 'list_top_rated_all_time_name',
        description: 'list_top_rated_all_time_desc',
        type: 'endpoint',
        tmdbId: '/movie/top_rated'
    },
    {
        id: 'harry_potter_collection',
        name: 'list_harry_potter_collection_name',
        description: 'list_harry_potter_collection_desc',
        type: 'collection',
        tmdbId: '1241'
    },
    {
        id: 'oscars_2024_winners',
        name: 'list_oscars_2024_winners_name',
        description: 'list_oscars_2024_winners_desc',
        type: 'manual',
        tmdbId: [ 872585, 792307, 915935, 840430, 467244, 363215, 508883 ]
    },
    {
        id: 'christopher_nolan_films',
        name: 'list_christopher_nolan_films_name',
        description: 'list_christopher_nolan_films_desc',
        type: 'director',
        tmdbId: '525',
    },
    {
        id: 'ghibli_magic',
        name: 'list_ghibli_magic_name',
        description: 'list_ghibli_magic_desc',
        type: 'endpoint',
        tmdbId: '/discover/movie?with_companies=10342&sort_by=vote_average.desc',
    },
    {
        id: 'action_packed_adrenaline',
        name: 'list_action_packed_adrenaline_name',
        description: 'list_action_packed_adrenaline_desc',
        type: 'endpoint',
        tmdbId: '/discover/movie?with_genres=28&sort_by=popularity.desc&primary_release_date.gte=2015-01-01'
    },
    {
        id: 'mcu_phase_one',
        name: 'list_mcu_phase_one_name',
        description: 'list_mcu_phase_one_desc',
        type: 'collection',
        tmdbId: '86311'
    },
    {
        id: "quentin_tarantino_films",
        name: "list_quentin_tarantino_films_name",
        description: "list_quentin_tarantino_films_desc",
        type: 'director',
        tmdbId: '138'
    },
    {
        id: "lord_of_the_rings_trilogy",
        name: "list_lord_of_the_rings_trilogy_name",
        description: "list_lord_of_the_rings_trilogy_desc",
        type: 'collection',
        tmdbId: '119'
    },
];

/**
 * Tüm kürate edilmiş listeleri döndürür.
 * @returns {Array<object>} Liste nesnelerinin bir dizisi.
 */
export function getCuratedLists() {
    return CURATED_LISTS;
}