import type { CSSProperties, ReactNode } from "react";
import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import { Button } from "../components/ui/button";
import { BrandLogo } from "../components/ui/brand-logo";
import { MaterialIcon } from "../components/ui/material-icon";
import { spring } from "../lib/motion";
import "./landing.css";

/**
 * Public entry point at `/`. The app lives at `/app` (DESIGN.md §5).
 * Structure follows AIDA (attention, interest, desire, action), with a problem →
 * solution block, three steps, use cases, a data-trust block, and objections.
 * Copy follows DESIGN.md §1, §9, §13: no invented ratings, reviews, or numbers.
 */

const APP_HREF = "/app";
const ROUTE_D = "M 28 232 C 96 232, 112 84, 196 96 S 318 52, 372 74";

const PAINS = [
  { icon: "schedule", title: "Розклад не каже, де транспорт зараз.", text: "Ви чекаєте на зупинці й не знаєте, чи встигнете." },
  { icon: "stacked_bar_chart", title: "Оцінки й фото розкидані.", text: "Кав’ярню шукаєте в одному місці, відгуки читаєте в іншому." },
  { icon: "shuffle", title: "Кожна послуга — з нуля.", text: "Запис, столик, квиток: щоразу новий застосунок і нова реєстрація." },
] as const;

const STEPS = [
  { icon: "map", title: "Відкрийте мапу", text: "Місто, транспорт і місця одразу. Реєстрація не потрібна." },
  { icon: "tune", title: "Оберіть, що потрібно", text: "Маршрут, зупинку, кав’ярню поруч або подію." },
  { icon: "near_me", title: "Дійте за кілька дотиків", text: "Прокладіть маршрут, зателефонуйте або збережіть місце на пристрої." },
] as const;

const FEATURES = [
  {
    id: "transport",
    icon: "directions_bus",
    eyebrow: "Транспорт",
    title: "Автобуси, трамваї й тролейбуси наживо.",
    text: "Позиції з живого GPS-потоку та маршрути. Час прибуття є оцінкою, а не розкладом.",
    points: ["Маршрути й зупинки на мапі", "Оцінка прибуття за позицією транспорту"],
  },
  {
    id: "places",
    icon: "place",
    eyebrow: "Місця",
    title: "Кав’ярні, аптеки, парки й школи поруч.",
    text: "Місця поруч із фото, оцінками й відгуками, там де вони є. Якщо оцінки немає, її не показуємо.",
    points: ["Пошук місць поруч із вами", "Оцінки лише там, де вони є"],
  },
  {
    id: "services",
    icon: "event_available",
    eyebrow: "Послуги й події",
    title: "Записи, квитки й столики в одному місці.",
    text: "Цей розділ поки що демо. Запити нікуди не надсилаються, і результат прямо про це повідомляє.",
    points: ["Запис, столик і квитки", "Позначено як «Демо»"],
  },
] as const;

const BENEFITS = [
  { icon: "layers", title: "Одна мапа замість трьох застосунків", text: "Транспорт, місця й послуги поруч, без перемикання." },
  { icon: "verified", title: "Видно, що саме ви бачите", text: "Кожна мітка має підпис: наживо, оцінка або демо." },
  { icon: "language", title: "Працює в браузері", text: "Нічого не треба встановлювати, щоб подивитися маршрут." },
  { icon: "lock", title: "Ваші місця лишаються з вами", text: "Збережені місця й налаштування зберігаються на вашому пристрої." },
] as const;

const USE_CASES = [
  { icon: "work", title: "Щоденна поїздка на роботу", text: "Перевірте, який транспорт їде зараз і скільки йти до зупинки." },
  { icon: "flight_land", title: "Перші дні в місті", text: "Знайдіть аптеку, банкомат і парк, не відкриваючи десять вкладок." },
  { icon: "family_restroom", title: "Вихідні з дітьми", text: "Плейграунди, гуртки й дитячі події поруч, позначені як демо." },
  { icon: "build", title: "Послуга, коли вона раптом потрібна", text: "Шиномонтаж, ремонт або кравець поруч, з телефоном одним дотиком." },
] as const;

const LABELS = [
  { tag: "Наживо", tone: "live", text: "Позиція транспорту з GPS-потоку." },
  { tag: "Оцінка", tone: "estimate", text: "Час прибуття за позицією, не за розкладом." },
  { tag: "Демо", tone: "demo", text: "Послуги й події. Запити нікуди не надсилаються." },
] as const;

const FAQ = [
  {
    q: "Чи можна довіряти часу прибуття?",
    a: "Це оцінка за поточною позицією транспорту на мапі. Це не розклад і не гарантія.",
  },
  {
    q: "Чи потрібен акаунт?",
    a: "Ні. Профіль, збережені місця й налаштування зберігаються на вашому пристрої. Вхід в обліковий запис ще не підключено.",
  },
  {
    q: "Чи працюють запис, замовлення й квитки?",
    a: "Поки що ні. Це демо: запити нікуди не надсилаються, і результат прямо про це повідомляє.",
  },
] as const;

const stagger = (index: number) => ({ "--i": index }) as CSSProperties;

/** Scroll-in reveal: fades and rises once, with the app's default spring. */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...spring.default, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers the `staggerChild` items inside it when the block enters view. */
const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring.default },
};

function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing">
        <motion.div className="landing-progress" style={{ scaleX: progress }} aria-hidden="true" />

        <header className="landing-nav">
          <div className="landing-nav-inner">
            <a href="/" className="landing-brand" aria-label="next, головна">
              <BrandLogo />
            </a>
            <nav className="landing-nav-links" aria-label="Розділи сторінки">
              <a href="#problem">Чому eway</a>
              <a href="#features">Можливості</a>
              <a href="#faq">Питання</a>
              <a href="#data">Дані</a>
            </nav>
            <Button asChild size="sm" className="landing-btn landing-btn-primary landing-btn-nav">
              <a href={APP_HREF}>Відкрити мапу</a>
            </Button>
          </div>
        </header>

        <main>
          {/* Attention: a clear promise and a live picture of the product. */}
          <section className="landing-hero" aria-labelledby="landing-hero-title">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow landing-rise" style={stagger(0)}>
                Львів · жива мапа
              </p>
              <h1 id="landing-hero-title" className="landing-hero-title landing-rise" style={stagger(1)}>
                Ваше місто — на одній мапі.
              </h1>
              <p className="landing-lead landing-rise" style={stagger(2)}>
                Автобуси, трамваї й тролейбуси наживо. Місця поруч. Послуги, які не треба шукати в трьох застосунках.
              </p>
              <div className="landing-cta-row landing-rise" style={stagger(3)}>
                <Button asChild size="lg" className="landing-btn landing-btn-primary">
                  <a href={APP_HREF}>
                    <MaterialIcon name="map" size={20} />
                    Відкрити мапу
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="landing-btn landing-btn-secondary">
                  <a href="#steps">Як це працює</a>
                </Button>
              </div>
              <p className="landing-microcopy landing-rise" style={stagger(4)}>
                Без реєстрації. Працює в браузері.
              </p>
            </div>

            <motion.div
              className="landing-stage"
              aria-hidden="true"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring.default, delay: 0.25 }}
            >
              <div className="landing-map">
                <span className="landing-map-water" />
                <span className="landing-map-park" />
                <svg className="landing-map-route" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                  <path id="landing-route-path" d={ROUTE_D} />
                  <circle cx="196" cy="96" r="7" className="landing-map-stop" />
                  <g>
                    <circle r="16" className="landing-map-vehicle" style={{ fill: "var(--fleet-trolleybus)" }} />
                    <text textAnchor="middle" dominantBaseline="central" className="landing-map-vehicle-text">
                      9
                    </text>
                    <animateMotion dur="9s" repeatCount="indefinite" rotate="0">
                      <mpath href="#landing-route-path" />
                    </animateMotion>
                  </g>
                </svg>
              </div>
              <motion.div
                className="landing-sheet"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.default, delay: 0.6 }}
              >
                <span className="landing-sheet-route landing-route-trolleybus">9</span>
                <span className="landing-sheet-copy">
                  <strong>Тролейбус, зупинка поруч</strong>
                  <span>≈ 4 хв · Оцінка</span>
                </span>
                <span className="landing-chip is-filled">Маршрут</span>
              </motion.div>
            </motion.div>
          </section>

          {/* Problem → agitate → solve (PAS). */}
          <section id="problem" className="landing-block" aria-labelledby="landing-problem-title">
            <Reveal>
              <p className="landing-eyebrow">Знайомо?</p>
              <h2 id="landing-problem-title" className="landing-title">
                Щоб дізнатися, коли приїде трамвай, доводиться відкривати три застосунки.
              </h2>
            </Reveal>
            <StaggerGroup className="landing-pain-grid">
              {PAINS.map((pain) => (
                <motion.article key={pain.title} className="landing-card landing-pain" variants={staggerChild}>
                  <span className="landing-icon-tile">
                    <MaterialIcon name={pain.icon} size={24} />
                  </span>
                  <h3>{pain.title}</h3>
                  <p>{pain.text}</p>
                </motion.article>
              ))}
            </StaggerGroup>
            <Reveal className="landing-solve">
              <p>
                <strong>eway збирає це в одну мапу,</strong> де все під рукою.
              </p>
            </Reveal>
          </section>

          {/* Interest: the three product areas, shown with real-looking states. */}
          <section id="features" className="landing-block" aria-labelledby="landing-features-title">
            <Reveal>
              <p className="landing-eyebrow">Можливості</p>
              <h2 id="landing-features-title" className="landing-title">
                Три речі, які ви відкриєте першими.
              </h2>
            </Reveal>
            <StaggerGroup className="landing-bento">
              {FEATURES.map((feature) => (
                <motion.article
                  key={feature.id}
                  className={`landing-card landing-feature landing-feature-${feature.id}`}
                  variants={staggerChild}
                  whileHover={{ y: -4 }}
                  transition={spring.state}
                  aria-labelledby={`landing-${feature.id}-title`}
                >
                  <div className="landing-feature-copy">
                    <span className="landing-icon-tile">
                      <MaterialIcon name={feature.icon} size={24} />
                    </span>
                    <p className="landing-eyebrow">{feature.eyebrow}</p>
                    <h3 id={`landing-${feature.id}-title`} className="landing-feature-title">
                      {feature.title}
                    </h3>
                    <p className="landing-feature-text">{feature.text}</p>
                    <ul className="landing-points">
                      {feature.points.map((point) => (
                        <li key={point}>
                          <MaterialIcon name="check" size={18} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="landing-feature-visual" aria-hidden="true">
                    {feature.id === "transport" && (
                      <div className="landing-mock">
                        <span className="landing-mock-label">Приклад</span>
                        <div className="landing-mock-row">
                          <span className="landing-mock-route landing-route-trolleybus">9</span>
                          <span className="landing-mock-copy">
                            <strong>Тролейбус</strong>
                            <span>≈ 4 хв · Оцінка</span>
                          </span>
                        </div>
                        <div className="landing-mock-row">
                          <span className="landing-mock-route landing-route-tram">4</span>
                          <span className="landing-mock-copy">
                            <strong>Трамвай</strong>
                            <span>≈ 9 хв · Оцінка</span>
                          </span>
                        </div>
                        <div className="landing-mock-row">
                          <span className="landing-mock-route landing-route-bus">22</span>
                          <span className="landing-mock-copy">
                            <strong>Автобус</strong>
                            <span>Немає позиції зараз</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {feature.id === "places" && (
                      <div className="landing-mock">
                        <span className="landing-mock-label">Приклад</span>
                        <div className="landing-mock-row">
                          <span className="landing-mock-thumb">
                            <MaterialIcon name="coffee" size={28} />
                          </span>
                          <span className="landing-mock-copy">
                            <span className="landing-mock-eyebrow">Їжа</span>
                            <strong>Кав’ярня поруч</strong>
                            <span>Оцінки з’являться, коли є відгуки</span>
                          </span>
                        </div>
                        <div className="landing-mock-chips">
                          <span className="landing-chip is-filled">Маршрут</span>
                          <span className="landing-chip">На мапі</span>
                        </div>
                      </div>
                    )}

                    {feature.id === "services" && (
                      <div className="landing-mock">
                        <span className="landing-mock-label">Демо</span>
                        <div className="landing-mock-chips">
                          <span className="landing-chip is-filled">Столик</span>
                          <span className="landing-chip">Квитки</span>
                          <span className="landing-chip">Запис</span>
                        </div>
                        <p className="landing-mock-note">Запит нікуди не надсилається.</p>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </StaggerGroup>
          </section>

          {/* Desire: why it is better, and who it is for. */}
          <section className="landing-block" aria-labelledby="landing-benefits-title">
            <Reveal>
              <p className="landing-eyebrow">Чому це зручніше</p>
              <h2 id="landing-benefits-title" className="landing-title">
                Менше пошуку, більше дороги.
              </h2>
            </Reveal>
            <StaggerGroup className="landing-benefit-grid">
              {BENEFITS.map((item) => (
                <motion.div key={item.title} className="landing-benefit" variants={staggerChild}>
                  <span className="landing-icon-tile">
                    <MaterialIcon name={item.icon} size={24} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </StaggerGroup>
          </section>

          <section className="landing-block" aria-labelledby="landing-cases-title">
            <Reveal>
              <p className="landing-eyebrow">Для кого</p>
              <h2 id="landing-cases-title" className="landing-title">
                Одна мапа для звичайного дня.
              </h2>
            </Reveal>
            <StaggerGroup className="landing-case-grid">
              {USE_CASES.map((item) => (
                <motion.article key={item.title} className="landing-card landing-case" variants={staggerChild}>
                  <span className="landing-icon-tile">
                    <MaterialIcon name={item.icon} size={24} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </motion.article>
              ))}
            </StaggerGroup>
          </section>

          {/* Steps: the path from opening the app to acting on it. */}
          <section id="steps" className="landing-block" aria-labelledby="landing-steps-title">
            <Reveal>
              <p className="landing-eyebrow">Як це працює</p>
              <h2 id="landing-steps-title" className="landing-title">
                Три кроки від відкриття до маршруту.
              </h2>
            </Reveal>
            <StaggerGroup className="landing-steps">
              {STEPS.map((step, index) => (
                <motion.li key={step.title} className="landing-step" variants={staggerChild}>
                  <span className="landing-step-number">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </motion.li>
              ))}
            </StaggerGroup>
          </section>

          {/* Trust: what each label means. Proof by transparency. */}
          <section id="data" className="landing-block" aria-labelledby="landing-data-title">
            <Reveal>
              <p className="landing-eyebrow">Чесно про дані</p>
              <h2 id="landing-data-title" className="landing-title">
                Кожна мітка каже, звідки вона.
              </h2>
              <p className="landing-lead-small">Ми не видаємо оцінки за факти й демо за реальні послуги.</p>
            </Reveal>
            <StaggerGroup className="landing-label-list">
              {LABELS.map((item) => (
                <motion.div key={item.tag} className="landing-label-row" variants={staggerChild}>
                  <span className={`landing-tag is-${item.tone}`}>{item.tag}</span>
                  <p>{item.text}</p>
                </motion.div>
              ))}
            </StaggerGroup>
          </section>

          {/* Objections: answer the doubts before the visitor voices them. */}
          <section id="faq" className="landing-block" aria-labelledby="landing-faq-title">
            <Reveal>
              <p className="landing-eyebrow">Питання</p>
              <h2 id="landing-faq-title" className="landing-title">
                Що найчастіше питають.
              </h2>
            </Reveal>
            <Reveal className="landing-faq-list">
              {FAQ.map((item) => (
                <details key={item.q} className="landing-faq-item">
                  <summary>
                    <span>{item.q}</span>
                    <MaterialIcon name="add" size={22} />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </Reveal>
          </section>

          {/* Action: the closing offer, repeated once the case is made. */}
          <Reveal className="landing-final-wrap">
            <section className="landing-final" aria-labelledby="landing-final-title">
              <h2 id="landing-final-title" className="landing-final-title">
                Відкрийте мапу міста.
              </h2>
              <p className="landing-final-lead">Безкоштовно, без реєстрації, у браузері.</p>
              <Button asChild size="lg" className="landing-btn landing-btn-primary">
                <a href={APP_HREF}>
                  <MaterialIcon name="map" size={20} />
                  Відкрити мапу
                </a>
              </Button>
            </section>
          </Reveal>
        </main>

        <footer className="landing-footer">
          <div className="landing-footer-top">
            <BrandLogo />
            <nav className="landing-footer-links" aria-label="Посилання внизу сторінки">
              <a href={APP_HREF}>Мапа</a>
              <a href="#features">Можливості</a>
              <a href="#faq">Питання</a>
              <a href="#data">Дані</a>
            </nav>
          </div>
                  </footer>
      </div>
    </MotionConfig>
  );
}
