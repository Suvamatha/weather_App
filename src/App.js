import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// Import custom hooks
import { useRecentSearches } from "./hooks/useRecentSearches";
import { useFavorites } from "./hooks/useFavorites";
import { useWeatherWidget } from "./hooks/useWeatherWidget";

// Import components
import SnowCanvas from "./components/SnowCanvas";
import MiniWidget from "./components/MiniWidget";

export default function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleAnimated, setTitleAnimated] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSnow, setShowSnow] = useState(false);

  // Search input typing state & debounce
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Hook-based state managers
  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useRecentSearches();

  const {
    favorites,
    saveFavorite,
    removeFavorite,
    isFavorite,
  } = useFavorites();

  // Core API Weather Fetching Logic
  const fetchWeather = useCallback(
    async (cityName) => {
      if (!cityName || !cityName.trim()) {
        setError("Please enter a city!");
        return;
      }

      setLoading(true);
      setError("");

      const apiKey = "4d84d99f6464f76073c3a37c3f29ed07";
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName.trim()
        )}&appid=${apiKey}&units=metric`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod === "404") {
          setError("City not found!");
        } else {
          const weatherData = {
            city: data.name,
            country: data.sys.country,
            description: data.weather[0].description,
            temperature: Math.round(data.main.temp),
            tempMin: Math.round(data.main.temp_min),
            tempMax: Math.round(data.main.temp_max),
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            feelsLike: Math.round(data.main.feels_like),
            pressure: data.main.pressure,
            icon: data.weather[0].icon,
          };
          setWeather(weatherData);
          setCity(""); // Clear search bar after selection

          // Add to recent search history
          addRecentSearch(weatherData.city);
        }
      } catch (err) {
        setError("Something went wrong. Try again!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [addRecentSearch]
  );

  // Wire up Widget Mode logic using custom hook
  const {
    isWidgetMode,
    setIsWidgetMode,
    toggleWidgetMode,
    widgetPosition,
    saveWidgetPosition,
  } = useWeatherWidget(weather?.city, fetchWeather);

  // Initial loading screen timers
  useEffect(() => {
    const timer = setTimeout(() => setShowLoadingScreen(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Title typing animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setTitleAnimated(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Background gradient and snow effect triggers
  useEffect(() => {
    const body = document.body;

    if (isDarkMode) {
      body.style.background = "linear-gradient(135deg, #0f172a, #1e293b)";
      setShowSnow(true);
      return;
    }

    if (weather) {
      const temp = weather.temperature;
      const desc = weather.description.toLowerCase();

      // Show snow only when it's snowing or cold
      setShowSnow(desc.includes("snow") || temp < 0);

      if (temp < 5) {
        body.style.background = "linear-gradient(135deg, #74b9ff, #0984e3)";
      } else if (temp < 25) {
        body.style.background = "linear-gradient(135deg, #ffeaa7, #fab1a0)";
      } else {
        body.style.background = "linear-gradient(135deg, #ff7675, #e17055)";
      }
    } else {
      body.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
      setShowSnow(false);
    }
  }, [weather, isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Return appropriate emoji icon based on conditions
  const getWeatherIcon = useCallback((description, temperature) => {
    const desc = description.toLowerCase();
    if (desc.includes("clear")) return isDarkMode ? "🌙" : "☀️";
    if (desc.includes("cloud")) return "☁️";
    if (desc.includes("rain")) return "🌧️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("thunder")) return "⛈️";
    if (desc.includes("mist") || desc.includes("fog")) return "🌫️";
    if (temperature > 30) return "🔥";
    if (temperature < 5) return "🥶";
    return "🌈";
  }, [isDarkMode]);

  // Handle keyboard inputs in search input
  const handleInputChange = (e) => {
    setCity(e.target.value);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500); // Stop typing state 500ms after user pauses
  };

  // Form submission handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    setShowDropdown(false);
    fetchWeather(city);
  };

  // Click on a historical search chip or item
  const handleSelectRecentSearch = (selectedCity) => {
    setShowDropdown(false);
    fetchWeather(selectedCity);
  };

  // Pin/unpin a city as favorite
  const handleToggleFavorite = () => {
    if (!weather) return;
    if (isFavorite(weather.city)) {
      removeFavorite(weather.city);
    } else {
      saveFavorite(weather.city);
    }
  };

  return (
    <>
      {/* ====== LOADING SCREEN ====== */}
      {showLoadingScreen && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="weather-loader">
              <div className="sun"></div>
              <div className="cloud"></div>
            </div>
            <h1 className="welcome-title">Weather Forecast</h1>
            <p className="loading-subtitle">Loading atmospheric data...</p>
          </div>
        </div>
      )}

      {/* ====== FALLING SNOW (HIGH PERFORMANCE CANVAS) ====== */}
      <SnowCanvas isSnowing={showSnow} isTyping={isTyping} />

      {/* ====== FLOATING WEATHER PARTICLES (STATIC DECORATION) ====== */}
      {!isWidgetMode && (
        <div className="weather-particles">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`particle ${
                weather
                  ? weather.temperature > 25
                    ? "sunny"
                    : weather.description.includes("cloud")
                    ? "cloudy"
                    : "rainy"
                  : "sunny"
              }`}
            ></div>
          ))}
        </div>
      )}

      {/* ====== FLOATING MINI WIDGET ====== */}
      {isWidgetMode && (
        <MiniWidget
          weather={weather}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onCloseWidget={() => setIsWidgetMode(false)}
          onRefresh={fetchWeather}
          widgetPosition={widgetPosition}
          saveWidgetPosition={saveWidgetPosition}
          getWeatherIcon={getWeatherIcon}
        />
      )}

      {/* ====== MAIN APP CONTAINER ====== */}
      <div
        className={`app-container ${showLoadingScreen ? "hidden" : ""} ${
          isDarkMode ? "dark" : ""
        } ${isWidgetMode ? "hidden" : ""}`}
      >
        {/* HEADER */}
        <div className="app-header">
          <h1 className={`title ${titleAnimated ? "no-typing" : ""}`}>
            <span className="title-icon">⛅</span>
            Weather App
          </h1>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={toggleDarkMode} className="mode-toggle">
              <span className="toggle-icon">{isDarkMode ? "☀️" : "🌙"}</span>
            </button>
          </div>
        </div>

        {/* PINNED FAVORITES LIST */}
        {favorites.length > 0 && (
          <div className="favorites-section">
            <p className="favorites-title">⭐ Favorites:</p>
            <div className="favorites-chips">
              {favorites.map((favCity, index) => (
                <button
                  key={index}
                  className="favorite-chip"
                  onClick={() => handleSelectRecentSearch(favCity)}
                >
                  <span className="favorite-star">★</span>
                  {favCity}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH SECTION */}
        <div className="search-section">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="input-outline"
                placeholder="Search for a city..."
                value={city}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
              />
              <span className="search-icon">🔍</span>

              {/* RECENT SEARCHES DROPDOWN */}
              {showDropdown && recentSearches.length > 0 && (
                <div className="recent-searches-dropdown">
                  <div className="recent-searches-header">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      className="clear-history-btn"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur from firing first
                        clearRecentSearches();
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  {recentSearches.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      className="dropdown-item"
                      onMouseDown={() => handleSelectRecentSearch(item)}
                    >
                      <div className="dropdown-item-content">
                        <span>🕒</span>
                        <span>{item}</span>
                      </div>
                      {isFavorite(item) && <span className="favorite-star">★</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className={`btn-outline ${loading ? "loading" : ""}`}
            >
              {loading ? <div className="button-loader"></div> : "Search"}
            </button>
          </form>

          {/* SEARCH HISTORY HORIZONTAL LIST */}
          {recentSearches.length > 0 && (
            <div className="search-history">
              <p className="history-title">Recent searches:</p>
              <div className="history-chips">
                {recentSearches.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    className="history-chip"
                    onClick={() => handleSelectRecentSearch(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* WEATHER CARD */}
        {weather && (
          <div className="weather-card animated-entry">
            <div className="weather-header">
              <div className="location">
                <div className="location-title-wrapper">
                  <h2 className="weather-title">
                    {weather.city}, {weather.country}
                  </h2>
                  <button
                    className="pin-favorite-btn"
                    onClick={handleToggleFavorite}
                    title={
                      isFavorite(weather.city)
                        ? "Remove from Favorites"
                        : "Pin to Favorites"
                    }
                  >
                    <span
                      style={{
                        color: isFavorite(weather.city) ? "#ffb703" : "#aaa",
                      }}
                    >
                      {isFavorite(weather.city) ? "★" : "☆"}
                    </span>
                  </button>
                </div>
                <p className="weather-description">{weather.description}</p>
              </div>
              <div className="weather-icon">
                {getWeatherIcon(weather.description, weather.temperature)}
              </div>
            </div>

            <div className="temperature-section">
              <div className="current-temp">
                <span className="temp-value">{weather.temperature}</span>
                <span className="temp-unit">°C</span>
              </div>
              <p className="feels-like">Feels like {weather.feelsLike}°C</p>
              <p className="feels-like" style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Min: {weather.tempMin}°C | Max: {weather.tempMax}°C
              </p>
            </div>

            <div className="weather-stats">
              <div className="stat-item">
                <span className="stat-icon">💧</span>
                <div className="stat-info">
                  <span className="stat-value">{weather.humidity}%</span>
                  <span className="stat-label">Humidity</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💨</span>
                <div className="stat-info">
                  <span className="stat-value">{weather.windSpeed}m/s</span>
                  <span className="stat-label">Wind</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🌡️</span>
                <div className="stat-info">
                  <span className="stat-value">{weather.pressure}hPa</span>
                  <span className="stat-label">Pressure</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER & WIDGET TOGGLE BUTTON */}
        {!weather && !error && (
          <div className="welcome-message">
            <div className="welcome-icon">🌤️</div>
            <h3>Welcome to Weather App</h3>
            <p>Search for any city to get current weather information</p>
          </div>
        )}

        {/* WIDGET MODE ON/OFF SWITCH */}
        <div className="widget-mode-toggle-wrapper">
          <button
            onClick={toggleWidgetMode}
            className={`widget-toggle-btn ${isWidgetMode ? "active" : ""}`}
            title="Toggle compact widget display"
          >
            🔌 Widget Mode {isWidgetMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </>
  );
}