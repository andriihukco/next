import { useEffect, type ReactNode } from "react";
import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import { Button } from "../components/ui/button";
import { BrandLogo } from "../components/ui/brand-logo";
import { LegalFooter } from "../legal/legal-footer";
import { APP_HREF } from "./landing-content";
import "./landing.css";

export type LandingNavLink = { href: string; label: string };

const GLOBAL_NAV: LandingNavLink[] = [
  { href: "#cities", label: "Міста" },
  { href: "#features", label: "Можливості" },
  { href: "#steps", label: "Як це працює" },
  { href: "#faq", label: "Питання" },
];

const GLOBAL_FOOTER: LandingNavLink[] = [
  ...GLOBAL_NAV,
  { href: "#join", label: "Для закладів" },
  { href: "#data", label: "Дані" },
];

/**
 * Shared frame of every landing page: scroll progress, the sticky nav, the footer.
 * The global page passes its section links; a city page links back to the city list.
 */
export function LandingChrome({
  title,
  navLinks = GLOBAL_NAV,
  footerLinks = GLOBAL_FOOTER,
  children,
}: {
  title: string;
  navLinks?: LandingNavLink[];
  footerLinks?: LandingNavLink[];
  children: ReactNode;
}) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing">
        <motion.div className="landing-progress" style={{ scaleX: progress }} aria-hidden="true" />

        <header className="landing-nav">
          <div className="landing-nav-inner">
            <a href="/" className="landing-brand" aria-label="NEXTCOM, головна">
              <BrandLogo />
            </a>
            <nav className="landing-nav-links" aria-label="Розділи сторінки">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
            <Button asChild size="sm" className="landing-btn landing-btn-primary landing-btn-nav">
              <a href={APP_HREF}>Відкрити мапу</a>
            </Button>
          </div>
        </header>

        {children}

        <footer className="landing-footer">
          <div className="landing-footer-top">
            <BrandLogo />
            <nav className="landing-footer-links" aria-label="Посилання внизу сторінки">
              <a href={APP_HREF}>Мапа</a>
              {footerLinks.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <LegalFooter />
        </footer>
      </div>
    </MotionConfig>
  );
}
