// src/components/Parent/BusRegistration.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { saveBusRegistrations } from '../../config/firebase';
import { Bus, MapPin, Clock, DollarSign, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const BusRegistration = ({ studentId, onUpdate, busRoutes = [], existingRegistrations = [] }) => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [usesBus, setUsesBus] = useState(false);
  const [loading, setLoading] = useState(false);

  const terms = ['First Term', 'Second Term', 'Third Term'];

  // Get existing registration for selected term
  const getExistingRegistration = (term) => {
    return existingRegistrations.find(
      r => r.studentId === studentId && r.term === term
    );
  };

  const handleTermChange = (term) => {
    setSelectedTerm(term);
    const existingReg = getExistingRegistration(term);
    if (existingReg && existingReg.usesBus) {
      setUsesBus(true);
      setSelectedRoute(existingReg.routeId);
    } else {
      setUsesBus(false);
      setSelectedRoute('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTerm) {
      toast.error('Please select a term');
      return;
    }
    
    setLoading(true);

    const selectedRouteData = busRoutes.find(r => r.id.toString() === selectedRoute);
    
    // Get all existing registrations
    const allRegistrations = JSON.parse(localStorage.getItem('studentBusRegistrations') || '[]');
    
    // Remove existing registration for this term and student
    const filtered = allRegistrations.filter(
      r => !(r.studentId === studentId && r.sessionId === currentSession?.id && r.term === selectedTerm)
    );
    
    // Add new registration if using bus
    if (usesBus && selectedRouteData) {
      const newRegistration = {
        id: Date.now(),
        studentId: studentId,
        sessionId: currentSession?.id,
        sessionName: currentSession?.name,
        term: selectedTerm,
        usesBus: true,
        routeId: selectedRoute,
        routeLocation: selectedRouteData?.location,
        busFee: selectedRouteData?.fee,
        registeredDate: new Date().toISOString(),
        parentId: user.uid
      };
      filtered.push(newRegistration);
    }
    
    localStorage.setItem('studentBusRegistrations', JSON.stringify(filtered));
    
    // Also save to Firebase
    await saveBusRegistrations(filtered);
    
    if (usesBus && selectedRouteData) {
      toast.success(`Bus registration for ${selectedTerm} completed! Fee: ₦${selectedRouteData.fee.toLocaleString()}`);
    } else {
      toast.success(`Bus registration removed for ${selectedTerm}`);
    }
    
    // Reset form
    setSelectedTerm('');
    setSelectedRoute('');
    setUsesBus(false);
    
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate();
    }
    
    setLoading(false);
  };

  if (busRoutes.length === 0) {
    return (
      <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#92400e' }}>No bus routes available. Please contact admin.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Bus size={20} />
        School Bus Registration (Per Term)
      </h4>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Term *</label>
          <select
            value={selectedTerm}
            onChange={(e) => handleTermChange(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          >
            <option value="">Select Term</option>
            {terms.map(term => {
              const existingReg = getExistingRegistration(term);
              return (
                <option key={term} value={term}>
                  {term} {existingReg && existingReg.usesBus ? '(Currently Registered)' : ''}
                </option>
              );
            })}
          </select>
        </div>
        
        {selectedTerm && (
          <>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={usesBus}
                  onChange={(e) => {
                    setUsesBus(e.target.checked);
                    if (!e.target.checked) setSelectedRoute('');
                  }}
                  style={{ width: 'auto' }}
                />
                My child uses the school bus for {selectedTerm}
              </label>
            </div>
            
            {usesBus && (
              <>
                <div className="form-group">
                  <label>Select Bus Route/Location for {selectedTerm} *</label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select a route</option>
                    {busRoutes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.location} - ₦{route.fee.toLocaleString()}/term
                        {route.pickupTime && ` (Pickup: ${route.pickupTime})`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedRoute && (
                  <div style={{ 
                    background: '#eff6ff', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '16px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      <strong>Bus Fee for {selectedTerm}:</strong> ₦{busRoutes.find(r => r.id.toString() === selectedRoute)?.fee.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }} 
          disabled={loading || !selectedTerm}
        >
          <Save size={16} />
          {loading ? 'Saving...' : `Save Bus Registration for ${selectedTerm || 'Term'}`}
        </button>
      </form>
      
      {/* Display existing registrations */}
      {existingRegistrations.filter(r => r.studentId === studentId && r.usesBus).length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h5 style={{ marginBottom: '12px', fontSize: '13px', color: '#4a5568' }}>Current Bus Registrations:</h5>
          {existingRegistrations.filter(r => r.studentId === studentId && r.usesBus).map(reg => (
            <div key={reg.id} style={{ 
              padding: '10px', 
              background: '#d1fae5', 
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong>{reg.term}</strong>
                  <span style={{ marginLeft: '8px' }}>📍 {reg.routeLocation}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#065f46' }}>
                    ₦{reg.busFee.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusRegistration;