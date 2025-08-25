import React from 'react';
import MatrixNavbar from '../MatrixNavbar';

const Blog = () => {
  return (
    <div>
      <MatrixNavbar />
      <div className="page-content">
        <div className="page-container">
          <h1 className="page-title">Blog</h1>
          <p className="page-description">
            Latest security research, tutorials, and insights from the DefCon Belgrade community
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blog;