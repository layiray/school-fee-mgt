import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { listenToPayments, savePayment } from '../../config/firebase';
import { Check, X, CreditCard, DollarSign, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingApprovals = ({ onApprove }) => {
  const { currentSession } = useSession();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!currentSession) return;
    
    const unsubscribe = listenToPayments((allPayments) => {
      const sessionPayments = allPayments.filter(p => 
        p.sessionId === currentSession?.id && p.status === 'pending'
      );
      setPayments(sessionPayments);
      filterPayments(sessionPayments, searchTerm);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentSession]);

  const filterPayments = (paymentsList, term) => {
    if (!term) {
      setFilteredPayments(paymentsList);
    } else {
      const filtered = paymentsList.filter(p => 
        p.studentName?.toLowerCase().includes(term.toLowerCase()) ||
        p.admissionNumber?.toLowerCase().includes(term.toLowerCase()) ||
        p.className?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredPayments(filtered);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterPayments(payments, term);
  };

  const handleApprove = async (payment) => {
    setProcessingId(payment.id);
    const updatedPayment = { 
      ...payment, 
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin'
    };
    
    const result = await savePayment(updatedPayment);
    
    if (result.success) {
      toast.success(`Payment from ${payment.studentName} (${payment.admissionNumber || 'N/A'}) approved successfully`);
      if (onApprove) onApprove();
    } else {
      toast.error('Failed to approve payment: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (payment) => {
    setProcessingId(payment.id);
    const updatedPayment = { 
      ...payment, 
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin'
    };
    
    const result = await savePayment(updatedPayment);
    
    if (result.success) {
      toast.error(`Payment from ${payment.studentName} (${payment.admissionNumber || 'N/A'}) rejected`);
      if (onApprove) onApprove();
    } else {
      toast.error('Failed to reject payment: ' + result.error);
    }
    setProcessingId(null);
  };

  const getPaymentModeIcon = (mode) => {
    return mode === 'online' ? <CreditCard size={14} /> : <DollarSign size={14} />;
  };

  const totalPendingAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
          Session: {currentSession?.name} | {filteredPayments.length} payment(s) pending
        </p>
      </div>
      <div className="card-body">
        {/* Search Bar */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by student name, admission number, or class..."
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
        </div>
        
        {filteredPayments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            {searchTerm ? 'No matching payments found' : `No pending payments to approve for ${currentSession?.name}`}
          </p>
        ) : (
          <>
            <div className="table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>Term</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Parent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.date).toLocaleDateString()}</td>
                      <td><strong>{payment.studentName}</strong></td>
                      <td>
                        <span style={{ 
                          background: '#e0e7ff', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {payment.admissionNumber || 'N/A'}
                        </span>
                      </td>
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
                      <td style={{ fontSize: '12px' }}>{payment.parentName || 'N/A'} </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(payment)}
                            disabled={processingId === payment.id}
                            className="btn btn-success"
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Approve Payment"
                          >
                            <Check size={14} /> {processingId === payment.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(payment)}
                            disabled={processingId === payment.id}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Reject Payment"
                          >
                            <X size={14} /> {processingId === payment.id ? '...' : 'Reject'}
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#fef3c7', 
              borderRadius: '8px', 
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span><strong>Total Pending Amount:</strong> ₦{totalPendingAmount.toLocaleString()}</span>
              <span><strong>Number of Pending Payments:</strong> {filteredPayments.length}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;