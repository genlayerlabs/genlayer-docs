// pages/_app.js
import "/pages/style.css";
import { GoogleAnalytics } from "nextjs-google-analytics";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <GoogleAnalytics trackPageViews gaMeasurementId="G-K1DWDNGBKV" />
      <Component {...pageProps} />
    </>
  );
}
