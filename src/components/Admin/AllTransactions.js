import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { listenToPayments } from '../../config/firebase';
import { Filter, CreditCard, DollarSign, Search } from 'lucide-react';

const AllTransactions = () => {
  const { currentSession, sessions } = useSession();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('current');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = listenToPayments((allPayments) => {
      setPayments(allPayments);
      filterPayments(allPayments, sessionFilter);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const filterPayments = (allPayments, filter) => {
    let filtered = [];
    if (filter === 'current') {
      filtered = allPayments.filter(p => p.sessionId === currentSession?.id);
    } else if (filter === 'all') {
      filtered = allPayments;
    } else {
      filtered = allPayments.filter(p => p.sessionId === parseInt(filter));
    }
    
    // Apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.className?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  };

  const handleFilterChange = (filter) => {
    setSessionFilter(filter);
    filterPayments(payments, filter);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    filterPayments(payments, sessionFilter);
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

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const approvedAmount = filteredPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

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
          
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by student name, admission number, or class..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '12px', 
          marginBottom: '20px' 
        }}>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{filteredPayments.length}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Transactions</div>
          </div>
          <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>₦{approvedAmount.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Approved Amount</div>
          </div>
          <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>₦{pendingAmount.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Pending Amount</div>
          </div>
          <div style={{ background: '#f3e8ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>₦{totalAmount.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Amount</div>
          </div>
        </div>
        
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
                <th>Session</th>
                <th>Status</th>
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
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>₦{(payment.amount || 0).toLocaleString()}</td>
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
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllTransactions;