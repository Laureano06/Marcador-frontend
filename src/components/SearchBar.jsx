import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { search } from "../api";
import { DURATION, EASE_OUT } from "../motion";

const DEBOUNCE_MS = 450; // esperamos a que el usuario deje de tipear antes
                          // de gastar una búsqueda contra la API externa

export default function SearchBar({ onSelectTeam }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // { teams, leagues } | null
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [open, setOpen] = useState(false);
  // -1 = nada resaltado. Solo los equipos son seleccionables (las ligas
  // son texto estático), así que el índice recorre results.teams.
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);
  const listboxId = "search-listbox";

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
      setHighlighted(-1);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    setHighlighted(-1);
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
    setHighlighted(-1);
  };

  const teams = results?.teams || [];

  // Navegación por teclado: flechas mueven el resaltado entre equipos
  // (las ligas son texto estático, no se navegan), Enter selecciona,
  // Escape cierra. Sin esto, un usuario de lector de pantalla no tenía
  // forma de recorrer los resultados más que Tab secuencial, y no había
  // ninguna señal de que algo hubiera aparecido al escribir.
  const handleKeyDown = (e) => {
    if (!open || teams.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % teams.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? teams.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelectTeam(teams[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasResults =
    results && (results.teams.length > 0 || results.leagues.length > 0);

  // Antes el dropdown no aparecía en absoluto por debajo de 3 caracteres
  // — para alguien tipeando lento, eso lee como que la búsqueda está
  // rota, no como "todavía no llegaste al mínimo".
  const isShort = query.trim().length > 0 && query.trim().length < 3;
  const isOpen = open && (isShort || query.trim().length >= 3);

  return (
    <div className="search-box" ref={boxRef}>
      <label htmlFor="search-input" className="sr-only">
        Buscar equipo o liga
      </label>
      <input
        id="search-input"
        className="search-input"
        type="text"
        placeholder="Buscar equipo o liga…"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          highlighted >= 0 ? `search-option-${highlighted}` : undefined
        }
        autoComplete="off"
      />

      {/* Región viva, oculta visualmente: anuncia a lectores de pantalla
          lo que el dropdown ya muestra visualmente (cantidad, error,
          "buscando…") — sin esto no había ninguna señal no-visual de que
          algo pasó al escribir. */}
      <span className="sr-only" role="status" aria-live="polite">
        {status === "loading" && "Buscando…"}
        {status === "error" && "No se pudo buscar."}
        {status === "ok" &&
          (hasResults
            ? `${teams.length} equipo${teams.length === 1 ? "" : "s"}, ${
                results.leagues.length
              } liga${results.leagues.length === 1 ? "" : "s"} encontrados`
            : `Sin resultados para ${query}`)}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="search-dropdown"
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
            style={{ transformOrigin: "top" }}
          >
            {isShort && (
              <div className="search-msg">Seguí escribiendo…</div>
            )}
            {status === "loading" && (
              <div className="search-msg">Buscando…</div>
            )}
            {status === "error" && (
              <div className="search-msg">No se pudo buscar. Probá de nuevo.</div>
            )}
            {status === "ok" && !hasResults && (
              <div className="search-msg">Sin resultados para "{query}"</div>
            )}

            {status === "ok" && teams.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Equipos</div>
                {teams.map((team, i) => (
                  <button
                    key={team.id}
                    id={`search-option-${i}`}
                    role="option"
                    aria-selected={highlighted === i}
                    className={
                      "search-result" + (highlighted === i ? " highlighted" : "")
                    }
                    onClick={() => handleSelectTeam(team)}
                    onMouseEnter={() => setHighlighted(i)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
