import React from 'react';
import './FloatingActionButton.css';
import aiBucket from '../assets/ai-bucket.png';

const FloatingActionButton = ({ onClick, title = 'AI Action', likedCount = 0 }) => (
  <button className="fab" onClick={onClick} title={title}>
    <img src={aiBucket} alt="AI Action" className="fab-icon" />
    {likedCount > 0 && (
      <span className="fab-counter">{likedCount}</span>
    )}
  </button>
);

export default FloatingActionButton;
