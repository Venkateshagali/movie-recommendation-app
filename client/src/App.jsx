import { useMemo, useState } from "react";
import "./App.css";

const DEFAULT_BACKEND = "https://movie-recommendation-backend-beryl.vercel.app";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : DEFAULT_BACKEND);

function App() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => query.trim().length > 0 && !loading, [query, loading]);

  const getRecommendations = async () => {
    const userInput = query.trim();
    if (!userInput) return;

    setLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setHistory((prev) => [
        {
          id: Date.now(),
          input: userInput,
          output: data.movies || "No recommendations received.",
        },
        ...prev,
      ]);
      setQuery("");
    } catch (err) {
      setError(
        err?.name === "AbortError"
          ? "Request timed out. Please try again."
          : err?.message || "Server error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">AI Powered</p>
        <h1>Movie Recommendation Assistant</h1>
        <p className="subtitle">
          Describe your taste and get 5 curated movie picks with short reasons.
        </p>

        <div className="composer">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: I like mind-bending sci-fi thrillers with strong plot twists."
            rows={4}
          />
          <button onClick={getRecommendations} disabled={!canSubmit}>
            {loading ? "Finding recommendations..." : "Get Recommendations"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="meta">
          <span>Backend: {API_BASE_URL}</span>
        </div>
      </section>

      <section className="history">
        {history.length === 0 ? (
          <div className="empty">
            <p>Your recommendations will appear here.</p>
          </div>
        ) : (
          history.map((item) => (
            <article key={item.id} className="message">
              <div className="question">You: {item.input}</div>
              <pre className="answer">{item.output}</pre>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
