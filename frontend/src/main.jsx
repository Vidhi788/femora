import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/dark.css";
   import { initTheme } from "./theme.js";
   initTheme();


const container = document.getElementById("root");

container.querySelector(".boot-splash")?.remove();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
