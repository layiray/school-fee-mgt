// src/context/SessionContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);

  // Force load from Firebase - ALWAYS prioritize Firebase
  const forceLoadFromFirebase = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    
    try {
      console.log('🔄 SessionProvider: Force loading from Firebase');
      
      // Get sessions directly from Firebase
      const firebaseSessions = await getSessions();
      console.log('📦 Firebase sessions:', firebaseSessions);
      
      if (firebaseSessions && firebaseSessions.length > 0) {
        // Update state
        setSessions(firebaseSessions);
        
        // Find active session
        const activeSession = firebaseSessions.find(s => s.isActive === true && s.isArchived !== true);
        console.log('🎯 Active session in Firebase:', activeSession);
        
        if (activeSession) {
          // Check if this is different from current
          const currentId = currentSession?.id;
          if (currentId !== activeSession.id) {
            console.log(`🔄 Session changed from ${currentId} to ${activeSession.id}`);
            setCurrentSession(activeSession);
            localStorage.setItem('currentSessionId', String(activeSession.id));
            localStorage.setItem('schoolSessions', JSON.stringify(firebaseSessions));
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('sessionChanged', { 
              detail: { 
                id: activeSession.id,
                name: activeSession.name,
                ...activeSession
              } 
            }));
            
            toast.success(`Session: ${activeSession.name}`, { duration: 2000 });
            return activeSession;
          } else {
            // Same session, just ensure state is set
            if (!currentSession) {
              setCurrentSession(activeSession);
            }
            return currentSession || activeSession;
          }
        } else {
          // No active session - try to find any non-archived
          const fallback = firebaseSessions.find(s => s.isArchived !== true);
          if (fallback) {
            console.log(`⚠️ No active session, using fallback: ${fallback.name}`);
            setCurrentSession(fallback);
            localStorage.setItem('currentSessionId', String(fallback.id));
            localStorage.setItem('schoolSessions', JSON.stringify(firebaseSessions));
            return fallback;
          } else {
            console.log('❌ No active or non-archived sessions found');
            setCurrentSession(null);
            localStorage.removeItem('currentSessionId');
            return null;
          }
        }
      } else {
        // No sessions in Firebase - create default
        console.log('📝 No sessions in Firebase, creating default');
        const defaultSession = {
          id: Date.now(),
          name: '2024/2025',
          startYear: 2024,
          endYear: 2025,
          isActive: true,
          isArchived: false,
          startDate: '2024-09-01',
          endDate: '2025-07-31',
          createdAt: new Date().toISOString()
        };
        const defaultSessions = [defaultSession];
        
        setSessions(defaultSessions);
        setCurrentSession(defaultSession);
        localStorage.setItem('currentSessionId', String(defaultSession.id));
        localStorage.setItem('schoolSessions', JSON.stringify(defaultSessions));
        await saveSessions(defaultSessions);
        return defaultSession;
      }
    } catch (error) {
      console.error('❌ Error loading from Firebase:', error);
      // Fallback to localStorage
      const localSessions = JSON.parse(localStorage.getItem('schoolSessions') || '[]');
      if (localSessions.length > 0) {
        setSessions(localSessions);
        const active = localSessions.find(s => s.isActive === true && s.isArchived !== true);
        if (active) {
          setCurrentSession(active);
          return active;
        }
      }
      return null;
    } finally {
      isSyncing.current = false;
      setLoading(false);
    }
  }, [currentSession]);

  // Initialize on mount - ALWAYS load from Firebase
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🚀 SessionProvider: Initializing...');
      forceLoadFromFirebase().then(() => {
        isInitialized.current = true;
        console.log('✅ SessionProvider: Initialized');
      });
    }
  }, [forceLoadFromFirebase]);

  // Real-time listener - ALWAYS sync with Firebase
  useEffect(() => {
    if (!isInitialized.current) return;

    console.log('👂 SessionProvider: Setting up real-time listener');
    
    const unsubscribe = listenToSessions(async (firebaseSessions) => {
      if (!firebaseSessions || firebaseSessions.length === 0) return;
      
      console.log('📡 Real-time update received:', firebaseSessions);
      
      // Update sessions state
      setSessions(firebaseSessions);
      
      // Find active session
      const activeSession = firebaseSessions.find(s => s.isActive === true && s.isArchived !== true);
      
      if (activeSession) {
        const storedId = localStorage.getItem('currentSessionId');
        const storedIdNum = storedId ? parseInt(storedId) : null;
        
        // Check if session has changed
        if (!currentSession || currentSession.id !== activeSession.id || storedIdNum !== activeSession.id) {
          console.log(`🔄 SESSION CHANGED: ${activeSession.name} (${activeSession.id})`);
          
          // Update everything
          setCurrentSession(activeSession);
          localStorage.setItem('currentSessionId', String(activeSession.id));
          localStorage.setItem('schoolSessions', JSON.stringify(firebaseSessions));
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('sessionChanged', { 
            detail: { 
              id: activeSession.id,
              name: activeSession.name,
              ...activeSession
            } 
          }));
          
          toast.success(`Session: ${activeSession.name}`, { duration: 2000 });
        }
      } else {
        // No active session - check stored
        const storedId = localStorage.getItem('currentSessionId');
        if (storedId) {
          const storedSession = firebaseSessions.find(s => s.id === parseInt(storedId) && s.isArchived !== true);
          if (storedSession) {
            if (!currentSession || currentSession.id !== storedSession.id) {
              setCurrentSession(storedSession);
            }
          } else {
            // Stored session is archived or doesn't exist
            const fallback = firebaseSessions.find(s => s.isArchived !== true);
            if (fallback) {
              setCurrentSession(fallback);
              localStorage.setItem('currentSessionId', String(fallback.id));
            } else {
              setCurrentSession(null);
              localStorage.removeItem('currentSessionId');
            }
          }
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentSession]);

  const createSession = async (sessionData) => {
    try {
      // Get fresh sessions from Firebase
      const freshSessions = await getSessions();
      const existingSessions = freshSessions.length > 0 ? freshSessions : sessions;
      
      // Check if session already exists
      if (existingSessions.find(s => s.name === sessionData.name)) {
        toast.error('Session already exists!');
        return null;
      }
      
      const newSession = {
        id: Date.now(),
        ...sessionData,
        isActive: false,
        isArchived: false,
        createdAt: new Date().toISOString()
      };
      
      const updatedSessions = [...existingSessions, newSession];
      
      // Save to Firebase
      const result = await saveSessions(updatedSessions);
      
      if (result.success) {
        setSessions(updatedSessions);
        localStorage.setItem('schoolSessions', JSON.stringify(updatedSessions));
        toast.success(`Session ${newSession.name} created!`);
        return newSession;
      } else {
        toast.error('Failed to create session: ' + result.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      return null;
    }
  };

  const switchSession = async (sessionId) => {
    try {
      console.log(`🔄 Switching to session ${sessionId}`);
      
      // Get fresh sessions from Firebase
      const freshSessions = await getSessions();
      const session = freshSessions.find(s => s.id === sessionId);
      
      if (!session) {
        toast.error('Session not found');
        return false;
      }
      
      if (session.isArchived) {
        toast.error('Cannot activate an archived session');
        return false;
      }
      
      // Deactivate all sessions, activate the selected one
      const updatedSessions = freshSessions.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }));
      
      // Save to Firebase
      const result = await saveSessions(updatedSessions);
      
      if (result.success) {
        // Update state
        setSessions(updatedSessions);
        setCurrentSession(session);
        localStorage.setItem('currentSessionId', String(session.id));
        localStorage.setItem('schoolSessions', JSON.stringify(updatedSessions));
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('sessionChanged', { 
          detail: { 
            id: session.id,
            name: session.name,
            ...session
          } 
        }));
        
        toast.success(`Switched to ${session.name}`);
        return true;
      } else {
        toast.error('Failed to switch session: ' + result.error);
        return false;
      }
    } catch (error) {
      console.error('Error switching session:', error);
      toast.error('Failed to switch session');
      return false;
    }
  };

  const archiveSession = async (sessionId) => {
    try {
      const freshSessions = await getSessions();
      
      const updatedSessions = freshSessions.map(session =>
        session.id === sessionId ? { ...session, isArchived: true, isActive: false } : session
      );
      
      const result = await saveSessions(updatedSessions);
      
      if (result.success) {
        setSessions(updatedSessions);
        localStorage.setItem('schoolSessions', JSON.stringify(updatedSessions));
        
        if (currentSession?.id === sessionId) {
          const newActive = updatedSessions.find(s => s.isActive && !s.isArchived);
          if (newActive) {
            await switchSession(newActive.id);
          } else {
            setCurrentSession(null);
            localStorage.removeItem('currentSessionId');
          }
        }
        toast.success('Session archived');
        return true;
      } else {
        toast.error('Failed to archive session: ' + result.error);
        return false;
      }
    } catch (error) {
      console.error('Error archiving session:', error);
      toast.error('Failed to archive session');
      return false;
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 SessionProvider: Force refresh requested');
    setLoading(true);
    const session = await forceLoadFromFirebase();
    setLoading(false);
    return session;
  };

  const value = {
    currentSession,
    sessions,
    loading,
    createSession,
    switchSession,
    archiveSession,
    forceRefresh,
    refreshCurrentSession: forceRefresh
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};