import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { BrandLogo } from "../../components/ui/brand-logo";
import { Button } from "../../components/ui/button";
import { Chip } from "../../components/ui/chip";
import { MaterialIcon } from "../../components/ui/material-icon";
import { exitTransition, spring } from "../../lib/motion";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import { useMediaQuery } from "../../lib/use-media-query";
import {
  ONBOARDING_STEPS,
  PROFILE_QUESTIONS,
  WELCOME_FEATURES,
  type OnboardingProfile,
} from "./steps";
import "./onboarding.css";

export type OnboardingPhase = "welcome" | "profile" | "tour";

type Rect = { x: number; y: number; width: number; height: number };

type OnboardingDialogProps = {
  phase: OnboardingPhase;
  step: number;
  /** Changes when the app view changes, so the spotlight re-measures its target. */
  viewKey: string;
  onPhaseChange: (phase: OnboardingPhase) => void;
  onStartTour: (profile: OnboardingProfile) => void;
  onStepChange: (step: number) => void;
  onFinish: () => void;
};

const SPOTLIGHT_PADDING = 6;
const EDGE = 16;
const GAP = 16;

/** Measures the live `data-tour` target and follows it while it moves. */
function useSpotlight(target: string | null, viewKey: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let element: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const update = (): void => {
      if (!element) return;
      const box = element.getBoundingClientRect();
      if (!box.width && !box.height) {
        setRect(null);
        return;
      }
      setRect({
        x: box.left - SPOTLIGHT_PADDING,
        y: box.top - SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
      });
    };
    // Wait one frame so a view switch has mounted the target.
    const frame = window.requestAnimationFrame(() => {
      element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!element) {
        setRect(null);
        return;
      }
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
      update();
      observer = new ResizeObserver(update);
      observer.observe(element);
    });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target, viewKey]);
  return rect;
}

const roundedRect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}` +
  `A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}` +
  `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;

/**
 * Dims everything except the target. The cutout is an even-odd path driven by
 * springs, so it glides between targets and can be re-targeted mid-flight.
 * (SVG masks and huge box-shadows both fail to paint over the WebGL map.)
 */
function Spotlight({ rect }: { rect: Rect }) {
  const x = useSpring(rect.x, spring.default);
  const y = useSpring(rect.y, spring.default);
  const width = useSpring(rect.width, spring.default);
  const height = useSpring(rect.height, spring.default);
  useEffect(() => {
    x.set(rect.x);
    y.set(rect.y);
    width.set(rect.width);
    height.set(rect.height);
  }, [rect, x, y, width, height]);
  const hole = useTransform(() =>
    roundedRect(x.get(), y.get(), Math.max(width.get(), 16), Math.max(height.get(), 16), 8),
  );
  const scrim = useTransform(
    () => `M0,0H${window.innerWidth}V${window.innerHeight}H0Z ${hole.get()}`,
  );
  return (
    <motion.svg
      className="onboarding-spotlight"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: exitTransition }}
      transition={{ duration: 0.2 }}
    >
      <motion.path className="onboarding-spotlight-scrim" d={scrim} fillRule="evenodd" />
      <motion.path className="onboarding-spotlight-ring" d={hole} />
    </motion.svg>
  );
}

/** Places the tour card next to the spotlight, below it when there is room. */
function cardPosition(rect: Rect, card: { width: number; height: number }): { x: number; y: number } {
  const maxX = window.innerWidth - card.width - EDGE;
  const x = Math.max(EDGE, Math.min(rect.x, maxX));
  const below = rect.y + rect.height + GAP;
  const y =
    below + card.height <= window.innerHeight - EDGE
      ? below
      : Math.max(EDGE, rect.y - card.height - GAP);
  return { x, y };
}

export function OnboardingDialog({
  phase,
  step,
  viewKey,
  onPhaseChange,
  onStartTour,
  onStepChange,
  onFinish,
}: OnboardingDialogProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [cardSize, setCardSize] = useState({ width: 390, height: 300 });
  const [feature, setFeature] = useState<string>(WELCOME_FEATURES[0].id);
  const [profile, setProfile] = useState<OnboardingProfile>({ heardAboutUs: "", visitorType: "" });
  // +1 when moving forward, −1 when moving back: content leaves the way it came.
  const [direction, setDirection] = useState(1);
  const docked = useMediaQuery("(max-width: 800px)");
  const isTour = phase === "tour";
  const current = ONBOARDING_STEPS[step];
  const spotlight = useSpotlight(isTour ? current.target : null, viewKey);
  const anchored = isTour && spotlight !== null && !docked;

  const contentKey = isTour ? `tour-${step}` : phase;
  useDialogFocus(cardRef, { onEscape: onFinish, focusKey: contentKey });

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(() => {
      setCardSize({ width: card.offsetWidth, height: card.offsetHeight });
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const go = (next: () => void, dir: number): void => {
    setDirection(dir);
    next();
  };

  const position = anchored ? cardPosition(spotlight, cardSize) : null;
  const selectedFeature = WELCOME_FEATURES.find((item) => item.id === feature) ?? WELCOME_FEATURES[0];

  return (
    <>
      <motion.div
        className="onboarding-veil"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: spotlight && isTour ? 0 : 1 }}
        exit={{ opacity: 0, transition: exitTransition }}
        transition={{ duration: 0.2 }}
      />
      <AnimatePresence>
        {isTour && spotlight && <Spotlight key="spotlight" rect={spotlight} />}
      </AnimatePresence>
      <motion.section
        ref={cardRef}
        className={`onboarding-card${isTour ? " is-tour" : " is-centered"}${anchored ? " is-anchored" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={
          position
            ? { opacity: 1, scale: 1, x: position.x, y: position.y }
            : { opacity: 1, scale: 1, x: 0, y: 0 }
        }
        exit={{ opacity: 0, scale: 0.98, transition: exitTransition }}
        transition={spring.default}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={contentKey}
            className="onboarding-content"
            data-focus-scope={contentKey}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: exitTransition }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring.default}
          >
            {phase === "welcome" && (
              <>
                <h2 id="onboarding-title" className="onboarding-title">
                  <motion.span
                    className="onboarding-title-logo"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring.momentum, delay: 0.06 }}
                  >
                    <BrandLogo />
                  </motion.span>
                  <span className="onboarding-title-text">Місто ближче</span>
                </h2>
                <p id="onboarding-description" className="onboarding-intro">
                  Транспорт, корисні місця й події Львова — на одній мапі.
                </p>
                <div className="onboarding-features" role="group" aria-label="Що всередині">
                  {WELCOME_FEATURES.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.default, delay: 0.12 + index * 0.05 }}
                    >
                      <Chip
                        icon={item.icon}
                        selected={feature === item.id}
                        aria-controls="onboarding-feature-detail"
                        onClick={() => setFeature(item.id)}
                      >
                        {item.label}
                      </Chip>
                    </motion.div>
                  ))}
                </div>
                <div id="onboarding-feature-detail" className="onboarding-feature-detail" aria-live="polite">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={selectedFeature.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6, transition: exitTransition }}
                      transition={spring.state}
                    >
                      <MaterialIcon name={selectedFeature.icon} size={20} filled />
                      {selectedFeature.detail}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="onboarding-actions">
                  <Button type="button" variant="ghost" onClick={onFinish}>
                    Не зараз
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    data-autofocus
                    onClick={() => go(() => onPhaseChange("profile"), 1)}
                  >
                    Почати тур
                    <MaterialIcon name="arrow_forward" size={18} />
                  </Button>
                </div>
              </>
            )}

            {phase === "profile" && (
              <>
                <div className="onboarding-progress">
                  <span>Перед стартом</span>
                  <span>Необов’язково</span>
                </div>
                <h2 id="onboarding-title" className="onboarding-heading">
                  Кілька слів про вас
                </h2>
                <p id="onboarding-description" className="onboarding-intro">
                  Це допоможе зрозуміти, кому застосунок стає в пригоді. Можна пропустити.
                </p>
                {PROFILE_QUESTIONS.map((question) => (
                  <fieldset key={question.id} className="onboarding-question">
                    <legend>{question.legend}</legend>
                    <div className="onboarding-options">
                      {question.options.map((option) => (
                        <Chip
                          key={option}
                          size="sm"
                          selected={profile[question.id] === option}
                          onClick={() =>
                            setProfile((value) => ({
                              ...value,
                              [question.id]: value[question.id] === option ? "" : option,
                            }))
                          }
                        >
                          {option}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="onboarding-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => go(() => onPhaseChange("welcome"), -1)}
                  >
                    Назад
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => go(() => onStartTour({ heardAboutUs: "", visitorType: "" }), 1)}
                    >
                      Пропустити
                    </Button>
                    <Button type="button" onClick={() => go(() => onStartTour(profile), 1)}>
                      Почати тур
                      <MaterialIcon name="arrow_forward" size={18} />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {isTour && (
              <>
                <div className="onboarding-progress">
                  <span>Знайомство</span>
                  <span>
                    {step + 1} / {ONBOARDING_STEPS.length}
                  </span>
                </div>
                <div
                  className="onboarding-progress-track"
                  role="progressbar"
                  aria-label="Кроки знайомства"
                  aria-valuemin={1}
                  aria-valuemax={ONBOARDING_STEPS.length}
                  aria-valuenow={step + 1}
                >
                  <motion.span
                    initial={false}
                    animate={{ scaleX: (step + 1) / ONBOARDING_STEPS.length }}
                    transition={spring.state}
                  />
                </div>
                <div className="onboarding-copy">
                  <span className="onboarding-icon" aria-hidden="true">
                    <MaterialIcon name={current.icon} size={22} filled />
                  </span>
                  <h2 id="onboarding-title" className="onboarding-heading">
                    {current.title}
                  </h2>
                  <p id="onboarding-description">{current.body}</p>
                </div>
                <div className="onboarding-actions">
                  <Button type="button" variant="ghost" onClick={onFinish}>
                    Пропустити тур
                  </Button>
                  <div>
                    {step > 0 && (
                      <Button type="button" variant="outline" onClick={() => go(() => onStepChange(step - 1), -1)}>
                        Назад
                      </Button>
                    )}
                    <Button type="button" data-autofocus onClick={() => go(() => onStepChange(step + 1), 1)}>
                      {step === ONBOARDING_STEPS.length - 1 ? "Готово" : "Далі"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </>
  );
}
