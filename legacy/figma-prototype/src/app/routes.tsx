import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { HomeScreen } from "./components/HomeScreen";
import { NewCorrectionScreen } from "./components/NewCorrectionScreen";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { CreditsPage } from "./components/CreditsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/home",
    Component: HomeScreen,
  },
  {
    path: "/credits",
    Component: CreditsPage,
  },
  {
    path: "/new-correction",
    Component: NewCorrectionScreen,
  },
  {
    path: "/processing",
    Component: ProcessingScreen,
  },
  {
    path: "/results/:sessionId",
    Component: ResultsScreen,
  },
]);
