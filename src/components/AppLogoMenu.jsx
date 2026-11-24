import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLogoDropdown from './AppLogoDropdown';
import { useSecretKeySequence } from './hooks/useSecretKeySequence';

export default function AppLogoMenu({
  title = "Rajat's calendar",
  subtitle,
  badge,
  currentScreen,
  onHelpClick,
  secretMode,
  onSecretModeToggle,
  className = ''
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [internalSecretMode, setInternalSecretMode] = useState(Boolean(secretMode));
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (secretMode !== undefined) {
      setInternalSecretMode(secretMode);
    }
  }, [secretMode]);

  const activeScreen = currentScreen || (() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/jivandisha')) return 'jivandisha';
    if (path.startsWith('/finances')) return 'finances';
    if (path.startsWith('/work')) return 'work';
    return 'calendar';
  })();

  const { resetSequence } = useSecretKeySequence({
    isActive: showDropdown,
    isSecretMode: internalSecretMode,
    onSecretTriggered: () => {
      setInternalSecretMode(true);
      onSecretModeToggle?.(true);
    },
    onDismiss: () => setShowDropdown(false)
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        resetSequence();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, resetSequence]);

  const handleToggleDropdown = () => {
    setShowDropdown(prev => !prev);
    resetSequence();
  };

  const handleNavigate = (path) => {
    setShowDropdown(false);
    resetSequence();
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleHideSecret = (e) => {
    e.stopPropagation();
    setInternalSecretMode(false);
    onSecretModeToggle?.(false);
    setShowDropdown(false);
    resetSequence();
  };

  return (
    <div className={`app-logo-menu-container ${className}`} ref={dropdownRef}>
      <div
        className="app-brand-trigger"
        onClick={handleToggleDropdown}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={showDropdown}
        title="Click to switch screen or view menu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleDropdown();
          }
        }}
      >
        <img src="/favicon.png" alt="App Logo" className="app-logo" />
        <div className="app-brand-text">
          <div className="app-brand-title-row">
            <span className="app-brand-title">{title}</span>
            {badge && <span className="app-brand-badge">{badge}</span>}
            <span className={`app-title-caret ${showDropdown ? 'open' : ''}`}>▾</span>
          </div>
          {subtitle && <p className="app-brand-subtitle">{subtitle}</p>}
        </div>
      </div>

      {showDropdown && (
        <AppLogoDropdown
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          onHelpClick={(e) => {
            setShowDropdown(false);
            onHelpClick?.(e);
          }}
          internalSecretMode={internalSecretMode}
          onHideSecret={handleHideSecret}
        />
      )}
    </div>
  );
}
