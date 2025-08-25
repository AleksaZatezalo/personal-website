import React from 'react';
import MatrixNavbar from '../MatrixNavbar';

const Forum = () => {
  return (
    <div>
      <MatrixNavbar />
      <div className="page-content">
        <div className="page-container">
          <h1 className="page-title">Forum</h1>
          <p className="page-description">
            Connect with fellow security researchers, ask questions, and share knowledge
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forum;