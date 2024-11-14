const apiKey = '26858a54534d44058528d75c73dfd6a8';
const baseUrl = 'https://api.spoonacular.com/recipes';

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация переменных
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const recipeGrid = document.getElementById("recipeGrid");
    const recipeModal = document.getElementById("recipeModal");
    const favoritesGrid = document.getElementById("favoritesGrid");
    const favoritesButton = document.getElementById("favoritesButton");
    const backButton = document.getElementById("backButton");
    const pageTitle = document.getElementById("pageTitle");
    const suggestionsContainer = document.getElementById("suggestions"); // Инициализация контейнера подсказок


      // Обработчик события ввода для поиска с автоподсказками
searchInput.addEventListener("input", async (e) => {
    const query = e.target.value;
    if (query.length > 2) {
        const recipes = await fetchRecipes(query);
        displayRecipes(recipes);
        displaySuggestions(recipes);
    } else {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
    }
});

     // Hide suggestions when navigating to favorites
     favoritesButton.addEventListener("click", () => {
        displayFavorites();
        backButton.style.display = "inline";
        searchInput.style.display = "none";
        searchButton.style.display = "none";
        favoritesButton.style.display = "none";
        recipeGrid.style.display = "none";
        favoritesGrid.style.display = "grid";
        pageTitle.innerText = "Favorites";
        suggestionsContainer.style.display = "none"; // Hide suggestions
    });

       // Hide suggestions when returning from favorites
    backButton.addEventListener("click", () => {
        recipeGrid.style.display = "grid";
        favoritesGrid.style.display = "none";
        backButton.style.display = "none";
        searchInput.style.display = "inline";
        searchButton.style.display = "inline";
        favoritesButton.style.display = "inline";
        pageTitle.innerText = "Recipe Finder";
        suggestionsContainer.style.display = "none"; // Hide suggestions
    });

  // Function to display suggestions in the dropdown
    function displaySuggestions(recipes) {
        suggestionsContainer.innerHTML = ""; // Clear previous suggestions

        if (recipes.length === 0) {
            suggestionsContainer.innerHTML = "<p>No suggestions available</p>";
            suggestionsContainer.style.display = "block";
            return;
        }

        recipes.forEach(recipe => {
            const suggestionItem = document.createElement("p");
            suggestionItem.addEventListener("click", ()=>{
                displaySingleRecipe(recipe);

            })

            suggestionItem.textContent = recipe.title;
            suggestionItem.addEventListener("click", () => selectSuggestion(recipe));
            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.style.display = "block";
    }



// Hide suggestions when clicking outside the input field
document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-container")) {
        suggestionsContainer.style.display = "none";
    }
});




});
 // Function to select a suggestion and display that single recipe
// Function to select a suggestion and display that single recipe
function selectSuggestion(recipe) {
    searchInput.value = recipe.title;
    suggestionsContainer.style.display = "none";// Hide suggestions after selection
    // Очищаем сетку и показываем только выбранный рецепт
    recipeGrid.innerHTML = `
        <div class="recipe-card" data-id="${recipe.id}">
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <button class="favorite-btn heart-btn ${isRecipeFavorite(recipe.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(event, ${recipe.id}, '${recipe.title}', '${recipe.image}', this)">
                ♥
            </button>
            <button class="info-btn" onclick="showRecipeInfo(${recipe.id})">Инфо</button>
        </div>
    `;
}

    // Function to display a single recipe in the grid
    function displaySingleRecipe(recipe) {
        recipeGrid.innerHTML = `
            <div class="recipe-card" data-id="${recipe.id}">
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <button class="favorite-btn heart-btn ${isRecipeFavorite(recipe.id) ? 'active' : ''}" 
                        onclick="toggleFavorite(event, ${recipe.id}, '${recipe.title}', '${recipe.image}', this)">
                    ♥
                </button>
                <button class="info-btn" onclick="showRecipeInfo(${recipe.id})">Инфо</button>
            </div>
        `;
    }

async function fetchRecipes(query) {
    const url = `${baseUrl}/complexSearch?query=${query}&number=10&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error fetching recipes:", error);
        return [];
    }
}

async function fetchRecipeDetails(id) {
    const url = `${baseUrl}/${id}/information?apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка при получении данных рецепта:", error);
        return null;
    }
}


function displayRecipes(recipes) {
    recipeGrid.innerHTML = recipes.map(recipe => {
        const isFavorite = isRecipeFavorite(recipe.id);
        return `
            <div class="recipe-card" data-id="${recipe.id}">
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <button class="favorite-btn heart-btn ${isFavorite ? 'active' : ''}" 
                        onclick="toggleFavorite(event, ${recipe.id}, '${recipe.title}', '${recipe.image}', this)">
                    ♥
                </button>
               <button class="info-btn" onclick="showRecipeInfo(${recipe.id})">Info</button>

            </div>
        `;
    }).join('');

    // Добавляем обработчик клика на карточку для открытия модального окна
    recipeGrid.querySelectorAll(".recipe-card").forEach(card => {
        card.addEventListener("click", (event) => {
            if (!event.target.classList.contains("heart-btn") && !event.target.classList.contains("info-btn")) {
                openModal(card.dataset.id);
            }
        });
    });
}

function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    // Проверка на пустой список избранного
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = "<p>No favorites added yet.</p>";
        return;
    }

    // Обновляем сетку с избранными рецептами
    favoritesGrid.innerHTML = favorites.map(fav => `
        <div class="recipe-card" data-id="${fav.id}">
            <img src="${fav.image}" alt="${fav.title}">
            <h3>${fav.title}</h3>
            <button class="favorite-btn heart-btn active" 
                    onclick="toggleFavorite(event, ${fav.id}, '${fav.title}', '${fav.image}', this)">
                ♥
            </button>
        </div>
    `).join('');

    // Добавляем обработчик клика на карточку для открытия модального окна
    favoritesGrid.querySelectorAll(".recipe-card").forEach(card => {
        card.addEventListener("click", (event) => {
            if (!event.target.classList.contains("heart-btn")) {
                openModal(card.dataset.id);
            }
        });
    });
}

async function openModal(id) {
    const recipe = await fetchRecipeDetails(id);
    document.getElementById("recipeTitle").innerText = recipe.title;
    document.getElementById("recipeImage").src = recipe.image;
    document.getElementById("recipeDescription").innerHTML = recipe.summary;
    document.getElementById("instructions").innerText = recipe.instructions;

    document.getElementById("ingredientsList").innerHTML = recipe.extendedIngredients.map(ing => `
        <li>${ing.original}</li>
    `).join('');

    document.getElementById("nutritionInfo").innerHTML = `
        <li>Calories: ${recipe.nutrition.nutrients.find(n => n.name === 'Calories').amount} kcal</li>
        <li>Protein: ${recipe.nutrition.nutrients.find(n => n.name === 'Protein').amount} g</li>
    `;

    // Проверка, является ли рецепт избранным
    const isFavorite = isRecipeFavorite(id);
    const modalFavoriteButton = document.getElementById("modalFavoriteButton");

    // Обновляем класс кнопки в зависимости от состояния
    if (isFavorite) {
        modalFavoriteButton.classList.add("active");
    } else {
        modalFavoriteButton.classList.remove("active");
    }

    // Обработчик клика по кнопке "Избранное" в модальном окне
    modalFavoriteButton.onclick = (event) => {
        toggleFavorite(event, id, recipe.title, recipe.image, modalFavoriteButton);
    };

    recipeModal.style.display = "block";
}

document.getElementById("closeModal").addEventListener("click", () => {
    recipeModal.style.display = "none";
});

function toggleFavorite(event, id, title, image, button) {
    event.stopPropagation();

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const index = favorites.findIndex(fav => fav.id === id);

    if (index === -1) {
        favorites.push({ id, title, image });
        localStorage.setItem("favorites", JSON.stringify(favorites));
        button.classList.add("active");
    } else {
        favorites.splice(index, 1);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        button.classList.remove("active");
    }

    console.log('Updated favorites:', favorites);
}

function isRecipeFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    return favorites.some(fav => fav.id === id);
}

async function showRecipeInfo(id) {
    const recipe = await fetchRecipeDetails(id);
    if (!recipe) return;

    // Заполняем информацию в модальном окне
    document.getElementById("recipeTitle").innerText = recipe.title;
    document.getElementById("recipeImage").src = recipe.image;
    document.getElementById("recipeDescription").innerHTML = recipe.summary;
    document.getElementById("instructions").innerText = recipe.instructions;

    document.getElementById("recipeInfo").innerHTML = `
        <p><strong>Время приготовления:</strong> ${recipe.readyInMinutes} минут</p>
        <p><strong>Порции:</strong> ${recipe.servings}</p>
        <ul id="ingredientsList">
            ${recipe.extendedIngredients.map(ing => `<li>${ing.original}</li>`).join('')}
        </ul>
    `;

    // Показываем модальное окно
    recipeModal.style.display = "block";
}

