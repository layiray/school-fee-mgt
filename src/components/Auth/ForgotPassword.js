import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error("Password reset error:", error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email address');
          break;
        case 'auth/invalid-email':
          toast.error('Please enter a valid email address');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many requests. Please try again later');
          break;
        default:
          toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.5s ease' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px'
          }}>
            🔐
          </div>
          <h2>Forgot Password?</h2>
          <p style={{ marginTop: '8px', opacity: 0.9 }}>Reset your password</p>
        </div>
        <div className="card-body">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    style={{ paddingLeft: '36px' }}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                <Send size={16} />
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: '#d5f4e6', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle size={30} color="#27ae60" />
              </div>
              <h3 style={{ marginBottom: '10px', color: '#27ae60' }}>Check Your Email</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                We've sent password reset instructions to:<br/>
                <strong>{email}</strong>
              </p>
              <div style={{ 
                background: '#fef3c7', 
                padding: '12px', 
                borderRadius: '8px', 
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong>📧 What to do next:</strong>
                <ol style={{ marginTop: '8px', marginLeft: '20px' }}>
                  <li>Check your email inbox</li>
                  <li>Click the link in the email</li>
                  <li>Create a new password</li>
                  <li>Login with your new password</li>
                </ol>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
          )}
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                fontSize: '14px'
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;