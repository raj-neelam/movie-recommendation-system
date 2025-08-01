import React from 'react';
import './Popup.css';

const Popup = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className="movie-details-page">
      <button className="back-button" onClick={onClose}>
        <span className="arrow">←</span> Back
      </button>

      {/* Background Image with Overlay */}
      <div className="background-container">
        <img
          src={movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : './assets/no_movie_found.png'}
          alt="Movie Background"
          className="background-image"
        />
        <div className="background-overlay"></div>
      </div>

      {/* Content */}
      <div className="content-container">
        {/* Left Side - Movie Poster */}
        <div className="poster-section">
          <div className="poster-card">
            <img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : './assets/no_movie_found.png'}
              alt={movie.title || 'No Title Available'}
              className="poster-image"
            />
            <div className="streaming-badge">
              Available on
              <img
                src="https://www.immo-pontissalien.fr/assets/images/logo-youtube.png"
                alt="YouTube"
                style={{ height: '20px', verticalAlign: 'middle', marginLeft: '5px' }}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Movie Information */}
        <div className="info-section">
          <div className="movie-header">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="movie-subtitle">
              <span className="rating-badge">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
              <span className="release-date">{movie.release_date || 'N/A'}</span>
              <span className="genres">{movie.genres ? movie.genres.map((g) => g.name).join(', ') : 'N/A'}</span>
              <span className="duration">{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'}</span>
            </div>
          </div>

          <div className="rating-section">
            <div
              className="rating-disc"
              style={{ '--rating': movie.vote_average ? (movie.vote_average / 10) * 10 : 0 }}
            >
              <span className="rating-number">
                {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>

          <button
            className="btn-play-trailer"
            onClick={() => {
              const searchQuery = encodeURIComponent(`${movie.title} trailer`);
              window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
            }}
          >
            <span className="play-icon">▶</span>
            Play Trailer
          </button>

          <div className="movie-description">
            <p className="tagline">{movie.tagline || 'Experience the story'}</p>
            <div className="overview">
              <h3>Overview</h3>
              <p>{movie.overview || 'No overview available for this movie.'}</p>
            </div>
          </div>

          <div className="crew-info">
            <div className="director-info">
              <h4>{movie.director || 'Unknown Director'}</h4>
              <p>Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
