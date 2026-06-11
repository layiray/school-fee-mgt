import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { 
  savePayment, 
  listenToPayments, 
  listenToFeeStructures, 
  listenToBusRegistrations,
  listenToExtraBills
} from '../../config/firebase';
import { Send, Info, CreditCard, DollarSign, PlusCircle, Bus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentForm = ({ onPaymentComplete, onAddStudent, parentStudents = [] }) => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    admissionNumber: '',
    className: '',
    term: '',
    amount: '',
    paymentMode: 'online'
  });
  const [feeStructures, setFeeStructures] = useState([]);
  const [busRegistrations, setBusRegistrations] = useState([]);
  const [existingPayments, setExistingPayments] = useState([]);
  const [extraBills, setExtraBills] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);
  const [studentBusFee, setStudentBusFee] = useState(0);
  const [studentExtraBills, setStudentExtraBills] = useState([]);
  const [studentTuitionFee, setStudentTuitionFee] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen to real-time data from Firebase
  useEffect(() => {
    if (!currentSession) return;

    // Listen to fee structures
    const unsubscribeFees = listenToFeeStructures(currentSession.id, (fees) => {
      console.log("PaymentForm - Fee structures from Firebase:", fees);
      setFeeStructures(fees);
    });

    // Listen to bus registrations
    const unsubscribeBus = listenToBusRegistrations((registrations) => {
      console.log("PaymentForm - Bus registrations from Firebase:", registrations);
      setBusRegistrations(registrations);
    });

    // Listen to payments
    const unsubscribePayments = listenToPayments((payments) => {
      console.log("PaymentForm - Payments from Firebase:", payments);
      setExistingPayments(payments);
    });

    // Listen to extra bills
    const unsubscribeExtra = listenToExtraBills((bills) => {
      console.log("PaymentForm - Extra bills from Firebase:", bills);
      setExtraBills(bills);
    });

    setTimeout(() => setLoading(false), 500);

    return () => {
      unsubscribeFees();
      unsubscribeBus();
      unsubscribePayments();
      unsubscribeExtra();
    };
  }, [currentSession]);

  // Calculate fees when student and term are selected
  useEffect(() => {
    if (formData.studentId && formData.className && formData.term) {
      calculateFeesForTerm();
    }
  }, [formData.studentId, formData.className, formData.term, feeStructures, busRegistrations, extraBills, existingPayments]);

  const calculateFeesForTerm = () => {
    // Calculate tuition fee from fee structures
    const tuitionFee = feeStructures.find(f => 
      f.className === formData.className && f.term === formData.term
    )?.amount || 0;
    setStudentTuitionFee(tuitionFee);
    console.log("Tuition fee calculated:", tuitionFee);
    
    // Calculate bus fee from registrations
    const busReg = busRegistrations.find(r => 
      r.studentId === formData.studentId && 
      r.term === formData.term && 
      r.usesBus
    );
    const busFee = busReg ? busReg.busFee : 0;
    setStudentBusFee(busFee);
    console.log("Bus fee calculated:", busFee);
    
    // Get extra bills for this student
    const studentBills = extraBills.filter(b => 
      b.studentId === formData.studentId && !b.isPaid
    );
    setStudentExtraBills(studentBills);
    console.log("Extra bills:", studentBills);
    
    // Set selected fee for display
    if (tuitionFee > 0) {
      setSelectedFee({ amount: tuitionFee });
    } else {
      setSelectedFee(null);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const selectedStudent = parentStudents.find(s => s.id === studentId);
    
    if (selectedStudent) {
      setFormData({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        admissionNumber: selectedStudent.admissionNumber || '',
        className: selectedStudent.className,
        term: '',
        amount: '',
        paymentMode: formData.paymentMode
      });
      setSelectedFee(null);
      setStudentBusFee(0);
      setStudentTuitionFee(0);
    }
  };

  const handleTermChange = (e) => {
    const term = e.target.value;
    setFormData(prev => ({ ...prev, term: term, amount: '' }));
  };

  const handlePaymentModeChange = (mode) => {
    setFormData(prev => ({ ...prev, paymentMode: mode }));
  };

  const handleAmountChange = (e) => {
    setFormData(prev => ({ ...prev, amount: e.target.value }));
  };

  const getPreviouslyPaidForTerm = () => {
    if (!formData.studentId || !formData.term) return 0;
    
    // Filter payments for this student and term that are approved
    const approvedPayments = existingPayments.filter(p => 
      p.studentId === formData.studentId && 
      p.term === formData.term && 
      p.status === 'approved'
    );
    
    const total = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log("Previously paid for term:", total);
    return total;
  };

  const getTotalOutstandingBalance = () => {
    if (!formData.studentId || !formData.term || !selectedFee) return 0;
    
    const previouslyPaid = getPreviouslyPaidForTerm();
    const tuitionBalance = studentTuitionFee - previouslyPaid;
    const totalExtraBillsAmount = studentExtraBills.reduce((sum, b) => sum + b.amount, 0);
    
    const total = tuitionBalance + studentBusFee + totalExtraBillsAmount;
    console.log("Total outstanding:", total);
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentSession) {
      toast.error('No active session. Please contact admin.');
      return;
    }
    
    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }
    
    if (!formData.term) {
      toast.error('Please select a term');
      return;
    }
    
    if (studentTuitionFee === 0) {
      toast.error('No fee structure found for this class and term. Please contact admin.');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const totalOutstanding = getTotalOutstandingBalance();
    
    if (amount > totalOutstanding) {
      toast.error(`Payment amount exceeds total outstanding balance of ₦${totalOutstanding.toLocaleString()}`);
      return;
    }
    
    const paymentId = Date.now();
    
    const payment = {
      id: paymentId,
      studentId: formData.studentId,
      studentName: formData.studentName,
      admissionNumber: formData.admissionNumber,
      className: formData.className,
      term: formData.term,
      amount: amount,
      status: 'pending',
      paymentMode: formData.paymentMode,
      date: new Date().toISOString(),
      sessionId: currentSession.id,
      sessionName: currentSession.name,
      parentId: user?.uid,
      parentName: user?.name,
      tuitionFee: studentTuitionFee,
      busFee: studentBusFee,
      extraBillsTotal: studentExtraBills.reduce((sum, b) => sum + b.amount, 0),
      totalFeeForTerm: studentTuitionFee + studentBusFee,
      previouslyPaid: getPreviouslyPaidForTerm(),
      remainingAfterThis: totalOutstanding - amount,
      createdAt: new Date().toISOString()
    };
    
    setLoading(true);
    const result = await savePayment(payment);
    setLoading(false);
    
    if (result.success) {
      toast.success(`Payment submitted for approval! Remaining balance: ₦${(totalOutstanding - amount).toLocaleString()}`);
      
      setFormData({
        studentId: formData.studentId,
        studentName: formData.studentName,
        admissionNumber: formData.admissionNumber,
        className: formData.className,
        term: '',
        amount: '',
        paymentMode: formData.paymentMode
      });
      
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    } else {
      toast.error('Failed to submit payment: ' + result.error);
    }
  };

  const previouslyPaid = getPreviouslyPaidForTerm();
  const totalOutstanding = getTotalOutstandingBalance();

  if (loading && parentStudents.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Make a Payment</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px' }}>Loading fee structures...</p>
        </div>
      </div>
    );
  }

  if (!parentStudents || parentStudents.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Make a Payment</h2>
          <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
            Session: {currentSession?.name}
          </p>
        </div>
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ 
              width: '70px', 
              height: '70px', 
              background: '#eff6ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <PlusCircle size={35} color="#3b82f6" />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '1.125rem' }}>No Students Added Yet</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
              Add your first student to start making payments.
            </p>
            <button 
              onClick={onAddStudent}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <PlusCircle size={16} />
              Add Your First Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Make a Payment</h2>
        <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
          Session: {currentSession?.name}
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Student Selection */}
          <div className="form-group">
            <label>Select Student *</label>
            <select 
              value={formData.studentId} 
              onChange={handleStudentChange}
              required
              style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            >
              <option value="">-- Select a student --</option>
              {parentStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.className} {student.admissionNumber ? `(${student.admissionNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {formData.studentId && (
            <>
              {/* Display Admission Number */}
              {formData.admissionNumber && (
                <div style={{ 
                  background: '#f0fdf4', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  fontSize: '0.875rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <strong>Admission Number:</strong> {formData.admissionNumber}
                </div>
              )}
              
              {/* Term Selection */}
              <div className="form-group">
                <label>Select Term *</label>
                <select 
                  value={formData.term} 
                  onChange={handleTermChange}
                  required
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  <option value="">-- Select Term --</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>

              {/* Payment Mode Selection */}
              <div className="form-group">
                <label>Mode of Payment *</label>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '8px'
                }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      padding: '12px',
                      border: `2px solid ${formData.paymentMode === 'online' ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formData.paymentMode === 'online' ? '#eff6ff' : 'white',
                      minHeight: '48px'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="online"
                      checked={formData.paymentMode === 'online'}
                      onChange={() => handlePaymentModeChange('online')}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <CreditCard size={18} color={formData.paymentMode === 'online' ? '#3b82f6' : '#6b7280'} />
                    <span>Online Transfer</span>
                  </label>
                  
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      padding: '12px',
                      border: `2px solid ${formData.paymentMode === 'cash' ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formData.paymentMode === 'cash' ? '#eff6ff' : 'white',
                      minHeight: '48px'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="cash"
                      checked={formData.paymentMode === 'cash'}
                      onChange={() => handlePaymentModeChange('cash')}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <DollarSign size={18} color={formData.paymentMode === 'cash' ? '#3b82f6' : '#6b7280'} />
                    <span>Cash Payment</span>
                  </label>
                </div>
              </div>
              
              {/* Fee Breakdown */}
              {formData.term && (
                <div style={{ 
                  background: '#eff6ff', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Info size={16} color="#3b82f6" />
                    <strong>Fee Breakdown for {formData.term}</strong>
                  </div>
                  <div style={{ fontSize: '0.813rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Tuition Fee:</span>
                      <strong>₦{studentTuitionFee.toLocaleString()}</strong>
                    </div>
                    
                    {studentBusFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bus size={14} /> Bus Fee:
                        </span>
                        <strong style={{ color: '#10b981' }}>₦{studentBusFee.toLocaleString()}</strong>
                      </div>
                    )}
                    
                    {studentBusFee === 0 && formData.term && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bus size={14} /> Bus Fee:
                        </span>
                        <strong style={{ color: '#6b7280' }}>Not Registered</strong>
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '8px', 
                      paddingTop: '8px', 
                      borderTop: '1px dashed #cbd5e1',
                      fontWeight: 'bold'
                    }}>
                      <span>Total Fee for Term:</span>
                      <strong style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                        ₦{(studentTuitionFee + studentBusFee).toLocaleString()}
                      </strong>
                    </div>
                    
                    {previouslyPaid > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#10b981' }}>
                        <span>Already Paid:</span>
                        <strong>₦{previouslyPaid.toLocaleString()}</strong>
                      </div>
                    )}
                    
                    {studentExtraBills.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                        <div style={{ color: '#e74c3c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={14} /> Extra Bills:
                        </div>
                        {studentExtraBills.map(bill => (
                          <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span>• {bill.description}</span>
                            <span style={{ color: '#e74c3c' }}>₦{bill.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold' }}>
                          <span>Total Extra Bills:</span>
                          <span style={{ color: '#e74c3c' }}>₦{studentExtraBills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '12px', 
                      paddingTop: '12px', 
                      borderTop: '2px solid #cbd5e1',
                      background: '#fef3c7',
                      padding: '10px',
                      borderRadius: '8px'
                    }}>
                      <strong>Total Outstanding:</strong>
                      <strong style={{ color: '#e74c3c', fontSize: '0.875rem' }}>
                        ₦{totalOutstanding.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Amount Input */}
              <div className="form-group">
                <label>Amount to Pay (₦) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount to pay"
                  min="1"
                  max={totalOutstanding}
                  required
                  disabled={!formData.term || studentTuitionFee === 0 || totalOutstanding === 0 || loading}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
                {formData.term && studentTuitionFee > 0 && totalOutstanding > 0 && (
                  <small style={{ color: '#6b7280', marginTop: '6px', display: 'block' }}>
                    Maximum payable: ₦{totalOutstanding.toLocaleString()}
                  </small>
                )}
                {totalOutstanding === 0 && formData.term && (
                  <small style={{ color: '#10b981', marginTop: '6px', display: 'block' }}>
                    ✓ No outstanding balance for this term
                  </small>
                )}
              </div>
              
              {/* SUBMIT PAYMENT BUTTON */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
                disabled={!formData.term || studentTuitionFee === 0 || totalOutstanding === 0 || loading}
              >
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Payment for Approval'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;