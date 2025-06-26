// pages/_app.js
import "/pages/style.css";
import { GoogleAnalytics } from "nextjs-google-analytics";
import localFont from 'next/font/local'

const myFont = localFont({
  src: './fonts/switzer-regular.woff2',
})

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        body {
          font-family: ${myFont.style.fontFamily};
        }
      `}</style>
      <GoogleAnalytics trackPageViews gaMeasurementId="G-K1DWDNGBKV" />
      <Component {...pageProps} />
    </>
  );
}
