import "./App.css";
import { useEffect } from "react";
import { BenchmarksPage } from "./pages/BenchmarksPage";
import { CanvasPage } from "./pages/CanvasPage";
import { DocsPage } from "./pages/DocsPage";
import { HomePage } from "./pages/HomePage";

const routeForPath = (pathname: string) => {
  const route = pathname.replace(/\/+$/, "") || "/";
  switch (route) {
    case "/canvas":
      return <CanvasPage />;
    case "/docs":
      return <DocsPage />;
    case "/benchmarks":
      return <BenchmarksPage />;
    default:
      return <HomePage />;
  }
};

function App() {
  useEffect(() => {
    const route = window.location.pathname.replace(/\/+$/, "") || "/";
    const titles: Record<string, string> = {
      "/": "DrawMCP — One live canvas for people and agents",
      "/canvas": "DrawMCP Canvas",
      "/docs": "DrawMCP Docs",
      "/benchmarks": "DrawMCP Benchmarks",
    };
    document.title = titles[route] ?? titles["/"];
  }, []);

  return routeForPath(window.location.pathname);
}

export default App;
