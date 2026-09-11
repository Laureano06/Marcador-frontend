import { useCallback, useEffect, useState } from "react";
import { fetchTransfers } from "../api";
import { COMPETITION_REGISTRY } from "../competitions/config";
import PlayerFace from "../components/PlayerFace";
import PlayerLink from "../components/PlayerLink";
import TeamLink from "../components/TeamLink";
import { ArrowRightIcon } from "../components/icons";
import { useDocumentMeta } from "../useDocumentMeta";

const PAGE_SIZE = 25;

const ORDERINGS = [
  { key: "-transfer_date", label: "Más recientes" },
  { key: "-fee", label: "Fichajes más caros" },
];

// Mismo registro que ya usa el feed para priorizar ligas (config.js) —
// evita mantener una segunda lista de "ligas conocidas" separada, y
// cualquier liga que se sume ahí para el feed aparece acá gratis.
const LEAGUE_OPTIONS = Object.entries(COMPETITION_REGISTRY)
  .map(([id, entry]) => ({ id, name: entry.names[0] }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));

// BSD manda "Free"/"Loan" (o "-" cuando no hay dato) en fee_description —
// se traduce lo conocido, cualquier otro valor real se muestra tal cual
// en vez de inventarle una traducción.
const FEE_DESCRIPTION_ES = {
  Free: "Libre",
  Loan: "Préstamo",
  Unknown: "Desconocido",
  "-": "Monto no informado",
};

// BSD usa estos dos nombres como pseudo-clubes especiales (jugador sin
// equipo / retirado) — cualquier otro nombre es un club real y se
// muestra tal cual, sin traducir.
const TEAM_NAME_ES = {
  "No team": "Sin club",
  Retired: "Retirado",
};

function teamNameLabel(name) {
  return TEAM_NAME_ES[name] || name || "Sin club";
}

const feeFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function feeLabel(transfer) {
  if (transfer.feeEur) return feeFormatter.format(transfer.feeEur);
  const desc = transfer.feeDescription;
  return FEE_DESCRIPTION_ES[desc] || desc || "Monto no informado";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function TransferRow({ transfer }) {
  return (
    <li className="transfer-row">
      <span className="transfer-date">{formatDate(transfer.date)}</span>

      <PlayerLink playerId={transfer.playerId} className="transfer-player">
        <PlayerFace photo={transfer.playerPhoto} name={transfer.playerName} size="sm" />
        <span className="transfer-player-name">{transfer.playerName}</span>
      </PlayerLink>

      <span className="transfer-move">
        <TeamLink teamId={transfer.fromTeamId} className="transfer-team">
          {transfer.fromTeamCrest && <img src={transfer.fromTeamCrest} alt="" />}
          <span>{teamNameLabel(transfer.fromTeamName)}</span>
        </TeamLink>
        <ArrowRightIcon className="transfer-arrow" />
        <TeamLink teamId={transfer.toTeamId} className="transfer-team">
          {transfer.toTeamCrest && <img src={transfer.toTeamCrest} alt="" />}
          <span>{teamNameLabel(transfer.toTeamName)}</span>
        </TeamLink>
      </span>

      <span className="transfer-fee">{feeLabel(transfer)}</span>
    </li>
  );
}

export default function TransfersPage() {
  const [leagueId, setLeagueId] = useState("");
  const [hasFee, setHasFee] = useState(false);
  const [ordering, setOrdering] = useState(ORDERINGS[0].key);

  const [transfers, setTransfers] = useState([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ok | error | loading-more
  const [errorMessage, setErrorMessage] = useState("");

  const filters = {
    league_id: leagueId || undefined,
    has_fee: hasFee || undefined,
    ordering,
  };
  // Solo estas tres cambian el conjunto de resultados — la key fuerza que
  // el efecto de abajo dispare una carga desde cero (offset 0) cada vez
  // que cambian, sin tener que listarlas por separado en el array de deps.
  const filterKey = JSON.stringify(filters);

  const load = useCallback(() => {
    setStatus("loading");
    setTransfers([]);
    fetchTransfers({ ...filters, offset: 0 })
      .then((data) => {
        setTransfers(data.transfers);
        setCount(data.count);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = () => {
    setStatus("loading-more");
    fetchTransfers({ ...filters, offset: transfers.length })
      .then((data) => {
        setTransfers((prev) => [...prev, ...data.transfers]);
        setCount(data.count);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  };

  useDocumentMeta({
    title: "Fichajes y mercado de pases | PARTIDOS",
    description:
      "Últimos fichajes y traspasos de fútbol de todo el mundo, con monto y club de origen y destino.",
  });

  const canLoadMore = status !== "loading" && transfers.length < count;

  return (
    <div className="transfers-page">
      <h1 className="transfers-heading">Fichajes</h1>

      <div className="transfers-filters">
        <select
          className="transfers-filter-select"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          aria-label="Filtrar por liga"
        >
          <option value="">Todas las ligas</option>
          {LEAGUE_OPTIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          className="transfers-filter-select"
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          aria-label="Ordenar por"
        >
          {ORDERINGS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="transfers-filter-checkbox">
          <input
            type="checkbox"
            checked={hasFee}
            onChange={(e) => setHasFee(e.target.checked)}
          />
          Solo con monto confirmado
        </label>
      </div>

      {status === "loading" && <p className="empty">Cargando fichajes…</p>}

      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar los fichajes</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status !== "loading" && status !== "error" && transfers.length === 0 && (
        <p className="empty">No hay fichajes para estos filtros.</p>
      )}

      {transfers.length > 0 && (
        <>
          <ul className="transfers-list">
            {transfers.map((t) => (
              <TransferRow key={t.id} transfer={t} />
            ))}
          </ul>

          {canLoadMore && (
            <button
              className="transfers-load-more"
              onClick={loadMore}
              disabled={status === "loading-more"}
            >
              {status === "loading-more" ? "Cargando…" : "Cargar más"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
