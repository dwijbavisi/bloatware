import React from "react";
import ReactDOM from "react-dom/client";

function App(): JSX.Element {
    return (
        <main style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", padding: "2rem" }}>
            <h1>bloatware-site</h1>
            <p>This Vite app is scaffolded for development tooling.</p>
            <p>Run <code>npm run build:static</code> to generate the static site from markdown.</p>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("app")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
