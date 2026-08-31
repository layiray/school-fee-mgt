// src/components/Parent/ParentDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  listenToStudents, 
  listenToPayments, 
  listenToFeeStructures,
  listenToExtraBills,
  listenToBusRegistrations,
  listenToBusRoutes,
  getSessions,
} from '../../config/firebase';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import StudentBalanceSummary from './StudentBalanceSummary';
import AddStudentForm from './AddStudentForm';
import { DollarSign, Clock, Users, Calendar, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ParentDashboard = () => {
  const { user } = useAuth();
  
  // State declarations
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extraBills, setExtraBills] = useState([]);
  const [busRegistrations, setBusRegistrations] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Refs
  const mountedRef = useRef(true);
  const unsubscribeRefs = useRef([]);
  const loadTimeoutRef = useRef(null);

  // Mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================
  // CORE FUNCTION: Get the active session from Firebase
  // ============================================
  const getActiveSessionFromFirebase = useCallback(async () => {
    try {
      console.log('🔍 Fetching sessions from Firebase...');
      const fbSessions = await getSessions();
      console.log('📦 Firebase sessions:', fbSessions);
      
      if (!fbSessions || fbSessions.length === 0) {
        console.log('❌ No sessions in Firebase');
        return null;
      }
      
      // Find active session (isActive === true and not archived)
      let active = fbSessions.find(s => s.isActive === true && s.isArchived !== true);
      
      if (active) {
        console.log(`✅ Active session found: ${active.name} (${active.id})`);
        return active;
      }
      
      // If no active session, find the first non-archived session
      const firstAvailable = fbSessions.find(s => s.isArchived !== true);
      if (firstAvailable) {
        console.log(`⚠️ No active session, using first available: ${firstAvailable.name}`);
        return firstAvailable;
      }
      
      console.log('❌ No available sessions found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      return null;
    }
  }, []);

  // ============================================
  // CORE FUNCTION: Load all data for a session
  // ============================================
  const loadDataForSession = useCallback((session) => {
    if (!session || !user?.uid) {
      console.log('❌ Cannot load data: No session or user');
      return;
    }

    // Clean up previous listeners
    unsubscribeRefs.current.forEach(unsub => {
      try { unsub(); } catch (e) { /* ignore */ }
    });
    unsubscribeRefs.current = [];

    console.log(`📊 Loading data for session: ${session.name} (${session.id})`);

    // Update state
    setCurrentSession(session);
    localStorage.setItem('currentSessionId', String(session.id));

    let isMounted = true;

    // 1. Listen to students
    const unsubStudents = listenToStudents((allStudents) => {
      if (!isMounted) return;
      const parentStudents = allStudents.filter(s => s.parentId === user.uid);
      console.log(`👨‍👩‍👧 Parent has ${parentStudents.length} students`);
      setStudents(parentStudents);
      setLoading(false);
    });
    unsubscribeRefs.current.push(unsubStudents);

    // 2. Listen to payments for this session
    const unsubPayments = listenToPayments((payments) => {
      if (!isMounted) return;
      const sessionPayments = payments.filter(p => p.sessionId === session.id);
      console.log(`💰 ${sessionPayments.length} payments for this session`);
      setAllPayments(sessionPayments);
    });
    unsubscribeRefs.current.push(unsubPayments);

    // 3. Listen to fee structures for this session
    const unsubFees = listenToFeeStructures(session.id, (fees) => {
      if (!isMounted) return;
      console.log(`📚 ${fees?.length || 0} fee structures loaded`);
      setFeeStructures(fees || []);
    });
    unsubscribeRefs.current.push(unsubFees);

    // 4. Listen to bus routes for this session
    const unsubBusRoutes = listenToBusRoutes(session.id, (routes) => {
      if (!isMounted) return;
      console.log(`🚌 ${routes?.length || 0} bus routes loaded`);
      setBusRoutes(routes || []);
    });
    unsubscribeRefs.current.push(unsubBusRoutes);

    // 5. Listen to extra bills
    const unsubExtra = listenToExtraBills((bills) => {
      if (!isMounted) return;
      setExtraBills(bills || []);
    });
    unsubscribeRefs.current.push(unsubExtra);

    // 6. Listen to bus registrations
  const unsubBusReg = listenToBusRegistrations((registrations) => {
    if (!isMounted) return;
    console.log(`🚌 Bus registrations loaded: ${registrations?.length || 0}`);
    setBusRegistrations(registrations || []);
  });
  unsubscribeRefs.current.push(unsubBusReg);

    // Safety timer
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        console.log('⏰ Data load completed via safety timer');
      }
    }, 5000);

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ============================================
  // CORE FUNCTION: Force refresh session and data
  // ============================================
  const refreshSessionAndData = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setLoading(true);
    
    const toastId = toast.loading('Loading session data...');
    
    try {
      // 1. Get active session from Firebase
      const activeSession = await getActiveSessionFromFirebase();
      
      if (activeSession) {
        // 2. Update localStorage
        localStorage.setItem('currentSessionId', String(activeSession.id));
        
        // 3. Load data for this session
        loadDataForSession(activeSession);
        
        // 4. Dispatch event for other components
        window.dispatchEvent(new CustomEvent('sessionChanged', { 
          detail: { 
            id: activeSession.id,
            name: activeSession.name,
            ...activeSession
          } 
        }));
        
        toast.success(`Session: ${activeSession.name}`, { id: toastId });
        console.log(`✅ Successfully loaded session: ${activeSession.name}`);
      } else {
        toast.error('No active session found', { id: toastId });
        setCurrentSession(null);
        setLoading(false);
        console.log('❌ No active session found');
      }
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      toast.error('Failed to load session', { id: toastId });
      setLoading(false);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, getActiveSessionFromFirebase, loadDataForSession]);

  // ============================================
  // INITIALIZATION - Runs once on mount
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    
    const init = async () => {
      console.log('🚀 ParentDashboard: Initializing...');
      
      // First, check if we have a stored session ID
      const storedId = localStorage.getItem('currentSessionId');
      console.log(`📌 Stored session ID: ${storedId}`);
      
      // Always fetch from Firebase to get the latest
      const activeSession = await getActiveSessionFromFirebase();
      
      if (activeSession) {
        // Check if the stored ID matches the Firebase active session
        if (storedId && parseInt(storedId) !== activeSession.id) {
          console.log(`🔄 Session mismatch! Stored: ${storedId}, Firebase: ${activeSession.id}`);
          // Update localStorage with the correct session
          localStorage.setItem('currentSessionId', String(activeSession.id));
        }
        
        // Load data for the active session
        loadDataForSession(activeSession);
      } else {
        console.log('❌ No active session found on init');
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      mountedRef.current = false;
      unsubscribeRefs.current.forEach(unsub => {
        try { unsub(); } catch (e) { /* ignore */ }
      });
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [getActiveSessionFromFirebase, loadDataForSession]);

  // ============================================
  // POLLING: Check for session changes every 10 seconds
  // ============================================
  useEffect(() => {
    if (!currentSession) return;
    
    const interval = setInterval(async () => {
      try {
        const fbSessions = await getSessions();
        if (!fbSessions || fbSessions.length === 0) return;
        
        const active = fbSessions.find(s => s.isActive === true && s.isArchived !== true);
        
        if (active && active.id !== currentSession.id) {
          console.log(`🔄 POLLING: Session changed from ${currentSession.id} to ${active.id}`);
          // Session changed! Refresh everything
          await refreshSessionAndData();
        }
      } catch (error) {
        // Silent fail
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [currentSession, refreshSessionAndData]);

  // ============================================
  // EVENT LISTENER: Listen for session changes from admin
  // ============================================
  useEffect(() => {
    const handleSessionChange = async (event) => {
      const newSession = event.detail;
      console.log('📢 Session change event:', newSession);
      
      if (newSession && newSession.id !== currentSession?.id) {
        toast.custom((t) => (
          <div style={{
            background: '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>🔄</span>
            <span>Session changed to: <strong>{newSession.name}</strong></span>
          </div>
        ), { duration: 3000 });
        
        // Refresh everything
        await refreshSessionAndData();
      }
    };
    
    window.addEventListener('sessionChanged', handleSessionChange);
    
    return () => {
      window.removeEventListener('sessionChanged', handleSessionChange);
    };
  }, [currentSession, refreshSessionAndData]);

  // ============================================
  // Helper Functions
  // ============================================
  const getTuitionFee = (className, term) => {
    if (!feeStructures || feeStructures.length === 0) return 0;
    const fee = feeStructures.find(f => f.className === className && f.term === term);
    return fee ? fee.amount : 0;
  };

  const getBusFee = (studentId, term) => {
    const registration = busRegistrations.find(
      r => r.studentId === studentId && r.term === term && r.usesBus
    );
    return registration ? registration.busFee : 0;
  };

  const getStudentTermPaid = (studentId, term) => {
    const relevantPayments = allPayments.filter(p => 
      p.studentId === studentId && 
      p.term === term && 
      p.status === 'approved'
    );
    return relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getStudentTotalPaid = (studentId) => {
    const relevantPayments = allPayments.filter(p => 
      p.studentId === studentId && p.status === 'approved'
    );
    return relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getUnpaidExtraBills = (studentId) => {
    return extraBills.filter(b => b.studentId === studentId && !b.isPaid);
  };

  const getStudentsWithBalances = () => {
    const studentsWithData = students.map(student => {
      const terms = ['First Term', 'Second Term', 'Third Term'];
      let studentTotalTuition = 0;
      let studentTotalBus = 0;
      
      const termSummaries = terms.map(term => {
        const tuitionFee = getTuitionFee(student.className, term);
        const busFee = getBusFee(student.id, term);
        const totalFeeForTerm = tuitionFee + busFee;
        const paidForTerm = getStudentTermPaid(student.id, term);
        const balanceForTerm = totalFeeForTerm - paidForTerm;
        
        studentTotalTuition += tuitionFee;
        studentTotalBus += busFee;
        
        return {
          term,
          tuitionFee,
          busFee,
          totalFee: totalFeeForTerm,
          paid: paidForTerm,
          balance: balanceForTerm,
          isComplete: balanceForTerm === 0 && totalFeeForTerm > 0
        };
      });
      
      const unpaidExtraBills = getUnpaidExtraBills(student.id);
      const unpaidExtraBillsTotal = unpaidExtraBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      const totalFeeForSession = studentTotalTuition + studentTotalBus + unpaidExtraBillsTotal;
      const totalPaidForSession = getStudentTotalPaid(student.id);
      const overallBalance = totalFeeForSession - totalPaidForSession;
      
      return {
        ...student,
        termSummaries,
        totalTuitionForSession: studentTotalTuition,
        totalBusForSession: studentTotalBus,
        extraBillsTotal: unpaidExtraBillsTotal,
        extraBillsList: unpaidExtraBills,
        totalFeeForSession,
        totalPaidForSession,
        overallBalance,
        isFullyPaid: overallBalance === 0 && totalFeeForSession > 0
      };
    });
    
    return studentsWithData;
  };

  const studentsWithBalances = getStudentsWithBalances();
  const parentStudentIds = students.map(s => s.id);
  
  const totalPaid = allPayments
    .filter(p => parentStudentIds.includes(p.studentId) && p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const pendingPayments = allPayments
    .filter(p => parentStudentIds.includes(p.studentId) && p.status === 'pending')
    .length;

  const handleDataUpdate = () => {
    // Reload data without changing session
    if (currentSession) {
      loadDataForSession(currentSession);
    }
  };

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  const onStudentAdded = () => {
    handleDataUpdate();
  };

  // ============================================
  // RENDER
  // ============================================
  
  // Loading state
  if (loading && students.length === 0 && !isSyncing) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading your dashboard...</p>
            {currentSession && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>
                Session: {currentSession.name}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No session state
  if (!currentSession && !loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#ef4444' }} />
            <h3>No Active Session</h3>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Please contact the administrator to set up the current academic session.
            </p>
            <button 
              onClick={refreshSessionAndData} 
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              disabled={isSyncing}
            >
              <RefreshCw size={16} className={isSyncing ? 'spinner' : ''} />
              {isSyncing ? 'Loading...' : 'Check for Sessions'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="container" style={{ padding: isMobile ? '12px' : '20px' }}>
      {/* Session Indicator Banner */}
      <div style={{ 
        background: isSyncing ? '#fef3c7' : currentSession?.isActive ? '#d1fae5' : '#eff6ff',
        padding: '12px 16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        border: `1px solid ${isSyncing ? '#f59e0b' : currentSession?.isActive ? '#10b981' : '#3b82f6'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color={isSyncing ? '#f59e0b' : currentSession?.isActive ? '#10b981' : '#3b82f6'} />
          <span style={{ fontSize: '14px' }}>
            <strong>Active Session:</strong> {currentSession?.name || 'Loading...'}
            {isSyncing && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>(Updating...)</span>}
            {currentSession?.isActive && !isSyncing && (
              <span style={{ color: '#10b981', marginLeft: '8px' }}>✅ Active</span>
            )}
          </span>
          <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>
            (ID: {currentSession?.id || 'N/A'})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {feeStructures.length > 0 ? (
              <span style={{ color: '#10b981' }}>✅ {feeStructures.length} fees loaded</span>
            ) : (
              <span style={{ color: '#f59e0b' }}>⏳ No fee structures</span>
            )}
          </div>
          <button 
            onClick={refreshSessionAndData} 
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'spinner' : ''} />
            {isSyncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ 
        padding: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '16px' : '24px'
      }}>
        <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Welcome, {user?.name || 'Parent'}!</h2>
        <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
          Manage your children's school fees
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="summary-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '12px' : '20px',
        marginBottom: isMobile ? '20px' : '24px'
      }}>
        <div className="summary-card" style={{ borderLeftColor: '#3b82f6' }}>
          <h4>My Children</h4>
          <div className="amount">{students.length}</div>
          <Users size={18} style={{ marginTop: '6px', color: '#3b82f6' }} />
        </div>
        
        <div className="summary-card" style={{ borderLeftColor: '#10b981' }}>
          <h4>Total Paid</h4>
          <div className="amount">₦{totalPaid.toLocaleString()}</div>
          <DollarSign size={18} style={{ marginTop: '6px', color: '#10b981' }} />
        </div>
        
        <div className="summary-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h4>Pending Approvals</h4>
          <div className="amount">{pendingPayments}</div>
          <Clock size={18} style={{ marginTop: '6px', color: '#f59e0b' }} />
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', 
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '20px' : '24px'
      }}>
        <div>
          <PaymentForm 
            onPaymentComplete={handleDataUpdate} 
            onAddStudent={handleAddStudent}
            feeStructures={feeStructures}
            busRegistrations={busRegistrations}
            busRoutes={busRoutes}
            parentStudents={students}
          />
          {students.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <button 
                onClick={handleAddStudent}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <PlusCircle size={16} />
                Add Another Student
              </button>
            </div>
          )}
        </div>
        
        <StudentBalanceSummary 
          students={studentsWithBalances} 
          onUpdate={handleDataUpdate}
          busRoutes={busRoutes}
          busRegistrations={busRegistrations}
        />
      </div>
      
      {/* Payment History */}
      <div style={{ marginTop: '24px' }}>
        <PaymentHistory />
      </div>
      
      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentForm 
          onClose={() => setShowAddStudent(false)}
          onStudentAdded={onStudentAdded}
          existingStudents={students}
        />
      )}
    </div>
  );
};
export default ParentDashboard;