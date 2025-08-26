import React, { useState } from 'react';
import MatrixNavbar from '../MatrixNavbar';

const Login = () => {
  const [step, setStep] = useState('access-code'); // 'access-code', 'auth-choice', 'login', 'register'
  const [accessCode, setAccessCode] = useState('');
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    tag: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const availableTags = [
    'Crypto', 'OSCP', 'Networks', 'Web Apps', 'Forensics', 
    'Malware Analysis', 'Social Engineering', 'Physical Security',
    'Mobile Security', 'Cloud Security', 'DevSecOps', 'Incident Response',
    'Threat Intelligence', 'Red Team', 'Blue Team', 'Purple Team'
  ];

  const validateAccessCode = () => {
    if (accessCode === '1337') {
      setStep('auth-choice');
      setErrors({});
    } else {
      setErrors({ accessCode: 'Invalid access code. Have you read all the introductory articles?' });
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    
    if (!loginData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegistration = () => {
    const newErrors = {};
    
    if (!registerData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (registerData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/forum';
      } else {
        setErrors({ general: data.message || 'Login failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!validateRegistration()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          tag: registerData.tag
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/forum';
      } else {
        setErrors({ general: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const renderAccessCodeStep = () => (
    <div className="auth-form">
      <div className="form-header">
        <h2>Access Required</h2>
        <p>Enter the access code from the "Getting Connected" article to continue</p>
      </div>
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Access Code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          className={`form-input ${errors.accessCode ? 'error' : ''}`}
        />
        {errors.accessCode && <span className="error-message">{errors.accessCode}</span>}
      </div>
      
      <button onClick={validateAccessCode} className="auth-button">
        Continue
      </button>
    </div>
  );

  const renderAuthChoice = () => (
    <div className="auth-form">
      <div className="form-header">
        <h2>Welcome to DC381</h2>
        <p>Choose your action</p>
      </div>
      
      <div className="auth-choice-buttons">
        <button onClick={() => setStep('login')} className="auth-button">
          Login
        </button>
        <button onClick={() => setStep('register')} className="auth-button">
          Register
        </button>
      </div>
      
      <button onClick={() => setStep('access-code')} className="back-button">
        ← Back
      </button>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-form">
      <div className="form-header">
        <h2>Login</h2>
        <p>Enter your credentials</p>
      </div>
      
      {errors.general && <div className="error-banner">{errors.general}</div>}
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={loginData.username}
          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          className={`form-input ${errors.username ? 'error' : ''}`}
        />
        {errors.username && <span className="error-message">{errors.username}</span>}
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          className={`form-input ${errors.password ? 'error' : ''}`}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <button onClick={handleLogin} className="auth-button" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      <button onClick={() => setStep('auth-choice')} className="back-button">
        ← Back
      </button>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-form">
      <div className="form-header">
        <h2>Register</h2>
        <p>Create your DC381 account</p>
      </div>
      
      {errors.general && <div className="error-banner">{errors.general}</div>}
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Username *"
          value={registerData.username}
          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
          className={`form-input ${errors.username ? 'error' : ''}`}
        />
        {errors.username && <span className="error-message">{errors.username}</span>}
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Password *"
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          className={`form-input ${errors.password ? 'error' : ''}`}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Confirm Password *"
          value={registerData.confirmPassword}
          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>
      
      <div className="form-group">
        <select
          value={registerData.tag}
          onChange={(e) => setRegisterData({ ...registerData, tag: e.target.value })}
          className="form-select"
        >
          <option value="">Select your interest (optional)</option>
          {availableTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
      
      <button onClick={handleRegister} className="auth-button" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
      
      <button onClick={() => setStep('auth-choice')} className="back-button">
        ← Back
      </button>
    </div>
  );

  return (
    <div>
      <MatrixNavbar />
      <div className="auth-container">
        {step === 'access-code' && renderAccessCodeStep()}
        {step === 'auth-choice' && renderAuthChoice()}
        {step === 'login' && renderLogin()}
        {step === 'register' && renderRegister()}
      </div>
    </div>
  );
};

export default Login;