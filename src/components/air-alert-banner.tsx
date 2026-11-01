import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { MaterialIcon, TriangleAlert } from "./ui/material-icon";
import { formatDistance } from "../lib/app-formatters";
import type { AirAlert, Shelter } from "../lib/app-types";

export type NearestShelter = Shelter & { distanceMeters: number };

type AirAlertBannerProps = {
  airAlert: AirAlert;
  expanded: boolean;
  onToggleExpanded: () => void;
  shelterLoadState: "loading" | "ready" | "error";
  userLocation: [number, number] | null;
  locationError: string | null;
  onRequestLocation: () => void;
  nearestShelter: NearestShelter | null;
  onShowShelterOnMap: (shelter: NearestShelter) => void;
};

/** Active air-alert banner: level, threats, and the nearest shelter from the city's open data. */
export function AirAlertBanner({
  airAlert,
  expanded,
  onToggleExpanded,
  shelterLoadState,
  userLocation,
  locationError,
  onRequestLocation,
  nearestShelter,
  onShowShelterOnMap,
}: AirAlertBannerProps): ReactNode {
  if (airAlert.status !== "active") return null;
  return (
    <section
      className={`air-alert active level-${airAlert.level ?? "red"}${expanded ? " expanded" : ""}`}
      role="status"
    >
      <button
        type="button"
        className="air-alert-pill"
        aria-expanded={expanded}
        onClick={() => onToggleExpanded()}
      >
        <TriangleAlert size={19} />
        <strong>
          {airAlert.level === "yellow"
            ? "БпЛА · Львівщина"
            : "Тривога · Львівщина"}
        </strong>
        <MaterialIcon
          name={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          size={20}
        />
      </button>
      {expanded && (
        <div className="air-alert-details">
          <p>
            {airAlert.level === "yellow"
              ? "Жовтий рівень — загроза ударних БпЛА. Будьте уважні, в укриття спускайтеся за потреби."
              : "Червоний рівень — ракетна небезпека. Негайно пройдіть до найближчого укриття."}
          </p>
          {(airAlert.sinceText || (airAlert.areasAffected?.length ?? 0) > 0) && (
            <div className="air-alert-meta">
              {airAlert.sinceText && (
                <span className="air-alert-since">
                  <MaterialIcon name="schedule" size={15} />
                  {airAlert.sinceText}
                </span>
              )}
              {(airAlert.areasAffected?.length ?? 0) > 0 && (
                <ul className="air-alert-areas" aria-label="Райони під тривогою">
                  {airAlert.areasAffected?.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="air-alert-threats">
            <div className="air-alert-threats-head">
              <MaterialIcon name="flight" size={16} />
              <strong>БпЛА та КАБ</strong>
              <small>за повідомленнями Повітряних сил</small>
            </div>
            {(airAlert.threats?.length ?? 0) > 0 ? (
              <ul className="air-alert-threat-list">
                {airAlert.threats?.map((threat) => (
                  <li
                    className={`air-alert-threat kind-${threat.kind}`}
                    key={`${threat.time}-${threat.place}`}
                  >
                    <time>{threat.time}</time>
                    <span>{threat.placeUk}</span>
                    <small>{threat.kindLabel}</small>
                    {threat.note && <p>{threat.note}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="air-alert-threat-empty">
                Нових повідомлень про БпЛА по Львівщині немає. Статус
                оновлюється кожні 30 секунд.
              </p>
            )}
          </div>
          <div className="air-alert-links">
            <Button asChild variant="outline" size="sm" className="alert-action">
              <a
                href="https://map.war-monitor.org/"
                target="_blank"
                rel="noreferrer"
              >
                <MaterialIcon name="radar" size={16} />
                Жива мапа БпЛА
              </a>
            </Button>
          </div>
          <small className="air-alert-source">
            Дані alerts.in.ua. Це не офіційна система оповіщення: слухайте сирени й офіційні канали.
          </small>
          <div className="shelter-nearest">
            {shelterLoadState === "loading" ? (
              <span>Завантажуємо міський перелік укриттів…</span>
            ) : shelterLoadState === "error" ? (
              <span>
                Не вдалося завантажити перелік укриттів. Перевірте{" "}
                <a
                  href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                  target="_blank"
                  rel="noreferrer"
                >
                  дані міста
                </a>
                .
              </span>
            ) : !userLocation ? (
              <>
                {locationError && (
                  <span className="shelter-location-error" role="alert">
                    {locationError}
                  </span>
                )}
                <span>Дозвольте геолокацію, щоб знайти найближче укриття.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shelter-action"
                  onClick={onRequestLocation}
                >
                  Моє місце
                </Button>
              </>
            ) : nearestShelter ? (
              <>
                <strong>
                  Найближче · {formatDistance(nearestShelter.distanceMeters)}{" "}
                  по прямій
                </strong>
                <span className="shelter-address">
                  {nearestShelter.address}
                </span>
                <small>
                  {nearestShelter.status}
                  {nearestShelter.capacity
                    ? ` · ${nearestShelter.capacity} місць`
                    : ""}
                  {" · доступ 24/7 за даними міста"}
                </small>
                <div className="shelter-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shelter-action"
                    onClick={() =>
                      onShowShelterOnMap(nearestShelter)
                    }
                  >
                    На мапі
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shelter-action"
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.lat},${nearestShelter.lng}&travelmode=walking&origin=${userLocation[1]},${userLocation[0]}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Маршрут
                    </a>
                  </Button>
                </div>
                <small className="shelter-source-note">
                  Відстань по прямій. Фактичну доступність перевіряйте на
                  місці ·{" "}
                  <a
                    href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                    target="_blank"
                    rel="noreferrer"
                  >
                    джерело: відкриті дані Львова
                  </a>
                </small>
              </>
            ) : (
              <span>
                Немає укриття зі статусом «готове» або «рекомендоване» та
                цілодобовим доступом у міському переліку.{" "}
                <a
                  href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                  target="_blank"
                  rel="noreferrer"
                >
                  Переглянути джерело
                </a>
                .
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
