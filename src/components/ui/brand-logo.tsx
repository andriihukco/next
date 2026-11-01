/**
 * @file brand-logo.tsx
 * @description The "NEXTCOM" wordmark. Single source for the header and onboarding.
 * Letters use `currentColor`; the chevron uses the primary token.
 */

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg width="131" height="20" viewBox="0 0 131 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXTCOM" role="img" className={className}>
    <text x="0" y="19.6" fill="currentColor" fontFamily="Manrope, sans-serif" fontSize="27" fontWeight="800" textLength="110" lengthAdjust="spacingAndGlyphs">NEXTCOM</text>
    <g transform="translate(40 0)">
    <path d="M78.4895 20L85.371 10.3019L78.4895 0.603699H83.4506L90.3321 10.3019L83.4506 20H78.4895Z" fill="var(--primary)"/>
    </g>
    </svg>
  );
}
