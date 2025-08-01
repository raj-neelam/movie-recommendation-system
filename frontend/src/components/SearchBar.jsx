import React, { useState, useEffect, useRef } from 'react';


const SearchBar = ({
  movieId,
  setMovieId,
  fetchMovieDetails,
  suggestions,
  fadeOut,
  setFadeOut,
  setSuggestions,
  handleInputChange,
  handleKeyPress,
  onSuggestionSelect
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  // Reset selectedIndex when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Keyboard navigation handler
  const handleInputKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const movie = suggestions[selectedIndex];
        setMovieId(movie.title);
        if (onSuggestionSelect) {
          onSuggestionSelect(movie.tmdbId);
        } else {
          fetchMovieDetails(movie.tmdbId);
        }
        setFadeOut(true);
        setTimeout(() => setSuggestions([]), 500);
      } else if (handleKeyPress) {
        handleKeyPress(e);
      }
    }
  };

  // Mouse click handler for suggestions
  const handleSuggestionClick = (movie) => {
    setMovieId(movie.title);
    if (onSuggestionSelect) {
      onSuggestionSelect(movie.tmdbId);
    } else {
      fetchMovieDetails(movie.tmdbId);
    }
    setFadeOut(true);
    setTimeout(() => setSuggestions([]), 500);
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter TMDb Movie ID or Name"
          value={movieId}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <button onClick={() => fetchMovieDetails(movieId)}>Search</button>
      </div>
      {suggestions.length > 0 && (
        <ul className={`suggestions-list${fadeOut ? ' fade-out' : ''}`}>
          {suggestions.map((movie, index) => (
            <li
              key={index}
              className={`suggestion-item${index === selectedIndex ? ' selected' : ''}`}
              onClick={() => handleSuggestionClick(movie)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: index === selectedIndex ? '#333' : undefined }}
            >
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {movie.title} {movie.year ? <span style={{ color: '#b0b0b0' }}>({movie.year})</span> : ''}
              </span>
              <span style={{ minWidth: 48, textAlign: 'right', color: '#ffd700', fontWeight: 600 }}>
                {movie.average_rating ? movie.average_rating.toFixed(1) : 'N/A'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
