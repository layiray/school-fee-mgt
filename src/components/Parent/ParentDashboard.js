import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { 
  listenToStudents, 
  listenToPayments, 
  listenToFeeStructures,
  listenToExtraBills,
  listenToBusRegistrations,
  listenToBusRoutes,
  saveStudent,
  addStudentToParent
} from '../../config/firebase';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import StudentBalanceSummary from './StudentBalanceSummary';
import AddStudentForm from './AddStudentForm';
import { DollarSign, Clock, Users, Calendar, PlusCircle, CreditCard, Receipt, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  
  // State declarations - All from Firebase only
  const [allPayments, setAllPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extraBills, setExtraBills] = useState([]);
  const [busRegistrations, setBusRegistrations] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [activeMobileView, setActiveMobileView] = useState('payment');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dataLoaded, setDataLoaded] = useState({
    students: false,
    payments: false,
    feeStructures: false,
    busRoutes: false
  });

  // Mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all data from Firebase - NO localStorage
  useEffect(() => {
    if (!user || !user.uid) {
      console.log("No user authenticated");
      return;
    }

    if (!currentSession) {
      console.log("No current session");
      return;
    }

    console.log("=== ParentDashboard Loading from Firebase ===");
    console.log("User UID:", user.uid);
    console.log("Current Session ID:", currentSession.id);

    // Listen to students from Firebase
    const unsubscribeStudents = listenToStudents((allStudents) => {
      console.log("Students from Firebase:", allStudents);
      const parentStudents = allStudents.filter(s => s.parentId === user.uid);
      console.log("Parent's students:", parentStudents);
      setStudents(parentStudents);
      setDataLoaded(prev => ({ ...prev, students: true }));
    });

    // Listen to all payments from Firebase
    const unsubscribePayments = listenToPayments((payments) => {
      console.log("Payments from Firebase:", payments);
      setAllPayments(payments || []);
      setDataLoaded(prev => ({ ...prev, payments: true }));
    });

    // Listen to fee structures for current session from Firebase
    const unsubscribeFees = listenToFeeStructures(currentSession.id, (fees) => {
      console.log(`Fee structures for session ${currentSession.id} from Firebase:`, fees);
      setFeeStructures(fees || []);
      setDataLoaded(prev => ({ ...prev, feeStructures: true }));
    });
    
    // Listen to bus routes for current session from Firebase
    const unsubscribeBusRoutes = listenToBusRoutes(currentSession.id, (routes) => {
      console.log(`Bus routes for session ${currentSession.id} from Firebase:`, routes);
      setBusRoutes(routes || []);
      setDataLoaded(prev => ({ ...prev, busRoutes: true }));
    });
    
    // Listen to extra bills from Firebase
    const unsubscribeExtra = listenToExtraBills((bills) => {
      console.log("Extra bills from Firebase:", bills);
      setExtraBills(bills || []);
    });
    
    // Listen to bus registrations from Firebase
    const unsubscribeBusReg = listenToBusRegistrations((registrations) => {
      console.log("Bus registrations from Firebase:", registrations);
      setBusRegistrations(registrations || []);
    });
    
    // Check when all essential data is loaded
    const interval = setInterval(() => {
      if (dataLoaded.students && dataLoaded.payments && dataLoaded.feeStructures && loading) {
        console.log("All essential data loaded from Firebase");
        setLoading(false);
        clearInterval(interval);
      }
    }, 500);
    
    // Timeout after 5 seconds
    const timer = setTimeout(() => {
      console.log("Loading timeout - forcing display");
      setLoading(false);
      clearInterval(interval);
    }, 5000);
    
    return () => {
      unsubscribeStudents();
      unsubscribePayments();
      unsubscribeFees();
      unsubscribeBusRoutes();
      unsubscribeExtra();
      unsubscribeBusReg();
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [user, currentSession]);

  // Helper function to get tuition fee from Firebase data
  const getTuitionFee = (className, term) => {
    if (!feeStructures || feeStructures.length === 0) {
      return 0;
    }
    const fee = feeStructures.find(f => f.className === className && f.term === term);
    return fee ? fee.amount : 0;
  };

  // Helper function to get bus fee from Firebase data
  const getBusFee = (studentId, term) => {
    const registration = busRegistrations.find(
      r => r.studentId === studentId && r.term === term && r.usesBus
    );
    return registration ? registration.busFee : 0;
  };

  // Get total paid for a specific student in a specific term from Firebase payments
  const getStudentTermPaid = (studentId, term) => {
    const relevantPayments = allPayments.filter(p => 
      p.studentId === studentId && 
      p.term === term && 
      p.status === 'approved'
    );
    return relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Get total paid for a student across all terms from Firebase payments
  const getStudentTotalPaid = (studentId) => {
    const relevantPayments = allPayments.filter(p => 
      p.studentId === studentId && p.status === 'approved'
    );
    return relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Get unpaid extra bills from Firebase
  const getUnpaidExtraBills = (studentId) => {
    return extraBills.filter(b => b.studentId === studentId && !b.isPaid);
  };

  // Build complete student balance data from Firebase
  const getStudentsWithBalances = () => {
    console.log("Building student balances from Firebase data");
    console.log("Fee structures count:", feeStructures.length);
    console.log("Students count:", students.length);
    console.log("Payments count:", allPayments.length);
    
    const studentsWithData = students.map(student => {
      const terms = ['First Term', 'Second Term', 'Third Term'];
      let studentTotalTuition = 0;
      let studentTotalBus = 0;
      
      // Calculate per term
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
      
      // Add extra bills
      const unpaidExtraBills = getUnpaidExtraBills(student.id);
      const unpaidExtraBillsTotal = unpaidExtraBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      // Calculate totals
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

  // Calculate dashboard totals from Firebase data
  const studentsWithBalances = getStudentsWithBalances();
  const parentStudentIds = students.map(s => s.id);
  
  // Total paid across all parent's students from Firebase
  const totalPaid = allPayments
    .filter(p => parentStudentIds.includes(p.studentId) && p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Pending payments count from Firebase
  const pendingPayments = allPayments
    .filter(p => parentStudentIds.includes(p.studentId) && p.status === 'pending')
    .length;
  
  // Total session fee across all students
  const totalSessionFee = studentsWithBalances.reduce((total, student) => total + (student.totalFeeForSession || 0), 0);

  const handleDataUpdate = () => {
    setRefresh(!refresh);
  };

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  const onStudentAdded = () => {
    handleDataUpdate();
  };

  // Show loading indicator while fetching from Firebase
  if (loading && students.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading your dashboard from Firebase...</p>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#9ca3af' }}>
              {!dataLoaded.students && "📚 Loading students... "}
              {!dataLoaded.payments && "💰 Loading payments... "}
              {!dataLoaded.feeStructures && "📋 Loading fee structures... "}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <h3>No Active Session</h3>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Please contact the administrator to set up the current academic session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: isMobile ? '12px' : '20px' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ 
        padding: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '16px' : '24px'
      }}>
        <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Welcome, {user?.name}!</h2>
        <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
          Manage your children's school fees
        </p>
      </div>
      
      {/* Session Info */}
      <div className="session-banner" style={{ 
        padding: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '16px' : '24px',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={isMobile ? 18 : 20} />
          <div>
            <strong style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{currentSession.name} Session</strong>
            <p style={{ fontSize: '0.65rem', marginTop: '2px' }}>
              ID: {currentSession.id}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 'bold' }}>₦{totalPaid.toLocaleString()}</div>
            <div style={{ fontSize: '0.6rem' }}>Paid</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 'bold' }}>₦{(totalSessionFee - totalPaid).toLocaleString()}</div>
            <div style={{ fontSize: '0.6rem' }}>Due</div>
          </div>
        </div>
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
          <h4>Pending</h4>
          <div className="amount">{pendingPayments}</div>
          <Clock size={18} style={{ marginTop: '6px', color: '#f59e0b' }} />
        </div>
      </div>
      
      {/* Mobile Toggle */}
      {isMobile && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          background: '#f3f4f6',
          padding: '6px',
          borderRadius: '12px'
        }}>
          <button
            onClick={() => setActiveMobileView('payment')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeMobileView === 'payment' ? '#3b82f6' : 'transparent',
              color: activeMobileView === 'payment' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <CreditCard size={18} />
            Make Payment
          </button>
          <button
            onClick={() => setActiveMobileView('summary')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeMobileView === 'summary' ? '#3b82f6' : 'transparent',
              color: activeMobileView === 'summary' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <Receipt size={18} />
            Balance Summary
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', 
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '20px' : '24px'
      }}>
        {/* Payment Form Section */}
        {(isMobile ? activeMobileView === 'payment' : true) && (
          <div>
            <PaymentForm 
              onPaymentComplete={handleDataUpdate} 
              onAddStudent={handleAddStudent}
              feeStructures={feeStructures}
              busRegistrations={busRegistrations}
              busRoutes={busRoutes}
              parentStudents={students}
            />
            {students.length > 0 && !isMobile && (
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
        )}
        
        {/* Balance Summary Section */}
        {(isMobile ? activeMobileView === 'summary' : true) && (
          <StudentBalanceSummary 
            students={studentsWithBalances} 
            onUpdate={handleDataUpdate}
            busRoutes={busRoutes}
            busRegistrations={busRegistrations}
          />
        )}
      </div>
      
      {/* Add Student Button for Mobile */}
      {isMobile && students.length > 0 && activeMobileView === 'payment' && (
        <div style={{ marginBottom: '20px' }}>
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