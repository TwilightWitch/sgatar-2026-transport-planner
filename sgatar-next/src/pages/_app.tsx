/**
 * @file Next.js custom App.
 *
 * Wraps every Pages Router page with the global CSS, React Query client, and
 * i18n provider.  Equivalent to the App Router root layout but without any
 * server-only imports so it is safe to run on the client.
 */
import type { AppProps } from "next/app";
import Head from "next/head";
import { Providers } from "../providers";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SGATAR 2026 Transport Planner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </>
  );
}
