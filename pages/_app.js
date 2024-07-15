// pages/_app.js
import { GoogleAnalytics } from 'nextjs-google-analytics'

const App = ({ Component, pageProps }) => {
  return (
    <>
      <GoogleAnalytics trackPageViews gaMeasurementId="G-RC7Z1GKQH2" />
      <Component {...pageProps} />
    </>
  )
}

export default App
