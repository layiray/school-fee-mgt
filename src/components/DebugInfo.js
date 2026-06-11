import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const DebugInfo = () => {
  const { currentSession } = useSession();
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#333',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 9999
        }}
      >
        Debug Info
      </button>
    );
  }

  const feeKey = currentSession ? `feeStructures_${currentSession.id}` : null;
  const feeStructures = feeKey ? localStorage.getItem(feeKey) : null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1f2937',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <strong>Debug Information</strong>
        <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
      </div>
      <div><strong>Session:</strong> {currentSession?.name} (ID: {currentSession?.id})</div>
      <div><strong>User:</strong> {user?.name} ({user?.role})</div>
      <div><strong>Fee Storage Key:</strong> {feeKey}</div>
      <div><strong>Fee Structures:</strong> {feeStructures ? JSON.parse(feeStructures).length : 0}</div>
      {feeStructures && (
        <div style={{ marginTop: '8px', maxHeight: '200px', overflow: 'auto' }}>
          {JSON.parse(feeStructures).map((fee, i) => (
            <div key={i} style={{ borderTop: '1px solid #374151', padding: '4px 0' }}>
              {fee.className} - {fee.term}: ₦{fee.amount}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          console.log('Fee Structures:', feeStructures);
          console.log('Current Session:', currentSession);
          console.log('All localStorage:', localStorage);
        }}
        style={{ marginTop: '8px', background: '#3b82f6', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        Log to Console
      </button>
    </div>
  );
};

export default DebugInfo;