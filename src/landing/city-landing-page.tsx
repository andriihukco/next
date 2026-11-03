import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { MaterialIcon } from "../components/ui/material-icon";
import { spring } from "../lib/motion";
import { APP_HREF, FEATURES, LABELS } from "./landing-content";
import { CITIES, citySource, type City } from "./landing-cities";
import { LandingChrome } from "./landing-chrome";
import { LandingLeadForm } from "./landing-lead-form";
import { LandingMapArt } from "./landing-map-art";
import { stagger, Reveal, staggerChild, StaggerGroup } from "./landing-motion";

/**
 * One page per city at `/<slug>`. A live city sends visitors into its map. A city that is not
 * live yet takes a waitlist for that city only, and never gives a date.
 */
export function CityLandingPage({ city }: { city: City }) {
  const others = CITIES.filter((item) => item.slug !== city.slug);
  const mapOfCity = city.genitive ? `мапу ${city.genitive}` : "мапу міста";

  return (
    <LandingChrome
      title={
        city.live
          ? `NEXTCOM — ${city.name}: транспорт наживо й місця на мапі`
          : `NEXTCOM — ${city.name}: мапа міста в черзі`
      }
      navLinks={[
        { href: "/#cities", label: "Міста" },
        { href: "/#features", label: "Можливості" },
        { href: "#faq", label: "Питання" },
      ]}
      footerLinks={[
        { href: "/#cities", label: "Міста" },
        { href: "/#features", label: "Можливості" },
        { href: "/#faq", label: "Питання" },
      ]}
    >
      <main>
        <section className="landing-hero" aria-labelledby="landing-city-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow landing-rise" style={stagger(0)}>
              {city.live ? `${city.name} · жива мапа` : `${city.name} · у черзі`}
            </p>
            <h1
              id="landing-city-title"
              className="landing-hero-title landing-rise"
              style={stagger(1)}
            >
              {city.live ? `${city.name} на одній мапі.` : `${city.name}: мапа скоро.`}
            </h1>
            <p className="landing-lead landing-rise" style={stagger(2)}>
              {city.live
                ? "Автобуси, трамваї й тролейбуси наживо, місця поруч і довідник міста. Без реєстрації."
                : "Транспорт наживо, місця поруч і довідник міста ще не відкриті. Поки що працює Львів."}
            </p>
            <div className="landing-cta-row landing-rise" style={stagger(3)}>
              {city.live ? (
                <Button asChild size="lg" className="landing-btn landing-btn-primary">
                  <a href={APP_HREF}>
                    <MaterialIcon name="map" size={20} />
                    Відкрити {mapOfCity}
                  </a>
                </Button>
              ) : (
                <Button asChild size="lg" className="landing-btn landing-btn-primary">
                  <a href="#join">Залишити пошту</a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="landing-btn landing-btn-secondary"
              >
                <a href={city.live ? "/#cities" : "/lviv"}>
                  {city.live ? "Усі міста" : "Відкрити Львів"}
                </a>
              </Button>
            </div>
            <p className="landing-microcopy landing-rise" style={stagger(4)}>
              {city.live
                ? "Без реєстрації. Працює в браузері."
                : "Безкоштовно. Лише лист, коли місто відкриється."}
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
              <span className="landing-sheet-copy">
                <strong>{city.name}</strong>
                <span>{city.live ? "Транспорт і місця на мапі" : "Місто в черзі"}</span>
              </span>
              <span className={city.live ? "landing-chip is-filled" : "landing-chip"}>
                {city.live ? "Працює" : "Незабаром"}
              </span>
            </motion.div>
          </motion.div>
        </section>

        {city.live ? (
          <>
            <section className="landing-block" aria-labelledby="landing-city-features-title">
              <Reveal>
                <p className="landing-eyebrow">Що є в {city.name}</p>
                <h2 id="landing-city-features-title" className="landing-title">
                  Транспорт, місця й довідник.
                </h2>
              </Reveal>
              <StaggerGroup className="landing-case-grid">
                {FEATURES.map((feature) => (
                  <motion.article
                    key={feature.id}
                    className="landing-card landing-case"
                    variants={staggerChild}
                  >
                    <span className="landing-icon-tile">
                      <MaterialIcon name={feature.icon} size={24} />
                    </span>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </motion.article>
                ))}
              </StaggerGroup>
            </section>

            <section className="landing-block" aria-labelledby="landing-city-data-title">
              <Reveal>
                <p className="landing-eyebrow">Чесно про дані</p>
                <h2 id="landing-city-data-title" className="landing-title">
                  Кожна мітка каже, звідки вона.
                </h2>
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
          </>
        ) : (
          <section id="join" className="landing-block" aria-labelledby="landing-city-join-title">
            <Reveal>
              <p className="landing-eyebrow">Залишайтеся на зв’язку</p>
              <h2 id="landing-city-join-title" className="landing-title">
                Напишемо, коли відкриємо {city.name}.
              </h2>
              <p className="landing-lead-small">
                Поки що місто в черзі. Ми не називаємо дати, доки мапа не готова.
              </p>
            </Reveal>
            <Reveal className="landing-join-card">
              <LandingLeadForm source={citySource(city)} cityName={city.name} />
            </Reveal>
          </section>
        )}

        <section className="landing-block" aria-labelledby="landing-city-others-title">
          <Reveal>
            <p className="landing-eyebrow">Інші міста</p>
            <h2 id="landing-city-others-title" className="landing-title">
              Оберіть інше місто.
            </h2>
          </Reveal>
          <Reveal className="landing-city-links">
            {others.map((item) => (
              <a key={item.slug} href={`/${item.slug}`} className="landing-chip">
                {item.name}
                {item.live && <span className="landing-city-links-live">Працює</span>}
              </a>
            ))}
          </Reveal>
        </section>

        <Reveal className="landing-final-wrap">
          <section className="landing-final" aria-labelledby="landing-city-final-title">
            <h2 id="landing-city-final-title" className="landing-final-title">
              {city.live ? `Відкрийте ${mapOfCity}.` : "Поки що відкрийте Львів."}
            </h2>
            <p className="landing-final-lead">Безкоштовно, без реєстрації, у браузері.</p>
            <Button asChild size="lg" className="landing-btn landing-btn-primary">
              <a href={city.live ? APP_HREF : "/lviv"}>
                <MaterialIcon name="map" size={20} />
                {city.live ? `Відкрити ${mapOfCity}` : "Мапа Львова"}
              </a>
            </Button>
          </section>
        </Reveal>
      </main>
    </LandingChrome>
  );
}
