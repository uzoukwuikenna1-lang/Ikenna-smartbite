import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Configures the root HTML for every web page during static rendering.
 * Adds the PWA manifest + Apple "Add to Home Screen" meta so the site installs
 * as a standalone app on iOS and Android.
 * (This file has no effect on native.)
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#15803D" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS "Add to Home Screen" */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SmartBite FUTO" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preload the Ionicons font so icons render on first paint (avoids the
            flash of wrong/garbled glyphs while @expo/vector-icons loads it async). */}
        <link rel="preload" href="/fonts/Ionicons.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />

        {/* Background + eagerly register the Ionicons web font. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background-color:#15803D;}
@font-face{font-family:'Ionicons';src:url('/fonts/Ionicons.ttf') format('truetype');font-display:block;}`,
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
