import { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [movies, setMovies] = useState('');
  const [loading, setLoading] = useState(false);

  const getMovies = async () => {
  setLoading(true);

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000); // 10 sec hard stop

    const res = await fetch(
      fetch('https://movie-recommendation-frontend-two.vercel.app/', {
,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input }),
        signal: controller.signal
      }
    );

    const data = await res.json();
    setMovies(data.movies || "No recommendations");

  } catch (err) {
    setMovies("Server took too long to respond. Please retry.");
  }

  setLoading(false);
};

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h2>🎬 Movie Recommendation App</h2>

      <input
        placeholder="Enter your movie preference"
        onChange={e => setInput(e.target.value)}
        style={{ width: '300px', padding: '8px' }}
      />

      <br /><br />

      <button onClick={getMovies} disabled={loading}>
  {loading ? 'Fetching recommendations… (first load may take a few seconds)' : 'Get Recommendations'}
</button>


      <pre style={{ marginTop: 20 }}>
        {movies}
      </pre>
    </div>
  );
}

export default App;
