import React, { useState, useEffect } from "react";
import "./App.css";

export default function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleAnimated, setTitleAnimated] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSnow, setShowSnow] = useState(false);

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => setShowLoadingScreen(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Title typing cleanup
  useEffect(() => {
    const timer = setTimeout(() => setTitleAnimated(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Background gradient and snow based on weather
  useEffect(() => {
    updateBackgroundAndEffects();
  }, [weather, isDarkMode]);

  const updateBackgroundAndEffects = () => {
    const body = document.body;
    
    if (isDarkMode) {
      body.style.background = 'linear-gradient(135deg, #0f172a, #1e293b)';
      setShowSnow(true);
      return;
    }

    if (weather) {
      const temp = weather.temperature;
      const desc = weather.description.toLowerCase();
      
      // Show snow only when it's actually snowing or very cold
      setShowSnow(desc.includes('snow') || temp < 0);
      
      if (temp < 5) {
        body.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
      } else if (temp < 25) {
        body.style.background = 'linear-gradient(135deg, #ffeaa7, #fab1a0)';
      } else {
        body.style.background = 'linear-gradient(135deg, #ff7675, #e17055)';
      }
    } else {
      body.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
      setShowSnow(false);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const getWeatherIcon = (description, temperature) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return isDarkMode ? '🌙' : '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('thunder')) return '⛈️';
    if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
    if (temperature > 30) return '🔥';
    if (temperature < 5) return '🥶';
    return '🌈';
  };

  async function getWeather(e) {
    e.preventDefault();
    if (!city.trim()) {
      setError("Please enter a city!");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    const apiKey = "4d84d99f6464f76073c3a37c3f29ed07";

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
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
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          feelsLike: Math.round(data.main.feels_like),
          pressure: data.main.pressure,
          icon: data.weather[0].icon
        };
        setWeather(weatherData);
        
        // Add to search history
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item.city !== weatherData.city);
          return [weatherData, ...filtered.slice(0, 4)];
        });
      }
    } catch (err) {
      setError("Something went wrong. Try again!");
    }

    setLoading(false);
  }

  const searchFromHistory = (cityName) => {
    setCity(cityName);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      getWeather(fakeEvent);
    }, 100);
  };

  // Generate snowflakes
  const generateSnowflakes = () => {
    const snowflakes = [];
    for (let i = 0; i < 50; i++) {
      const size = Math.random() > 0.7 ? 'large' : Math.random() > 0.4 ? 'medium' : 'small';
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      snowflakes.push(
        <div
          key={i}
          className={`snowflake ${size}`}
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return snowflakes;
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

      {/* ====== FALLING SNOW ====== */}
      {showSnow && (
        <div className="snow-container">
          {generateSnowflakes()}
        </div>
      )}

      {/* ====== WEATHER PARTICLES ====== */}
      <div className="weather-particles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`particle ${weather ? 
            weather.temperature > 25 ? 'sunny' : 
            weather.description.includes('cloud') ? 'cloudy' : 'rainy' 
            : 'sunny'}`}></div>
        ))}
      </div>

      {/* ====== MAIN APP ====== */}
      <div className={`app-container ${showLoadingScreen ? "hidden" : ""} ${isDarkMode ? "dark" : ""}`}>
        
        {/* HEADER */}
        <div className="app-header">
          <h1 className={`title ${titleAnimated ? "no-typing" : ""}`}>
            <span className="title-icon">⛅</span>
            Weather App
          </h1>
          
          <button onClick={toggleDarkMode} className="mode-toggle">
            <span className="toggle-icon">
              {isDarkMode ? "☀️" : "🌙"}
            </span>
          </button>
        </div>

        {/* SEARCH SECTION */}
        <div className="search-section">
          <form className="search-form" onSubmit={getWeather}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="input-outline"
                placeholder="Search for a city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            <button type="submit" className={`btn-outline ${loading ? "loading" : ""}`}>
              {loading ? (
                <div className="button-loader"></div>
              ) : (
                "Search"
              )}
            </button>
          </form>

          {/* SEARCH HISTORY */}
          {searchHistory.length > 0 && (
            <div className="search-history">
              <p className="history-title">Recent searches:</p>
              <div className="history-chips">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className="history-chip"
                    onClick={() => searchFromHistory(item.city)}
                  >
                    {item.city}
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
                <h2 className="weather-title">
                  {weather.city}, {weather.country}
                </h2>
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
              <p className="feels-like">
                Feels like {weather.feelsLike}°C
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

        {/* FOOTER */}
        {!weather && !error && (
          <div className="welcome-message">
            <div className="welcome-icon">🌤️</div>
            <h3>Welcome to Weather App</h3>
            <p>Search for any city to get current weather information</p>
          </div>
        )}
      </div>
    </>
  );
}