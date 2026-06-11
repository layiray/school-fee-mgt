// src/hooks/useFirebaseSync.js
import { useEffect, useState } from 'react';
import { 
  listenToFeeStructures, 
  listenToBusRoutes, 
  listenToPayments, 
  listenToStudents,
  listenToSessions,
  listenToExtraBills,
  listenToBusRegistrations
} from '../config/firebase';

export const useFirebaseSync = (currentSession) => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [extraBills, setExtraBills] = useState([]);
  const [busRegistrations, setBusRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Listen to fee structures
    if (currentSession) {
      const unsubscribeFee = listenToFeeStructures(currentSession.id, (data) => {
        setFeeStructures(data);
        // Also save to localStorage as cache
        localStorage.setItem(`feeStructures_${currentSession.id}`, JSON.stringify(data));
      });

      const unsubscribeBus = listenToBusRoutes(currentSession.id, (data) => {
        setBusRoutes(data);
        localStorage.setItem(`busRoutes_${currentSession.id}`, JSON.stringify(data));
      });

      const unsubscribePayments = listenToPayments((data) => {
        setPayments(data);
        localStorage.setItem('payments', JSON.stringify(data));
      });

      const unsubscribeStudents = listenToStudents((data) => {
        setStudents(data);
        localStorage.setItem('students', JSON.stringify(data));
      });

      const unsubscribeSessions = listenToSessions((data) => {
        setSessions(data);
        localStorage.setItem('schoolSessions', JSON.stringify(data));
      });

      const unsubscribeExtraBills = listenToExtraBills((data) => {
        setExtraBills(data);
        localStorage.setItem('extraBills', JSON.stringify(data));
      });

      const unsubscribeBusReg = listenToBusRegistrations((data) => {
        setBusRegistrations(data);
        localStorage.setItem('studentBusRegistrations', JSON.stringify(data));
      });

      setLoading(false);

      return () => {
        unsubscribeFee();
        unsubscribeBus();
        unsubscribePayments();
        unsubscribeStudents();
        unsubscribeSessions();
        unsubscribeExtraBills();
        unsubscribeBusReg();
      };
    }
  }, [currentSession]);

  return {
    feeStructures,
    busRoutes,
    payments,
    students,
    sessions,
    extraBills,
    busRegistrations,
    loading
  };
};