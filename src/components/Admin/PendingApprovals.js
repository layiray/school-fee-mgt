// src/components/Admin/PendingApprovals.js
import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { listenToPayments, savePayment } from '../../config/firebase';
import { Check, X, CreditCard, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingApprovals = ({ onApprove }) => {
  const { currentSession } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSession) return;
    
    // Listen to real-time payments from Firebase
    const unsubscribe = listenToPayments((allPayments) => {
      console.log("All payments from Firebase:", allPayments);
      // Filter for current session and pending status
      const sessionPayments = allPayments.filter(p => 
        p.sessionId === currentSession?.id && p.status === 'pending'
      );
      setPayments(sessionPayments);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentSession]);

  const handleApprove = async (payment) => {
    const updatedPayment = { 
      ...payment, 
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin'
    };
    
    // Update in Firebase
    const result = await savePayment(updatedPayment);
    
    if (result.success) {
      // Update local storage as backup
      const allPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const updatedPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      
      toast.success(`Payment from ${payment.studentName} approved successfully`);
      
      if (onApprove) onApprove();
    } else {
      toast.error('Failed to approve payment: ' + result.error);
    }
  };

  const handleReject = async (payment) => {
    const updatedPayment = { 
      ...payment, 
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin'
    };
    
    // Update in Firebase
    const result = await savePayment(updatedPayment);
    
    if (result.success) {
      // Update local storage as backup
      const allPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const updatedPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      
      toast.error(`Payment from ${payment.studentName} rejected`);
      
      if (onApprove) onApprove();
    } else {
      toast.error('Failed to reject payment: ' + result.error);
    }
  };

  const getPaymentModeIcon = (mode) => {
    return mode === 'online' ? <CreditCard size={14} /> : <DollarSign size={14} />;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Pending Approvals</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Pending Approvals</h2>
        </div>
        <div className="card-body">
          <p>No active session. Please create a session first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Pending Approvals</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
          Session: {currentSession?.name} | {payments.length} payment(s) pending
        </p>
      </div>
      <div className="card-body">
        {payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            No pending payments to approve for {currentSession?.name}
          </p>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Term</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td><strong>{payment.studentName}</strong></td>
                    <td>{payment.className}</td>
                    <td>{payment.term}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>₦{payment.amount.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {getPaymentModeIcon(payment.paymentMode)}
                        <span style={{ fontSize: '12px' }}>
                          {payment.paymentMode === 'online' ? 'Online' : 'Cash'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{payment.parentName || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(payment)}
                          className="btn btn-success"
                          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Approve Payment"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(payment)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Reject Payment"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {payments.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#fef3c7', 
            borderRadius: '8px', 
            fontSize: '12px' 
          }}>
            <strong>Total Pending Amount:</strong> ₦{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;