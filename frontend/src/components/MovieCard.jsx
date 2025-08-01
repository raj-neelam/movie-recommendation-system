import React, { useState } from 'react';
import './MovieCard.css';
import likeIcon from '../assets/like.png';
import likedIcon from '../assets/liked.png';
import noMovieIcon from '../assets/no_movie_found.png';

const MovieCard = ({ movie, onClick, liked, onToggleLike }) => {
  const [imgSrc, setImgSrc] = useState(
    movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noMovieIcon
  );

  return (
  <div className={`movie-card${liked ? ' liked' : ''}`} onClick={() => onClick(movie.id, false)}>
      <div className="movie-poster">
        <img
          src={imgSrc}
          alt={movie.title || 'No Title Available'}
          onError={() => setImgSrc(noMovieIcon)}
        />
        <div className="movie-overlay">
          <div className="movie-title">{movie.title}</div>
          <div className="movie-meta">
            <span className="rating">★ {movie.vote_average || 'N/A'}</span>
            <span className="year">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
            <span className="duration">{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'}</span>
          </div>
          <div className="movie-details">
            <div className="genre-tags">
              {movie.genres && movie.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="tag">{genre.name}</span>
              ))}
            </div>
            <div className="director">Dir. {movie.director || 'Unknown'}</div>
          </div>
        </div>
      </div>
      <button
        className={`open-popup-button${liked ? ' always-visible' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike();
        }}
        aria-pressed={liked}
        title={liked ? 'remove from like list' : 'add to like list'}
      >
        <img
          src={liked ? likedIcon : likeIcon}
          alt={liked ? 'Unlike' : 'Like'}
          style={{ width: '24px', height: '24px', pointerEvents: 'none', filter: liked ? 'invert(1) grayscale(1) brightness(2)' : 'invert(1) grayscale(1) brightness(1.5)' }}
        />
      </button>
    </div>
  );
};

export default MovieCard;
