// src/context/SessionContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSessions, saveSessions, listenToSessions } from '../config/firebase';
import toast from 'react-hot-toast';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time session updates from Firebase
    const unsubscribe = listenToSessions((sessionData) => {
      if (sessionData && sessionData.length > 0) {
        setSessions(sessionData);
        
        // Try to find the session from localStorage first
        const storedSessionId = localStorage.getItem('currentSessionId');
        let activeSession = sessionData.find(s => s.id === parseInt(storedSessionId));
        
        // If not found, find the active session
        if (!activeSession) {
          activeSession = sessionData.find(s => s.isActive);
        }
        
        // If still not found, use the first session
        if (!activeSession && sessionData.length > 0) {
          activeSession = sessionData[0];
        }
        
        if (activeSession) {
          setCurrentSession(activeSession);
          localStorage.setItem('currentSessionId', activeSession.id);
        }
      } else {
        // Only create default session if absolutely no sessions exist
        const defaultSession = {
          id: Date.now(),
          name: '2024/2025',
          startYear: 2024,
          endYear: 2025,
          isActive: true,
          startDate: '2024-09-01',
          endDate: '2025-07-31',
          createdAt: new Date().toISOString()
        };
        setSessions([defaultSession]);
        setCurrentSession(defaultSession);
        saveSessions([defaultSession]);
        localStorage.setItem('currentSessionId', defaultSession.id);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const createSession = async (sessionData) => {
    const newSession = {
      id: Date.now(),
      ...sessionData,
      isActive: false,
      createdAt: new Date().toISOString()
    };
    
    // Get current sessions first
    const currentSessions = await getSessions();
    
    // Add new session to existing sessions
    const updatedSessions = [...currentSessions, newSession];
    setSessions(updatedSessions);
    
    // Save all sessions (preserving existing ones)
    const result = await saveSessions(updatedSessions);
    
    if (result.success) {
      toast.success(`Session ${newSession.name} created successfully!`);
    } else {
      toast.error('Failed to create session: ' + result.error);
    }
    return newSession;
  };

  const switchSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // Deactivate all sessions first
      const updatedSessions = sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }));
      
      setSessions(updatedSessions);
      setCurrentSession(session);
      localStorage.setItem('currentSessionId', session.id);
      
      const result = await saveSessions(updatedSessions);
      
      if (result.success) {
        // Force reload of data by dispatching an event
        window.dispatchEvent(new CustomEvent('sessionChanged', { detail: session }));
        toast.success(`Switched to ${session.name} session`);
        return true;
      } else {
        toast.error('Failed to switch session: ' + result.error);
        return false;
      }
    }
    return false;
  };

  const archiveSession = async (sessionId) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, isArchived: true, isActive: false } : session
    );
    setSessions(updatedSessions);
    
    const result = await saveSessions(updatedSessions);
    
    if (result.success) {
      if (currentSession?.id === sessionId) {
        const newActiveSession = updatedSessions.find(s => s.isActive && !s.isArchived);
        if (newActiveSession) {
          switchSession(newActiveSession.id);
        }
      }
      toast.success('Session archived');
    } else {
      toast.error('Failed to archive session: ' + result.error);
    }
  };

  const updateSession = async (sessionId, updates) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setSessions(updatedSessions);
    
    const result = await saveSessions(updatedSessions);
    
    if (result.success) {
      if (currentSession?.id === sessionId) {
        setCurrentSession({ ...currentSession, ...updates });
        localStorage.setItem('currentSessionId', sessionId);
      }
      toast.success('Session updated');
    } else {
      toast.error('Failed to update session: ' + result.error);
    }
  };

  const refreshCurrentSession = () => {
    const storedSessionId = localStorage.getItem('currentSessionId');
    if (storedSessionId) {
      const session = sessions.find(s => s.id === parseInt(storedSessionId));
      if (session) {
        setCurrentSession(session);
        return session;
      }
    }
    return currentSession;
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      sessions,
      loading,
      createSession,
      switchSession,
      archiveSession,
      updateSession,
      refreshCurrentSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};