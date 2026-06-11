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
import { DollarSign, Clock, Users, Calendar, PlusCircle, CreditCard, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const [payments, setPayments] = useState([]);
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

  // Check screen size for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to real-time data from Firebase
  useEffect(() => {
    if (!user || !user.uid) {
      console.log("No user authenticated");
      return;
    }

    console.log("Setting up Firebase listeners for user:", user.uid);

    // Listen to students
    const unsubscribeStudents = listenToStudents((allStudents) => {
      console.log("All students from Firebase:", allStudents);
      const parentStudents = allStudents.filter(s => s.parentId === user.uid);
      console.log("Parent's students:", parentStudents);
      setStudents(parentStudents);
    });

    // Listen to payments
    const unsubscribePayments = listenToPayments((allPayments) => {
      console.log("All payments from Firebase:", allPayments);
      setPayments(allPayments || []);
    });

    // Listen to fee structures
    if (currentSession) {
      const unsubscribeFees = listenToFeeStructures(currentSession.id, (fees) => {
        console.log("Fee structures loaded:", fees);
        setFeeStructures(fees || []);
      });
      
      const unsubscribeExtra = listenToExtraBills((bills) => {
        console.log("Extra bills loaded:", bills);
        setExtraBills(bills || []);
      });
      
      const unsubscribeBusReg = listenToBusRegistrations((registrations) => {
        console.log("Bus registrations loaded:", registrations);
        setBusRegistrations(registrations || []);
      });
      
      const unsubscribeBusRoutes = listenToBusRoutes(currentSession.id, (routes) => {
        console.log("Bus routes loaded:", routes);
        setBusRoutes(routes || []);
      });
      
      setTimeout(() => setLoading(false), 1000);
      
      return () => {
        unsubscribeStudents();
        unsubscribePayments();
        unsubscribeFees();
        unsubscribeExtra();
        unsubscribeBusReg();
        unsubscribeBusRoutes();
      };
    }
    
    return () => {
      unsubscribeStudents();
      unsubscribePayments();
    };
  }, [user, currentSession]);

  // Get tuition fee from admin fee structure
  const getTuitionFee = (className, term) => {
    const fee = feeStructures.find(f => f.className === className && f.term === term);
    return fee ? fee.amount : 0;
  };

  // Get bus fee from parent registration for specific term
  const getBusFee = (studentId, term) => {
    const registration = busRegistrations.find(
      r => r.studentId === studentId && r.term === term && r.usesBus
    );
    return registration ? registration.busFee : 0;
  };

  // Get total paid for a student in a specific term (only approved payments)
  const getPaidAmount = (studentId, term) => {
    const approvedPayments = payments.filter(p => 
      p.studentId === studentId && p.term === term && p.status === 'approved'
    );
    return approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Get UNPAID extra bills for a student (not paid yet)
  const getUnpaidExtraBills = (studentId) => {
    return extraBills.filter(b => b.studentId === studentId && !b.isPaid);
  };

  // Get total unpaid extra bills amount
  const getTotalUnpaidExtraBills = (studentId) => {
    const unpaid = getUnpaidExtraBills(studentId);
    return unpaid.reduce((sum, b) => sum + (b.amount || 0), 0);
  };

  // Build student summary with all fees
  const getStudentsWithBalances = () => {
    return students.map(student => {
      const terms = ['First Term', 'Second Term', 'Third Term'];
      let totalTuitionForSession = 0;
      let totalBusForSession = 0;
      let totalPaidForSession = 0;
      
      const termSummaries = terms.map(term => {
        const tuitionFee = getTuitionFee(student.className, term);
        const busFee = getBusFee(student.id, term);
        const totalFeeForTerm = tuitionFee + busFee;
        const paidForTerm = getPaidAmount(student.id, term);
        const balanceForTerm = totalFeeForTerm - paidForTerm;
        
        totalTuitionForSession += tuitionFee;
        totalBusForSession += busFee;
        totalPaidForSession += paidForTerm;
        
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
      
      // Get unpaid extra bills for this student
      const unpaidExtraBills = getUnpaidExtraBills(student.id);
      const unpaidExtraBillsTotal = unpaidExtraBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      // TOTAL FEE = Tuition + Bus + Unpaid Extra Bills
      const totalFeeForSession = totalTuitionForSession + totalBusForSession + unpaidExtraBillsTotal;
      const overallBalance = totalFeeForSession - totalPaidForSession;
      
      return {
        ...student,
        termSummaries,
        totalTuitionForSession,
        totalBusForSession,
        extraBillsTotal: unpaidExtraBillsTotal,
        extraBillsList: unpaidExtraBills,
        totalFeeForSession,
        totalPaidForSession,
        overallBalance,
        isFullyPaid: overallBalance === 0 && totalFeeForSession > 0
      };
    });
  };

  const studentsWithBalances = getStudentsWithBalances();
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const totalPaid = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const totalSessionFee = studentsWithBalances.reduce((total, student) => total + (student.totalFeeForSession || 0), 0);

  const handleDataUpdate = () => {
    setRefresh(!refresh);
  };

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  const onStudentAdded = async (newStudent) => {
    console.log("Student added, refreshing dashboard...", newStudent);
    handleDataUpdate();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading your dashboard...</p>
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
      
      {/* Session Info Banner */}
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
              {currentSession.startDate && currentSession.endDate 
                ? `${currentSession.startDate} to ${currentSession.endDate}`
                : 'Current session'}
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
      
      {/* Summary Cards */}
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
      
      {/* Mobile Toggle Buttons */}
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
      
      {/* Main Content - Two Columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', 
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '20px' : '24px'
      }}>
        {/* Left Column - Payment Form */}
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
        
        {/* Right Column - Student Balance Summary */}
        {(isMobile ? activeMobileView === 'summary' : true) && (
          <StudentBalanceSummary 
            students={studentsWithBalances} 
            onUpdate={handleDataUpdate}
            busRoutes={busRoutes}
            busRegistrations={busRegistrations}
          />
        )}
      </div>
      
      {/* Add Another Student Button - Mobile Version */}
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
      
      {/* Payment History Section */}
      <div style={{ marginTop: '24px' }}>
        <PaymentHistory />
      </div>
      
      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentForm 
          onClose={() => setShowAddStudent(false)}
          onStudentAdded={onStudentAdded}
        />
      )}
    </div>
  );
};

export default ParentDashboard;