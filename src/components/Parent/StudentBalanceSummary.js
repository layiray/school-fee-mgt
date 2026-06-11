import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Bus, FileText } from 'lucide-react';
import BusRegistration from './BusRegistration';

const StudentBalanceSummary = ({ students, onUpdate, busRoutes = [], busRegistrations = [] }) => {
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleBusRegistrationUpdate = () => {
    setRefresh(!refresh);
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate();
    }
  };

  if (!students || students.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Student Balance Summary</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
          <p style={{ color: '#6b7280' }}>No students added yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Student Balance Summary</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.9 }}>
          Total = Tuition + Bus Fees + Extra Bills (if any)
        </p>
      </div>
      <div className="card-body">
        {students.map(student => {
          return (
            <div key={student.id} style={{ 
              marginBottom: '16px', 
              border: `2px solid ${student.overallBalance === 0 ? '#c6f6d5' : '#e2e8f0'}`, 
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div 
                onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                style={{ 
                  padding: '16px', 
                  background: student.overallBalance === 0 ? '#f0fff4' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{student.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{student.className}</p>
                    {student.admissionNumber && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#6b7280' }}>Admission: {student.admissionNumber}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {student.overallBalance === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={20} color="#10b981" />
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Fully Paid</span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ed8936' }}>
                          ₦{student.overallBalance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Remaining Balance</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <div style={{ 
                    background: '#e2e8f0', 
                    borderRadius: '8px', 
                    height: '8px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${student.totalFeeForSession > 0 ? (student.totalPaidForSession / student.totalFeeForSession) * 100 : 0}%`, 
                      height: '100%', 
                      background: student.overallBalance === 0 ? '#10b981' : '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem' }}>
                    <span>Paid: ₦{student.totalPaidForSession.toLocaleString()}</span>
                    <span>Total: ₦{student.totalFeeForSession.toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
                  <span>📚 Tuition: ₦{student.totalTuitionForSession.toLocaleString()}</span>
                  {student.totalBusForSession > 0 && (
                    <span><Bus size={14} /> Bus: ₦{student.totalBusForSession.toLocaleString()}</span>
                  )}
                  {student.extraBillsTotal > 0 && (
                    <span style={{ color: '#e74c3c' }}><FileText size={14} /> Extra: ₦{student.extraBillsTotal.toLocaleString()}</span>
                  )}
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                    Click to view details
                  </div>
                  {expandedStudent === student.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              
              {expandedStudent === student.id && (
                <div style={{ padding: '20px', background: '#f7fafc', borderTop: '1px solid #e2e8f0' }}>
                  {/* Bus Registration Section */}
                  <BusRegistration 
                    studentId={student.id} 
                    onUpdate={handleBusRegistrationUpdate}
                    busRoutes={busRoutes}
                    existingRegistrations={busRegistrations}
                  />
                  
                  {/* Extra Bills Section */}
                  {student.extraBillsList && student.extraBillsList.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#e74c3c' }}>
                        Outstanding Extra Bills
                      </h4>
                      {student.extraBillsList.map(bill => (
                        <div key={bill.id} style={{ 
                          padding: '12px', 
                          background: 'white', 
                          borderRadius: '8px',
                          marginBottom: '8px',
                          borderLeft: '3px solid #e74c3c'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <strong>{bill.description}</strong>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                Type: {bill.type?.toUpperCase() || 'OTHER'} | Added: {new Date(bill.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                              ₦{bill.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: '#fef3c7', 
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <strong>Total Extra Bills:</strong>
                        <strong style={{ color: '#e74c3c' }}>₦{student.extraBillsTotal.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                  
                  {/* Term-wise breakdown */}
                  <h4 style={{ marginTop: '16px', marginBottom: '12px', fontSize: '14px' }}>Term-wise Breakdown</h4>
                  {student.termSummaries && student.termSummaries.map((term, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '12px', 
                      padding: '12px', 
                      background: 'white', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${term.isComplete ? '#48bb78' : term.balance > 0 ? '#e53e3e' : '#9ca3af'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{term.term}</strong>
                        {term.isComplete && <CheckCircle size={16} color="#10b981" />}
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Tuition Fee:</span>
                          <strong>₦{term.tuitionFee.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Bus size={14} /> Bus Fee:
                          </span>
                          <strong style={{ color: term.busFee > 0 ? '#10b981' : '#6b7280' }}>
                            {term.busFee > 0 ? `₦${term.busFee.toLocaleString()}` : 'Not Registered'}
                          </strong>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          paddingTop: '8px', 
                          borderTop: '1px solid #e2e8f0',
                          marginTop: '4px',
                          fontWeight: 'bold'
                        }}>
                          <span>Total for {term.term}:</span>
                          <span style={{ color: '#1e40af' }}>₦{term.totalFee.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '8px', 
                        fontSize: '0.875rem',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '8px'
                      }}>
                        <div>
                          <div style={{ color: '#718096' }}>Paid</div>
                          <strong style={{ color: '#48bb78' }}>₦{term.paid.toLocaleString()}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#718096' }}>Balance</div>
                          <strong style={{ color: term.balance === 0 ? '#48bb78' : '#e53e3e' }}>
                            ₦{term.balance.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Session Summary */}
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: '#eff6ff', 
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Session Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <div>
                        <div style={{ color: '#718096' }}>Total Tuition</div>
                        <strong>₦{student.totalTuitionForSession.toLocaleString()}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#718096' }}>Total Bus Fees</div>
                        <strong>₦{student.totalBusForSession.toLocaleString()}</strong>
                      </div>
                      {student.extraBillsTotal > 0 && (
                        <div>
                          <div style={{ color: '#718096' }}>Extra Bills</div>
                          <strong style={{ color: '#e74c3c' }}>₦{student.extraBillsTotal.toLocaleString()}</strong>
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#718096' }}>Total Session Fee</div>
                        <strong>₦{student.totalFeeForSession.toLocaleString()}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#718096' }}>Total Paid</div>
                        <strong style={{ color: '#10b981' }}>₦{student.totalPaidForSession.toLocaleString()}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#718096' }}>Remaining Balance</div>
                        <strong style={{ color: student.overallBalance === 0 ? '#10b981' : '#e74c3c' }}>
                          ₦{student.overallBalance.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentBalanceSummary;