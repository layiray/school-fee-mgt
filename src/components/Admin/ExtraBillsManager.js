import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { saveExtraBills, listenToExtraBills, listenToStudents } from '../../config/firebase';
import { Plus, Trash2, DollarSign, AlertCircle, User, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ExtraBillsManager = () => {
  const { currentSession } = useSession();
  const [extraBills, setExtraBills] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedStudentClass, setSelectedStudentClass] = useState('');
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    type: 'medical'
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load extra bills from Firebase
  useEffect(() => {
    if (!currentSession) return;
    
    const unsubscribe = listenToExtraBills((bills) => {
      console.log("Extra bills from Firebase:", bills);
      setExtraBills(bills);
    });
    
    return () => unsubscribe();
  }, [currentSession]);

  // Load students from Firebase
  useEffect(() => {
    const unsubscribe = listenToStudents((allStudents) => {
      console.log("Students from Firebase:", allStudents);
      setStudents(allStudents);
    });
    
    return () => unsubscribe();
  }, []);

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(studentId);
      setSelectedStudentName(student.name);
      setSelectedStudentClass(student.className);
    } else {
      setSelectedStudent('');
      setSelectedStudentName('');
      setSelectedStudentClass('');
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    
    if (!newBill.description || !newBill.amount) {
      toast.error('Please fill all fields');
      return;
    }
    
    setLoading(true);

    const bill = {
      id: Date.now(),
      studentId: selectedStudent,
      studentName: selectedStudentName,
      className: selectedStudentClass,
      description: newBill.description,
      amount: parseFloat(newBill.amount),
      type: newBill.type,
      status: 'pending',
      sessionId: currentSession?.id,
      sessionName: currentSession?.name,
      date: new Date().toISOString(),
      isPaid: false,
      createdAt: new Date().toISOString()
    };

    const updatedBills = [...extraBills, bill];
    const result = await saveExtraBills(updatedBills);
    
    if (result.success) {
      toast.success(`Extra bill added for ${selectedStudentName}`);
      setNewBill({ description: '', amount: '', type: 'medical' });
      setSelectedStudent('');
      setSelectedStudentName('');
      setSelectedStudentClass('');
    } else {
      toast.error('Failed to add extra bill: ' + result.error);
    }
    
    setLoading(false);
  };

  const handleMarkAsPaid = async (billId) => {
    const updatedBills = extraBills.map(bill =>
      bill.id === billId ? { ...bill, isPaid: true, status: 'paid', paidDate: new Date().toISOString() } : bill
    );
    
    const result = await saveExtraBills(updatedBills);
    
    if (result.success) {
      toast.success('Bill marked as paid');
    } else {
      toast.error('Failed to mark as paid: ' + result.error);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      const updatedBills = extraBills.filter(bill => bill.id !== billId);
      const result = await saveExtraBills(updatedBills);
      
      if (result.success) {
        toast.success('Bill deleted');
      } else {
        toast.error('Failed to delete bill: ' + result.error);
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.className?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingBills = extraBills.filter(b => !b.isPaid);
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  if (!currentSession) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Extra Bills Management</h2>
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
        <h2>Extra Bills Management</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
          Add medical bills, damages, or other extra charges for specific students
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleAddBill} style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Add New Extra Bill</h3>
          
          <div className="form-group">
            <label>Search/Select Student *</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search by student name or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <select
              value={selectedStudent}
              onChange={handleStudentChange}
              style={{ marginTop: '8px' }}
              required
            >
              <option value="">Select a student</option>
              {filteredStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.className}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Bill Type *</label>
            <select
              value={newBill.type}
              onChange={(e) => setNewBill({ ...newBill, type: e.target.value })}
              required
            >
              <option value="medical">🏥 Medical Bill</option>
              <option value="damage">💔 Damage/Loss</option>
              <option value="other">📋 Other Charge</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              value={newBill.description}
              onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
              placeholder="e.g., Medical checkup, Broken window, Lost textbook"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Amount (₦) *</label>
            <input
              type="number"
              value={newBill.amount}
              onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={loading}
          >
            <Plus size={16} />
            {loading ? 'Adding...' : 'Add Extra Bill'}
          </button>
        </form>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3>Extra Bills</h3>
            <div style={{ background: totalPendingAmount > 0 ? '#fee2e2' : '#d1fae5', padding: '8px 16px', borderRadius: '8px' }}>
              Total Pending: ₦{totalPendingAmount.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Class</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extraBills.map(bill => (
                <tr key={bill.id} style={{ background: bill.isPaid ? '#f0fdf4' : 'white' }}>
                  <td>{new Date(bill.date).toLocaleDateString()}</td>
                  <td><strong>{bill.studentName}</strong></td>
                  <td>{bill.className}</td>
                  <td>
                    <span className={`badge ${bill.type === 'medical' ? 'badge-info' : bill.type === 'damage' ? 'badge-warning' : 'badge-secondary'}`}>
                      {bill.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{bill.description}</td>
                  <td style={{ fontWeight: 'bold', color: '#e74c3c' }}>₦{bill.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${bill.isPaid ? 'badge-approved' : 'badge-pending'}`}>
                      {bill.isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!bill.isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(bill.id)}
                          className="btn btn-success"
                          style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle size={14} /> Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {extraBills.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No extra bills added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {extraBills.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#d1fae5', borderRadius: '8px', fontSize: '0.875rem' }}>
            <strong>✅ {extraBills.filter(b => !b.isPaid).length} pending bill(s)</strong> totaling ₦{totalPendingAmount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtraBillsManager;