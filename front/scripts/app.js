const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const feedback = document.getElementById("feedback");
const resultCard = document.getElementById("result-card");

const locationField = document.getElementById("location");
const conditionField = document.getElementById("condition");
const tempField = document.getElementById("temp");
const feelsLikeField = document.getElementById("feels-like");
const humidityField = document.getElementById("humidity");
const weatherIcon = document.getElementById("weather-icon");
const searchButton = document.getElementById("search-btn");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Buscando..." : "Buscar";
}

function showCard(data) {
  locationField.textContent = `${data.city}, ${data.country}`;
  conditionField.textContent = data.description;
  tempField.textContent = `${Math.round(data.temp)}°C`;
  feelsLikeField.textContent = `${Math.round(data.feelsLike)}°C`;
  humidityField.textContent = `${data.humidity}%`;
  weatherIcon.src = data.iconUrl;
  weatherIcon.alt = `Icone: ${data.description}`;

  resultCard.classList.remove("hidden");
}

function hideCard() {
  resultCard.classList.add("hidden");
}

function normalizePayload(payload) {
  if (payload && payload.main && payload.weather) {
    const weather = payload.weather[0] || {};
    return {
      city: payload.name || "Cidade desconhecida",
      country: payload.sys?.country || "--",
      temp: payload.main.temp,
      feelsLike: payload.main.feels_like,
      humidity: payload.main.humidity,
      description: weather.description || "Sem descricao",
      iconUrl: weather.icon
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : ""
    };
  }

  return {
    city: payload.city,
    country: payload.country,
    temp: payload.temp,
    feelsLike: payload.feelsLike,
    humidity: payload.humidity,
    description: payload.description,
    iconUrl: payload.iconUrl
  };
}

async function fetchWeather(city) {
  const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || "Nao foi possivel consultar o clima.");
  }

  return normalizePayload(payload);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    hideCard();
    showFeedback("Digite o nome de uma cidade para buscar.", true);
    cityInput.focus();
    return;
  }

  setLoading(true);
  showFeedback("Consultando clima...");

  try {
    const weatherData = await fetchWeather(city);
    showCard(weatherData);
    showFeedback(`Dados atualizados para ${weatherData.city}.`);
  } catch (error) {
    hideCard();
    showFeedback(error.message || "Erro ao consultar o clima.", true);
  } finally {
    setLoading(false);
  }
});
