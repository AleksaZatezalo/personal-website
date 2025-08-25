import React from 'react';
import MatrixNavbar from '../MatrixNavbar';

const Login = () => {
  return (
    <div>
      <MatrixNavbar />
      <div className="page-content">
        <div className="page-container">
          <h1 className="page-title">Login</h1>
          <p className="page-description">
            Access your DefCon Belgrade member account
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;