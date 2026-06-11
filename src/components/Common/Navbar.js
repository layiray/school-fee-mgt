import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, X, User, Shield } from 'lucide-react';

// Import the logo image - choose one method below

// Method 1: If logo is in public/images folder
const logoImage = '/images/bis-logo.jpg';

// Method 2: If logo is in src/assets folder (uncomment and use this)
// import logoImage from '../../assets/bis-logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navStyles = {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const containerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const logoContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  };

  // Updated logoBoxStyles for image
  const logoBoxStyles = {
    width: '45px',
    height: '45px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.1)'
  };

  const logoImageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  };

  const logoPlaceholderStyles = {
    width: '45px',
    height: '45px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '24px',
    fontFamily: 'serif'
  };

  const schoolNameStyles = {
    margin: 0,
    fontSize: isMobile ? '14px' : '18px',
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  };

  const subTextStyles = {
    margin: '2px 0 0',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.8)'
  };

  const desktopMenuStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  };

  const userInfoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white'
  };

  const avatarStyles = {
    width: '35px',
    height: '35px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const userNameStyles = {
    margin: 0,
    fontWeight: 600,
    fontSize: '14px',
    color: 'white'
  };

  const userRoleStyles = {
    margin: 0,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize'
  };

  const logoutButtonStyles = {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'all 0.3s ease'
  };

  const mobileMenuButtonStyles = {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '8px',
    minHeight: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const mobileDropdownStyles = {
    position: 'absolute',
    top: '69px',
    left: 0,
    right: 0,
    background: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '16px',
    zIndex: 99,
    borderTop: '1px solid #e5e7eb'
  };

  const mobileUserInfoStyles = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const mobileAvatarStyles = {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '24px'
  };

  const mobileUserNameStyles = {
    fontWeight: 'bold',
    margin: 0,
    fontSize: '16px',
    color: '#1f2937'
  };

  const mobileUserEmailStyles = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0'
  };

  const mobileUserRoleStyles = {
    fontSize: '11px',
    color: '#6b7280',
    margin: '2px 0 0',
    textTransform: 'capitalize'
  };

  const mobileLogoutButtonStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  };

  return (
    <nav style={navStyles}>
      <div style={containerStyles}>
        {/* Logo and School Name */}
        <div style={logoContainerStyles}>
          {!imageError ? (
            <div style={logoBoxStyles}>
              <img 
                src={logoImage} 
                alt="Beulahland International Schools" 
                style={logoImageStyles}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div style={logoPlaceholderStyles}>🏫</div>
          )}
          <div>
            <h3 style={schoolNameStyles}>
              Beulahland International Schools
            </h3>
            {!isMobile && (
              <p style={subTextStyles}>
                Fee Management System
              </p>
            )}
          </div>
        </div>
        
        {/* Desktop Menu */}
        {!isMobile && (
          <div style={desktopMenuStyles}>
            <div style={userInfoStyles}>
              <div style={avatarStyles}>
                {user?.role === 'admin' ? <Shield size={18} color="white" /> : <User size={18} color="white" />}
              </div>
              <div>
                <p style={userNameStyles}>{user?.name}</p>
                <p style={userRoleStyles}>{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              style={logoutButtonStyles}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
        
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={mobileMenuButtonStyles}
          >
            {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMobile && showMobileMenu && (
        <div style={mobileDropdownStyles}>
          <div style={mobileUserInfoStyles}>
            <div style={mobileAvatarStyles}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={mobileUserNameStyles}>{user?.name}</p>
              <p style={mobileUserEmailStyles}>{user?.email}</p>
              <p style={mobileUserRoleStyles}>Role: {user?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              setShowMobileMenu(false);
            }} 
            style={mobileLogoutButtonStyles}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;