import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listenToUsers, updateUser, deleteUser } from '../../config/firebase';
import { Users, Shield, Plus, Edit, Trash2, X, Save, UserCheck, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [parents, setParents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin'
  });
  const [activeTab, setActiveTab] = useState('parents'); // 'parents' or 'admins'

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const unsubscribe = listenToUsers((allUsers) => {
      console.log("All users from Firebase:", allUsers);
      
      // Separate admins and parents
      const adminList = allUsers.filter(u => u.role === 'admin');
      const parentList = allUsers.filter(u => u.role === 'parent');
      
      setUsers(allUsers);
      setAdmins(adminList);
      setParents(parentList);
      setLoading(false);
    });
    
    return () => unsubscribe();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    // In a real app, you would create the user in Firebase Auth first
    // For demo, we'll just show a message
    toast.info('In production, users would be created via Firebase Auth');
    setShowAddModal(false);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'admin' });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    const result = await updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role
    });
    
    if (result.success) {
      toast.success('User updated successfully');
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'admin' });
    } else {
      toast.error('Failed to update user: ' + result.error);
    }
  };

  const handleDeleteUser = async (userId, userRole, userName) => {
    // Prevent deleting the last admin
    if (userRole === 'admin' && admins.length <= 1) {
      toast.error('Cannot delete the only admin account');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(`${userName} deleted successfully`);
      } else {
        toast.error('Failed to delete user: ' + result.error);
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'parent'
    });
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>User Management</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users size={24} />
              User Management
            </h2>
            <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
              Manage administrators and registered parents
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Add New Admin
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* Tab Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '8px'
        }}>
          <button
            onClick={() => setActiveTab('parents')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'parents' ? '#3b82f6' : 'transparent',
              color: activeTab === 'parents' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            <UserCheck size={16} />
            Parents ({parents.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'admins' ? '#3b82f6' : 'transparent',
              color: activeTab === 'admins' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            <Shield size={16} />
            Administrators ({admins.length})
          </button>
        </div>

        {/* Parents List */}
        {activeTab === 'parents' && (
          <>
            {parents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No parents registered yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Parent Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Registered Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parents.map(parent => (
                      <tr key={parent.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {getInitials(parent.name)}
                            </div>
                            <div>
                              <strong>{parent.name || 'N/A'}</strong>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Parent Account</div>
                            </div>
                          </div>
                        </td>
                        <td>{parent.email}</td>
                        <td>{parent.phone || 'N/A'}</td>
                        <td>{formatDate(parent.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => openEditModal(parent)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(parent.id, parent.role, parent.name)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Admins List */}
        {activeTab === 'admins' && (
          <>
            {admins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No administrators found</p>
              </div>
            ) : (
              <div className="table-container">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Admin Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {getInitials(admin.name)}
                            </div>
                            <div>
                              <strong>{admin.name || 'N/A'}</strong>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Administrator</div>
                            </div>
                          </div>
                        </td>
                        <td>{admin.email}</td>
                        <td>{admin.phone || 'N/A'}</td>
                        <td>{formatDate(admin.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => openEditModal(admin)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(admin.id, admin.role, admin.name)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Summary Cards */}
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{parents.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Registered Parents</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{admins.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Administrators</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{users.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Users</div>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Shield size={24} />
                  Add New Administrator
                </h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter temporary password"
                    required
                  />
                </div>
                <div style={{ 
                  background: '#fef3c7', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  <strong>Note:</strong> In production, this would create a Firebase Auth account.
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Add Administrator
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Edit size={24} />
                  Edit User
                </h3>
                <button onClick={() => setEditingUser(null)} style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="parent">Parent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Save size={16} /> Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;