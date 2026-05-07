import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import { saveAs } from 'file-saver';
import { QRCodeCanvas } from 'qrcode.react';

// --- Login Component ---
const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'mevat' && password === 'vatme') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '64px', height: '64px', background: '#3b82f6', borderRadius: '16px',
            margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>Secure Access</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>VAT Invoice Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '16px', outline: 'none', transition: 'all 0.2s'
              }}
              placeholder="Enter username"
              required
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '16px', outline: 'none', transition: 'all 0.2s'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '14px', margin: '0' }}>{error}</p>}

          <button type="submit" style={{
            background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
            transition: 'transform 0.1s, background 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >Login to System</button>
        </form>
      </div>
    </div>
  );
};

// --- Main Application Component (Guard) ---
const InvoiceForm: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('vat_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('vat_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vat_auth');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <InvoiceContent onLogout={handleLogout} />;
};

// --- Original Invoice Content Logic ---
const InvoiceContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(Array.from({ length: 8 }, (_, i) => ({
    id: i, description: '', unit: '', qty: '', unitPrice: ''
  })));

  const [serviceCharge, setServiceCharge] = useState<number | ''>('');
  const [qrValue, setQrValue] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [tempQrInput, setTempQrInput] = useState('');
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNo: '',
    invoiceDate: '',
    fromName: '',
    fromTradeName: '',
    fromCity: 'OROMIA',
    fromZone: 'JIMMA ZONE',
    fromWoreda: 'JIMMA CITY ADMIN',
    fromKebele: 'H E R M A T A',
    fromHNo: '0 3 9',
    fromTele: '',
    fromTIN: '0022852002',
    fromVATNo: '9489910009',
    fromVATDate: '2015-09-12 00:00:00',
    toName: '',
    toCity: '',
    toZone: '',
    toWoreda: '',
    toKebele: '',
    toHNo: '',
    toTIN: '',
    toVATNo: '',
    toVATDate: '',
    checkNo: '',
    voucherNo: '',
    receiverName: '',
  });
  const [invoiceColor, setInvoiceColor] = useState('#343444');

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = (qty: number | string, price: number | string) => {
    if (qty === '' || price === '') return 0;
    return Number(qty) * Number(price);
  };

  const subTotal = items.reduce((sum, item) => sum + calculateTotal(item.qty, item.unitPrice), 0);
  const totalWithService = subTotal + (Number(serviceCharge) || 0);
  const vat = totalWithService * 0.15;
  const grandTotal = totalWithService + vat;

  const getWordBirr = () => {
    if (grandTotal === 0) return '';
    const integerPart = Math.floor(grandTotal);
    const decimalPart = Math.round((grandTotal - integerPart) * 100);

    let words = toWords(integerPart).replace(/-/g, ' ').toUpperCase() + ' BIRR';
    if (decimalPart > 0) {
      words += ` AND ${decimalPart}/100 CENTS`;
    }
    return words;
  };

  const updateItem = (id: number, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const exportPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice.pdf`);
    } catch (error) {
      console.error(error);
    }
  };

  const exportWord = () => {
    if (!invoiceRef.current) return;
    try {
      const clone = invoiceRef.current.cloneNode(true) as HTMLElement;

      // Replace all inputs with their current values
      const originalInputs = invoiceRef.current.querySelectorAll('input');
      const clonedInputs = clone.querySelectorAll('input');

      originalInputs.forEach((input, index) => {
        const span = document.createElement('span');
        span.innerText = input.value || '\u00A0';
        span.style.cssText = input.style.cssText;
        span.style.display = 'inline-block';
        span.style.minWidth = '50px';
        span.style.color = invoiceColor; // Explicitly set color for Word
        span.className = 'field-span';
        if (input.className.includes('field-input')) {
          span.style.borderBottom = '1px solid #000';
        }
        clonedInputs[index].parentNode?.replaceChild(span, clonedInputs[index]);
      });

      // Inject Word-compatible CSS to mimic the browser layout
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Invoice</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Times New Roman', serif; font-weight: bold; }
            .invoice-wrapper { width: 100%; max-width: 800px; margin: 0 auto; }
            .header-container { display: table; width: 100%; margin-bottom: 20px; }
            .header-left, .header-right { display: table-cell; vertical-align: top; }
            .address-container { display: table; width: 100%; border-spacing: 20px 0; }
            .address-block { display: table-cell; width: 45%; vertical-align: top; }
            .field-row { display: table; width: 100%; margin-bottom: 10px; }
            .invoice-table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid black; padding: 8px; text-align: left; }
            .calculations-container { display: table; width: 100%; }
            .calc-labels { display: table-cell; width: 60%; text-align: right; padding-right: 15px; }
            .calc-values { display: table-cell; width: 40%; border: 1px solid black; }
            .footer-section { margin-top: 30px; }
            .vertical-sidebar { display: none; }
            /* Apply theme color to user fields and totals in Word */
            .theme-text, span.field-span { color: ${invoiceColor} !important; }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";

      const sourceHTML = header + clone.outerHTML + footer;
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
      saveAs(blob, 'VAT_Invoice_Editable.doc');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="invoice-actions">
        <button className="btn" onClick={exportPDF}>Export to PDF</button>
        <button className="btn" onClick={exportWord} style={{ backgroundColor: '#10b981' }}>Export to Word</button>
        <button className="btn" onClick={() => window.print()} style={{ backgroundColor: '#fff', color: '#2563eb', border: '1px solid #2563eb' }}>Print</button>
        <button className="btn" onClick={() => setShowQrModal(true)} style={{ backgroundColor: '#6366f1', color: '#fff' }}>Generate QR</button>
        <button className="btn" onClick={() => setShowQuickFill(true)} style={{ backgroundColor: '#f59e0b', color: '#fff' }}>Quick Fill Form</button>
        <button className="btn" onClick={onLogout} style={{ backgroundColor: '#ef4444', color: '#fff' }}>Logout</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '15px', padding: '5px 12px', background: 'white', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Theme Color
          </label>
          <input 
            type="color" 
            value={invoiceColor} 
            onChange={(e) => setInvoiceColor(e.target.value)}
            style={{ width: '30px', height: '24px', padding: '0', border: 'none', cursor: 'pointer', background: 'none' }}
          />
        </div>
      </div>

      {showQuickFill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '0', borderRadius: '16px', width: '95%', maxWidth: '900px',
            maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 30px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Invoice Data Form</h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.875rem' }}>Fill in the details below to update the invoice</p>
              </div>
              <button onClick={() => setShowQuickFill(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flexGrow: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                <section>
                  <h3 style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '10px', color: '#1e3a8a', marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                    Basic Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Invoice No.</label>
                      <input type="text" value={formData.invoiceNo} onChange={e => handleFormChange('invoiceNo', e.target.value)} placeholder="Enter No." />
                    </div>
                    <div className="form-group">
                      <label>Invoice Date</label>
                      <input type="date" value={formData.invoiceDate} onChange={e => handleFormChange('invoiceDate', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Details (From)</h4>
                    <div className="form-group"><label>Supplier Name</label><input type="text" value={formData.fromName} onChange={e => handleFormChange('fromName', e.target.value)} /></div>
                    <div className="form-group"><label>Trade Name</label><input type="text" value={formData.fromTradeName} onChange={e => handleFormChange('fromTradeName', e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group"><label>City</label><input type="text" value={formData.fromCity} onChange={e => handleFormChange('fromCity', e.target.value)} /></div>
                      <div className="form-group"><label>Zone</label><input type="text" value={formData.fromZone} onChange={e => handleFormChange('fromZone', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group"><label>Woreda</label><input type="text" value={formData.fromWoreda} onChange={e => handleFormChange('fromWoreda', e.target.value)} /></div>
                      <div className="form-group"><label>Kebele</label><input type="text" value={formData.fromKebele} onChange={e => handleFormChange('fromKebele', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                      <div className="form-group"><label>H.No.</label><input type="text" value={formData.fromHNo} onChange={e => handleFormChange('fromHNo', e.target.value)} /></div>
                      <div className="form-group"><label>Telephone</label><input type="text" value={formData.fromTele} onChange={e => handleFormChange('fromTele', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Supplier TIN</label><input type="text" value={formData.fromTIN} onChange={e => handleFormChange('fromTIN', e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group"><label>VAT No</label><input type="text" value={formData.fromVATNo} onChange={e => handleFormChange('fromVATNo', e.target.value)} /></div>
                      <div className="form-group"><label>VAT Reg Date</label><input type="text" value={formData.fromVATDate} onChange={e => handleFormChange('fromVATDate', e.target.value)} /></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '10px', color: '#1e3a8a', marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                    Customer & Payment
                  </h3>

                  <div className="form-group"><label>Customer Name</label><input type="text" value={formData.toName} onChange={e => handleFormChange('toName', e.target.value)} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group"><label>City</label><input type="text" value={formData.toCity} onChange={e => handleFormChange('toCity', e.target.value)} /></div>
                    <div className="form-group"><label>Zone</label><input type="text" value={formData.toZone} onChange={e => handleFormChange('toZone', e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group"><label>Woreda</label><input type="text" value={formData.toWoreda} onChange={e => handleFormChange('toWoreda', e.target.value)} /></div>
                    <div className="form-group"><label>Kebele</label><input type="text" value={formData.toKebele} onChange={e => handleFormChange('toKebele', e.target.value)} /></div>
                    <div className="form-group"><label>H.No.</label><input type="text" value={formData.toHNo} onChange={e => handleFormChange('toHNo', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label>Customer TIN</label><input type="text" value={formData.toTIN} onChange={e => handleFormChange('toTIN', e.target.value)} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group"><label>Customer VAT No</label><input type="text" value={formData.toVATNo} onChange={e => handleFormChange('toVATNo', e.target.value)} /></div>
                    <div className="form-group"><label>VAT Reg Date</label><input type="text" value={formData.toVATDate} onChange={e => handleFormChange('toVATDate', e.target.value)} /></div>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Info</h4>
                    <div className="form-group">
                      <label>Service Charge (if any)</label>
                      <input type="number" value={serviceCharge} onChange={e => setServiceCharge(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Check Number (if payment by check)</label>
                      <input type="text" value={formData.checkNo} onChange={e => handleFormChange('checkNo', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group"><label>Voucher No.</label><input type="text" value={formData.voucherNo} onChange={e => handleFormChange('voucherNo', e.target.value)} /></div>
                      <div className="form-group"><label>Receiver Name</label><input type="text" value={formData.receiverName} onChange={e => handleFormChange('receiverName', e.target.value)} /></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div style={{ padding: '20px 30px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button className="btn" onClick={() => setShowQuickFill(false)} style={{ background: '#64748b', color: 'white' }}>Cancel</button>
              <button className="btn" onClick={() => setShowQuickFill(false)} style={{ background: '#3b82f6', color: 'white' }}>Save & View Invoice</button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Generate QR Code</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Enter text, a link, or a TIN number to generate the invoice QR code.</p>
            <input
              type="text"
              value={tempQrInput}
              onChange={(e) => setTempQrInput(e.target.value)}
              placeholder="Enter content..."
              style={{
                width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                marginBottom: '20px', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowQrModal(false)}
                style={{ padding: '8px 16px', border: 'none', background: '#eee', borderRadius: '6px', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => {
                  setQrValue(tempQrInput);
                  setShowQrModal(false);
                }}
                style={{ padding: '8px 16px', border: 'none', background: '#6366f1', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
              >Generate</button>
            </div>
          </div>
        </div>
      )}

      <div className="invoice-container">
        <div className="invoice-wrapper" ref={invoiceRef} style={{ '--field-color': invoiceColor } as any}>
          {/* Vertical Left Sidebar */}
          <div className="vertical-sidebar">
            <span>በብርሃንና ሰላም ማተሚያ ድሪጅት የግብር ከፋይ መለያ ቁጥር 0000007140</span>
          </div>

          {/* Header */}
          <div className="header-container">
            <div className="header-left">
              <div className="invoice-no-row" style={{ alignItems: 'center', gap: '20px' }}>
                <div className="text-group">
                  <span>የደረሰኝ ቁጥር</span>
                  <span>Invoice No.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    className="field-input"
                    style={{
                      width: '120px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: invoiceColor,
                      border: 'none',
                      padding: '2px 0',
                      backgroundColor: 'transparent',
                      textAlign: 'center'
                    }}
                    value={formData.invoiceNo}
                    onChange={e => handleFormChange('invoiceNo', e.target.value)}
                    placeholder="No."
                  />

                  <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: 0, left: '0px', width: '10px', height: '10px', borderTop: '2px solid black', borderLeft: '2px solid black' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '60px', width: '10px', height: '10px', borderTop: '2px solid black', borderRight: '2px solid black' }}></div>
                    <div style={{ position: 'absolute', top: '60px', left: '0px', width: '10px', height: '10px', borderBottom: '2px solid black', borderLeft: '2px solid black' }}></div>
                    <div style={{ position: 'absolute', top: '60px', left: '60px', width: '10px', height: '10px', borderBottom: '2px solid black', borderRight: '2px solid black' }}></div>

                    {qrValue ? (
                      <QRCodeCanvas value={qrValue} size={70} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px', background: 'black', outline: '3px solid var(--invoice-bg)', outlineOffset: '-5px' }}></div>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '15px', height: '15px', background: 'black', outline: '3px solid var(--invoice-bg)', outlineOffset: '-5px' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '15px', height: '15px', background: 'black', outline: '3px solid var(--invoice-bg)', outlineOffset: '-5px' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="header-center">
              <h2>የተጨማሪ እሴት ታክስ ደረሰኝ</h2>
              <h3>Value Added Tax Cash Sales Invoice</h3>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block' }}>የእጅ በእጅ ሽያጭ (Cash Sales)</div>
            </div>

            <div className="header-right">
              <div className="text-group" style={{ alignItems: 'flex-start', display: 'inline-flex' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>ቀን</span>
                  <input type="date" value={formData.invoiceDate} onChange={e => handleFormChange('invoiceDate', e.target.value)} style={{ borderBottom: '1px solid black', width: '120px' }} />
                </div>
                <span>Invoice Date</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="address-container" style={{ marginTop: '20px' }}>
            {/* FROM */}
            <div className="address-block">
              <div className="field-row" style={{ marginBottom: '5px' }}>
                <div className="text-group">
                  <span style={{ fontWeight: 'bold' }}>ከ</span>
                  <span>From:</span>
                </div>
                <input className="field-input" type="text" value={formData.fromName} onChange={e => handleFormChange('fromName', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>የንግድ ስም ስያሜ</span>
                  <span>Trade Name</span>
                </div>
                <input className="field-input" type="text" value={formData.fromTradeName} onChange={e => handleFormChange('fromTradeName', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>አድራሻ፡ ከተማ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Address City/Town</span>
                </div>
                <input type="text" className="field-input" style={{ margin: '0 5px', textAlign: 'center' }} value={formData.fromCity} onChange={e => handleFormChange('fromCity', e.target.value)} />

                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ዞን/ክ/ከተማ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Zone/ Sub-City</span>
                </div>
                <input type="text" className="field-input" style={{ margin: '0 0 0 5px', textAlign: 'center' }} value={formData.fromZone} onChange={e => handleFormChange('fromZone', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ወረዳ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Woreda</span>
                </div>
                <input type="text" className="field-input" style={{ margin: '0 5px', textAlign: 'center' }} value={formData.fromWoreda} onChange={e => handleFormChange('fromWoreda', e.target.value)} />

                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ቀበሌ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Kebele</span>
                </div>
                <input type="text" className="field-input" style={{ margin: '0 0 0 5px', textAlign: 'center' }} value={formData.fromKebele} onChange={e => handleFormChange('fromKebele', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>የቤት.ቁ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>H.No.</span>
                </div>
                <input type="text" className="field-input" style={{ width: '50px', flexGrow: 0, margin: '0 5px', textAlign: 'center' }} value={formData.fromHNo} onChange={e => handleFormChange('fromHNo', e.target.value)} />

                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ስልክ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Tele</span>
                </div>
                <input type="text" className="field-input" style={{ marginLeft: '5px' }} value={formData.fromTele} onChange={e => handleFormChange('fromTele', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>የሻጭ የግብር ከፋይ መለያ ቁጥር</span>
                  <span>Supplier's TIN</span>
                </div>
                <input type="text" className="field-input" value={formData.fromTIN} onChange={e => handleFormChange('fromTIN', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>የሻጭ የተ.እ.ታ. ቁጥር</span>
                  <span>Supplier's VAT Reg. No.</span>
                </div>
                <input type="text" className="field-input" value={formData.fromVATNo} onChange={e => handleFormChange('fromVATNo', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>ለተ.እ.ታ. የተመዘገበበት ቀን</span>
                  <span>Date of VAT Registration</span>
                </div>
                <input type="text" className="field-input" value={formData.fromVATDate} onChange={e => handleFormChange('fromVATDate', e.target.value)} />
              </div>
            </div>

            {/* TO */}
            <div className="address-block">
              <div className="field-row" style={{ marginBottom: '5px' }}>
                <div className="text-group">
                  <span style={{ fontWeight: 'bold' }}>ለ</span>
                  <span>To</span>
                </div>
                <input className="field-input" type="text" value={formData.toName} onChange={e => handleFormChange('toName', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>አድራሻ፡ ከተማ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Address City/Town</span>
                </div>
                <input className="field-input" type="text" style={{ width: '100px', flexGrow: 0, margin: '0 5px' }} value={formData.toCity} onChange={e => handleFormChange('toCity', e.target.value)} />

                <div style={{ position: 'relative', marginLeft: '10px' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ዞን/ክ/ከተማ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Zone/ Sub-City</span>
                </div>
                <input className="field-input" type="text" value={formData.toZone} onChange={e => handleFormChange('toZone', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ወረዳ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Woreda</span>
                </div>
                <input className="field-input" type="text" style={{ width: '60px', flexGrow: 0, margin: '0 5px' }} value={formData.toWoreda} onChange={e => handleFormChange('toWoreda', e.target.value)} />

                <div style={{ position: 'relative', marginLeft: '10px' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ቀበሌ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Kebele</span>
                </div>
                <input className="field-input" type="text" style={{ width: '60px', flexGrow: 0, margin: '0 5px' }} value={formData.toKebele} onChange={e => handleFormChange('toKebele', e.target.value)} />

                <div style={{ position: 'relative', marginLeft: '10px' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>የቤት.ቁ</span>
                  <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>H.No.</span>
                </div>
                <input className="field-input" type="text" value={formData.toHNo} onChange={e => handleFormChange('toHNo', e.target.value)} />
              </div>

              <div className="field-row" style={{ marginTop: '22px' }}>
                <div className="text-group">
                  <span>የገዢ የግብር ከፋይ መለያ ቁጥር</span>
                  <span>Customer's TIN</span>
                </div>
                <input className="field-input" type="text" value={formData.toTIN} onChange={e => handleFormChange('toTIN', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>የገዢ የተ.እ.ታ. ቁጥር /ካለው/</span>
                  <span>Customer's VAT Reg. No.</span>
                </div>
                <input className="field-input" type="text" value={formData.toVATNo} onChange={e => handleFormChange('toVATNo', e.target.value)} />
              </div>

              <div className="field-row">
                <div className="text-group">
                  <span>ለተ.እ.ታ. የተመዘገበበት ቀን</span>
                  <span>Date of VAT Registration</span>
                </div>
                <input className="field-input" type="text" value={formData.toVATDate} onChange={e => handleFormChange('toVATDate', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>
                  <div>ተ.ቁ</div>
                  <div>No.</div>
                </th>
                <th className="desc-col">
                  <div>የዕቃው ዓይነት</div>
                  <div>Descreption</div>
                </th>
                <th style={{ width: '15%' }}>
                  <div>መለኪያ</div>
                  <div>Unit</div>
                </th>
                <th style={{ width: '10%' }}>
                  <div>ብዛት</div>
                  <div>Qty</div>
                </th>
                <th style={{ width: '15%' }}>
                  <div>የአንዱ ዋጋ</div>
                  <div>Unit Price</div>
                </th>
                <th style={{ width: '20%' }}>
                  <div>ጠቅላላ ዋጋ</div>
                  <div>Total Amount</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td></td>
                  <td className="desc-col">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} />
                  </td>
                  <td className="theme-text">{calculateTotal(item.qty, item.unitPrice) > 0 ? calculateTotal(item.qty, item.unitPrice).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Top 3 rows align with Unit Price column (65% spacer, 15% label area) */}
            <div style={{ display: 'flex', minHeight: '25px' }}>
              <div style={{ width: '62%' }}></div>
              <div style={{ width: '18%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>ሰርቪስ ቻርጅ /ካለ/</span>
                <span>Service Charge</span>
              </div>
              <div style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                <input type="number" style={{ width: '100%', height: '100%', textAlign: 'center' }} value={serviceCharge} onChange={e => setServiceCharge(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '25px' }}>
              <div style={{ width: '62%' }}></div>
              <div style={{ width: '18%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>ድምር</span>
                <span>Total</span>
              </div>
              <div className="theme-text" style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalWithService > 0 && totalWithService.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '25px' }}>
              <div style={{ width: '62%' }}></div>
              <div style={{ width: '18%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ. /15%/</span>
                <span>VAT</span>
              </div>
              <div className="theme-text" style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vat > 0 && vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Bottom row aligns with Qty column start (55% spacer, 25% label area) */}
            <div style={{ display: 'flex', minHeight: '40px' }}>
              <div style={{ width: '50%' }}></div>
              <div style={{ width: '30%', paddingRight: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ. ጨምሮ ጠቅላላ ዋጋ</span>
                <span style={{ whiteSpace: 'nowrap' }}>Total Selling Price Including VAT</span>
              </div>
              <div className="theme-text" style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {grandTotal > 0 && grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer-section">
            <div className="word-birr-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>በፊደል ብር/</span>
                <span style={{ marginLeft: '4px' }}>In Word Birr</span>
              </div>
              <div className="word-birr-box theme-text" style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', flexGrow: 1 }}>
                {getWordBirr()}
              </div>
            </div>

            <div className="payment-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
              <div className="text-group" style={{ flexDirection: 'row', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>የክፍያ ሁኔታ/</span>
                <span style={{ marginLeft: '4px' }}>Mode of Payment</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div className="checkbox-group">
                  <div className="text-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>በጥሬ ገንዘብ/</span>
                    <span style={{ marginLeft: '4px' }}>Cash</span>
                  </div>
                  <div className="check-box"></div>
                </div>

                <div className="checkbox-group" style={{ marginLeft: '30px' }}>
                  <div className="text-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>በቼክ/</span>
                    <span style={{ marginLeft: '4px' }}>Check</span>
                  </div>
                  <div className="check-box"></div>
                </div>

                <div className="field-row" style={{ flexGrow: 1, marginLeft: '30px', maxWidth: '75%' }}>
                  <div className="text-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>የቼክ ቁጥር/</span>
                    <span style={{ marginLeft: '4px' }}>Check No.</span>
                  </div>
                  <input className="field-input" type="text" value={formData.checkNo} onChange={e => handleFormChange('checkNo', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="signature-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '5px' }}>
              <div className="field-row" style={{ width: '55%' }}>
                <div className="text-group">
                  <span style={{ fontWeight: 'bold' }}>ቫውቸር ቁጥር/</span>
                  <span>Voucher No.</span>
                </div>
                <input className="field-input" type="text" value={formData.voucherNo} onChange={e => handleFormChange('voucherNo', e.target.value)} />
              </div>

              <div className="field-row" style={{ width: '40%' }}>
                <div className="text-group">
                  <span style={{ fontWeight: 'bold' }}>የተቀባይ ስምና ፊርማ/</span>
                  <span>Receiver Name & Signature</span>
                </div>
                <input className="field-input" type="text" value={formData.receiverName} onChange={e => handleFormChange('receiverName', e.target.value)} />
              </div>
            </div>

            <div className="distribution-row" style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
              <div className="text-group" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>ክፍፍል:-</span>
                <span>Distribution:-</span>
              </div>
              <div className="text-group" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>ዋናው</span>
                <span>Original</span>
              </div>
              <div className="text-group" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>ለከፋይ</span>
                <span>Customer</span>
              </div>
              <div className="text-group" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>1ኛ ኮፒ ለሂሳብ ክፍል</span>
                <span>1st Copy Account</span>
              </div>
              <div className="text-group" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold' }}>2ኛ ኮፒ ለፓድ</span>
                <span>2nd Copy Pad</span>
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: '15px', paddingBottom: '10px' }}>
              <div style={{ visibility: 'hidden', marginRight: '20px' }}>
                <div className="text-group" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 'bold' }}>ክፍፍል:-</span>
                  <span>Distribution:-</span>
                </div>
              </div>

              <div style={{
                border: 'none',
                padding: '10px',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '8px',
                textTransform: 'none',
                fontFamily: "'Times New Roman', serif",
                transform: 'translateX(100px)',//y edit this value (e.g., 50px) to move text left/right
              }}>
                Original
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
