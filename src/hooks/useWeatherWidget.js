import { useState, useEffect, useCallback } from "react";

export function useWeatherWidget(currentCity, fetchWeatherCallback) {
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState(() => {
    const saved = localStorage.getItem("weather_widget_position");
    return saved ? JSON.parse(saved) : { x: 50, y: 120 };
  });

  const toggleWidgetMode = useCallback(() => {
    setIsWidgetMode((prev) => !prev);
  }, []);

  const saveWidgetPosition = useCallback((position) => {
    setWidgetPosition(position);
    localStorage.setItem("weather_widget_position", JSON.stringify(position));
  }, []);

  // Auto-refresh weather information every 10 minutes if widget mode is active
  useEffect(() => {
    if (!isWidgetMode || !fetchWeatherCallback || !currentCity) return;

    // Refresh every 10 minutes (600,000 ms)
    const intervalId = setInterval(() => {
      console.log(`Auto-refreshing weather for ${currentCity}...`);
      fetchWeatherCallback(currentCity);
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isWidgetMode, fetchWeatherCallback, currentCity]);

  return {
    isWidgetMode,
    setIsWidgetMode,
    toggleWidgetMode,
    widgetPosition,
    saveWidgetPosition,
  };
}
