/**
 * @file Next.js custom Document.
 *
 * Sets the HTML shell used by all Pages Router pages.  Only runs on the
 * server; no event handlers or client-side state here.
 */
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta
          name="description"
          content="Live operational transport management for SGATAR 2026 conference"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
