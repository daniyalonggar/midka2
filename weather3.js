const apiKey = "b4fe33d75cf299d1785228ef54073f8b"; // Your OpenWeatherMap API Key
let unit = "metric"; // Default to Celsius
let debounceTimer;
let currentLocation = null; // Переменная для хранения текущего местоположения

// Function to debounce search input
function debounceSearch() {
    clearTimeout(debounceTimer);
    const city = document.getElementById("search-input").value;
    debounceTimer = setTimeout(() => {
        if (city) {
            getCitySuggestions(city);
        } else {
            document.getElementById("suggestions-list").style.display = "none";
        }
    }, 500); // 500ms debounce time
}

// Function to fetch city suggestions from OpenWeatherMap
async function getCitySuggestions(query) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&units=${unit}&appid=${apiKey}&cnt=50`; // Limiting to 50 results
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log(data);
        // Filter cities that contain the query string anywhere in the name
        const filteredCities = data.list.filter(city => 
            city.name.toLowerCase().includes(query.toLowerCase()) // Use includes() to match anywhere in the city name
        );

        // Show suggestions
        const suggestionsList = document.getElementById("suggestions-list");
        suggestionsList.innerHTML = "";
        filteredCities.forEach(city => {
            const listItem = document.createElement("li");
            listItem.textContent = `${city.name}, ${city.sys.country}`;
            listItem.onclick = () => selectCity(city.name);
            suggestionsList.appendChild(listItem);
        });

        // Show the list if there are suggestions
        suggestionsList.style.display = filteredCities.length > 0 ? "block" : "none";
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
    }
}


// Function to select a city from the suggestions
function selectCity(cityName) {
    document.getElementById("search-input").value = cityName;
    document.getElementById("suggestions-list").style.display = "none";
    getWeatherData(cityName);
}

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

       

        // Сохраняем текущий город
        currentCity = data.name;

        // Обновление информации о погоде
        document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById("temperature").textContent = `${data.main.temp}° ${unit === "metric" ? "C" : "F"}`;
        document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById("wind-speed").textContent = `Wind Speed: ${data.wind.speed} m/s`;
        document.getElementById("weather-condition").textContent = data.weather[0].description;

        // Иконка погоды
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        document.getElementById("weather-icon").innerHTML = `<img src="${iconUrl}" alt="Weather Icon">`;

        // Получение прогноза на 5 дней для города
        getForecastData(city);
    } catch (error) {
        openModal("Error fetching weather data. Please try again later.");
        console.error("Error fetching weather data:", error);
    }
}

// Функция для получения прогноза на 5 дней для текущего местоположения

// Function to fetch a 5-day forecast for a given city
async function getForecastData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod !== "200") { // Если прогноз не найден
            openModal("Could not retrieve 5-day forecast. Please try again.");
            return;
        }

        const forecastContainer = document.getElementById("forecast-container");
        forecastContainer.innerHTML = "";

        for (let i = 0; i < data.list.length; i += 8) { // Каждый 8-й элемент - это прогноз на один день
            const day = data.list[i];
            const date = new Date(day.dt * 1000);
            const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

            const forecastDay = document.createElement("div");
            forecastDay.classList.add("forecast-day");

            forecastDay.innerHTML = `
                <h4>${date.toLocaleDateString()}</h4>
                <img src="${iconUrl}" alt="Weather Icon">
                <p>High: ${day.main.temp_max}°</p>
                <p>Low: ${day.main.temp_min}°</p>
                <p>${day.weather[0].description}</p>
            `;
            forecastContainer.appendChild(forecastDay);
        }
    } catch (error) {
        openModal("Error fetching 5-day forecast. Please try again later.");
        console.error("Error fetching forecast data:", error);
    }
}



function toggleUnits() {
    unit = unit === "metric" ? "imperial" : "metric";
    const button = document.getElementById("unit-toggle");
    button.textContent = unit === "metric" ? "Switch to °F" : "Switch to °C";

    // Если был выбран город, запросим данные для этого города
    if (currentCity) {
        getWeatherData(currentCity);
    } else {
        // Если города нет, запросим погоду по геолокации
        const city = document.getElementById("search-input").value;
        if (city) {
            getWeatherData(city);
        } else {
            getCurrentLocationWeather(); // Если нет города, используем текущие координаты
        }
    }
}


// Функция для получения погоды по текущему местоположению
async function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                // Обновление информации о городе
                document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
                document.getElementById("temperature").textContent = `${data.main.temp}° ${unit === "metric" ? "C" : "F"}`;
                document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
                document.getElementById("wind-speed").textContent = `Wind Speed: ${data.wind.speed} m/s`;
                document.getElementById("weather-condition").textContent = data.weather[0].description;

                // Иконка погоды
                const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
                document.getElementById("weather-icon").innerHTML = `<img src="${iconUrl}" alt="Weather Icon">`;

                // Сохраняем город для использования при переключении единиц
                currentCity = data.name;

                // Получение прогноза на 5 дней для текущего местоположения
                getForecastDataByLocation(lat, lon);
            } catch (error) {
                console.error("Error fetching current location weather:", error);
            }
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Функция для получения данных о погоде по координатам
async function getWeatherDataByLocation(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Обновление текущей погоды
        document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById("temperature").textContent = `${data.main.temp}° ${unit === "metric" ? "C" : "F"}`;
        document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById("wind-speed").textContent = `Wind Speed: ${data.wind.speed} m/s`;
        document.getElementById("weather-condition").textContent = data.weather[0].description;

        // Иконка погоды
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        document.getElementById("weather-icon").innerHTML = `<img src="${iconUrl}" alt="Weather Icon">`;

        // Получение прогноза на 5 дней для текущего местоположения
        getForecastDataByLocation(lat, lon);
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

// Open modal with a message
function openModal(message) {
    document.getElementById("modal-message").textContent = message;
    document.getElementById("modal").style.display = "block";
}

// Close modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

