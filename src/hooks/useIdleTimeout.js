import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const useIdleTimeout = (timeoutMinutes = 5) => {
  const { logout } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Set warning timeout (30 seconds before logout)
    warningTimeoutRef.current = setTimeout(() => {
      toast.error('⚠️ You will be logged out due to inactivity in 30 seconds', {
        duration: 10000,
        position: 'top-center',
        icon: '⏰',
      });
    }, (timeoutMinutes * 60 * 1000) - 30000);
    
    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      toast.error('Logged out due to inactivity');
      logout();
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    
    const handleActivity = () => {
      resetTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Start the timer
    resetTimer();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);
};

export default useIdleTimeout;