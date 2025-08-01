
import React, { useRef, useEffect, useState } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://movie-recommendation-system-unbf.onrender.com";
import { fetchSimilarMovies } from '../utils/fetchSimilarMovies';
import { fetchMovieDetailsWithCredits } from '../utils/fetchMovieDetails';
import './AISuggestedContent.css';
import MovieCard from './MovieCard';
import Popup from './Popup';
import generatedImage from '../assets/generated-image-removebg-preview.png';

const AISuggestedContent = ({ likedMovies = [], onBack, onClear, onToggleLike }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [cachedDetails, setCachedDetails] = useState({});
  const [cachedSimilar, setCachedSimilar] = useState({});

  // When a recommended movie is liked, add to liked list, remove from recommendations, and fetch its similar movies
  const handleLikeRecommended = async (movieId) => {
    if (!movieId || likedMovies.some(lm => lm.id === movieId)) return;
    if (onToggleLike) onToggleLike(movieId);
    // Fetch similar movies for this new liked movie and merge
    const API_KEY = 'b537250515e995f02fabcdea18ff9124';
    try {
      const response = await fetch(`${API_BASE_URL}/similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_ids: [movieId] }),
      });
      if (!response.ok) return;
      const data = await response.json();
      let allSimilar = Object.values(data).flat()
        .filter(m => m.id && (m.title || m.name))
        .map(m => ({ ...m, title: m.title || m.name }));
      // Remove liked movies from results
      allSimilar = allSimilar.filter(m => !likedMovies.some(lm => lm.id === m.id) && m.id !== movieId);
      // Sort by similarity (descending)
      allSimilar.sort((a, b) => (b.similarity ?? b.distance ?? 0) - (a.similarity ?? a.distance ?? 0));
      // Fetch full details for each similar movie
      const detailsPromises = allSimilar.map(async (sim) => {
        const details = await fetchMovieDetailsWithCredits(sim.id, API_KEY);
        return details ? { ...details, similarity: sim.similarity, distance: sim.distance } : null;
      });
      const detailedMovies = (await Promise.all(detailsPromises)).filter(Boolean);
      // Merge with existing similarMovies, remove duplicates, sort
      setSimilarMovies(prev => {
        const all = [...prev, ...detailedMovies].filter(m => !likedMovies.some(lm => lm.id === m.id));
        const seen = new Set();
        const unique = all.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id); return true;
        });
        unique.sort((a, b) => (b.similarity ?? b.distance ?? 0) - (a.similarity ?? a.distance ?? 0));
        return unique;
      });
    } catch {}
  };

  // Cache details and similar movies for each liked movie as soon as it is liked
  useEffect(() => {
    const API_KEY = 'b537250515e995f02fabcdea18ff9124';
    likedMovies.forEach(async (movie) => {
      if (!movie.id || cachedDetails[movie.id]) return;
      // Fetch details
      const details = await fetchMovieDetailsWithCredits(movie.id, API_KEY);
      setCachedDetails(prev => ({ ...prev, [movie.id]: details }));
      // Fetch similar movies
      try {
        const response = await fetch(`${API_BASE_URL}/similar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movie_ids: [movie.id] }),
        });
        if (!response.ok) return;
        const data = await response.json();
        let allSimilar = Object.values(data).flat()
          .filter(m => m.id && (m.title || m.name))
          .map(m => ({ ...m, title: m.title || m.name }));
        // Remove liked movies from results
        allSimilar = allSimilar.filter(m => !likedMovies.some(lm => lm.id === m.id));
        // Sort by similarity (descending)
        allSimilar.sort((a, b) => (b.similarity ?? b.distance ?? 0) - (a.similarity ?? a.distance ?? 0));
        // Fetch full details for each similar movie
        const detailsPromises = allSimilar.map(async (sim) => {
          const details = await fetchMovieDetailsWithCredits(sim.id, API_KEY);
          return details ? { ...details, similarity: sim.similarity, distance: sim.distance } : null;
        });
        const detailedMovies = (await Promise.all(detailsPromises)).filter(Boolean);
        setCachedSimilar(prev => ({ ...prev, [movie.id]: detailedMovies }));
      } catch {}
    });
  }, [likedMovies]);

  // When opening the AI page, show all cached similar movies instantly
  useEffect(() => {
    // Combine all cached similar movies, remove duplicates, sort by similarity
    let all = Object.values(cachedSimilar).flat();
    // Remove liked movies
    all = all.filter(m => !likedMovies.some(lm => lm.id === m.id));
    // Remove duplicates by id
    const seen = new Set();
    all = all.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id); return true;
    });
    // Sort by similarity (descending)
    all.sort((a, b) => (b.similarity ?? b.distance ?? 0) - (a.similarity ?? a.distance ?? 0));
    setSimilarMovies(all);
  }, [cachedSimilar, likedMovies]);
  const carouselRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const visibleCount = 7;
  const cardWidth = 220;
  const gap = 24;
  const totalMovies = likedMovies.length;
  const isLoopScroll = totalMovies >= visibleCount;

  // Animate leftward continuously
  useEffect(() => {
    if (!isLoopScroll || totalMovies === 0 || isPaused) return;
    const interval = setInterval(() => {
      setOffset((prev) => {
        const maxOffset = totalMovies * (cardWidth + gap);
        const newOffset = prev + 1;
        if (newOffset >= maxOffset) {
          return 0;
        }
        return newOffset;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isLoopScroll, totalMovies, isPaused, cardWidth, gap]);

  // Reset offset if not scrolling
  useEffect(() => {
    if (!isLoopScroll) setOffset(0);
  }, [isLoopScroll]);

  // Use duplicates only if scrolling is enabled
  const moviesToRender = isLoopScroll ? [...likedMovies, ...likedMovies, ...likedMovies] : likedMovies;

  return (
    <div className="ai-suggested-overlay">
      {/* Top bar with back and clear selection buttons */}
      <div className="ai-top-bar">
        <button className="ai-back-btn-popup" onClick={onBack}>
          <span className="arrow">&#8592;</span> Back
        </button>
        <div style={{ flex: 1 }}></div>
        <button
          className="ai-clear-btn-blue"
          onClick={onClear}
          disabled={likedMovies.length === 0}
        >
          Clear Selection
        </button>
      </div>

      {/* Liked movies row */}
      <div className="ai-liked-row-bar">
        <span className="ai-liked-title">Liked Movies</span>
        <div
          className="carousel-container"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="carousel-viewport">
            <div
              className="ai-liked-moviecard-row"
              ref={carouselRef}
              style={{
                transform: `translateX(-${offset}px)`,
                transition: 'none',
              }}
            >
              {moviesToRender.length === 0
                ? <span className="ai-empty">No liked movies yet.</span>
                : moviesToRender.map((movie, idx) => (
                    <MovieCard
                      key={movie.id + '-' + idx}
                      movie={movie}
                      liked={true}
                      onToggleLike={() => onToggleLike && onToggleLike(movie.id)}
                      onClick={() => setSelectedMovie(movie)}
                      showLikeButton={true}
                      cardSize="large"
                    />
                  ))}
            </div>
          </div>
        </div>
        <hr className="ai-fade-hr-inline" />

        {/* Similar movies section */}
        <div className="ai-similar-movies-section">
          <div style={{ position: 'sticky', top: 0, background: 'rgba(20,20,20,0.98)', zIndex: 2, paddingTop: '8px' }}>
            <span className="ai-similar-title" style={{ color: '#fff', fontWeight: 'bold', fontSize: '22px', display: 'block' }}>
              Recommended For You
            </span>
            <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '12px' }}>
              (based on your like list)
            </div>
          </div>
          <div className="ai-similar-movie-grid">
            {similarMovies.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', width: '100%' }}>
                <img
                  src={generatedImage}
                  alt="No recommendations"
                  style={{ filter: 'brightness(0) invert(1)', opacity: 0.7, maxWidth: '220px', maxHeight: '220px', marginBottom: '12px' }}
                />
              </div>
            ) : (
              similarMovies.map((movie, idx) => (
                <MovieCard
                  key={movie.id + '-' + idx}
                  movie={movie}
                  liked={likedMovies.some(lm => lm.id === movie.id)}
                  onToggleLike={() => handleLikeRecommended(movie.id)}
                  onClick={() => setSelectedMovie(movie)}
                  showLikeButton={true}
                  cardSize="large"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Popup */}
      <Popup movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
};

export default AISuggestedContent;
