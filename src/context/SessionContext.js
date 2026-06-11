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
    // Listen for real-time session updates
    const unsubscribe = listenToSessions((sessionData) => {
      if (sessionData && sessionData.length > 0) {
        setSessions(sessionData);
        
        // Find active session or current session
        const activeSession = sessionData.find(s => s.isActive);
        const storedCurrentId = localStorage.getItem('currentSessionId');
        
        if (activeSession) {
          setCurrentSession(activeSession);
          localStorage.setItem('currentSessionId', activeSession.id);
        } else if (storedCurrentId) {
          const savedSession = sessionData.find(s => s.id.toString() === storedCurrentId);
          if (savedSession) {
            setCurrentSession(savedSession);
          } else {
            setCurrentSession(sessionData[0]);
            localStorage.setItem('currentSessionId', sessionData[0].id);
          }
        } else if (sessionData.length > 0) {
          setCurrentSession(sessionData[0]);
          localStorage.setItem('currentSessionId', sessionData[0].id);
        }
      } else {
        // Create default session if none exists
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
    
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    toast.success(`Session ${newSession.name} created successfully!`);
    return newSession;
  };

  const switchSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const updatedSessions = sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }));
      
      setSessions(updatedSessions);
      setCurrentSession(session);
      localStorage.setItem('currentSessionId', session.id);
      await saveSessions(updatedSessions);
      toast.success(`Switched to ${session.name} session`);
      return true;
    }
    return false;
  };

  const archiveSession = async (sessionId) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, isArchived: true, isActive: false } : session
    );
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    toast.success('Session archived');
  };

  const updateSession = async (sessionId, updates) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession({ ...currentSession, ...updates });
    }
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      sessions,
      loading,
      createSession,
      switchSession,
      archiveSession,
      updateSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};