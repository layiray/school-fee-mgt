import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { saveFeeStructures, listenToFeeStructures } from '../../config/firebase';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const FeeStructure = ({ onUpdate }) => {
  const { currentSession } = useSession();
  const [feeStructures, setFeeStructures] = useState([]);
  const [newFee, setNewFee] = useState({
    className: '',
    term: '',
    amount: ''
  });
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentSession) return;
    
    const unsubscribe = listenToFeeStructures(currentSession.id, (fees) => {
      setFeeStructures(fees);
    });
    
    return () => unsubscribe();
  }, [currentSession]);

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!newFee.className || !newFee.term || !newFee.amount) {
      toast.error('Please fill all fields');
      return;
    }

    const existingFee = feeStructures.find(
      f => f.className === newFee.className && f.term === newFee.term
    );
    
    if (existingFee) {
      toast.error(`Fee already exists for ${newFee.className} - ${newFee.term}`);
      return;
    }

    const newFeeObject = { 
      id: Date.now(), 
      className: newFee.className,
      term: newFee.term,
      amount: parseFloat(newFee.amount),
      sessionId: currentSession.id,
      sessionName: currentSession.name,
      createdAt: new Date().toISOString()
    };
    
    const updatedFees = [...feeStructures, newFeeObject];
    setFeeStructures(updatedFees);
    await saveFeeStructures(currentSession.id, updatedFees);
    
    toast.success(`Fee structure added for ${newFee.className} - ${newFee.term}`);
    setNewFee({ className: '', term: '', amount: '' });
    setShowMobileForm(false);
    
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate();
    }
  };

  const handleDeleteFee = async (id) => {
    const updatedFees = feeStructures.filter(f => f.id !== id);
    setFeeStructures(updatedFees);
    await saveFeeStructures(currentSession.id, updatedFees);
    toast.success('Fee structure deleted');
    
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate();
    }
  };

  const terms = ['First Term', 'Second Term', 'Third Term'];
  
  // Complete class list with all sections including JSS
  const classOptions = [
    // Pre-School
    'Pre-Nursery', 'Playgroup', 'Nursery 1', 'Nursery 2', 'Nursery 3',
    // Primary
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5',
    // Junior Secondary School (JSS)
    'JSS 1', 'JSS 2', 'JSS 3',
    // Senior Secondary School (SS)
    'SS1 Science', 'SS1 Commercial', 'SS1 Arts',
    'SS2 Science', 'SS2 Commercial', 'SS2 Arts',
    'SS3 Science', 'SS3 Commercial', 'SS3 Arts'
  ];

  if (!currentSession) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Fee Structure Management</h2>
        </div>
        <div className="card-body">
          <p style={{ textAlign: 'center', padding: '40px' }}>No active session. Please create a session first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2>Fee Structure Management</h2>
            <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
              Session: <strong>{currentSession.name}</strong>
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setShowMobileForm(!showMobileForm)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              Add Fee
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        {/* Desktop Form - Horizontal Layout */}
        {!isMobile && (
          <form onSubmit={handleAddFee} style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px' 
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr auto', 
              gap: '12px',
              alignItems: 'center'
            }}>
              <select
                value={newFee.className}
                onChange={(e) => setNewFee({ ...newFee, className: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">Select Class</option>
                <optgroup label="Pre-School">
                  <option value="Pre-Nursery">Pre-Nursery</option>
                  <option value="Playgroup">Playgroup</option>
                  <option value="Nursery 1">Nursery 1</option>
                  <option value="Nursery 2">Nursery 2</option>
                  <option value="Nursery 3">Nursery 3</option>
                </optgroup>
                <optgroup label="Primary">
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                </optgroup>
                <optgroup label="Junior Secondary School (JSS)">
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                </optgroup>
                <optgroup label="SS1">
                  <option value="SS1 Science">SS1 Science</option>
                  <option value="SS1 Commercial">SS1 Commercial</option>
                  <option value="SS1 Arts">SS1 Arts</option>
                </optgroup>
                <optgroup label="SS2">
                  <option value="SS2 Science">SS2 Science</option>
                  <option value="SS2 Commercial">SS2 Commercial</option>
                  <option value="SS2 Arts">SS2 Arts</option>
                </optgroup>
                <optgroup label="SS3">
                  <option value="SS3 Science">SS3 Science</option>
                  <option value="SS3 Commercial">SS3 Commercial</option>
                  <option value="SS3 Arts">SS3 Arts</option>
                </optgroup>
              </select>
              <select
                value={newFee.term}
                onChange={(e) => setNewFee({ ...newFee, term: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount (₦)"
                value={newFee.amount}
                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Plus size={16} />
                Add Fee
              </button>
            </div>
          </form>
        )}

        {/* Mobile Form - Modal/Drawer */}
        {isMobile && showMobileForm && (
          <div className="modal-overlay" onClick={() => setShowMobileForm(false)}>
            <div className="modal-content" style={{ maxWidth: '500px', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Add New Fee Structure</h3>
                  <button onClick={() => setShowMobileForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddFee}>
                  <div className="form-group">
                    <label>Class *</label>
                    <select
                      value={newFee.className}
                      onChange={(e) => setNewFee({ ...newFee, className: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">Select Class</option>
                      <optgroup label="Pre-School">
                        <option value="Pre-Nursery">Pre-Nursery</option>
                        <option value="Playgroup">Playgroup</option>
                        <option value="Nursery 1">Nursery 1</option>
                        <option value="Nursery 2">Nursery 2</option>
                        <option value="Nursery 3">Nursery 3</option>
                      </optgroup>
                      <optgroup label="Primary">
                        <option value="Primary 1">Primary 1</option>
                        <option value="Primary 2">Primary 2</option>
                        <option value="Primary 3">Primary 3</option>
                        <option value="Primary 4">Primary 4</option>
                        <option value="Primary 5">Primary 5</option>
                      </optgroup>
                      <optgroup label="Junior Secondary School (JSS)">
                        <option value="JSS 1">JSS 1</option>
                        <option value="JSS 2">JSS 2</option>
                        <option value="JSS 3">JSS 3</option>
                      </optgroup>
                      <optgroup label="SS1">
                        <option value="SS1 Science">SS1 Science</option>
                        <option value="SS1 Commercial">SS1 Commercial</option>
                        <option value="SS1 Arts">SS1 Arts</option>
                      </optgroup>
                      <optgroup label="SS2">
                        <option value="SS2 Science">SS2 Science</option>
                        <option value="SS2 Commercial">SS2 Commercial</option>
                        <option value="SS2 Arts">SS2 Arts</option>
                      </optgroup>
                      <optgroup label="SS3">
                        <option value="SS3 Science">SS3 Science</option>
                        <option value="SS3 Commercial">SS3 Commercial</option>
                        <option value="SS3 Arts">SS3 Arts</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Term *</label>
                    <select
                      value={newFee.term}
                      onChange={(e) => setNewFee({ ...newFee, term: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">Select Term</option>
                      {terms.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₦) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    Add Fee Structure
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Fee List - Responsive Table */}
        <div className="table-container">
          <div style={{ 
            overflowX: 'auto', 
            marginTop: isMobile ? '16px' : '0',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{ 
              width: '100%', 
              minWidth: isMobile ? '500px' : 'auto',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', background: '#f3f4f6' }}>Class</th>
                  <th style={{ padding: '12px', textAlign: 'left', background: '#f3f4f6' }}>Term</th>
                  <th style={{ padding: '12px', textAlign: 'left', background: '#f3f4f6' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', background: '#f3f4f6' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.map(fee => (
                  <tr key={fee.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}><strong>{fee.className}</strong></td>
                    <td style={{ padding: '12px' }}>{fee.term}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#10b981' }}>₦{fee.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleDeleteFee(fee.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        {!isMobile && 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {feeStructures.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No fee structures added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Card for Mobile */}
        {isMobile && feeStructures.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#d1fae5', 
            borderRadius: '8px', 
            fontSize: '12px',
            textAlign: 'center'
          }}>
            <strong>✅ {feeStructures.length} fee structure(s) set for this session.</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeStructure;