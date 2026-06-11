import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  arrayUnion,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlyPkGNqm0kRwbeyzXKh2voG6s53ojAuw",
  authDomain: "school-fee-management-2498c.firebaseapp.com",
  projectId: "school-fee-management-2498c",
  storageBucket: "school-fee-management-2498c.firebasestorage.app",
  messagingSenderId: "14236652788",
  appId: "1:14236652788:web:51956e0bf81cbcfce6baa1",
  measurementId: "G-FCQ1WRLMTL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const toStringId = (id) => String(id);

// ============ AUTHENTICATION ============
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      uid: user.uid,
      email: email,
      role: userData.role || 'parent',
      students: [],
      createdAt: new Date().toISOString()
    });
    
    return { success: true, user: { uid: user.uid, email: user.email, ...userData } };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') errorMessage = "Email already in use";
    if (error.code === 'auth/weak-password') errorMessage = "Password should be at least 6 characters";
    return { success: false, error: errorMessage };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const defaultUser = {
        uid: user.uid,
        email: user.email,
        name: email.split('@')[0],
        role: 'parent',
        students: [],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), defaultUser);
      return { success: true, user: defaultUser };
    }
    
    const userData = userDoc.data();
    return { success: true, user: { uid: user.uid, email: user.email, ...userData } };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') errorMessage = "User not found";
    if (error.code === 'auth/wrong-password') errorMessage = "Wrong password";
    return { success: false, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        callback({ uid: user.uid, email: user.email, ...userData });
      } else {
        const defaultUser = {
          uid: user.uid,
          email: user.email,
          name: user.email.split('@')[0],
          role: 'parent',
          students: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), defaultUser);
        callback({ uid: user.uid, email: user.email, ...defaultUser });
      }
    } else {
      callback(null);
    }
  });
};

// ============ CREATE ADMIN USER ============
export const createAdminUser = async () => {
  try {
    const email = "admin@beulahland.com";
    const password = "Admin@123";
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: "School Administrator",
      role: "admin",
      students: [],
      createdAt: new Date().toISOString()
    });
    
    console.log("Admin user created successfully!");
    return { success: true };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Admin user already exists");
      return { success: true };
    }
    console.error("Error creating admin:", error);
    return { success: false, error: error.message };
  }
};

// ============ USERS ============
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    return [];
  }
};

export const updateUser = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', toStringId(userId)), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', toStringId(userId)));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToUsers = (callback) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    callback(users);
  });
};

// ============ STUDENTS ============
// In src/config/firebase.js, make sure saveStudent is correct
export const saveStudent = async (student) => {
  try {
    // Ensure the ID is a valid string (no special characters that break Firestore)
    const safeId = String(student.id).replace(/[\/\\#\$\*\[\]\{\}\|\^\~`]/g, '_');
    await setDoc(doc(db, 'students', safeId), {
      ...student,
      id: safeId, // Store the safe ID
      originalId: student.id, // Keep original ID for reference if needed
      updatedAt: new Date().toISOString()
    });
    console.log("Student saved to Firebase:", safeId);
    return { success: true };
  } catch (error) {
    console.error("Save student error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteStudent = async (studentId) => {
  try {
    await deleteDoc(doc(db, 'students', toStringId(studentId)));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'students'));
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push(doc.data());
    });
    return students;
  } catch (error) {
    return [];
  }
};

export const listenToStudents = (callback) => {
  return onSnapshot(collection(db, 'students'), (snapshot) => {
    const students = [];
    snapshot.forEach((doc) => {
      students.push(doc.data());
    });
    callback(students);
  });
};

// ============ FEE STRUCTURES ============
export const saveFeeStructures = async (sessionId, data) => {
  try {
    await setDoc(doc(db, 'feeStructures', toStringId(sessionId)), {
      data: data,
      sessionId: sessionId,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Save fee structures error:", error);
    return { success: false, error: error.message };
  }
};

export const getFeeStructures = async (sessionId) => {
  try {
    const docRef = doc(db, 'feeStructures', toStringId(sessionId));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().data : [];
  } catch (error) {
    return [];
  }
};

export const listenToFeeStructures = (sessionId, callback) => {
  const docRef = doc(db, 'feeStructures', toStringId(sessionId));
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? doc.data().data : []);
  });
};

// ============ BUS ROUTES ============
export const saveBusRoutes = async (sessionId, data) => {
  try {
    await setDoc(doc(db, 'busRoutes', toStringId(sessionId)), {
      data: data,
      sessionId: sessionId,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBusRoutes = async (sessionId) => {
  try {
    const docRef = doc(db, 'busRoutes', toStringId(sessionId));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().data : [];
  } catch (error) {
    return [];
  }
};

export const listenToBusRoutes = (sessionId, callback) => {
  const docRef = doc(db, 'busRoutes', toStringId(sessionId));
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? doc.data().data : []);
  });
};

// ============ PAYMENTS ============
export const savePayment = async (payment) => {
  try {
    const docRef = doc(db, 'payments', toStringId(payment.id));
    await setDoc(docRef, {
      ...payment,
      updatedAt: new Date().toISOString()
    });
    console.log("Payment saved to Firebase:", payment.id);
    return { success: true };
  } catch (error) {
    console.error("Save payment error:", error);
    return { success: false, error: error.message };
  }
};

export const getAllPayments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'payments'));
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push(doc.data());
    });
    return payments;
  } catch (error) {
    return [];
  }
};

export const listenToPayments = (callback) => {
  return onSnapshot(collection(db, 'payments'), (snapshot) => {
    const payments = [];
    snapshot.forEach((doc) => {
      payments.push(doc.data());
    });
    console.log("Payments loaded from Firebase:", payments.length);
    callback(payments);
  });
};

// ============ SESSIONS ============
export const saveSessions = async (sessions) => {
  try {
    await setDoc(doc(db, 'sessions', 'allSessions'), {
      data: sessions,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSessions = async () => {
  try {
    const docRef = doc(db, 'sessions', 'allSessions');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().data : [];
  } catch (error) {
    return [];
  }
};

export const listenToSessions = (callback) => {
  const docRef = doc(db, 'sessions', 'allSessions');
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? doc.data().data : []);
  });
};

// ============ EXTRA BILLS ============
export const saveExtraBills = async (extraBills) => {
  try {
    await setDoc(doc(db, 'extraBills', 'allExtraBills'), {
      data: extraBills,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getExtraBills = async () => {
  try {
    const docRef = doc(db, 'extraBills', 'allExtraBills');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().data : [];
  } catch (error) {
    return [];
  }
};

export const listenToExtraBills = (callback) => {
  const docRef = doc(db, 'extraBills', 'allExtraBills');
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? doc.data().data : []);
  });
};

// ============ BUS REGISTRATIONS ============
export const saveBusRegistrations = async (registrations) => {
  try {
    await setDoc(doc(db, 'busRegistrations', 'allRegistrations'), {
      data: registrations,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBusRegistrations = async () => {
  try {
    const docRef = doc(db, 'busRegistrations', 'allRegistrations');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().data : [];
  } catch (error) {
    return [];
  }
};

export const listenToBusRegistrations = (callback) => {
  const docRef = doc(db, 'busRegistrations', 'allRegistrations');
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? doc.data().data : []);
  });
};

// ============ ADD STUDENT TO PARENT ============
export const addStudentToParent = async (parentId, studentId) => {
  try {
    const userRef = doc(db, 'users', toStringId(parentId));
    await updateDoc(userRef, {
      students: arrayUnion(toStringId(studentId))
    });
    console.log("Student linked to parent:", studentId);
    return { success: true };
  } catch (error) {
    console.error("Add student to parent error:", error);
    return { success: false, error: error.message };
  }
};

// ============ MIGRATION FROM LOCALSTORAGE ============
export const migrateLocalToFirebase = async () => {
  try {
    // Migrate sessions
    const sessions = JSON.parse(localStorage.getItem('schoolSessions') || '[]');
    if (sessions.length > 0) await saveSessions(sessions);
    
    // Migrate fee structures and bus routes for each session
    for (const session of sessions) {
      const feeData = localStorage.getItem(`feeStructures_${session.id}`);
      if (feeData) await saveFeeStructures(session.id, JSON.parse(feeData));
      
      const busData = localStorage.getItem(`busRoutes_${session.id}`);
      if (busData) await saveBusRoutes(session.id, JSON.parse(busData));
    }
    
    // Migrate students
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    for (const student of students) await saveStudent(student);
    
    // Migrate payments
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    for (const payment of payments) await savePayment(payment);
    
    // Migrate extra bills
    const extraBills = JSON.parse(localStorage.getItem('extraBills') || '[]');
    if (extraBills.length > 0) await saveExtraBills(extraBills);
    
    // Migrate bus registrations
    const busRegistrations = JSON.parse(localStorage.getItem('studentBusRegistrations') || '[]');
    if (busRegistrations.length > 0) await saveBusRegistrations(busRegistrations);
    
    console.log('Migration complete!');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};