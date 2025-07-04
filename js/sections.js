// js/sections.js
import {
  renderMyMovies,
  renderWatchLaterMovies,
  renderTrendingMovies,
  renderTrendingSkeletons,
  renderProfilePage,
  renderSpecialLists,
  renderListDetail,
} from "./render.js";
import { calculateStats } from "./stats.js";
import { fetchTrendingMovies, fetchMoviesFromList } from "./api.js";
// YENİ: Lottie animasyon fonksiyonlarını import ediyoruz
import { openMovieMode, openMovieDetailsModal, showLoadingSpinner, hideLoadingSpinner } from "./modals.js";
import { watchedMovies, watchLaterMovies } from "./storage.js";
import { auth } from "./firebase.js";
import { initFilterModal, openFilterModal, applyFilters } from "./filters.js";
import { getCuratedLists } from "./lists.js";

// --- DOM Elementleri ---
const myWatchedMoviesSection = document.getElementById(
  "my-watched-movies-section"
);
const myMoviesList = document.getElementById("my-movies-list");
const myMoviesEmptyMessage = document.getElementById("my-movies-empty-message");
const sortButton = document.getElementById("sort-button");
const sortOptionsMenu = document.getElementById("sort-options-menu");
const sortOptions = document.querySelectorAll(".sort-option");
const filterButton = document.getElementById("filter-button");
const trendingMoviesSection = document.getElementById(
  "trending-movies-section"
);
const trendingMoviesGrid = document.getElementById("trending-movies-grid");
const trendingErrorMessage = document.getElementById("trending-error-message");
const specialListsSection = document.getElementById("special-lists-section");
const listDetailSection = document.getElementById("list-detail-section");
const listDetailTitle = document.getElementById("list-detail-title");
const listDetailGrid = document.getElementById("list-detail-grid");
const watchLaterMoviesSection = document.getElementById(
  "watch-later-movies-section"
);
const watchLaterMoviesList = document.getElementById("watch-later-movies-list");
const watchLaterEmptyMessage = document.getElementById(
  "watch-later-empty-message"
);
const profileSection = document.getElementById("profile-section");
const profileLoggedInView = document.getElementById("profile-logged-in-view");
const profileLoggedOutView = document.getElementById("profile-logged-out-view");
const addMovieFloatButton = document.getElementById("add-movie-float-button");

const specialListsLoader = document.getElementById("special-lists-loader");
const specialListsContentContainer = document.getElementById(
  "special-lists-content-container"
);

// --- Durum Değişkenleri ---
let currentSortCriteria = "date-desc";
let activeFilters = {};

// --- Fonksiyonlar ---

export function refreshWatchedMoviesList(newFilters) {
  if (myWatchedMoviesSection.classList.contains("hidden")) {
    return;
  }
  if (newFilters !== undefined) activeFilters = newFilters;
  filterButton.classList.toggle(
    "active",
    Object.keys(activeFilters).length > 0
  );
  const filteredMovies = applyFilters(watchedMovies, activeFilters);
  const moviesToSort = [...filteredMovies];
  switch (currentSortCriteria) {
    case "date-desc":
      moviesToSort.sort(
        (a, b) => new Date(b.watchedDate) - new Date(a.watchedDate)
      );
      break;
    case "date-asc":
      moviesToSort.sort(
        (a, b) => new Date(a.watchedDate) - new Date(b.watchedDate)
      );
      break;
    case "rating-desc":
      moviesToSort.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "rating-asc":
      moviesToSort.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      break;
    case "title-asc":
      moviesToSort.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  renderMyMovies(
    myMoviesList,
    moviesToSort,
    myMoviesEmptyMessage,
    openMovieMode
  );
}

export function refreshWatchLaterList() {
  if (watchLaterMoviesSection.classList.contains("hidden")) {
    return;
  }
  renderWatchLaterMovies(
    watchLaterMoviesList,
    watchLaterMovies,
    watchLaterEmptyMessage,
    openMovieMode
  );
}

export function setupListViewControls() {
  if (!sortButton || !sortOptionsMenu || !filterButton) return;
  initFilterModal(refreshWatchedMoviesList);
  sortButton.addEventListener("click", (e) => {
    e.stopPropagation();
    sortOptionsMenu.classList.toggle("hidden");
    sortButton.classList.toggle("open");
  });
  sortOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      sortOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      currentSortCriteria = option.dataset.sort;
      sortButton.querySelector(
        "span"
      ).textContent = `Sırala: ${option.textContent}`;
      sortOptionsMenu.classList.add("hidden");
      sortButton.classList.remove("open");
      refreshWatchedMoviesList();
    });
  });
  filterButton.addEventListener("click", () => {
    openFilterModal(watchedMovies, activeFilters);
  });
  document.addEventListener("click", (e) => {
    if (
      !sortButton.contains(e.target) &&
      !sortOptionsMenu.classList.contains("hidden")
    ) {
      sortOptionsMenu.classList.add("hidden");
      sortButton.classList.remove("open");
    }
  });
}

export function updateProfileView(user) {
  if (user && !user.isAnonymous) {
    profileLoggedOutView.classList.add("hidden");
    profileLoggedInView.classList.remove("hidden");
    document.getElementById("profile-name").textContent =
      user.email.split("@")[0];
    document.getElementById("profile-email").textContent = user.email;
    const stats = calculateStats(watchedMovies);
    renderProfilePage(stats);
  } else {
    profileLoggedInView.classList.add("hidden");
    profileLoggedOutView.classList.remove("hidden");
  }
}

async function showListDetail(list) {
  document
    .querySelectorAll(".content-section")
    .forEach((s) => s.classList.add("hidden"));
  listDetailSection.classList.remove("hidden");
  listDetailTitle.textContent = "Yükleniyor...";
  showLoadingSpinner("Liste detayları getiriliyor...");
  try {
      const movies = await fetchMoviesFromList(list);
      listDetailTitle.textContent = list.name;
      renderListDetail(listDetailGrid, movies, openMovieDetailsModal);
  } catch(error) {
      listDetailTitle.textContent = "Hata";
      listDetailGrid.innerHTML = `<p class="text-red-400 text-center col-span-full">Liste yüklenemedi.</p>`;
  } finally {
      hideLoadingSpinner();
  }
}

export async function showSection(sectionId) {
  const sections = [
    trendingMoviesSection,
    myWatchedMoviesSection,
    watchLaterMoviesSection,
    profileSection,
    specialListsSection,
    listDetailSection,
  ];
  const navItems = document.querySelectorAll(".nav-item");
  sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });
  navItems.forEach((item) => {
    let expectedNavItemId = "";
    if (sectionId === "my-watched-movies-section")
      expectedNavItemId = "nav-my-log";
    else if (sectionId === "trending-movies-section")
      expectedNavItemId = "nav-trending";
    else if (sectionId === "special-lists-section")
      expectedNavItemId = "nav-lists";
    else if (sectionId === "watch-later-movies-section")
      expectedNavItemId = "nav-watch-later";
    else if (sectionId === "profile-section") expectedNavItemId = "nav-profile";
    item.classList.toggle("active", item.id === expectedNavItemId);
  });

  if (sectionId === 'my-watched-movies-section' || sectionId === 'watch-later-movies-section') {
    addMovieFloatButton.style.display = 'flex';
  } else {
    addMovieFloatButton.style.display = 'none';
  }

  trendingErrorMessage.style.display = 'none';

  if (sectionId === "my-watched-movies-section") {
    refreshWatchedMoviesList();
  } else if (sectionId === "trending-movies-section") {
    // GÜNCELLEME: 'Popüler' sekmesi için yeni Lottie animasyonlu yükleme mantığı
    showLoadingSpinner();
    trendingMoviesGrid.innerHTML = ''; 

    const timerPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    const dataFetchPromise = fetchTrendingMovies();

    try {
        const [_, movies] = await Promise.all([timerPromise, dataFetchPromise]);
        if (movies.length === 0) {
            trendingErrorMessage.textContent = 'Popüler film bulunamadı.';
            trendingErrorMessage.style.display = 'block';
        } else {
            renderTrendingMovies(movies, openMovieDetailsModal);
        }
    } catch (error) {
        trendingErrorMessage.textContent = `Bir hata oluştu: ${error.message}`;
        trendingErrorMessage.style.display = 'block';
    } finally {
        hideLoadingSpinner();
    }

  } else if (sectionId === "special-lists-section") {
    // --- YENİ KOD ---
    // Genel yükleme animasyonunu metinsiz çağırarak rastgele metin gelmesini sağlıyoruz.
    showLoadingSpinner(); 
    specialListsContentContainer.innerHTML = "";
    specialListsContentContainer.classList.add("hidden");
    
    const timerPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    const dataFetchPromise = (async () => {
      const lists = getCuratedLists();
      const listPromises = lists.map((list) => fetchMoviesFromList(list));
      const moviesPerList = await Promise.all(listPromises);
      return lists.map((list, index) => {
        const firstMovieWithPoster = moviesPerList[index].find(
          (m) => m.poster_path
        );
        return {
          ...list,
          heroImage: firstMovieWithPoster
            ? `https://image.tmdb.org/t/p/w500${firstMovieWithPoster.poster_path}`
            : null,
        };
      });
    })();

    const [_, listsWithImages] = await Promise.all([
      timerPromise,
      dataFetchPromise,
    ]);

    // --- YENİ KOD ---
    // Veri yüklendikten sonra genel yükleme animasyonunu gizliyoruz.
    hideLoadingSpinner(); 
    specialListsContentContainer.classList.remove("hidden");
    renderSpecialLists(
      specialListsContentContainer,
      listsWithImages,
      showListDetail
    );
  } else if (sectionId === "watch-later-movies-section") {
    renderWatchLaterMovies(
      watchLaterMoviesList,
      watchLaterMovies,
      watchLaterEmptyMessage,
      openMovieMode
    );
  } else if (sectionId === "profile-section") {
    updateProfileView(auth.currentUser);
  }
}

document.getElementById("back-to-lists-btn").addEventListener("click", () => {
  showSection("special-lists-section");
});