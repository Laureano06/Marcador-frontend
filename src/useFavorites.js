import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "marcador:favoritos";

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { teams: [], leagues: [] };
    const parsed = JSON.parse(raw);
    return {
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
      leagues: Array.isArray(parsed.leagues) ? parsed.leagues : [],
    };
  } catch {
    return { teams: [], leagues: [] };
  }
}

// Favoritos de equipos (por id numérico) y ligas (por nombre), guardados
// en localStorage — persisten entre visitas, en ese navegador.
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isTeamFavorite = useCallback(
    (teamId) => favorites.teams.includes(teamId),
    [favorites.teams]
  );

  const isLeagueFavorite = useCallback(
    (leagueName) => favorites.leagues.includes(leagueName),
    [favorites.leagues]
  );

  const toggleTeam = useCallback((teamId) => {
    setFavorites((prev) => {
      const has = prev.teams.includes(teamId);
      return {
        ...prev,
        teams: has
          ? prev.teams.filter((id) => id !== teamId)
          : [...prev.teams, teamId],
      };
    });
  }, []);

  const toggleLeague = useCallback((leagueName) => {
    setFavorites((prev) => {
      const has = prev.leagues.includes(leagueName);
      return {
        ...prev,
        leagues: has
          ? prev.leagues.filter((n) => n !== leagueName)
          : [...prev.leagues, leagueName],
      };
    });
  }, []);

  return { favorites, isTeamFavorite, isLeagueFavorite, toggleTeam, toggleLeague };
}
