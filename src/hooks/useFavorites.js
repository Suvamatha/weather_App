import { useState, useCallback, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("weather_favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse favorites from localStorage", e);
      }
    }
  }, []);

  const saveFavorite = useCallback((city) => {
    if (!city || typeof city !== "string") return;
    const cleanCity = city.trim();
    if (!cleanCity) return;

    setFavorites((prev) => {
      // Check if it already exists (case-insensitive)
      if (prev.some((item) => item.toLowerCase() === cleanCity.toLowerCase())) {
        return prev;
      }
      const updated = [...prev, cleanCity];
      localStorage.setItem("weather_favorites", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((city) => {
    if (!city || typeof city !== "string") return;
    const cleanCity = city.trim();
    if (!cleanCity) return;

    setFavorites((prev) => {
      const updated = prev.filter(
        (item) => item.toLowerCase() !== cleanCity.toLowerCase()
      );
      localStorage.setItem("weather_favorites", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (city) => {
      if (!city || typeof city !== "string") return false;
      return favorites.some(
        (item) => item.toLowerCase() === city.trim().toLowerCase()
      );
    },
    [favorites]
  );

  return {
    favorites,
    saveFavorite,
    removeFavorite,
    isFavorite,
  };
}
