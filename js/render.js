// js/render.js
import { formatDate } from "./utils.js";
import {
  TMDB_IMAGE_BASE_URL_W185,
  TMDB_IMAGE_BASE_URL_W92,
  TMDB_IMAGE_BASE_URL_W500,
  fetchMovieDetailsFromApi,
} from "./api.js";
import { openMovieMode } from "./modals.js";
import { ALL_BADGES } from "./badges.js";
import { showBadgeInfo } from "./badge-modal.js";
import { getTranslation } from "./i18n.js";

export function createStarsForDisplay(rating) {
  let starsHtml = '<span class="flex items-center">';
  const star_svg_path =
    "M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.921-7.417 3.921 1.481-8.279-6.064-5.828 8.332-1.151z";
  const half_star_gradient_id = "halfStarGradient";
  for (let i = 1; i <= 5; i++) {
    let fillAttribute;
    if (rating >= i) {
      fillAttribute = "var(--accent-secondary)";
    } else if (rating === i - 0.5) {
      fillAttribute = `url(#${half_star_gradient_id})`;
    } else {
      fillAttribute = "#484f58";
    }
    starsHtml += `<svg class="star-display-svg" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="${fillAttribute}"><path d="${star_svg_path}"/></svg>`;
  }
  starsHtml += "</span>";
  return starsHtml;
}

// renderMyMovies fonksiyonunun GÜVENLİ ve YENİ HALİ

export function renderMyMovies(
  listElement,
  movies,
  emptyMessageElement,
  openMovieModeFunction
) {
  // 1. Önce listeyi temizle (Bu yöntem güvenlidir)
  listElement.replaceChildren();

  if (movies.length === 0) {
    emptyMessageElement.style.display = "block";
    return;
  }

  emptyMessageElement.style.display = "none";

  movies.forEach((movie) => {
    // 2. Her bir elementi programatik olarak oluştur
    const movieItem = document.createElement("div");
    movieItem.className = "movie-item";

    const posterImg = document.createElement("img");
    posterImg.className = "movie-poster";
    posterImg.src = movie.poster || "fallback-image.png"; // Başlangıçta geçerli bir src ver
    posterImg.alt = `${movie.title} Poster`;

    // YENİ VE GÜVENLİ YÖNTEM: 'onerror' yerine 'error' event listener'ı ekliyoruz.
    posterImg.addEventListener(
      "error",
      () => {
        // Eğer poster yüklenemezse, güvenli bir yedek görsele geç.
        posterImg.src =
          "https://placehold.co/70x100/2A2A2A/AAAAAA?text=Poster+Yok";
      },
      { once: true }
    ); // Bu olay dinleyicisinin sadece bir kez çalışmasını garantiler.

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "movie-details";

    const titleEl = document.createElement("div");
    titleEl.className = "movie-title";
    titleEl.textContent = movie.title; // GÜVENLİ: .textContent kullanılıyor

    const starsEl = document.createElement("div");
    starsEl.innerHTML = createStarsForDisplay(movie.rating); // Bu fonksiyonun içi güvenli olduğu için innerHTML kullanılabilir

    const dateEl = document.createElement("div");
    dateEl.className = "watched-date";
    dateEl.textContent = formatDate(movie.watchedDate); // GÜVENLİ: .textContent kullanılıyor

    // Önce detayları kendi kapsayıcısına ekle
    detailsDiv.append(titleEl, starsEl, dateEl);

    // Yorum varsa oluştur ve ekle
    if (movie.comment) {
      const commentEl = document.createElement("p");
      commentEl.className = "short-comment";
      commentEl.textContent = movie.comment; // GÜVENLİ: .textContent kullanılıyor

      commentEl.addEventListener("click", (e) => {
        e.stopPropagation();
        commentEl.classList.toggle("expanded");
      });
      detailsDiv.appendChild(commentEl);
    }

    const chevronIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    chevronIcon.setAttribute("fill", "none");
    chevronIcon.setAttribute("viewBox", "0 0 24 24");
    chevronIcon.setAttribute("stroke-width", "2.5");
    chevronIcon.setAttribute("stroke", "currentColor");
    chevronIcon.classList.add(
      "w-5",
      "h-5",
      "text-gray-400",
      "self-center",
      "ml-2"
    );
    chevronIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />`;

    // 3. Oluşturulan tüm elementleri ana kapsayıcıya ekle
    movieItem.append(posterImg, detailsDiv, chevronIcon);

    // 4. Ana kapsayıcıya click olayını ekle
    movieItem.addEventListener("click", () => {
      openMovieModeFunction(movie.id, null, "watched");
    });

    // 5. Son olarak, tam ve güvenli listeyi DOM'a ekle
    listElement.appendChild(movieItem);
  });
}

export function renderWatchLaterMovies(
  listElement,
  movies,
  emptyMessageElement,
  openMovieModeFunction
) {
  listElement.innerHTML = "";
  if (movies.length === 0) {
    emptyMessageElement.style.display = "block";
    return;
  }
  emptyMessageElement.style.display = "none";
  movies.forEach((movie) => {
    const movieItem = document.createElement("div");
    movieItem.classList.add("movie-item");
    movieItem.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title} Poster" class="movie-poster" onerror="this.onerror=null;this.src='https://placehold.co/70x100/2A2A2A/AAAAAA?text=Poster+Yok';">
            <div class="movie-details">
                <div class="movie-title">${movie.title}</div>
                <p class="short-comment">${getTranslation('watch_later_status')}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-gray-400 self-center ml-2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        `;
    movieItem.addEventListener("click", () => {
      openMovieModeFunction(movie.id, null, "watch-later");
    });
    listElement.appendChild(movieItem);
  });
}

export function renderTrendingMovies(trendingMovies, openDetailModalFunction) {
  const trendingMoviesGrid = document.getElementById("trending-movies-grid");
  trendingMoviesGrid.innerHTML = "";
  trendingMovies.forEach((movie) => {
    const trendingItem = document.createElement("div");
    trendingItem.classList.add("trending-item");
    trendingItem.innerHTML = `<img src="${movie.poster_path
      ? TMDB_IMAGE_BASE_URL_W185 + movie.poster_path
      : "https://placehold.co/80x120/2A2A2A/AAAAAA?text=Poster+Yok"
      }" alt="${movie.title
      }" class="trending-poster" onerror="this.onerror=null;this.src='https://placehold.co/80x120/2A2A2A/AAAAAA?text=Poster+Yok';"><div class="trending-title">${movie.title
      }</div>`;
    trendingItem.addEventListener("click", () =>
      openDetailModalFunction(movie.id)
    );
    trendingMoviesGrid.appendChild(trendingItem);
  });
}

export function renderTrendingSkeletons(gridElement) {
  gridElement.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("skeleton-item");
    skeleton.innerHTML = `<div class="skeleton-poster"></div><div class="skeleton-title"></div>`;
    gridElement.appendChild(skeleton);
  }
}

export function displayTmdbSearchResults(results, resultsDiv) {
  resultsDiv.innerHTML = "";
  resultsDiv.classList.remove("hidden");
  results.slice(0, 5).forEach((movie) => {
    const movieResultItem = document.createElement("div");
    movieResultItem.classList.add("tmdb-result-item");
    movieResultItem.innerHTML = `<img src="${movie.poster_path
      ? TMDB_IMAGE_BASE_URL_W92 + movie.poster_path
      : "https://placehold.co/40x60/2A2A2A/AAAAAA?text=Yok"
      }" alt="${movie.title
      }" class="tmdb-result-poster"><div class="tmdb-result-details"><div class="tmdb-result-title">${movie.title
      }</div><div class="tmdb-result-year">${movie.release_date ? movie.release_date.substring(0, 4) : ""
      }</div></div>`;

    movieResultItem.addEventListener("click", async () => {
      const movieTitleInput = document.getElementById("movie-title-input");
      const moviePosterInput = document.getElementById("movie-poster-input");
      const movieDateInput = document.getElementById("movie-date-input");
      const movieRuntimeInput = document.getElementById("movie-runtime-input");
      const movieGenresInput = document.getElementById("movie-genres-input");
      const movieDirectorInput = document.getElementById(
        "movie-director-input"
      );
      const movieTmdbIdInput = document.getElementById("movie-tmdb-id");
      const chatWithCharacterButton = document.getElementById(
        "chat-with-character-button"
      );
      const watchLaterCheckbox = document.getElementById(
        "watch-later-checkbox"
      );
      const tmdbSearchMessage = document.getElementById("tmdb-search-message");

      tmdbSearchMessage.textContent = `'${movie.title}' detayları yükleniyor...`;
      tmdbSearchMessage.style.display = "block";
      resultsDiv.classList.add("hidden");
      try {
        const { movieData, directorName } = await fetchMovieDetailsFromApi(
          movie.id
        );
        movieTitleInput.value = movieData.title;
        moviePosterInput.value = movieData.poster_path
          ? TMDB_IMAGE_BASE_URL_W92 + movieData.poster_path
          : "";
        movieRuntimeInput.value = movieData.runtime || 0;
        movieGenresInput.value = JSON.stringify(movieData.genres || []);
        movieDirectorInput.value = directorName || "Bilinmiyor";
        movieTmdbIdInput.value = movie.id;
        if (!movieDateInput.value)
          movieDateInput.value =
            movieData.release_date || new Date().toISOString().split("T")[0];
        tmdbSearchMessage.style.display = "none";
        movieTitleInput.readOnly = true;

        // DÜZELTME: Film seçildiğinde sohbet butonunu görünür yap
        if (!watchLaterCheckbox.checked) {
          chatWithCharacterButton.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Arama sonucundan detay çekerken hata:", error);
        tmdbSearchMessage.textContent = getTranslation('error_loading_details').replace('{error}', error.message);
      }
    });
    resultsDiv.appendChild(movieResultItem);
  });
}

export function renderProfilePage(stats) {
  const heroElement = document.getElementById("profile-hero");
  const identityBadge = document.getElementById("cinematic-identity-badge");
  const statsPanel = document.getElementById("profile-stats-panel");

  if (!heroElement || !identityBadge || !statsPanel) return;

  if (stats.topRatedMovie && stats.topRatedMovie.poster) {
    const posterPath = stats.topRatedMovie.poster.replace(
      TMDB_IMAGE_BASE_URL_W92,
      ""
    );
    heroElement.style.backgroundImage = `url(${TMDB_IMAGE_BASE_URL_W500}${posterPath})`;
  } else {
    heroElement.style.backgroundImage = "none";
  }
  identityBadge.textContent = stats.cinematicIdentity;
  statsPanel.innerHTML = "";

  if (stats.totalMovies === 0) {
    statsPanel.innerHTML = `<p class="text-gray-400 text-center col-span-full p-4">${getTranslation('profile_empty_message')}</p>`;
    return;
  }

  let finalHTML = "";

  const overviewData = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
      value: stats.totalMovies,
      label: getTranslation('stat_total_movies'),
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
      value: stats.avgRating.toFixed(1),
      label: getTranslation('stat_avg_rating'),
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
      value: stats.totalWatchTime,
      label: getTranslation('stat_total_time'),
    },
  ];
  let overviewHTML = `<div class="stat-group" style="--animation-delay: 0ms;"><div class="overview-grid">`;
  overviewData.forEach((item) => {
    overviewHTML += `<div class="overview-card"><div class="overview-icon">${item.icon}</div><div class="overview-text"><span class="overview-value">${item.value}</span><span class="overview-label">${item.label}</span></div></div>`;
  });
  overviewHTML += `</div></div>`;
  finalHTML += overviewHTML;

  const totalRated = Object.values(stats.ratingDistribution).reduce(
    (sum, count) => sum + count,
    0
  );
  if (totalRated > 0) {
    let ratingsHTML = `<div class="stat-group" style="--animation-delay: 200ms;"><h3 class="stat-group-title">${getTranslation('stat_rating_dist')}</h3><ul class="stat-list">`;
    const sortedRatings = Object.keys(stats.ratingDistribution).sort(
      (a, b) => parseFloat(b) - parseFloat(a)
    );
    sortedRatings.forEach((rating) => {
      const count = stats.ratingDistribution[rating];
      const percentage = (count / totalRated) * 100;
      ratingsHTML += `<li class="rating-bar-container" data-rating="${rating}"><div class="rating-bar-label">${createStarsForDisplay(
        parseFloat(rating)
      )}</div><div class="rating-bar"><div class="rating-bar-fill" style="width: 0%;" data-width="${percentage}%"></div></div><span class="rating-bar-count">${count}</span></li>`;
    });
    ratingsHTML += `</ul></div>`;
    finalHTML += ratingsHTML;
  }

  if (stats.badges) {
    const { all: allBadges, earned: earnedBadges } = stats.badges;
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));
    let badgesHTML = `<div class="stat-group" style="--animation-delay: 300ms;"><div class="badge-group-header"><h3 class="stat-group-title">${getTranslation('stat_badge_collection')}</h3><span class="badge-count">${earnedBadges.length} / ${allBadges.length}</span></div>`;
    if (earnedBadges.length > 0) {
      const latestBadge = earnedBadges[earnedBadges.length - 1];
      badgesHTML += `<div class="badge-showcase" data-badge-id="${latestBadge.id}"><div class="featured-badge"><div class="featured-badge-icon">${latestBadge.icon}</div><span class="featured-badge-name">${getTranslation(latestBadge.name)}</span><span class="featured-badge-label">${getTranslation('stat_latest_badge')}</span></div><div class="other-badges">`;
      earnedBadges
        .slice(-5, -1)
        .reverse()
        .forEach((badge) => {
          badgesHTML += `<div class="badge-icon-preview" title="${getTranslation(badge.name)}" data-badge-id="${badge.id}">${badge.icon}</div>`;
        });
      badgesHTML += `</div></div>`;
    }
    badgesHTML += `<div id="badge-collection-grid" class="badge-collection-grid">`;
    allBadges.forEach((badge) => {
      const isEarned = earnedBadgeIds.has(badge.id);
      badgesHTML += `<div class="badge-card ${isEarned ? "earned" : "locked"
        }" data-badge-id="${badge.id}"><div class="badge-icon">${badge.icon
        }</div><div class="badge-text"><span class="badge-name">${getTranslation(badge.name)}</span>${!isEarned ? `<span class="badge-locked-text">${getTranslation("badge_locked")}</span>` : ""
        }</div></div>`;
    });
    badgesHTML += `</div>`;
    if (allBadges.length > 0) {
      badgesHTML += `<button id="toggle-badges-btn" class="toggle-badges-btn">${getTranslation('stat_view_collection')}</button>`;
    }
    badgesHTML += `</div>`;
    finalHTML += badgesHTML;
  }

  statsPanel.innerHTML = finalHTML;

  const badgeContainer = document.getElementById("profile-stats-panel");
  if (badgeContainer) {
    badgeContainer.addEventListener("click", (e) => {
      const card = e.target.closest(
        ".badge-card, .featured-badge, .badge-icon-preview"
      );
      if (card) {
        const badgeId = card.dataset.badgeId;
        const badgeData = ALL_BADGES.find((b) => b.id === badgeId);
        if (badgeData) showBadgeInfo(badgeData);
      }
    });
  }

  const toggleBtn = document.getElementById("toggle-badges-btn");
  const badgeGrid = document.getElementById("badge-collection-grid");
  if (toggleBtn && badgeGrid) {
    toggleBtn.addEventListener("click", () => {
      badgeGrid.classList.toggle("expanded");
      toggleBtn.textContent = badgeGrid.classList.contains("expanded")
        ? getTranslation('stat_hide_collection')
        : getTranslation('stat_view_collection');
    });
  }

  setTimeout(() => {
    document
      .querySelectorAll(".rating-bar-fill")
      .forEach((bar) => (bar.style.width = bar.dataset.width));
  }, 100);
}

export function renderSpecialLists(container, lists, onListClick) {
  container.innerHTML = `<h2 class="text-xl font-bold mb-4 text-gray-200">${getTranslation('special_lists_title')}</h2>`;
  const listContainer = document.createElement("div");
  listContainer.className = "special-lists-container";

  lists.forEach((list, index) => {
    const listCard = document.createElement("div");
    listCard.className = "list-card-v3"; // Yeni bir sınıf ismi kullanıyoruz
    listCard.style.setProperty("--animation-delay", `${index * 80}ms`);

    const posterUrl =
      list.heroImage ||
      "https://placehold.co/300x450/161b22/8b949e?text=SineLog";

    listCard.innerHTML = `
            <div class="list-card-image-wrapper">
                <div class="list-card-bg-image" style="background-image: url(${posterUrl})"></div>
                
                <img src="${posterUrl}" alt="${list.name}" class="list-card-fg-image" onerror="this.style.display='none'">
            </div>
            <div class="list-card-text-content">
                <div>
                    <h3 class="list-card-title">${getTranslation(list.name)}</h3>
                    <p class="list-card-description">${getTranslation(list.description)}</p>
                </div>
                <div class="list-card-chevron">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            </div>
        `;
    listCard.addEventListener("click", () => onListClick(list));
    listContainer.appendChild(listCard);
  });
  container.appendChild(listContainer);
}

export function renderListDetail(gridElement, movies, openDetailModalFunction) {
  gridElement.innerHTML = "";
  if (movies.length === 0) {
    gridElement.innerHTML = `<p class="text-gray-500 text-center col-span-full">${getTranslation('list_empty_message')}</p>`;
    return;
  }
  movies.forEach((movie) => {
    const trendingItem = document.createElement("div");
    trendingItem.classList.add("trending-item");
    trendingItem.innerHTML = `<img src="${movie.poster_path
      ? TMDB_IMAGE_BASE_URL_W185 + movie.poster_path
      : "https://placehold.co/80x120/2A2A2A/AAAAAA?text=Poster+Yok"
      }" alt="${movie.title
      }" class="trending-poster" onerror="this.onerror=null;this.src='https://placehold.co/80x120/2A2A2A/AAAAAA?text=Poster+Yok';"><div class="trending-title">${movie.title
      }</div>`;
    trendingItem.addEventListener("click", () =>
      openDetailModalFunction(movie.id)
    );
    gridElement.appendChild(trendingItem);
  });
}
