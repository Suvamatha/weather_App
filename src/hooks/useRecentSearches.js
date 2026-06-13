import { useState, useCallback, useEffect } from "react";

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("weather_recent_searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches from localStorage", e);
      }
    }
  }, []);

  const addRecentSearch = useCallback((city) => {
    if (!city || typeof city !== "string") return;
    const cleanCity = city.trim();
    if (!cleanCity) return;

    setRecentSearches((prev) => {
      // Remove any existing instance of this city (case-insensitive check)
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== cleanCity.toLowerCase()
      );
      // Put new search at the top, limit to 10
      const updated = [cleanCity, ...filtered].slice(0, 10);
      localStorage.setItem("weather_recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getRecentSearches = useCallback(() => {
    return recentSearches;
  }, [recentSearches]);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem("weather_recent_searches");
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    getRecentSearches,
    clearRecentSearches,
  };
}
