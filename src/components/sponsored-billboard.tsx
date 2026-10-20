import { useEffect, useRef, useState } from "react";
import "./sponsored-billboard.css";

type SponsoredAdCategory = "food" | "services";
type SponsoredAdDestination =
  | { section: "places"; category: SponsoredAdCategory }
  | { section: "events" | "education" };

type SponsoredBillboardProps = {
  onNavigate: (
    section: "places" | "events" | "education",
    category?: SponsoredAdCategory,
  ) => void;
};

const ADS: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  theme: string;
  destination: SponsoredAdDestination;
}[] = [
  {
    eyebrow: "Смакуй місто",
    title: "Кава свого міста",
    description: "Затишні кав'ярні та смачні відкриття поруч.",
    action: "Знайти кав'ярню",
    theme: "coffee",
    destination: { section: "places", category: "food" },
  },
  {
    eyebrow: "Плануй вихідні",
    title: "Куди сьогодні?",
    description: "Події та зустрічі, що наповнюють місто.",
    action: "Відкрити афішу",
    theme: "events",
    destination: { section: "events" },
  },
  {
    eyebrow: "Поруч для родини",
    title: "Освіта у Львові",
    description: "Знайдіть школу чи садочок для своєї родини.",
    action: "Переглянути освіту",
    theme: "education",
    destination: { section: "education" },
  },
  {
    eyebrow: "Твій район",
    title: "Потрібна послуга?",
    description: "Місцеві сервіси — ближче, ніж здається.",
    action: "Знайти поруч",
    theme: "services",
    destination: { section: "places", category: "services" },
  },
];

const SLAT_COUNIT = 14;
const ROTATION_DELAY = 8_000;
const FLIP_DURATION = 1_500;

function AdArtwork({ ad }: { ad: (typeof ADS)[number] }) {
  return (
    <div className={`sponsored-artwork sponsored-artwork-${ad.theme}`}>
      <span className="sponsored-artwork-orb sponsored-artwork-orb-primary" />
      <span className="sponsored-artwork-orb sponsored-artwork-orb-secondary" />
      <div className="sponsored-artwork-copy">
        <span className="sponsored-artwork-eyebrow">{ad.eyebrow}</span>
        <strong>{ad.title}</strong>
        <span className="sponsored-artwork-description">{ad.description}</span>
        <span className="sponsored-artwork-cta">{ad.action}</span>
      </div>
    </div>
  );
}

export function SponsoredBillboard({ onNavigate }: SponsoredBillboardProps) {
  const [currentAd, setCurrentAd] = useState(0);
  const [faceAds, setFaceAds] = useState([0, 1, 2]);
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isSettled, setIsSettled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const current = ADS[currentAd];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (): void =>
      setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || isHovered || hasFocus || reducedMotion || !isSettled) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const nextIndex = (currentAd + 1) % ADS.length;
      const nextFace = (step + 1) % faceAds.length;
      setFaceAds((faces) => {
        const nextFaces = [...faces];
        nextFaces[nextFace] = nextIndex;
        return nextFaces;
      });
      setCurrentAd(nextIndex);
      setStep(step + 1);
      setIsSettled(false);

      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
      transitionTimer.current = window.setTimeout(
        () => setIsSettled(true),
        FLIP_DURATION,
      );
    }, ROTATION_DELAY);

    return () => window.clearInterval(timer);
  }, [
    currentAd,
    faceAds.length,
    hasFocus,
    isHovered,
    isPaused,
    isSettled,
    reducedMotion,
    step,
  ]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  const showAd = (nextIndex: number): void => {
    if (nextIndex === currentAd || !isSettled) return;

    const nextFace = (step + 1) % faceAds.length;
    setFaceAds((faces) => {
      const nextFaces = [...faces];
      nextFaces[nextFace] = nextIndex;
      return nextFaces;
    });
    setCurrentAd(nextIndex);
    setStep(step + 1);
    setIsSettled(false);

    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
    }
    transitionTimer.current = window.setTimeout(
      () => setIsSettled(true),
      reducedMotion ? 0 : FLIP_DURATION,
    );
  };

  const navigateToAd = (): void => {
    if (current.destination.section === "places") {
      onNavigate("places", current.destination.category);
    } else {
      onNavigate(current.destination.section);
    }
  };

  return (
    <section
      className="sponsored-billboard"
      aria-label="Рекламна пропозиція"
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          setHasFocus(false);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sponsored-billboard-heading">
        <p>Реклама</p>
        <button
          type="button"
          className="sponsored-billboard-pause"
          aria-label={
            isPaused || isHovered || hasFocus
              ? "Продовжити автоматичну зміну реклами"
              : "Призупинити автоматичну зміну реклами"
          }
          aria-pressed={isPaused || isHovered || hasFocus}
          disabled={reducedMotion}
          onClick={() => {
            if (isPaused || isHovered || hasFocus) {
              setIsPaused(false);
              setHasFocus(false);
            } else {
              setIsPaused(true);
            }
          }}
        >
          {reducedMotion
            ? "Автопоказ вимкнено"
            : isPaused || isHovered || hasFocus
              ? "Продовжити"
              : "Пауза"}
        </button>
      </div>

      <div className="sponsored-billboard-frame">
        <div
          className={`sponsored-billboard-board${isSettled ? " settled" : ""}`}
          aria-hidden="true"
        >
          <div className="sponsored-billboard-flat">
            <AdArtwork ad={current} />
          </div>
          <div className="sponsored-billboard-slats">
            {Array.from({ length: SLAT_COUNIT }, (_, slatIndex) => (
              <div
                className="sponsored-billboard-slat"
                key={slatIndex}
                style={{
                  left: `${(slatIndex * 100) / SLAT_COUNIT}%`,
                  width: `${100 / SLAT_COUNIT}%`,
                  transitionDelay: `${slatIndex * 32}ms`,
                  transform: `rotateY(${step * -120}deg)`,
                }}
              >
                {faceAds.map((adIndex, faceIndex) => (
                  <div
                    className="sponsored-billboard-face"
                    key={faceIndex}
                    style={{
                      transform: `rotateY(${faceIndex * 120}deg) translateZ(6px)`,
                    }}
                  >
                    <div
                      className="sponsored-billboard-face-art"
                      style={{
                        width: `${SLAT_COUNIT * 100}%`,
                        left: `-${slatIndex * 100}%`,
                      }}
                    >
                      <AdArtwork ad={ADS[adIndex]} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="sponsored-billboard-rim" />
        </div>
      </div>

      <div className="sponsored-billboard-controls">
        <button
          type="button"
          className="sponsored-billboard-arrow"
          aria-label="Попередня реклама"
          disabled={!isSettled}
          onClick={() => showAd((currentAd + ADS.length - 1) % ADS.length)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="sponsored-billboard-dots" aria-label="Вибрати рекламу">
          {ADS.map((ad, index) => (
            <button
              type="button"
              key={ad.title}
              aria-label={`Реклама ${index + 1} з ${ADS.length}: ${ad.title}`}
              aria-current={index === currentAd ? "true" : undefined}
              disabled={!isSettled}
              onClick={() => showAd(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sponsored-billboard-arrow"
          aria-label="Наступна реклама"
          disabled={!isSettled}
          onClick={() => showAd((currentAd + 1) % ADS.length)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="sponsored-billboard-caption" aria-live={isPaused ? "polite" : "off"}>
        <span className="sponsored-billboard-sr-only">
          {current.eyebrow}. {current.title}. {current.description}
        </span>
        <button type="button" onClick={navigateToAd}>
          {current.action}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
