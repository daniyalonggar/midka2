const apiKey = 'a0e92554e6d570f3060db29acab45744';
const baseUrl = 'https://api.themoviedb.org/3';
const imageUrl = 'https://image.tmdb.org/t/p/w500';

async function fetchMovies(url) {
    const response = await fetch(url);
    const data = await response.json();
    displayMovies(data.results);
}

async function searchMovies() {
    const query = document.getElementById('search-input').value;
    if (query.length > 2) {
        const response = await fetch(`${baseUrl}/search/movie?api_key=${apiKey}&query=${query}`);
        const data = await response.json();
        
        // Call function to display suggestions
        displaySuggestions(data.results);
    } else {
        document.getElementById('suggestions-container').innerHTML = '';
    }
}

function displaySuggestions(movies) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';  // Clear previous suggestions
    
    if (movies.length > 0) {
        movies.forEach(movie => {
            const suggestion = document.createElement('div');
            suggestion.classList.add('suggestion');
            suggestion.textContent = movie.title;
            suggestion.onclick = () => selectSuggestion(movie);
            suggestionsContainer.appendChild(suggestion);
        });
    } else {
        suggestionsContainer.innerHTML = '<div>No movies found.</div>';
    }
}

function selectSuggestion(movie) {
    // Fill the search input with the selected movie title
    document.getElementById('search-input').value = movie.title;
    
    // Hide the suggestions container
    document.getElementById('suggestions-container').innerHTML = '';
    
    // Fetch and display movie details
    showMovieDetails(movie.id);
}
document.addEventListener('click', function(event) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    const searchInput = document.getElementById('search-input');
    if (!suggestionsContainer.contains(event.target) && event.target !== searchInput) {
        suggestionsContainer.innerHTML = '';
    }
});


// Загрузка главной страницы
function loadMainPage() {
    document.getElementById('genre-container').style.display = 'flex';
    document.getElementById('sort-buttons').style.display = 'block';
    document.getElementById('movies-grid').style.display = 'grid';
    fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}`);
}

function loadWatchLaterPage() {
    document.getElementById('main-page-container').style.display = 'none';
    document.getElementById('watchlater-container').style.display = 'block';
    displayWatchLaterMovies();
}
// Фильтры по жанрам
function loadMoviesByGenre(genre) {
    document.getElementById('genre-container').style.display = 'none';
    fetchMovies(`${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genre}`);
}
// Сортировка фильмов
function sortMovies(sortBy) {
    document.getElementById('genre-container').style.display = 'none';
    fetchMovies(`${baseUrl}/discover/movie?api_key=${apiKey}&sort_by=${sortBy}.desc`);
}

// Отображение фильмов на главной странице
function displayMovies(movies) {
    const moviesGrid = document.getElementById('movies-grid');
    moviesGrid.innerHTML = '';
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        // Check if the movie is already in the watchlist
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.some(m => m.id === movie.id);

        movieCard.innerHTML = `
            <img src="${imageUrl + movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p>Release Date: ${movie.release_date}</p>
            <button onclick="showMovieDetails(${movie.id})" class="details-btn">View Info</button>
            <button
                data-title="${movie.title}"
                data-poster-path="${movie.poster_path}"
                onclick="${isInWatchlist ? `removeFromWatchlist(${movie.id}, this)` : `addToWatchlist(${movie.id}, '${movie.title}', '${movie.poster_path}', this)`}"
                class="${isInWatchlist ? 'remove-btn' : 'add-btn'}">
                ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
        `;
        moviesGrid.appendChild(movieCard);
    });
}


async function showMovieDetails(movieId) {
    const response = await fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,videos,reviews`);
    const movie = await response.json();
    
    const modalContent = document.getElementById('movie-details');
    modalContent.innerHTML = `
        <h2>${movie.title}</h2>
        <p><strong>Overview:</strong> ${movie.overview}</p>
        <p><strong>Rating:</strong> ${movie.vote_average}</p>
        <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
        <p><strong>Genres:</strong> ${movie.genres.map(genre => genre.name).join(', ')}</p>
        
        <h3>Cast:</h3>
        <ul>
            ${movie.credits.cast.slice(0, 5).map(actor => `<li>${actor.name}</li>`).join('')}
        </ul>

        <h3>Directors:</h3>
        <ul>
            ${movie.credits.crew.filter(member => member.job === 'Director').map(director => `<li>${director.name}</li>`).join('')}
        </ul>

        <h3>User Reviews:</h3>
        <ul>
            ${movie.reviews.results.slice(0, 3).map(review => `
                <li>
                    <p><strong>${review.author}</strong>: ${review.content}</p>
                </li>
            `).join('')}
        </ul>

        <h3>Trailer:</h3>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${movie.videos.results[0]?.key}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

        <button onclick="closeModal()" class="close-btn">Close</button>
    `;
    
    document.getElementById('movie-details-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('movie-details-modal').style.display = 'none';
}

function addToWatchlist(movieId, title, posterPath, button) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

    // Check if the movie is already in the watchlist
    const movieExists = watchlist.some(movie => movie.id === movieId);
    
    if (!movieExists) {
        // Add movie to the watchlist
        watchlist.push({ id: movieId, title, poster_path: posterPath });
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`${title} added to Watchlist!`);

    } else {
        alert(`${title} is already in your Watchlist.`);
    }
}

// Function to render movies and their buttons on the main page
function renderMovies(movies) {
    const moviesGrid = document.getElementById('movies-grid');
    moviesGrid.innerHTML = ''; // Clear the grid before rendering

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        movieCard.innerHTML = `
            <img src="${movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <button 
                class="add-to-watchlist-btn" 
                onclick="addToWatchlist(${movie.id}, '${movie.title}', '${movie.poster_path}', this)"
                data-title="${movie.title}"
                data-poster="${movie.poster_path}"
            >
                Add to Watchlist
            </button>
        `;

        // Append movie card to grid
        moviesGrid.appendChild(movieCard);
    });
}

// Function to load and render movies (for example, based on a genre or search result)
function loadMovies(movies) {
    renderMovies(movies);
}



function displayWatchLaterMovies() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const watchLaterGrid = document.getElementById('watchlater-grid');
    watchLaterGrid.innerHTML = ''; // Clear the grid
    watchlist.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img src="${imageUrl + movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <button onclick="showMovieDetails(${movie.id})" class="details-btn">View Info</button>
            <button onclick="removeFromWatchlist(${movie.id})" class="remove-btn">Remove</button>
        `;
        watchLaterGrid.appendChild(movieCard);
    });
}

function removeFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(movie => movie.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayWatchLaterMovies();
}


// Загрузить страницу "Watch Later"
function loadWatchLater() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const watchLaterGrid = document.getElementById('watchlater-grid');
    watchLaterGrid.innerHTML = '';
    watchlist.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <h3>${movie.title}</h3>
        `;
        watchLaterGrid.appendChild(movieCard);
    });
}

document.addEventListener('DOMContentLoaded', loadMainPage);

// Функция для переключения видимости жанров
document.getElementById('burger-menu').addEventListener('click', function () {
    const genreList = document.getElementById('genre-list');
    genreList.style.display = genreList.style.display === 'flex' ? 'none' : 'flex';
});

// Функция для возврата на главный экран
function showMainPage() {
    document.getElementById('main-page-container').style.display = 'flex';
    document.getElementById('watchlater-container').style.display = 'none';
}

// Предполагаем, что эта функция уже существует для перехода в watchlater
function showWatchLater() {
    document.getElementById('main-page-container').style.display = 'none';
    document.getElementById('watchlater-container').style.display = 'flex';
}
