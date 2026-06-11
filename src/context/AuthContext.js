import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  resetPassword,
  onAuthChange,
  addStudentToParent,
  getAllStudents
} from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      const students = await getAllStudents();
      setAllStudents(students);
    };
    loadStudents();
  }, []);

  const register = async (userData) => {
    const result = await registerUser(userData.email, userData.password, {
      name: userData.name,
      phone: userData.phone,
      role: 'parent',
      students: []
    });
    
    if (result.success) {
      toast.success('Registration successful! Please login.');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  };

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const addStudentToParentAccount = async (parentId, studentId) => {
    return await addStudentToParent(parentId, studentId);
  };

  const getParentStudents = (parentId) => {
    if (!parentId) return [];
    return allStudents.filter(student => student.parentId === parentId);
  };

  const refreshStudents = async () => {
    const students = await getAllStudents();
    setAllStudents(students);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    addStudentToParent: addStudentToParentAccount,
    getParentStudents,
    refreshStudents
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};