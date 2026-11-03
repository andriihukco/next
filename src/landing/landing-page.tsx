import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { MaterialIcon } from "../components/ui/material-icon";
import { spring } from "../lib/motion";
import { APP_HREF, FACTS, STEPS, FEATURES, USE_CASES, LABELS, FAQ } from "./landing-content";
import { CITIES_BY_STATUS, LIVE_CITIES } from "./landing-cities";
import { LandingChrome } from "./landing-chrome";
import { LandingLeadForm } from "./landing-lead-form";
import { LandingMapArt } from "./landing-map-art";
import { stagger, Reveal, staggerChild, StaggerGroup } from "./landing-motion";

const PAGE_TITLE = "NEXTCOM — міська мапа: транспорт наживо й місця в кожному місті";

/** FAQPage structured data, so search results can show the answers (schema.org). */
const FAQ_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "NEXTCOM",
      applicationCategory: "TravelApplication",
      operatingSystem: "Web",
      inLanguage: "uk",
      description:
        "Транспорт наживо, місця й довідник міста на одній мапі. Міста відкриваються по черзі.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
});

/**
 * Global landing at `/`: one product for many cities. It leads with the city list, not with one city.
 * Live cities link to their page and the app; the rest take a waitlist on their own page.
 * Copy follows DESIGN.md §1, §9, §13: no invented ratings, reviews, or numbers.
 */
export function LandingPage() {
  return (
    <LandingChrome title={PAGE_TITLE}>
      <main>
        {/* Attention: one promise for every city, and a picture of the city switch. */}
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow landing-rise" style={stagger(0)}>
              Міська мапа · Україна
            </p>
            <h1
              id="landing-hero-title"
              className="landing-hero-title landing-rise"
              style={stagger(1)}
            >
              Ваше місто на одній мапі.
            </h1>
            <p className="landing-lead landing-rise" style={stagger(2)}>
              Транспорт наживо, місця поруч і довідник міста. Кожне місто має свою мапу. Зараз
              працює Львів.
            </p>
            <div className="landing-cta-row landing-rise" style={stagger(3)}>
              <Button asChild size="lg" className="landing-btn landing-btn-primary">
                <a href={APP_HREF}>
                  <MaterialIcon name="map" size={20} />
                  Відкрити мапу Львова
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="landing-btn landing-btn-secondary"
              >
                <a href="#cities">Оберіть місто</a>
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
            <LandingMapArt />
            <motion.div
              className="landing-sheet"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.default, delay: 0.6 }}
            >
              {CITIES_BY_STATUS.slice(0, 3).map((city) => (
                <span key={city.slug} className="landing-sheet-city">
                  <strong>{city.name}</strong>
                  <span className={city.live ? "landing-city-live" : "landing-city-status"}>
                    {city.live ? "Працює" : "Незабаром"}
                  </span>
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Proof: three counted facts instead of adjectives. */}
        <section id="why" className="landing-facts" aria-label="Коротко про NEXTCOM">
          <StaggerGroup className="landing-facts-grid">
            {FACTS.map((fact) => (
              <motion.div key={fact.label} className="landing-fact" variants={staggerChild}>
                <p className="landing-fact-value">{fact.value}</p>
                <p className="landing-fact-label">{fact.label}</p>
                <p className="landing-fact-text">{fact.text}</p>
              </motion.div>
            ))}
          </StaggerGroup>
        </section>

        {/* Cities: the product is divided by city. Live first, the rest one page each. */}
        <section id="cities" className="landing-block" aria-labelledby="landing-cities-title">
          <Reveal>
            <p className="landing-eyebrow">Міста</p>
            <h2 id="landing-cities-title" className="landing-title">
              Оберіть місто.
            </h2>
            <p className="landing-lead-small">
              Кожне місто має свою сторінку й свою мапу. Зараз працює{" "}
              {LIVE_CITIES.map((city) => city.name).join(", ")}, решту відкриваємо по черзі.
            </p>
          </Reveal>
          <StaggerGroup className="landing-city-grid">
            {CITIES_BY_STATUS.map((city) => (
              <motion.a
                key={city.slug}
                href={`/${city.slug}`}
                className={`landing-card landing-city${city.live ? " is-live" : ""}`}
                variants={staggerChild}
                whileHover={{ y: -2 }}
                transition={spring.state}
              >
                <span className="landing-city-name">{city.name}</span>
                <span className="landing-city-status">{city.live ? "Працює" : "Незабаром"}</span>
              </motion.a>
            ))}
          </StaggerGroup>
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
                      <span className="landing-mock-label">Незабаром</span>
                      <div className="landing-mock-chips">
                        <span className="landing-chip is-filled">Столик</span>
                        <span className="landing-chip">Квитки</span>
                        <span className="landing-chip">Запис</span>
                      </div>
                      <p className="landing-mock-note">З’явиться з першими закладами.</p>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </StaggerGroup>
        </section>

        {/* Desire: who it is for. */}
        <section className="landing-block" aria-labelledby="landing-cases-title">
          <Reveal>
            <p className="landing-eyebrow">Для кого</p>
            <h2 id="landing-cases-title" className="landing-title">
              Одна мапа для звичайного дня.
            </h2>
          </Reveal>
          <StaggerGroup className="landing-case-grid">
            {USE_CASES.map((item) => (
              <motion.article
                key={item.title}
                className="landing-card landing-case"
                variants={staggerChild}
              >
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
            <p className="landing-lead-small">
              Ми не видаємо оцінки за факти й демо за реальні послуги.
            </p>
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

        {/* Leads: a waitlist for people and a contact form for venues. */}
        <section id="join" className="landing-block" aria-labelledby="landing-join-title">
          <Reveal>
            <p className="landing-eyebrow">Залишайтеся на зв’язку</p>
            <h2 id="landing-join-title" className="landing-title">
              Наступне — записи, квитки й нові міста.
            </h2>
          </Reveal>
          <Reveal className="landing-join-card">
            <LandingLeadForm />
          </Reveal>
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
              Відкрийте мапу свого міста.
            </h2>
            <p className="landing-final-lead">
              Безкоштовно, без реєстрації, у браузері. Львів уже працює.
            </p>
            <Button asChild size="lg" className="landing-btn landing-btn-primary">
              <a href={APP_HREF}>
                <MaterialIcon name="map" size={20} />
                Відкрити мапу Львова
              </a>
            </Button>
          </section>
        </Reveal>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />
    </LandingChrome>
  );
}
