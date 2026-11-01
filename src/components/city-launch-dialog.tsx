import { useEffect, useRef, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MaterialIcon, X } from "./ui/material-icon";
import { TELEGRAM_CHANNEL_URL } from "../lib/app-constants";

export type CityIndexGroup = {
  letter: string;
  items: { key: string; name: string; isCenter: boolean }[];
};

type CityLaunchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citySearch: string;
  onCitySearchChange: (value: string) => void;
  cityIndexGroups: CityIndexGroup[];
  noMatches: boolean;
  interestedCities: Set<string>;
  onToggleCity: (name: string) => void;
  cityUpdateEmail: string;
  onCityUpdateEmailChange: (value: string) => void;
  cityUpdateSubmitting: boolean;
  cityUpdateStatus: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => unknown;
};

/** «Незабаром у нових містах»: the city picker, opened as a native modal dialog. */
export function CityLaunchDialog({
  open,
  onOpenChange,
  citySearch,
  onCitySearchChange,
  cityIndexGroups,
  noMatches,
  interestedCities,
  onToggleCity,
  cityUpdateEmail,
  onCityUpdateEmailChange,
  cityUpdateSubmitting,
  cityUpdateStatus,
  onSubmit,
}: CityLaunchDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // The native dialog owns focus trapping and Escape; React only mirrors the open flag.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
<dialog
  ref={dialogRef}
  className="city-launch-dialog"
  aria-modal="true"
  aria-labelledby="city-launch-title"
  onClose={() => onOpenChange(false)}
  onCancel={() => onOpenChange(false)}
  onClick={(event) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  }}
>
  <div className="city-launch-content">
    <header className="city-launch-header">
      <div>
        <span className="city-launch-eyebrow">un · МІСТО ПОРУЧ</span>
        <h2 id="city-launch-title">Незабаром у нових містах</h2>
        <p>
          Оберіть область або знайдіть місто. Повідомимо, щойно un
          з’явиться поруч.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Закрити вибір міста"
        onClick={() => onOpenChange(false)}
      >
        <X size={20} />
      </Button>
    </header>
    <label className="city-launch-search">
      <MaterialIcon name="search" size={20} />
      <Input
        type="search"
        aria-label="Знайти місто або область"
        placeholder="Місто або область"
        value={citySearch}
        onChange={(event) => onCitySearchChange(event.target.value)}
      />
      {citySearch && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Очистити пошук міст"
          onClick={() => onCitySearchChange("")}
        >
          <MaterialIcon name="close" size={18} />
        </Button>
      )}
    </label>
    <div
      className="city-launch-list"
      role="region"
      aria-label="Області та міста України"
    >
      <div className="city-index">
        {cityIndexGroups.map(({ letter, items }) => (
          <section
            key={letter}
            className="city-index-section"
            aria-labelledby={`city-index-${letter}`}
          >
            <h3 id={`city-index-${letter}`} className="city-index-letter">
              {letter}
            </h3>
            <ul className="city-index-items">
              {items.map((entry) => {
                const isSelected = interestedCities.has(entry.name);
                const isCurrent = entry.name === "Львів";
                return (
                  <li key={entry.key}>
                    <button
                      type="button"
                      className={`city-region-city${entry.isCenter ? " city-region-center" : ""}${isSelected ? " active" : ""}${isCurrent ? " current" : ""}`}
                      aria-pressed={isSelected}
                      disabled={isCurrent}
                      onClick={() => onToggleCity(entry.name)}
                    >
                      <span>{entry.name}</span>
                      {isCurrent ? (
                        <span className="city-region-badge">Доступне</span>
                      ) : isSelected ? (
                        <MaterialIcon name="check" size={18} />
                      ) : entry.isCenter ? (
                        <span className="city-region-badge">Центр</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {noMatches && (
        <p className="city-launch-empty" role="status">
          Місто або область не знайдено. Перевірте назву й спробуйте ще раз.
        </p>
      )}
    </div>
    <div className="city-launch-actions">
      {TELEGRAM_CHANNEL_URL ? (
        <a
          className="city-launch-telegram"
          href={TELEGRAM_CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
        >
          <div className="city-launch-telegram-content">
            <div className="city-launch-telegram-icon">
              <MaterialIcon name="send" size={24} />
            </div>
            <div className="city-launch-telegram-text">
              <strong>Підпишіться на Telegram</strong>
              <span>Отримуйте новини про запуск у нових містах</span>
            </div>
            <MaterialIcon name="arrow_forward" size={20} />
          </div>
        </a>
      ) : (
        <p className="city-launch-telegram-note">
          Посилання на Telegram-канал з’явиться тут незабаром.
        </p>
      )}
      <form className="city-launch-email-form" onSubmit={onSubmit}>
        <label htmlFor="city-launch-email">
          Залиште email — надішлемо новину про запуск у {interestedCities.size} {interestedCities.size === 1 ? "місті" : "містах"}
        </label>
        <div>
          <Input
            id="city-launch-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={cityUpdateEmail}
            disabled={cityUpdateSubmitting}
            onChange={(event) => {
              onCityUpdateEmailChange(event.target.value);
            }}
            required
          />
          <Button type="submit" disabled={cityUpdateSubmitting}>
            {cityUpdateSubmitting ? "Надсилаємо…" : "Повідомити мене"}
          </Button>
        </div>
        <p
          className="city-launch-status"
          role="status"
          aria-live="polite"
        >
          {cityUpdateStatus ||
            "Адресу буде надіслано лише після підключення підписки."}
        </p>
      </form>
    </div>
  </div>
</dialog>
  );
}
