import React, { useState, useEffect } from 'react';
import { X, Printer, CreditCard, DollarSign, Bus } from 'lucide-react';
import { listenToPayments, listenToBusRegistrations } from '../../config/firebase';

const ReceiptModal = ({ payment, onClose }) => {
  const [totalApprovedPaid, setTotalApprovedPaid] = useState(0);
  const [busFee, setBusFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(payment.tuitionFee || 0);
  const [totalFee, setTotalFee] = useState(payment.tuitionFee || 0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [percentagePaid, setPercentagePaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      let bus = 0;
      const unsubscribeBus = listenToBusRegistrations((registrations) => {
        const registration = registrations.find(
          r => r.studentId === payment.studentId && 
               r.term === payment.term && 
               r.usesBus
        );
        bus = registration ? registration.busFee : 0;
        setBusFee(bus);
        
        const totalFeeValue = tuitionFee + bus;
        setTotalFee(totalFeeValue);
      });
      
      const unsubscribePayments = listenToPayments((allPayments) => {
        const approvedPayments = allPayments.filter(p => 
          p.studentId === payment.studentId && 
          p.term === payment.term && 
          p.status === 'approved'
        );
        
        const totalApproved = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        setTotalApprovedPaid(totalApproved);
        
        const totalFeeValue = tuitionFee + bus;
        const remaining = totalFeeValue - totalApproved;
        setRemainingBalance(remaining);
        
        const percent = totalFeeValue > 0 ? (totalApproved / totalFeeValue) * 100 : 0;
        setPercentagePaid(percent);
      });
      
      setTimeout(() => setLoading(false), 1000);
      
      return () => {
        unsubscribePayments();
        unsubscribeBus();
      };
    } catch (error) {
      console.error("Error loading receipt data:", error);
      setLoading(false);
    }
  };

  const openReceiptInNewTab = () => {
    const receiptWindow = window.open('', '_blank');
    const isComplete = remainingBalance === 0;
    const displayPercentage = percentagePaid.toFixed(1);
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${payment.studentName}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 0.3cm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', 'Inter', Arial, sans-serif;
            background: #f0f2f5;
            padding: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          .receipt-container {
            max-width: 750px;
            width: 100%;
            margin: 0 auto;
          }
          
          .receipt {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          /* Header Section - Compact */
          .receipt-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
          }
          
          .school-logo {
            width: 45px;
            height: 45px;
            margin: 0 auto 8px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          
          .school-name {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          
          .school-motto {
            font-size: 8px;
            opacity: 0.9;
            margin-bottom: 3px;
          }
          
          .school-address {
            font-size: 7px;
            opacity: 0.8;
            margin-bottom: 8px;
          }
          
          .receipt-title {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 3px 16px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 600;
          }
          
          /* Body Section - Compact */
          .receipt-body {
            padding: 15px 20px;
          }
          
          /* Info Cards - Compact */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .info-card {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
            border-left: 2px solid #2a5298;
          }
          
          .info-label {
            font-size: 8px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          
          .info-value {
            font-size: 11px;
            font-weight: 700;
            color: #1a3c61;
          }
          
          /* Student Info - Compact */
          .student-info {
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
          }
          
          .student-label {
            font-size: 8px;
            color: #6c757d;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          
          .student-value {
            font-size: 11px;
            font-weight: 600;
            color: #2c3e50;
          }
          
          /* Section Titles - Compact */
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e3c72;
            margin: 12px 0 8px;
            padding-bottom: 4px;
            border-bottom: 1.5px solid #2a5298;
            display: inline-block;
          }
          
          /* Tables - Compact */
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          
          .details-table td {
            padding: 6px 0;
            font-size: 10px;
          }
          
          .details-table td:last-child {
            text-align: right;
            font-weight: bold;
          }
          
          .total-row td {
            padding: 8px 0;
            border-top: 1px solid #e5e7eb;
            border-bottom: none;
          }
          
          .amount-large {
            font-size: 13px;
            color: #10b981;
            font-weight: bold;
          }
          
          .amount-balance {
            font-size: 13px;
            color: #ef4444;
            font-weight: bold;
          }
          
          /* Progress Bar - Compact */
          .progress-section {
            margin: 12px 0;
          }
          
          .progress-bar {
            background: #e5e7eb;
            border-radius: 10px;
            height: 6px;
            overflow: hidden;
          }
          
          .progress-fill {
            background: linear-gradient(90deg, #10b981, #059669);
            height: 100%;
            width: ${percentagePaid}%;
            border-radius: 10px;
          }
          
          .progress-text {
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            margin-top: 5px;
          }
          
          /* Status Badge - Compact */
          .status-badge {
            display: inline-block;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 600;
            margin: 10px 0;
          }
          
          .status-paid {
            background: #fef3c7;
            color: #d97706;
          }
          
          .status-complete {
            background: #d1fae5;
            color: #065f46;
          }
          
          /* Footer - Compact */
          .receipt-footer {
            background: #1e3c72;
            color: white;
            padding: 10px 20px;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          
          .footer-text {
            font-size: 7px;
            opacity: 0.8;
            margin-top: 3px;
          }
          
          /* Print Button */
          .print-button {
            text-align: center;
            margin-top: 12px;
            padding-bottom: 12px;
          }
          
          .print-btn {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          
          .print-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
          
          /* Responsive */
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .receipt-body {
              padding: 12px 15px;
            }
            
            .info-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
          }
          
          /* Print Styles - Optimized for A4 */
          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }
            
            .receipt {
              box-shadow: none;
              border-radius: 0;
            }
            
            .print-button {
              display: none;
            }
            
            .receipt-header {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .progress-fill {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @page {
              size: A4;
              margin: 0.2cm;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            .receipt-body {
              padding: 10px 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt">
            <!-- Header -->
            <div class="receipt-header">
              <div class="school-logo">
                <img src="/images/bis-logo.jpg" alt="Logo" style="width:100%;height:100%;object-fit:contain;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🏫%3C/text%3E%3C/svg%3E'">
              </div>
              <div class="school-name">BEULAHLAND INTERNATIONAL SCHOOLS</div>
              <div class="school-motto">"Discovering purpose to fulfil destiny"</div>
              <div class="school-address">Aba Odan, Alakia-Ogungbade Road, Alakia | Tel: +2348053513361</div>
              <div class="receipt-title">OFFICIAL PAYMENT RECEIPT</div>
            </div>
            
            <!-- Body -->
            <div class="receipt-body">
              <!-- Receipt Info Cards -->
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Receipt Number</div>
                  <div class="info-value">#${payment.id}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Date Issued</div>
                  <div class="info-value">${new Date(payment.date).toLocaleDateString()}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Payment Method</div>
                  <div class="info-value">${payment.paymentMode === 'online' ? '💳 Online' : '💰 Cash'}</div>
                </div>
              </div>
              
              <!-- Student Information -->
              <div class="student-info">
                <div>
                  <div class="student-label">Student Name</div>
                  <div class="student-value">${payment.studentName}</div>
                </div>
                <div>
                  <div class="student-label">Admission Number</div>
                  <div class="student-value">${payment.admissionNumber || 'N/A'}</div>
                </div>
                <div>
                  <div class="student-label">Class</div>
                  <div class="student-value">${payment.className}</div>
                </div>
                <div>
                  <div class="student-label">Term</div>
                  <div class="student-value">${payment.term}</div>
                </div>
                <div>
                  <div class="student-label">Session</div>
                  <div class="student-value">${payment.sessionName || '2024/2025'}</div>
                </div>
                <div>
                  <div class="student-label">Status</div>
                  <div class="student-value" style="color: ${payment.status === 'approved' ? '#10b981' : '#f59e0b'}">${payment.status?.toUpperCase()}</div>
                </div>
              </div>
              
              <!-- Fee Breakdown -->
              <div class="section-title">💰 FEE BREAKDOWN</div>
              <table class="details-table">
                <tr>
                  <td>Tuition Fee</td>
                  <td>₦${tuitionFee.toLocaleString()}</td>
                </tr>
                ${busFee > 0 ? `
                <tr>
                  <td>🚌 Bus Fee</td>
                  <td>₦${busFee.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td><strong>Total Fee for ${payment.term}</strong></td>
                  <td><strong class="amount-large">₦${totalFee.toLocaleString()}</strong></td>
                </tr>
              </table>
              
              <!-- Payment Details -->
              <div class="section-title">💳 PAYMENT DETAILS</div>
              <table class="details-table">
                <tr>
                  <td>This Payment</td>
                  <td style="color: #10b981; font-weight: bold;">₦${payment.amount.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total Paid to Date</strong></td>
                  <td><strong class="amount-large">₦${totalApprovedPaid.toLocaleString()}</strong></td>
                </tr>
              </table>
              
              <!-- Balance Summary -->
              <div class="section-title">⚖️ BALANCE SUMMARY</div>
              <table class="details-table">
                <tr>
                  <td>Total Fee for Term</td>
                  <td>₦${totalFee.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total Paid</td>
                  <td>₦${totalApprovedPaid.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Remaining Balance</strong></td>
                  <td><strong class="${remainingBalance === 0 ? 'amount-large' : 'amount-balance'}">₦${remainingBalance.toLocaleString()}</strong></td>
                </tr>
              </table>
              
              <!-- Progress -->
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <div class="progress-text">
                  Payment Progress: ${displayPercentage}% Complete
                </div>
              </div>
              
              <!-- Status Badge -->
              <div style={{ textAlign: 'center' }}>
                <span class="status-badge ${remainingBalance === 0 ? 'status-complete' : 'status-paid'}">
                  ${remainingBalance === 0 ? '✓ FULLY PAID' : '⚠ PARTIAL PAYMENT'}
                </span>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="receipt-footer">
              <div>Computer-generated receipt. No signature required.</div>
              <div class="footer-text">📞 +234 805 351 3361 | 📧 beulahlandintschool@gmail.com</div>
              <div class="footer-text">© ${new Date().getFullYear()} Beulahland International Schools</div>
            </div>
            
            <!-- Print Button -->
            <div class="print-button">
              <button class="print-btn" onclick="window.print()">🖨️ PRINT RECEIPT</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: '400px', width: '90%', borderRadius: '12px', backgroundColor: 'white', margin: '20px auto' }}>
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ 
        maxWidth: '420px', 
        width: '90%',
        borderRadius: '12px',
        backgroundColor: 'white',
        margin: '20px auto',
        overflow: 'hidden'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '12px 16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ margin: 0, fontSize: '14px' }}>Payment Receipt</h3></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', color: 'white' }}><X size={14} /></button>
        </div>
        
        <div style={{ padding: '14px' }}>
          <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#166534', marginBottom: '6px', textAlign: 'center' }}>RECEIPT SUMMARY</div>
            <div style={{ fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Student:</span><strong>{payment.studentName}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>This Payment:</span><strong>₦{payment.amount.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Total Paid:</span><strong>₦{totalApprovedPaid.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span><strong>{payment.status?.toUpperCase()}</strong></div>
            </div>
          </div>
          
          <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}><span>Total Fee:</span><strong>₦{totalFee.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}><span>Total Paid:</span><strong>₦{totalApprovedPaid.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #fde68a', fontSize: '10px' }}>
              <span>Remaining:</span>
              <strong style={{ color: remainingBalance === 0 ? '#10b981' : '#e74c3c' }}>₦{remainingBalance.toLocaleString()}</strong>
            </div>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '10px 14px', display: 'flex', gap: '8px', background: '#f9fafb' }}>
          <button onClick={openReceiptInNewTab} style={{ flex: 1, background: 'linear-gradient(135deg, #1e3c72, #2a5298)', padding: '8px', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Printer size={12} /> View Receipt
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', background: '#6b7280', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '11px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;