import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, BookOpen, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveStudent, addStudentToParent, listenToStudents } from '../../config/firebase';

const AddStudentForm = ({ onClose, onStudentAdded, existingStudents = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentName: '',
    admissionNumber: '',
    className: '',
    relationship: 'parent'
  });
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState(existingStudents);

  useEffect(() => {
    const unsubscribe = listenToStudents((students) => {
      setAllStudents(students);
    });
    return () => unsubscribe();
  }, []);

  const sanitizeId = (text) => {
    if (!text) return '';
    return text.replace(/[\/\\#\$\*\[\]\{\}\|\^\~`]/g, '_').replace(/\s+/g, '_');
  };

  const isDuplicateAdmissionNumber = (admissionNumber) => {
    if (!admissionNumber) return false;
    return allStudents.some(
      s => s.admissionNumber && s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase()
    );
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
    
    if (isDuplicateAdmissionNumber(formData.admissionNumber)) {
      toast.error(`Admission number "${formData.admissionNumber}" already exists!`);
      return;
    }
    
    setLoading(true);
    
    try {
      const sanitizedAdmission = sanitizeId(formData.admissionNumber);
      const sanitizedName = sanitizeId(formData.studentName);
      const studentId = `${sanitizedAdmission}_${sanitizedName}_${Date.now()}`;
      
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
      
      const saveResult = await saveStudent(newStudent);
      if (!saveResult.success) {
        toast.error(saveResult.error || 'Failed to add student');
        setLoading(false);
        return;
      }
      
      const linkResult = await addStudentToParent(user.uid, studentId);
      if (!linkResult.success) {
        toast.error('Failed to link student to account');
        setLoading(false);
        return;
      }
      
      toast.success(`${formData.studentName} added successfully!`);
      
      if (onStudentAdded) {
        onStudentAdded();
      }
      
      onClose();
      
    } catch (error) {
      console.error("Add student error:", error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Complete class list with Pre-Nursery, Nursery, Primary, JSS, and SS
  const classes = [
    // Pre-School section
    'Pre-Nursery', 'Playgroup', 'Nursery 1', 'Nursery 2', 'Nursery 3',
    // Primary section
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5',
    // Junior Secondary School (JSS) - ADDED BACK
    'JSS 1', 'JSS 2', 'JSS 3',
    // Senior Secondary School (SS)
    'SS1 Science', 'SS1 Commercial', 'SS1 Arts',
    'SS2 Science', 'SS2 Commercial', 'SS2 Arts',
    'SS3 Science', 'SS3 Commercial', 'SS3 Arts'
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
              type="button"
              style={{ 
                background: '#f3f4f6', 
                border: 'none', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student Full Name *</label>
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
              <label>Admission Number *</label>
              <input
                type="text"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="e.g., BIS/001"
                required
                disabled={loading}
              />
              <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Format: BIS/001, BIS/002, etc. (Must be unique)
              </small>
            </div>
            
            <div className="form-group">
              <label>Class *</label>
              <select
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                required
                disabled={loading}
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
                ℹ️ Admission number must be unique and will appear on all payment receipts.
              </p>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Adding Student...' : 'Add Student'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;