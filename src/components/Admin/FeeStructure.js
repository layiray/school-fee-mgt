import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { saveFeeStructures, listenToFeeStructures } from '../../config/firebase';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FeeStructure = () => {
  const { currentSession } = useSession();
  const [feeStructures, setFeeStructures] = useState([]);
  const [newFee, setNewFee] = useState({ className: '', term: '', amount: '' });

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
  };

  const handleDeleteFee = async (id) => {
    const updatedFees = feeStructures.filter(f => f.id !== id);
    setFeeStructures(updatedFees);
    await saveFeeStructures(currentSession.id, updatedFees);
    toast.success('Fee structure deleted');
  };

  const terms = ['First Term', 'Second Term', 'Third Term'];
  const classOptions = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

  if (!currentSession) {
    return (
      <div className="card">
        <div className="card-header"><h2>Fee Structure Management</h2></div>
        <div className="card-body"><p>No active session. Please create a session first.</p></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Fee Structure Management</h2>
        <p>Session: <strong>{currentSession.name}</strong> <span style={{ color: '#10b981' }}>✅ Cloud Synced</span></p>
      </div>
      <div className="card-body">
        <form onSubmit={handleAddFee} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px' }}>
            <select value={newFee.className} onChange={(e) => setNewFee({ ...newFee, className: e.target.value })} required>
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newFee.term} onChange={(e) => setNewFee({ ...newFee, term: e.target.value })} required>
              <option value="">Select Term</option>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Amount (₦)" value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })} required />
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Fee</button>
          </div>
        </form>
        
        <div className="table-container">
          <table>
            <thead><tr><th>Class</th><th>Term</th><th>Amount</th><th>Action</th></tr></thead>
            <tbody>
              {feeStructures.map(fee => (
                <tr key={fee.id}>
                  <td><strong>{fee.className}</strong></td>
                  <td>{fee.term}</td>
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>₦{fee.amount.toLocaleString()}</td>
                  <td><button onClick={() => handleDeleteFee(fee.id)} className="btn btn-danger"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {feeStructures.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No fee structures added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeeStructure;