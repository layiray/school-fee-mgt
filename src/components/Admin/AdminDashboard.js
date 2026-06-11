import React, { useState, useEffect } from 'react';
import SessionManager from './SessionManager';
import FeeStructure from './FeeStructure';
import BusFeeManager from './BusFeeManager';
import ExtraBillsManager from './ExtraBillsManager';
import PendingApprovals from './PendingApprovals';
import AllTransactions from './AllTransactions';
import AdminManagement from './AdminManagement';
import { useSession } from '../../context/SessionContext';
import { 
  Bus, 
  FileText, 
  BookOpen, 
  Clock, 
  History, 
  Download, 
  Upload, 
  Database, 
  Trash2, 
  Shield,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getAllPayments, 
  getAllStudents, 
  getAllUsers,
  getFeeStructures,
  getBusRoutes,
  getBusRegistrations,
  saveSessions,
  saveFeeStructures,
  saveBusRoutes,
  saveBusRegistrations,
  migrateLocalToFirebase,
  listenToFeeStructures,
  listenToBusRoutes,
  listenToBusRegistrations,
  listenToStudents,
  listenToPayments,
  listenToUsers,
  listenToExtraBills
} from '../../config/firebase';

const AdminDashboard = () => {
  const { currentSession, sessions, switchSession } = useSession();
  const [activeTab, setActiveTab] = useState('admins');
  const [refresh, setRefresh] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreData, setRestoreData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connected');
  const [stats, setStats] = useState({
    studentCount: 0,
    paymentCount: 0,
    userCount: 0,
    totalAmount: 0,
    pendingAmount: 0,
    feeStructureCount: 0,
    busRouteCount: 0,
    sessionCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);

  // Listen to real-time data updates
  useEffect(() => {
    // Listen to students
    const unsubscribeStudents = listenToStudents((allStudents) => {
      setStats(prev => ({ ...prev, studentCount: allStudents.length }));
    });

    // Listen to payments with detailed stats
    const unsubscribePayments = listenToPayments((allPayments) => {
      const approved = allPayments.filter(p => p.status === 'approved');
      const pending = allPayments.filter(p => p.status === 'pending');
      const rejected = allPayments.filter(p => p.status === 'rejected');
      
      const totalApproved = approved.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPending = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats(prev => ({ 
        ...prev, 
        paymentCount: allPayments.length,
        totalAmount: totalApproved,
        pendingAmount: totalPending,
        approvedCount: approved.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length
      }));
      
      // Set recent payments (last 5)
      const recent = [...allPayments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
      setRecentPayments(recent);
    });

    // Listen to users
    const unsubscribeUsers = listenToUsers((allUsers) => {
      setStats(prev => ({ ...prev, userCount: allUsers.length }));
    });

    // Listen to fee structures for current session
    const unsubscribeFees = listenToFeeStructures(currentSession?.id, (fees) => {
      setStats(prev => ({ ...prev, feeStructureCount: fees.length }));
    });

    // Listen to bus routes for current session
    const unsubscribeBus = listenToBusRoutes(currentSession?.id, (routes) => {
      setStats(prev => ({ ...prev, busRouteCount: routes.length }));
    });

    // Listen to extra bills
    const unsubscribeExtra = listenToExtraBills((bills) => {
      const unpaidCount = bills.filter(b => !b.isPaid).length;
      setStats(prev => ({ ...prev, extraBillsCount: unpaidCount }));
    });

    return () => {
      unsubscribeStudents();
      unsubscribePayments();
      unsubscribeUsers();
      unsubscribeFees();
      unsubscribeBus();
      unsubscribeExtra();
    };
  }, [currentSession]);

  // Update session count
  useEffect(() => {
    setStats(prev => ({ ...prev, sessionCount: sessions.length }));
  }, [sessions]);

  // Export all data
  const exportAllData = async () => {
    setIsSyncing(true);
    try {
      const allStudents = await getAllStudents();
      const allPayments = await getAllPayments();
      const allUsers = await getAllUsers();
      const allBusRegistrations = await getBusRegistrations();
      
      const allFeeStructures = {};
      for (const session of sessions) {
        const fees = await getFeeStructures(session.id);
        allFeeStructures[session.id] = fees;
      }
      
      const allBusRoutes = {};
      for (const session of sessions) {
        const buses = await getBusRoutes(session.id);
        allBusRoutes[session.id] = buses;
      }
      
      const data = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        schoolName: 'Beulahland International Schools',
        currentSessionId: currentSession?.id,
        data: {
          schoolSessions: sessions,
          currentSession: currentSession,
          allFeeStructures: allFeeStructures,
          allBusRoutes: allBusRoutes,
          payments: allPayments,
          students: allStudents,
          appUsers: allUsers,
          studentBusRegistrations: allBusRegistrations
        }
      };

      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beulahland-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported successfully!`);
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Import data
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setRestoreData(importedData);
        setShowRestoreConfirm(true);
      } catch (error) {
        toast.error('Invalid backup file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmRestore = async () => {
    if (!restoreData) return;
    
    setIsSyncing(true);
    try {
      if (restoreData.data.schoolSessions) {
        await saveSessions(restoreData.data.schoolSessions);
      }
      
      if (restoreData.data.allFeeStructures) {
        for (const [sessionId, fees] of Object.entries(restoreData.data.allFeeStructures)) {
          await saveFeeStructures(sessionId, fees);
        }
      }
      
      if (restoreData.data.allBusRoutes) {
        for (const [sessionId, buses] of Object.entries(restoreData.data.allBusRoutes)) {
          await saveBusRoutes(sessionId, buses);
        }
      }
      
      if (restoreData.data.studentBusRegistrations) {
        await saveBusRegistrations(restoreData.data.studentBusRegistrations);
      }

      toast.success('All data restored successfully! Page will refresh.');
      setShowRestoreConfirm(false);
      setRestoreData(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Restore failed: ' + error.message);
      setIsSyncing(false);
    }
  };

  const syncToCloud = async () => {
    setIsSyncing(true);
    setCloudStatus('syncing');
    
    try {
      await saveSessions(sessions);
      
      for (const session of sessions) {
        const fees = await getFeeStructures(session.id);
        await saveFeeStructures(session.id, fees);
        
        const buses = await getBusRoutes(session.id);
        await saveBusRoutes(session.id, buses);
      }
      
      toast.success('All data synced to cloud successfully!');
      setCloudStatus('connected');
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
      setCloudStatus('disconnected');
    } finally {
      setIsSyncing(false);
    }
  };

  const migrateToCloud = async () => {
    if (window.confirm('This will migrate all local data to the cloud. Continue?')) {
      setIsSyncing(true);
      try {
        const result = await migrateLocalToFirebase();
        if (result.success) {
          toast.success('Data migrated to cloud successfully!');
          setCloudStatus('connected');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.error('Migration failed: ' + result.error);
        }
      } catch (error) {
        toast.error('Migration failed: ' + error.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const clearAllData = async () => {
    if (window.confirm('⚠️ WARNING: This will delete ALL data including users, payments, and settings. This action cannot be undone. Are you absolutely sure?')) {
      const confirmText = prompt('Type "CONFIRM" to delete all data:');
      if (confirmText === 'CONFIRM') {
        setIsSyncing(true);
        try {
          await saveSessions([]);
          await saveBusRegistrations([]);
          
          toast.success('All data cleared. Page will refresh.');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          toast.error('Failed to clear data: ' + error.message);
        } finally {
          setIsSyncing(false);
        }
      } else {
        toast.error('Data clear cancelled');
      }
    }
  };

  const tabs = [
    { id: 'admins', label: 'Admin Management', icon: <Shield size={18} /> },
    { id: 'fees', label: 'Fee Structure', icon: <BookOpen size={18} /> },
    { id: 'bus', label: 'Bus Fees', icon: <Bus size={18} /> },
    { id: 'extras', label: 'Extra Bills', icon: <FileText size={18} /> },
    { id: 'approvals', label: 'Pending Approvals', icon: <Clock size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={18} /> }
  ];

  if (!currentSession) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <h3>No Active Session</h3>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Please create a session to continue
            </p>
            <SessionManager />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <SessionManager />
      
      {/* Cloud Status Banner */}
      <div style={{ 
        background: cloudStatus === 'connected' ? '#d1fae5' : cloudStatus === 'syncing' ? '#fef3c7' : '#fee2e2',
        border: `1px solid ${cloudStatus === 'connected' ? '#10b981' : cloudStatus === 'syncing' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '12px',
        padding: '12px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {cloudStatus === 'connected' ? <Database size={20} color="#10b981" /> : cloudStatus === 'syncing' ? <TrendingUp size={20} color="#f59e0b" className="spinner" /> : <AlertCircle size={20} color="#ef4444" />}
          <div>
            <strong style={{ fontSize: '14px' }}>
              {cloudStatus === 'connected' ? 'Data Synced to Cloud' : cloudStatus === 'syncing' ? 'Syncing to Cloud...' : 'Cloud Sync Disconnected'}
            </strong>
            <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#6b7280' }}>
              Real-time data synchronization active
            </p>
          </div>
        </div>
        {cloudStatus !== 'connected' && (
          <button onClick={migrateToCloud} disabled={isSyncing} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} />
            {isSyncing ? 'Syncing...' : 'Enable Cloud Sync'}
          </button>
        )}
      </div>
      
      {/* Statistics Cards - Real-time */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="summary-card" style={{ borderLeftColor: '#3b82f6' }}>
          <h4>Total Students</h4>
          <div className="amount" style={{ fontSize: '28px' }}>{stats.studentCount}</div>
          <Users size={20} style={{ marginTop: '8px', color: '#3b82f6' }} />
        </div>
        
        <div className="summary-card" style={{ borderLeftColor: '#10b981' }}>
          <h4>Total Collected</h4>
          <div className="amount" style={{ fontSize: '24px' }}>₦{stats.totalAmount.toLocaleString()}</div>
          <DollarSign size={20} style={{ marginTop: '8px', color: '#10b981' }} />
        </div>
        
        <div className="summary-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h4>Pending Amount</h4>
          <div className="amount" style={{ fontSize: '24px' }}>₦{stats.pendingAmount.toLocaleString()}</div>
          <Clock size={20} style={{ marginTop: '8px', color: '#f59e0b' }} />
        </div>
        
        <div className="summary-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <h4>Total Users</h4>
          <div className="amount" style={{ fontSize: '28px' }}>{stats.userCount}</div>
          <Users size={20} style={{ marginTop: '8px', color: '#8b5cf6' }} />
        </div>
      </div>
      
      {/* Secondary Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.approvedCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Approved Payments</div>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Pending Payments</div>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{stats.rejectedCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Rejected Payments</div>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.feeStructureCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Fee Structures</div>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{stats.busRouteCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Bus Routes</div>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} />
            Recent Transactions
          </h2>
          <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
            Latest 5 payment activities
          </p>
        </div>
        <div className="card-body">
          {recentPayments.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No transactions yet</p>
          ) : (
            <div className="table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.date).toLocaleDateString()}</td>
                      <td><strong>{payment.studentName}</strong></td>
                      <td>₦{(payment.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${payment.status}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Backup & Restore Panel */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} />
            Data Management
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={exportAllData} disabled={isSyncing} className="btn btn-primary">
              <Download size={16} /> Backup Data
            </button>
            <button onClick={syncToCloud} disabled={isSyncing} className="btn btn-success">
              <Upload size={16} /> Sync to Cloud
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Restore from Backup
              <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
            <button onClick={clearAllData} disabled={isSyncing} className="btn btn-danger">
              <Trash2 size={16} /> Clear All Data
            </button>
          </div>
        </div>
      </div>
      
      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && restoreData && (
        <div className="modal-overlay" onClick={() => setShowRestoreConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <h3>Confirm Restore</h3>
              <p>Backup Date: {new Date(restoreData.exportDate).toLocaleString()}</p>
              <p>Sessions: {restoreData.data.schoolSessions?.length || 1}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={confirmRestore} className="btn btn-danger">Yes, Restore Data</button>
                <button onClick={() => setShowRestoreConfirm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Dashboard Tabs */}
      <div className="card">
        <div className="card-header">
          <h2>Administration</h2>
          <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
            Manage fees, bus routes, extra bills, approvals, and administrators
          </p>
        </div>
        <div className="card-body">
          <div className="tab-container">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            {activeTab === 'admins' && <AdminManagement />}
            {activeTab === 'fees' && <FeeStructure onUpdate={() => setRefresh(!refresh)} />}
            {activeTab === 'bus' && <BusFeeManager />}
            {activeTab === 'extras' && <ExtraBillsManager />}
            {activeTab === 'approvals' && <PendingApprovals onApprove={() => setRefresh(!refresh)} />}
            {activeTab === 'transactions' && <AllTransactions key={refresh} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;