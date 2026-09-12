import { createRoot } from "react-dom/client";
import { ChronoExperience } from "./ChronoExperience";
import { ServiceWorkerRegistration } from "./components/ServiceWorkerRegistration";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <>
    <ChronoExperience />
    <ServiceWorkerRegistration />
  </>,
);
