import React, { useState, useEffect } from 'react';

const MatrixNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., login in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Matrix Rain Effect
  useEffect(() => {
    const createMatrixRain = () => {
      const container = document.getElementById('matrix-bg');
      if (!container) {
        console.log('Matrix container not found');
        return;
      }

      const chars = '0123456789アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const specialStrings = ['DEFCON', 'Belgrade', 'Serbia', 'Hacking', 'DC381', 'Penetration Testing', 'Hacker Culture', 'Belgrade Born', 'Whitehats only', 'Stay ethical', '1337', 'Globally connected'];
      let intervalId;
      
      const createColumn = () => {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = Math.random() * 100 + 'vw';
        column.style.animationDuration = (Math.random() * 3 + 2) + 's';
        column.style.opacity = Math.random() * 0.5 + 0.3;
        column.style.fontSize = '14px';
        column.style.lineHeight = '1.2';
        
        let text = '';
        
        // 20% chance for entire column to be a special string only
        const useSpecialString = Math.random() < 0.2;
        
        if (useSpecialString) {
          const specialString = specialStrings[Math.floor(Math.random() * specialStrings.length)];
          // Create column with only the special string characters
          for (let i = 0; i < specialString.length; i++) {
            text += specialString[i] + '<br>';
          }
        } else {
          // Regular random character column
          const length = Math.random() * 15 + 8;
          for (let i = 0; i < length; i++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
          }
        }
        column.innerHTML = text;
        
        container.appendChild(column);
        
        // Remove column after animation
        setTimeout(() => {
          if (column && column.parentNode) {
            column.parentNode.removeChild(column);
          }
        }, 6000);
      };
      
      // Create initial burst of columns
      for (let i = 0; i < 30; i++) {
        setTimeout(createColumn, i * 200);
      }
      
      // Continue creating columns
      intervalId = setInterval(createColumn, 300);
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const cleanup = createMatrixRain();
      return cleanup;
    }, 100);

    return () => clearTimeout(timer);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    closeMobileMenu();
    window.location.href = '/';
  };

  return (
    <>
      {/* Matrix Rain Background */}
      <div className="matrix-bg" id="matrix-bg"></div>

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={handleLogoClick}>
            DC381
          </div>
          
          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <a href="/" className="nav-link" onClick={closeMobileMenu}>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a href="/faq" className="nav-link" onClick={closeMobileMenu}>
                Getting Started
              </a>
            </li>
            <li className="nav-item">
              <a href="/forum" className="nav-link" onClick={closeMobileMenu}>
                Forum
              </a>
            </li>
            {isAuthenticated ? (
              <li className="nav-item">
                <button 
                  onClick={handleLogout}
                  className="nav-link logout-button"
                >
                  Logout ({currentUser?.username})
                </button>
              </li>
            ) : (
              <li className="nav-item">
                <a href="/login" className="nav-link" onClick={closeMobileMenu}>
                  Login
                </a>
              </li>
            )}
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