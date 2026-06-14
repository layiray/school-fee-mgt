// src/components/Parent/PaymentHistory.js
import React, { useState, useEffect } from 'react';
import { listenToPayments } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import ReceiptModal from './ReceiptModal';
import { Eye } from 'lucide-react';

const PaymentHistory = () => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !currentSession) return;

    console.log("PaymentHistory - Loading from Firebase");
    
    const unsubscribe = listenToPayments((allPayments) => {
      // Filter for this parent's payments only (using parentId)
      const filteredPayments = (allPayments || []).filter(p => 
        p.parentId === user.uid && p.sessionId === currentSession.id
      );
      // Sort by date (newest first)
      filteredPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log("PaymentHistory - Filtered payments:", filteredPayments);
      setPayments(filteredPayments);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, currentSession]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="badge badge-approved">Approved</span>;
      case 'pending': return <span className="badge badge-pending">Pending</span>;
      case 'rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const approvedTotal = payments.reduce((sum, p) => sum + (p.status === 'approved' ? (p.amount || 0) : 0), 0);
  const pendingTotal = payments.reduce((sum, p) => sum + (p.status === 'pending' ? (p.amount || 0) : 0), 0);
  const approvedCount = payments.filter(p => p.status === 'approved').length;

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Payment History</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Payment History</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
          Session: {currentSession?.name}
        </p>
      </div>
      <div className="card-body">
        {payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            No payment history found
          </p>
        ) : (
          <>
            <div className="table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>Term</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.date).toLocaleDateString()}</td>
                      <td><strong>{payment.studentName}</strong></td>
                      <td>{payment.admissionNumber || 'N/A'}</td>
                      <td>{payment.className}</td>
                      <td>{payment.term}</td>
                      <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                        ₦{(payment.amount || 0).toLocaleString()}
                      </td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>
                        {payment.status === 'approved' && (
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Eye size={14} /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#d1fae5', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span><strong>Total Paid:</strong> ₦{approvedTotal.toLocaleString()}</span>
              <span><strong>Pending:</strong> ₦{pendingTotal.toLocaleString()}</span>
              <span><strong>Approved:</strong> {approvedCount}</span>
            </div>
          </>
        )}
      </div>
      
      {selectedPayment && (
        <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
};

export default PaymentHistory;