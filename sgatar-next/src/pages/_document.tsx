/**
 * @file Next.js custom Document.
 *
 * Sets the HTML shell used by all Pages Router pages.  Only runs on the
 * server; no event handlers or client-side state here.
 *
 * Contains:
 * - Favicon links
 * - SVG feColorMatrix filters for colorblind simulation modes
 * - Anti-flash inline script that restores the user's saved theme before
 *   React hydrates (prevents a white flash on dark/colorblind modes)
 */
import { Head, Html, Main, NextScript } from "next/document";

/** Inline script source — must be pure JS with no template literals or
 *  modern syntax to survive Next.js's script inlining. */
const THEME_INIT_SCRIPT = `(function(){try{
  var m=localStorage.getItem('sgatar-theme')||'light';
  var h=document.documentElement;
  h.className='';
  if(m==='dark')h.classList.add('dark');
  else if(m==='protanopia')h.classList.add('cb-protanopia');
  else if(m==='deuteranopia')h.classList.add('cb-deuteranopia');
  else if(m==='tritanopia')h.classList.add('cb-tritanopia');
  else if(m==='high-contrast')h.classList.add('high-contrast');
}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta
          name="description"
          content="Live operational transport management for SGATAR 2026 conference"
        />
        <link rel="icon" href="/SGATAR-2026-Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/SGATAR-2026-Logo.png" />
      </Head>
      <body>
        {/*
         * Anti-flash theme initialisation — runs synchronously before first
         * paint so the user never sees a white flash when dark/CB mode is set.
         */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        {/*
         * Hidden SVG housing the colour-blindness simulation filter matrices.
         * Referenced by globals.css rules: filter: url(#filter-protanopia) etc.
         *
         * Matrices are Brettel / Vienot (1999) standard values for dichromacy
         * simulation.  They show how the UI appears to users with each condition
         * so operators and developers can verify colour is not the sole
         * differentiator for any status indicator.
         */}
        <svg
          aria-hidden="true"
          focusable="false"
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
          }}
        >
          <defs>
            {/* Protanopia — missing L (red) cones */}
            <filter
              id="filter-protanopia"
              colorInterpolationFilters="linearRGB"
            >
              <feColorMatrix
                type="matrix"
                values="0.567 0.433 0     0 0
                        0.558 0.442 0     0 0
                        0     0.242 0.758 0 0
                        0     0     0     1 0"
              />
            </filter>
            {/* Deuteranopia — missing M (green) cones */}
            <filter
              id="filter-deuteranopia"
              colorInterpolationFilters="linearRGB"
            >
              <feColorMatrix
                type="matrix"
                values="0.625 0.375 0     0 0
                        0.700 0.300 0     0 0
                        0     0.300 0.700 0 0
                        0     0     0     1 0"
              />
            </filter>
            {/* Tritanopia — missing S (blue) cones */}
            <filter
              id="filter-tritanopia"
              colorInterpolationFilters="linearRGB"
            >
              <feColorMatrix
                type="matrix"
                values="0.950 0.050 0     0 0
                        0     0.433 0.567 0 0
                        0     0.475 0.525 0 0
                        0     0     0     1 0"
              />
            </filter>
          </defs>
        </svg>

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
