import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, UserPlus, Key } from 'lucide-react';

const Login = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  // Try multiple logo paths
  const logoSources = [
    "/images/bis-logo.jpg"
  ];

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        maxWidth: '450px', 
        width: '100%', 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 20px 35px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
          padding: '30px',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '16px' }}>
            {!logoError ? (
              <img 
                src={logoSources[0]} 
                alt="Beulahland International Schools Logo" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block'
                }}
                onError={handleLogoError}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '40px'
              }}>
                🏫
              </div>
            )}
          </div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            color: 'white',
            fontWeight: 'bold'
          }}>
            Beulahland International Schools
          </h2>
          <p style={{ 
            marginTop: '8px', 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.9)' 
          }}>
            Fee Management System
          </p>
        </div>
        
        <div style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '14px'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '14px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto'
                }}
              >
                <Key size={14} />
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'linear-gradient(135deg, #1e3c72, #2a5298)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Login
            </button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: '600',
                  padding: '0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <UserPlus size={14} />
                Register here
              </button>
            </p>
          </div>
          
          {/* <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#f3f4f6', 
            borderRadius: '8px', 
            fontSize: '13px' 
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Demo Credentials:</p>
            <p><strong>Parent:</strong> Register a new account or use parent@test.com / 123456</p>
            <p><strong>Admin:</strong> admin@school.com / admin123</p>
          </div> */}
          
        </div>
      </div>
    </div>
  );
};

export default Login;