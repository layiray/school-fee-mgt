import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { saveBusRoutes, listenToBusRoutes } from '../../config/firebase';
import { Plus, Trash2, Bus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const BusFeeManager = () => {
  const { currentSession } = useSession();
  const [busRoutes, setBusRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({
    location: '',
    fee: '',
    pickupTime: '',
    dropoffTime: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentSession) return;
    
    const unsubscribe = listenToBusRoutes(currentSession.id, (routes) => {
      setBusRoutes(routes);
    });
    
    return () => unsubscribe();
  }, [currentSession]);

  const handleAddRoute = async (e) => {
    e.preventDefault();
    
    if (!newRoute.location || !newRoute.fee) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    const route = {
      id: Date.now(),
      location: newRoute.location,
      fee: parseFloat(newRoute.fee),
      pickupTime: newRoute.pickupTime,
      dropoffTime: newRoute.dropoffTime,
      sessionId: currentSession?.id,
      sessionName: currentSession?.name,
      createdAt: new Date().toISOString()
    };

    const updatedRoutes = [...busRoutes, route];
    setBusRoutes(updatedRoutes);
    
    const result = await saveBusRoutes(currentSession.id, updatedRoutes);
    
    if (result.success) {
      toast.success('Bus route added successfully');
      setNewRoute({ location: '', fee: '', pickupTime: '', dropoffTime: '' });
    } else {
      toast.error('Failed to add bus route: ' + result.error);
    }
    
    setLoading(false);
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this bus route?')) {
      const updatedRoutes = busRoutes.filter(route => route.id !== routeId);
      setBusRoutes(updatedRoutes);
      
      const result = await saveBusRoutes(currentSession.id, updatedRoutes);
      
      if (result.success) {
        toast.success('Bus route deleted');
      } else {
        toast.error('Failed to delete bus route');
      }
    }
  };

  if (!currentSession) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Bus Fee Management</h2>
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
        <h2>Bus Fee Management</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
          Set bus fees for different locations - Session: {currentSession?.name}
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleAddRoute} style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Add New Bus Route</h3>
          
          <div className="form-group">
            <label>Location/Area *</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                value={newRoute.location}
                onChange={(e) => setNewRoute({ ...newRoute, location: e.target.value })}
                placeholder="e.g., GRA Phase 2, City Center, etc."
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Bus Fee (₦) per term *</label>
            <input
              type="number"
              value={newRoute.fee}
              onChange={(e) => setNewRoute({ ...newRoute, fee: e.target.value })}
              placeholder="Enter bus fee amount"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Pickup Time (Optional)</label>
            <input
              type="time"
              value={newRoute.pickupTime}
              onChange={(e) => setNewRoute({ ...newRoute, pickupTime: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Dropoff Time (Optional)</label>
            <input
              type="time"
              value={newRoute.dropoffTime}
              onChange={(e) => setNewRoute({ ...newRoute, dropoffTime: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={loading}
          >
            <Plus size={16} />
            {loading ? 'Adding...' : 'Add Bus Route'}
          </button>
        </form>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Bus Fee (per term)</th>
                <th>Pickup Time</th>
                <th>Dropoff Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {busRoutes.map(route => (
                <tr key={route.id}>
                  <td><strong><Bus size={14} style={{ display: 'inline', marginRight: '8px' }} /> {route.location}</strong></td>
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>₦{route.fee.toLocaleString()}</td>
                  <td>{route.pickupTime || 'Not set'}</td>
                  <td>{route.dropoffTime || 'Not set'}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                      disabled={loading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {busRoutes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No bus routes added yet. Add your first bus route above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {busRoutes.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#d1fae5', borderRadius: '8px', fontSize: '0.875rem' }}>
            <strong>✅ {busRoutes.length} bus route(s) available for this session.</strong>
            <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#065f46' }}>
              Parents can now register for bus services and will be charged the fee per term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusFeeManager;