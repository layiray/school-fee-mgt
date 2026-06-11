import React, { useState, useEffect } from 'react';
import { X, Printer, CreditCard, DollarSign, Bus, ExternalLink } from 'lucide-react';
import { listenToPayments, listenToBusRegistrations } from '../../config/firebase';

const ReceiptModal = ({ payment, onClose }) => {
  const [totalApprovedPaid, setTotalApprovedPaid] = useState(payment.status === 'approved' ? payment.amount : 0);
  const [busFee, setBusFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(payment.tuitionFee || 0);
  const [totalFee, setTotalFee] = useState(payment.tuitionFee || 0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [percentagePaid, setPercentagePaid] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const unsubscribePayments = listenToPayments((payments) => {
        const approved = payments.filter(p => 
          p.studentId === payment.studentId && 
          p.term === payment.term && 
          p.status === 'approved'
        );
        
        const total = approved.reduce((sum, p) => sum + (p.amount || 0), 0);
        setTotalApprovedPaid(total);
        
        const totalFeeValue = tuitionFee + busFee;
        const remaining = totalFeeValue - total;
        setRemainingBalance(remaining);
        
        const percent = totalFeeValue > 0 ? (total / totalFeeValue) * 100 : 0;
        setPercentagePaid(percent);
      });
      
      const unsubscribeBus = listenToBusRegistrations((registrations) => {
        const registration = registrations.find(
          r => r.studentId === payment.studentId && 
               r.term === payment.term && 
               r.usesBus
        );
        const bus = registration ? registration.busFee : 0;
        setBusFee(bus);
        
        const totalFeeValue = tuitionFee + bus;
        setTotalFee(totalFeeValue);
        
        const remaining = totalFeeValue - totalApprovedPaid;
        setRemainingBalance(remaining);
        
        const percent = totalFeeValue > 0 ? (totalApprovedPaid / totalFeeValue) * 100 : 0;
        setPercentagePaid(percent);
      });
      
      setTimeout(() => setLoading(false), 500);
      
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
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${payment.studentName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #f0f2f5; 
            padding: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
          }
          .receipt { 
            max-width: 750px; 
            width: 100%; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); 
            overflow: hidden; 
          }
          .receipt-header { 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
          }
          .school-logo { 
            width: 50px; 
            height: 50px; 
            margin: 0 auto 10px; 
            background: rgba(255,255,255,0.15); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            overflow: hidden;
          }
          .school-logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .school-name { font-size: 18px; font-weight: bold; }
          .school-address { font-size: 9px; opacity: 0.8; margin-top: 4px; }
          .receipt-title { 
            display: inline-block; 
            background: rgba(255,255,255,0.2); 
            padding: 4px 16px; 
            border-radius: 20px; 
            font-size: 10px; 
            margin-top: 8px; 
          }
          .receipt-body { padding: 16px 20px; }
          .section { margin-bottom: 16px; }
          .section-title { 
            font-size: 12px; 
            font-weight: bold; 
            color: #1e3c72; 
            border-bottom: 1px solid #1e3c72; 
            padding-bottom: 4px; 
            margin-bottom: 10px; 
            display: inline-block; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 10px; 
            background: #f8f9fa; 
            padding: 12px; 
            border-radius: 8px; 
          }
          .info-label { font-size: 9px; color: #6b7280; margin-bottom: 2px; }
          .info-value { font-size: 12px; font-weight: 600; color: #1f2937; }
          .amount-card { background: #f8f9fa; border-radius: 8px; padding: 12px; }
          .amount-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 6px 0; 
            border-bottom: 1px solid #e5e7eb; 
            font-size: 12px;
          }
          .amount-row:last-child { border-bottom: none; }
          .amount-total { font-size: 14px; font-weight: bold; color: #059669; }
          .amount-balance { font-size: 14px; font-weight: bold; color: #dc2626; }
          .progress-bar-container { 
            background: #e5e7eb; 
            border-radius: 10px; 
            height: 4px; 
            overflow: hidden; 
            margin: 12px 0; 
          }
          .progress-fill { 
            background: linear-gradient(90deg, #10b981, #059669); 
            height: 100%; 
            width: ${percentagePaid}%; 
          }
          .progress-text { font-size: 10px; color: #6b7280; text-align: center; margin-top: 4px; }
          .status-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 10px; 
            font-weight: 600; 
            text-align: center; 
          }
          .status-paid { background: #d1fae5; color: #065f46; }
          .footer { 
            background: #f8f9fa; 
            padding: 12px 20px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
            font-size: 9px; 
            color: #6b7280; 
          }
          .print-button { text-align: center; padding: 12px 20px; background: #f8f9fa; }
          .print-btn { 
            background: #2a5298; 
            color: white; 
            border: none; 
            padding: 8px 20px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 12px; 
          }
          @media print { 
            body { background: white; padding: 0; } 
            .print-button { display: none; } 
            .receipt { box-shadow: none; } 
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <div class="school-logo">
              <img src="/images/bis-logo.jpg" alt="Logo" style="width:100%;height:100%;object-fit:contain;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🏫%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="school-name">BEULAHLAND INTERNATIONAL SCHOOLS</div>
            <div class="school-address">123 Education Way, Knowledge City, Nigeria</div>
            <div class="receipt-title">OFFICIAL PAYMENT RECEIPT</div>
          </div>
          
          <div class="receipt-body">
            <div class="section">
              <div class="section-title">RECEIPT INFO</div>
              <div class="info-grid">
                <div><div class="info-label">Receipt No</div><div class="info-value">#${payment.id}</div></div>
                <div><div class="info-label">Date</div><div class="info-value">${new Date(payment.date).toLocaleDateString()}</div></div>
                <div><div class="info-label">Method</div><div class="info-value">${payment.paymentMode === 'online' ? 'Online' : 'Cash'}</div></div>
                <div><div class="info-label">Status</div><div class="info-value">${payment.status?.toUpperCase()}</div></div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">STUDENT INFO</div>
              <div class="info-grid">
                <div><div class="info-label">Name</div><div class="info-value">${payment.studentName}</div></div>
                <div><div class="info-label">Admission No</div><div class="info-value">${payment.admissionNumber || 'N/A'}</div></div>
                <div><div class="info-label">Class</div><div class="info-value">${payment.className}</div></div>
                <div><div class="info-label">Term</div><div class="info-value">${payment.term}</div></div>
                <div><div class="info-label">Session</div><div class="info-value">${payment.sessionName || '2024/2025'}</div></div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">FEE BREAKDOWN</div>
              <div class="amount-card">
                <div class="amount-row"><span>Tuition Fee</span><span>₦${tuitionFee.toLocaleString()}</span></div>
                ${busFee > 0 ? `<div class="amount-row"><span>🚌 Bus Fee</span><span>₦${busFee.toLocaleString()}</span></div>` : ''}
                <div class="amount-row" style="border-top:1px solid #e5e7eb;margin-top:4px;padding-top:8px;"><strong>Total for ${payment.term}</strong><strong class="amount-total">₦${totalFee.toLocaleString()}</strong></div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">PAYMENT</div>
              <div class="amount-card">
                <div class="amount-row"><span>This Payment</span><span style="color:#059669;">₦${payment.amount.toLocaleString()}</span></div>
                <div class="amount-row"><span>Total Paid</span><span class="amount-total">₦${totalApprovedPaid.toLocaleString()}</span></div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">BALANCE</div>
              <div class="amount-card">
                <div class="amount-row"><span>Remaining Balance</span><span class="${remainingBalance === 0 ? 'amount-total' : 'amount-balance'}">₦${remainingBalance.toLocaleString()}</span></div>
              </div>
            </div>
            
            <div class="progress-bar-container"><div class="progress-fill"></div></div>
            <div class="progress-text">${percentagePaid.toFixed(0)}% Paid</div>
            
            <div style="text-align:center;margin-top:12px;">
              <span class="status-badge ${remainingBalance === 0 ? 'status-paid' : 'status-paid'}">
                ${remainingBalance === 0 ? '✓ FULLY PAID' : '⚠ PARTIAL PAYMENT'}
              </span>
            </div>
          </div>
          
          <div class="footer">
            This is a computer-generated receipt. No signature required.
            <div>© ${new Date().getFullYear()} Beulahland International Schools</div>
          </div>
          
          <div class="print-button">
            <button class="print-btn" onclick="window.print()">🖨️ PRINT RECEIPT</button>
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
        <div className="modal-content" style={{ maxWidth: '450px', width: '90%', borderRadius: '12px', backgroundColor: 'white', margin: '20px auto' }}>
          <div style={{ padding: '40px', textAlign: 'center' }}>
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
        maxWidth: '480px', 
        width: '90%',
        borderRadius: '12px',
        backgroundColor: 'white',
        margin: '20px auto',
        overflow: 'hidden'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '14px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/images/bis-logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🏫'; }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Payment Receipt</h3>
              <p style={{ margin: '2px 0 0', fontSize: '10px', opacity: 0.9 }}>Beulahland Schools</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: 'white' }}><X size={16} /></button>
        </div>
        
        <div style={{ padding: '16px' }}>
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', textAlign: 'center' }}>RECEIPT SUMMARY</div>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>Student:</span><strong>{payment.studentName}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>Amount:</span><strong>₦{payment.amount.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span><strong>{payment.status?.toUpperCase()}</strong></div>
            </div>
          </div>
          
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}><span>Total Fee:</span><strong>₦{totalFee.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}><span>Total Paid:</span><strong>₦{totalApprovedPaid.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px', borderTop: '1px solid #fde68a', fontSize: '11px' }}><span>Remaining:</span><strong style={{ color: remainingBalance === 0 ? '#10b981' : '#e74c3c' }}>₦{remainingBalance.toLocaleString()}</strong></div>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', gap: '10px', background: '#f9fafb' }}>
          <button onClick={openReceiptInNewTab} style={{ flex: 1, background: 'linear-gradient(135deg, #1e3c72, #2a5298)', padding: '10px', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Printer size={14} /> Print Receipt</button>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#6b7280', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;