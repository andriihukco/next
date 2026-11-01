import { MaterialIcon } from "../../components/ui/material-icon";
import type { getRidershipEstimate } from "../../lib/fleet";

type RidershipEstimate = ReturnType<typeof getRidershipEstimate>;

/** Modelled passenger load. GPS feeds carry no passenger counts, so every number is labeled as an estimate. */
export function RidershipCard({ ridership }: { ridership: RidershipEstimate }) {
  const maxDailyPassengers = Math.max(...ridership.daily.map((day) => day.passengers));
  return (
    <section className="ridership-card" aria-labelledby="ridership-title">
      <div className="ridership-heading">
        <div>
          <span className="eyebrow">ПАСАЖИРОПОТІК</span>
          <h3 id="ridership-title">Завантаженість</h3>
        </div>
        <MaterialIcon name="groups" size={20} />
      </div>
      <div className="ridership-current">
        <div>
          <span>Зараз у салоні</span>
          <strong>~{ridership.current}</strong>
          <small>орієнтовно</small>
        </div>
        <span className="ridership-current-note">
          <MaterialIcon name="info" size={15} />
          Оцінка, не лічильник GPS
        </span>
      </div>
      <div className="ridership-chart-heading">
        <strong>Пасажирів за день</strong>
        <span>оцінка</span>
      </div>
      <div
        className="ridership-chart"
        role="img"
        aria-label={`Демонстраційна оцінка пасажиропотоку за днями: ${ridership.daily
          .map(({ day, passengers }) => `${day}: близько ${passengers}`)
          .join(", ")}`}
      >
        {ridership.daily.map(({ day, passengers }) => (
          <div className="ridership-day" key={day}>
            <span className="ridership-bar-track">
              <span
                className="ridership-bar"
                style={{ height: `${(passengers / maxDailyPassengers) * 100}%` }}
                title={`${day}: ~${passengers} пасажирів`}
              />
            </span>
            <span>{day}</span>
          </div>
        ))}
      </div>
      <p className="ridership-disclaimer">
        Демонстраційна модель попиту. Реальні GPS-дані не містять кількості пасажирів.
      </p>
    </section>
  );
}
