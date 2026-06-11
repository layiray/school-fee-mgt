import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, BookOpen, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveStudent, addStudentToParent } from '../../config/firebase';

const AddStudentForm = ({ onClose, onStudentAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentName: '',
    admissionNumber: '',
    className: '',
    relationship: 'parent'
  });
  const [loading, setLoading] = useState(false);

  // Function to sanitize ID (remove special characters that break Firestore paths)
  const sanitizeId = (text) => {
    if (!text) return '';
    return text.replace(/[\/\\#\$\*\[\]\{\}\|\^\~`]/g, '_').replace(/\s+/g, '_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.className) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!formData.admissionNumber) {
      toast.error('Please enter admission number');
      return;
    }
    
    setLoading(true);
    
    try {
      // Sanitize the admission number (replace / with _)
      const sanitizedAdmission = sanitizeId(formData.admissionNumber);
      const sanitizedName = sanitizeId(formData.studentName);
      
      // Create a unique student ID without special characters
      const studentId = `${sanitizedAdmission}_${sanitizedName}_${Date.now()}`;
      
      console.log("Generated student ID:", studentId);
      console.log("User UID:", user.uid);
      
      const newStudent = {
        id: studentId,
        name: formData.studentName,
        admissionNumber: formData.admissionNumber,
        className: formData.className,
        relationship: formData.relationship,
        parentId: user.uid,
        parentName: user.name,
        registeredDate: new Date().toISOString()
      };
      
      console.log("Saving student to Firebase:", newStudent);
      
      // Step 1: Save student to Firebase
      const saveResult = await saveStudent(newStudent);
      
      if (!saveResult.success) {
        toast.error('Failed to add student: ' + saveResult.error);
        setLoading(false);
        return;
      }
      
      console.log("Student saved successfully");
      
      // Step 2: Link student to parent
      const linkResult = await addStudentToParent(user.uid, studentId);
      
      if (!linkResult.success) {
        console.error("Failed to link student:", linkResult.error);
        toast.error('Student saved but failed to link to account. Please contact support.');
        setLoading(false);
        return;
      }
      
      console.log("Student linked to parent successfully");
      
      toast.success(`${formData.studentName} (${formData.admissionNumber}) added to your account`);
      
      // Step 3: Call the callback to refresh the dashboard
      if (onStudentAdded) {
        await onStudentAdded(newStudent);
      }
      
      onClose();
      
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error('Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const classes = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SS 1', 'SS 2', 'SS 3'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <UserPlus size={24} color="#3b82f6" />
              Add Student
            </h3>
            <button 
              onClick={onClose} 
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
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} />
                Student Full Name *
              </label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Enter student's full name"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} />
                Admission Number *
              </label>
              <input
                type="text"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="e.g., BIS/001"
                required
                disabled={loading}
              />
              <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Format: BIS/001, BIS/002, etc.
              </small>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} />
                Class *
              </label>
              <select
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Select Class</option>
                {classes.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Relationship to Student</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                disabled={loading}
              >
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sponsor">Sponsor</option>
              </select>
            </div>
            
            <div style={{ 
              background: '#eff6ff', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <p style={{ margin: 0, color: '#1e40af' }}>
                ℹ️ Admission number will appear on all payment receipts.
              </p>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;