import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { Calendar, Plus, Check, Archive, X, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const SessionManager = () => {
  const { sessions, currentSession, createSession, switchSession, archiveSession } = useSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    startDate: '',
    endDate: ''
  });

  const handleCreateSession = (e) => {
    e.preventDefault();
    
    const sessionName = newSession.name || `${newSession.startYear}/${newSession.endYear}`;
    
    // Check if session already exists
    if (sessions.find(s => s.name === sessionName)) {
      toast.error('Session already exists!');
      return;
    }
    
    createSession({
      name: sessionName,
      startYear: newSession.startYear,
      endYear: newSession.endYear,
      startDate: newSession.startDate,
      endDate: newSession.endDate
    });
    
    toast.success(`Session ${sessionName} created successfully!`);
    setShowCreateForm(false);
    setNewSession({
      name: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
      startDate: '',
      endDate: ''
    });
  };

  const getSessionStatus = (session) => {
    if (session.id === currentSession?.id) {
      return <span className="badge badge-success">Active</span>;
    }
    if (session.isArchived) {
      return <span className="badge badge-secondary">Archived</span>;
    }
    return <span className="badge badge-pending">Inactive</span>;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={24} />
              Session Management
            </h2>
            {currentSession && (
              <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
                Current Session: <strong>{currentSession.name}</strong>
              </p>
            )}
          </div>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="btn btn-success"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            New Session
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="table-container">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id} style={{ 
                  background: session.id === currentSession?.id ? '#eff6ff' : 'white'
                }}>
                  <td>
                    <strong>{session.name}</strong>
                    {session.startDate && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {session.startDate} to {session.endDate}
                      </div>
                    )}
                  </td>
                  <td>{session.startYear} - {session.endYear}</td>
                  <td>{getSessionStatus(session)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {session.id !== currentSession?.id && !session.isArchived && (
                        <button
                          onClick={() => {
                            switchSession(session.id);
                            toast.success(`Switched to ${session.name} session`);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          title="Activate Session"
                        >
                          <Check size={14} /> Activate
                        </button>
                      )}
                      {!session.isArchived && session.id !== currentSession?.id && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Archive ${session.name} session? This will mark it as completed.`)) {
                              archiveSession(session.id);
                              toast.success(`${session.name} archived`);
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          title="Archive Session"
                        >
                          <Archive size={14} /> Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '0.875rem' }}>
          <strong>ℹ️ Session Management Tips:</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px', color: '#6b7280' }}>
            <li>📅 Create a new session at the beginning of each academic year</li>
            <li>✅ Fees are tied to specific sessions - each session has its own fee structure</li>
            <li>🔄 When you switch sessions, fees for the new session will need to be set up</li>
            <li>📦 Archived sessions are read-only and cannot be modified - perfect for completed sessions</li>
            <li>💰 Payment history remains accessible even after archiving a session</li>
          </ul>
        </div>
      </div>
      
      {/* Create Session Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Calendar size={24} />
                  Create New Academic Session
                </h3>
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  style={{ 
                    background: '#f3f4f6', 
                    border: 'none', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateSession}>
                <div className="form-group">
                  <label>Session Name (Optional)</label>
                  <input
                    type="text"
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    placeholder="e.g., 2024/2025 (auto-generated if empty)"
                  />
                  <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    Leave empty to auto-generate from years
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Start Year *</label>
                  <input
                    type="number"
                    value={newSession.startYear}
                    onChange={(e) => setNewSession({ ...newSession, startYear: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Year *</label>
                  <input
                    type="number"
                    value={newSession.endYear}
                    onChange={(e) => setNewSession({ ...newSession, endYear: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Session Start Date (Optional)</label>
                  <input
                    type="date"
                    value={newSession.startDate}
                    onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                  />
                  <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    When does the session begin?
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Session End Date (Optional)</label>
                  <input
                    type="date"
                    value={newSession.endDate}
                    onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                  />
                  <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    When does the session end?
                  </small>
                </div>
                
                <div style={{ 
                  background: '#eff6ff', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0, color: '#1e40af' }}>
                    ℹ️ After creating a session, you'll need to:
                    <br />1. Set up fee structures for each class and term
                    <br />2. Add bus routes if needed
                    <br />3. Parents can then register and make payments
                  </p>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Create Session
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;