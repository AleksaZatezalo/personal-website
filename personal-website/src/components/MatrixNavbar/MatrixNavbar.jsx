import React, { useState, useEffect } from 'react';

const MatrixNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Matrix Rain Effect
  useEffect(() => {
    const createMatrixRain = () => {
      const container = document.getElementById('matrix-bg');
      if (!container) return;

      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      
      const createColumn = () => {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = Math.random() * 100 + 'vw';
        column.style.animationDuration = (Math.random() * 3 + 2) + 's';
        column.style.opacity = Math.random() * 0.5 + 0.3;
        
        let text = '';
        const length = Math.random() * 20 + 10;
        for (let i = 0; i < length; i++) {
          text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
        }
        column.innerHTML = text;
        
        container.appendChild(column);
        
        setTimeout(() => {
          if (column.parentNode) {
            column.parentNode.removeChild(column);
          }
        }, 5000);
      };
      
      // Create initial columns
      for (let i = 0; i < 50; i++) {
        setTimeout(createColumn, i * 100);
      }
      
      // Continue creating columns
      const interval = setInterval(createColumn, 150);
      
      return () => clearInterval(interval);
    };

    const cleanup = createMatrixRain();
    return cleanup;
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e) => {
    const logo = e.target;
    logo.style.animation = 'none';
    setTimeout(() => {
      logo.style.animation = 'glow 2s ease-in-out infinite alternate';
    }, 10);
  };

  return (
    <>
      {/* Matrix Rain Background */}
      <div className="matrix-bg" id="matrix-bg"></div>

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={handleLogoClick}>
            DEFCON_BG
          </div>
          
          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <a href="/" className="nav-link" onClick={closeMobileMenu}>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a href="/blog" className="nav-link" onClick={closeMobileMenu}>
                Blog
              </a>
            </li>
            <li className="nav-item">
              <a href="/forum" className="nav-link" onClick={closeMobileMenu}>
                Forum
              </a>
            </li>
            <li className="nav-item">
              <a href="/login" className="nav-link" onClick={closeMobileMenu}>
                Login
              </a>
            </li>
          </ul>

          <button 
            className="mobile-menu-btn" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            &#9776;
          </button>
        </div>
      </nav>
    </>
  );
};

export default MatrixNavbar;