// src/components/Admin/AllTransactions.js
import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { listenToPayments } from '../../config/firebase';
import { Filter, CreditCard, DollarSign } from 'lucide-react';

const AllTransactions = () => {
  const { currentSession, sessions } = useSession();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('current');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToPayments((allPayments) => {
      setPayments(allPayments);
      filterPayments(allPayments, sessionFilter);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const filterPayments = (allPayments, filter) => {
    if (filter === 'current') {
      setFilteredPayments(allPayments.filter(p => p.sessionId === currentSession?.id));
    } else if (filter === 'all') {
      setFilteredPayments(allPayments);
    } else {
      setFilteredPayments(allPayments.filter(p => p.sessionId === parseInt(filter)));
    }
  };

  const handleFilterChange = (filter) => {
    setSessionFilter(filter);
    filterPayments(payments, filter);
  };

  const getPaymentModeIcon = (mode) => {
    return mode === 'online' ? <CreditCard size={14} /> : <DollarSign size={14} />;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="badge badge-approved">Approved</span>;
      case 'pending': return <span className="badge badge-pending">Pending</span>;
      case 'rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>All Transactions</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>All Transactions</h2>
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Filter size={16} />
          <select 
            value={sessionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white' }}
          >
            <option value="current">Current Session Only</option>
            <option value="all">All Sessions</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-body">
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
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => (
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
                  <td>
                    <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                      {payment.sessionName || 'N/A'}
                    </span>
                  </td>
                  <td>{getStatusBadge(payment.status)}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#d1fae5', 
            borderRadius: '8px', 
            fontSize: '14px' 
          }}>
            <strong>Total Amount:</strong> ₦{filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;