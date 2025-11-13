import React, { useState } from "react";
import "./App.css";

export default function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getWeather(e) {
    e.preventDefault();
    setWeather({
      city: "Kathmandu",
      country: "NP",
      description: "Clear Sky",
      temperature: 25,
      humidity: 60,
      windSpeed: 5, 
      
    })
  }

  return (
    <>
      <div className="app-container">
        <h1 className="title">Weather App</h1>
        <form className="search-form" onSubmit={getWeather}>
          <input
            type="text"
            className="input-outline"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button type="submit" className="btn-outline">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="error">{error}</div>
        {weather && (
          <>
            <h2 className="weather-title">
              {weather.city}, {weather.country}
            </h2>
            <p className="weather-description">{weather.description}</p>
            <p className="weather-temperature">{weather.temperature}°C</p>
            <p className="weather-humidity">
              Humidity: {weather.humidity}%
            </p>
            <p className="weather-wind">
              Wind Speed: {weather.windSpeed} m/s
            </p>
          </>
        )}
      </div>
    </>
  );
}
