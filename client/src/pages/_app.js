import "@/styles/globals.css";
// TrackingProvider को इम्पोर्ट करें (सुनिश्चित करें कि पाथ सही है)
import { TrackingProvider } from "../context/TrackingContext"; 

export default function App({ Component, pageProps }) {
  return (
    <TrackingProvider>
      <Component {...pageProps} />
    </TrackingProvider>
  );
}