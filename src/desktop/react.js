// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Component imports
import reportWebVitals from "./vitals.js";
import DesktopComponent from "./desktop.js";

// Create the root element
const element = document.getElementById("root");
export default ReactApp = createRoot(element).render(<DesktopComponent />);

reportWebVitals();