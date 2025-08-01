import React from 'react';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="header-title">
        <h1>Movie Recommendation System</h1>
      </div>
      <a
        href="https://github.com/raj-neelam"
        target="_blank"
        rel="noopener noreferrer"
        title="Visit raj-neelam on GitHub"
        className="created-by floating-created-by"
      >
        ― created by
        <img
          src="https://github.com/raj-neelam.png"
          alt="raj-neelam GitHub Avatar"
          className="github-avatar-img"
        />
        <span className="created-by-name">Raj Gaurav</span>
      </a>
    </div>
  </header>
);

export default Header;
