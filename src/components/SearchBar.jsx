import { useState, useEffect, useRef, useCallback } from "react";
import { search } from "../api";

const DEBOUNCE_MS = 450; // esperamos a que el usuario deje de tipear antes
                          // de gastar una búsqueda contra la API externa

export default function SearchBar({ onSelectTeam }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // { teams, leagues } | null
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    setStatus("loading");
    try {
      const data = await search(q);
      if (!data) {
        setResults(null);
        setStatus("idle");
        return;
      }
      setResults(data);
      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults(null);
      setStatus("idle");
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  };

  // Cerrar el dropdown al hacer click afuera.
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTeam = (team) => {
    onSelectTeam(team.id);
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  const hasResults =
    results && (results.teams.length > 0 || results.leagues.length > 0);

  return (
    <div className="search-box" ref={boxRef}>
      <input
        className="search-input"
        type="text"
        placeholder="Buscar equipo o liga…"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
      />

      {open && query.trim().length >= 3 && (
        <div className="search-dropdown">
          {status === "loading" && (
            <div className="search-msg">Buscando…</div>
          )}
          {status === "error" && (
            <div className="search-msg">No se pudo buscar. Probá de nuevo.</div>
          )}
          {status === "ok" && !hasResults && (
            <div className="search-msg">Sin resultados para "{query}"</div>
          )}

          {status === "ok" && results.teams.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Equipos</div>
              {results.teams.map((team) => (
                <button
                  key={team.id}
                  className="search-result"
                  onClick={() => handleSelectTeam(team)}
                >
                  {team.crest && <img src={team.crest} alt="" />}
                  <span>{team.name}</span>
                  <span className="search-result-country">{team.country}</span>
                </button>
              ))}
            </div>
          )}

          {status === "ok" && results.leagues.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Ligas</div>
              {results.leagues.map((league) => (
                <div key={league.id} className="search-result search-result-static">
                  {league.logo && <img src={league.logo} alt="" />}
                  <span>{league.name}</span>
                  <span className="search-result-country">{league.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
