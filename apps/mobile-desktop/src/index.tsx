import React from "react";
import { createRoot } from "react-dom/client";
import { AppRegistry } from "react-native";
import App from "./App";

// Register the app
AppRegistry.registerComponent("LearnApp", () => App);

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Remove loading spinner
const loadingElement = document.getElementById("loading");
if (loadingElement) {
  loadingElement.remove();
}

// Render the app
const root = createRoot(rootElement);

// Get the application wrapper
AppRegistry.runApplication("LearnApp", {
  rootTag: rootElement,
});
