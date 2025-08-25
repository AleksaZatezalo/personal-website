import React, { useState, useEffect } from 'react';

const MissionStatement = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Different mission statements that rotate
  const missionTexts = [
    "Belgrade Born, Globally Connected",
  ];

  // Typewriter effect
  useEffect(() => {
    const currentText = missionTexts[currentTextIndex];
    let timeoutId;

    if (isTyping) {
      if (displayText.length < currentText.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, 100);
      } else {
        // Wait before starting to delete
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, 10000);
      }
    } else {
      if (displayText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
      } else {
        // Move to next text
        setCurrentTextIndex((prev) => (prev + 1) % missionTexts.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isTyping, currentTextIndex, missionTexts]);

  return (
    <div className="mission-statement">
      <div className="mission-container">
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-controls">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
          </div>
          <div className="terminal-title">DEFCON_BELGRADE.exe</div>
        </div>

        {/* Mission Content */}
        <div className="mission-content">
          <div className="mission-prompt">
            <span className="prompt-symbol">root@defcon-bg:~$</span>
            <span className="command">cat mission.txt</span>
          </div>
          
          <div className="mission-output">
            <div className="mission-main">
              <h1 className="mission-title">
                {displayText}
                <span className="cursor">|</span>
              </h1>
            </div>

            <div className="mission-details">
              <div className="mission-grid">
                <div className="mission-item">
                  <span className="mission-label">[LOCATION]</span>
                  <span className="mission-value">Belgrade, Serbia</span>
                </div>
                <div className="mission-item">
                  <span className="mission-label">[FOCUS]</span>
                  <span className="mission-value">Ethical Hacking & Defense</span>
                </div>
                <div className="mission-item">
                  <span className="mission-label">[COMMUNITY]</span>
                  <span className="mission-value">Open Source Security</span>
                </div>
              </div>

              <div className="mission-description">
                <p>
                  &gt; We are a collective of security researchers, ethical hackers, and cybersecurity 
                  enthusiasts dedicated to advancing the field of information security through 
                  knowledge sharing, hands-on training, and collaborative research.
                </p>
                <p>
                  &gt; Every two weeks, we gather to explore the latest vulnerabilities, share cutting-edge 
                  techniques, and build the next generation of cyber defenders. Join us in making 
                  the digital world more secure.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionStatement;