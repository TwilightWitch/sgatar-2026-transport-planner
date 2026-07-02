/**
 * @file Next.js custom App.
 *
 * Wraps every Pages Router page with the global CSS, React Query client, and
 * i18n provider.  Equivalent to the App Router root layout but without any
 * server-only imports so it is safe to run on the client.
 */
import type { AppProps } from "next/app";
import { Source_Sans_3 } from "next/font/google";
import Head from "next/head";
import { Providers } from "../providers";
import "../styles/globals.css";

/**
 * Source Sans 3 is the renamed successor to Source Sans Pro — same typeface,
 * same metrics, fully backwards-compatible.  Using `className` applies the
 * font-family directly to the wrapper element so all children inherit it
 * without needing a CSS variable.
 */
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SGATAR 2026 Transport Planner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* className applies font-family directly; all descendants inherit */}
      <div className={sourceSans.className}>
        <Providers>
          <Component {...pageProps} />
        </Providers>
      </div>
    </>
  );
}
