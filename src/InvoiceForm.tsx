import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import { saveAs } from 'file-saver';

const InvoiceForm: React.FC = () => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(Array.from({ length: 8 }, (_, i) => ({
    id: i, description: '', unit: '', qty: '', unitPrice: ''
  })));

  const [serviceCharge, setServiceCharge] = useState<number | ''>('');
  
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
            .vertical-sidebar { display: none; } /* Margin text is handled via Word Page Headers usually */
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
        <button className="btn" onClick={exportWord} style={{backgroundColor: '#10b981'}}>Export to Word</button>
        <button className="btn" onClick={() => window.print()} style={{backgroundColor: '#fff', color: '#2563eb', border: '1px solid #2563eb'}}>Print</button>
      </div>

      <div className="invoice-wrapper" ref={invoiceRef}>
        {/* Vertical Left Sidebar */}
        <div className="vertical-sidebar">
          <span>በብርሃንና ሰላም ማተሚያ ድሪጅት የግብር ከፋይ መለያ ቁጥር 0000007140</span>
        </div>

        {/* Header */}
        <div className="header-container">
          <div className="header-left">
            <div className="invoice-no-row" style={{ alignItems: 'flex-start' }}>
              <div className="text-group">
                <span>የደረሰኝ ቁጥር</span>
                <span>Invoice No.</span>
              </div>
              
              <div style={{ position: 'relative', marginLeft: '20px', width: '70px', height: '70px' }}>
                <div style={{ position: 'absolute', top: 0, left: '0px', width: '10px', height: '10px', borderTop: '2px solid black', borderLeft: '2px solid black' }}></div>
                <div style={{ position: 'absolute', top: 0, left: '60px', width: '10px', height: '10px', borderTop: '2px solid black', borderRight: '2px solid black' }}></div>
                <div style={{ position: 'absolute', top: '60px', left: '0px', width: '10px', height: '10px', borderBottom: '2px solid black', borderLeft: '2px solid black' }}></div>
                <div style={{ position: 'absolute', top: '60px', left: '60px', width: '10px', height: '10px', borderBottom: '2px solid black', borderRight: '2px solid black' }}></div>
                
                <div style={{ position: 'absolute', top: '10px', left: '10px', width: '10px', height: '10px', background: 'black', outline: '2px solid var(--invoice-bg)', outlineOffset: '-4px' }}></div>
                <div style={{ position: 'absolute', top: '10px', left: '50px', width: '10px', height: '10px', background: 'black', outline: '2px solid var(--invoice-bg)', outlineOffset: '-4px' }}></div>
                <div style={{ position: 'absolute', top: '50px', left: '10px', width: '10px', height: '10px', background: 'black', outline: '2px solid var(--invoice-bg)', outlineOffset: '-4px' }}></div>
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
                <input type="date" style={{ borderBottom: '1px solid black', width: '120px' }} />
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
              <input className="field-input" type="text" />
            </div>
            
            <div className="field-row">
              <div className="text-group">
                <span>የንግድ ስም ስያሜ</span>
                <span>Trade Name</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row" style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>አድራሻ፡ ከተማ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Address City/Town</span>
              </div>
              <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 5px', textAlign: 'center' }}>OROMIA</div>
              
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ዞን/ክ/ከተማ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Zone/ Sub-City</span>
              </div>
              <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 0 0 5px', textAlign: 'center', whiteSpace: 'nowrap' }}>JIMMA ZONE</div>
            </div>

            <div className="field-row" style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ወረዳ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Woreda</span>
              </div>
              <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 5px', textAlign: 'center', fontSize: '11px' }}>JIMMA CITY ADMIN</div>
              
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ቀበሌ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Kebele</span>
              </div>
              <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 0 0 5px', textAlign: 'center', whiteSpace: 'nowrap' }}>H E R M A T A</div>
            </div>

            <div className="field-row" style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>የቤት.ቁ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>H.No.</span>
              </div>
              <div style={{ width: '50px', borderBottom: '1px solid #000', margin: '0 5px', textAlign: 'center' }}>0 3 9</div>
              
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>ስልክ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Tele</span>
              </div>
              <input type="text" className="field-input" style={{ marginLeft: '5px' }} />
            </div>

            <div className="field-row">
              <div className="text-group">
                <span>የሻጭ የግብር ከፋይ መለያ ቁጥር</span>
                <span>Supplier's TIN</span>
              </div>
              <div className="field-input-static" style={{ flexGrow: 1 }}>
                 <span style={{ marginLeft: '10px' }}>0022852002</span>
              </div>
            </div>

            <div className="field-row">
              <div className="text-group">
                <span>የሻጭ የተ.እ.ታ. ቁጥር</span>
                <span>Supplier's VAT Reg. No.</span>
              </div>
              <div className="field-input-static" style={{ flexGrow: 1 }}>
                 <span style={{ marginLeft: '10px' }}>9489910009</span>
              </div>
            </div>

            <div className="field-row">
              <div className="text-group">
                <span>ለተ.እ.ታ. የተመዘገበበት ቀን</span>
                <span>Date of VAT Registration</span>
              </div>
              <div className="field-input-static" style={{ flexGrow: 1 }}>
                 <span style={{ marginLeft: '10px' }}>2015-09-12 00:00:00</span>
              </div>
            </div>
          </div>

          {/* TO */}
          <div className="address-block">
            <div className="field-row" style={{ marginBottom: '5px' }}>
              <div className="text-group">
                <span style={{ fontWeight: 'bold' }}>ለ</span>
                <span>To</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row" style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>አድራሻ፡ ከተማ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Address City/Town</span>
              </div>
              <input className="field-input" type="text" style={{width: '100px', flexGrow: 0}} />
              
              <div style={{ position: 'relative', marginLeft: '10px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>ዞን/ክ/ከተማ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Zone/ Sub-City</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row" style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ whiteSpace: 'nowrap' }}>ወረዳ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Woreda</span>
              </div>
              <input className="field-input" type="text" style={{width: '60px', flexGrow: 0}} />
              
              <div style={{ position: 'relative', marginLeft: '10px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>ቀበሌ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>Kebele</span>
              </div>
              <input className="field-input" type="text" style={{width: '60px', flexGrow: 0}} />

              <div style={{ position: 'relative', marginLeft: '10px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>የቤት.ቁ</span>
                <span style={{ position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap' }}>H.No.</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row" style={{marginTop: '22px'}}>
              <div className="text-group">
                <span>የገዢ የግብር ከፋይ መለያ ቁጥር</span>
                <span>Customer's TIN</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row">
              <div className="text-group">
                <span>የገዢ የተ.እ.ታ. ቁጥር /ካለው/</span>
                <span>Customer's VAT Reg. No.</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row">
              <div className="text-group">
                <span>ለተ.እ.ታ. የተመዘገበበት ቀን</span>
                <span>Date of VAT Registration</span>
              </div>
              <input className="field-input" type="text" />
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
                <td>{calculateTotal(item.qty, item.unitPrice) > 0 ? calculateTotal(item.qty, item.unitPrice).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ width: '40%' }}></div>
              <div style={{ width: '40%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold' }}>ሰርቪስ ቻርጅ ሐሳ/</span>
                <span>Service Charge</span>
              </div>
              <div style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                 <input type="number" style={{ width: '100%', height: '100%', textAlign: 'center' }} value={serviceCharge} onChange={e => setServiceCharge(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ width: '40%' }}></div>
              <div style={{ width: '40%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold' }}>ድምር</span>
                <span>Total</span>
              </div>
              <div style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalWithService > 0 && totalWithService.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ width: '40%' }}></div>
              <div style={{ width: '40%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ.  15%/</span>
                <span>VAT</span>
              </div>
              <div style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vat > 0 && vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '40px' }}>
              <div style={{ width: '40%' }}></div>
              <div style={{ width: '40%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ. ጨምሮ ጠቅላላ ዋጋ</span>
                <span style={{ whiteSpace: 'nowrap' }}>Total Selling Price Including VAT</span>
              </div>
              <div style={{ width: '20%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {grandTotal > 0 && grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="footer-section">
          <div className="word-birr-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px', whiteSpace: 'nowrap' }}>
              <span style={{fontWeight: 'bold'}}>በፊደል ብር/</span>
              <span style={{marginLeft: '4px'}}>In Word Birr</span>
            </div>
            <div className="word-birr-box" style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', flexGrow: 1 }}>
              {getWordBirr()}
            </div>
          </div>

          <div className="payment-row">
            <div className="text-group">
              <span style={{fontWeight: 'bold'}}>የክፍያ ሁኔታ/</span>
              <span>Mode of Payment</span>
            </div>
            
            <div className="checkbox-group">
              <div className="text-group">
                <span style={{fontWeight: 'bold'}}>በጥሬ ገንዘብ/</span>
                <span>Cash</span>
              </div>
              <div className="check-box"></div>
            </div>

            <div className="checkbox-group">
              <div className="text-group">
                <span style={{fontWeight: 'bold'}}>በቼክ/</span>
                <span>Check</span>
              </div>
              <div className="check-box"></div>
            </div>

            <div className="field-row" style={{ flexGrow: 1, marginLeft: '20px' }}>
              <div className="text-group">
                <span style={{fontWeight: 'bold'}}>የቼክ ቁጥር/</span>
                <span>Check No.</span>
              </div>
              <input className="field-input" type="text" />
            </div>
          </div>

          <div className="signature-row">
            <div className="field-row" style={{ width: '40%' }}>
              <div className="text-group">
                <span style={{fontWeight: 'bold'}}>ቫውቸር ቁጥር</span>
                <span>Voucher No.</span>
              </div>
              <input className="field-input" type="text" />
            </div>

            <div className="field-row" style={{ width: '50%' }}>
              <div className="text-group">
                <span style={{fontWeight: 'bold'}}>የተቀባይ ስምና ፊርማ</span>
                <span>Receiver Name & Signature</span>
              </div>
              <input className="field-input" type="text" />
            </div>
          </div>

          <div className="distribution-row">
            <div className="dist-texts">
              <div style={{fontWeight: 'bold'}}>
                <span>ክፍፍል:-</span>
                <span>ዋናው</span>
                <span>ለከፋይ</span>
                <span>1ኛ ኮፒ ለሂሳብ ክፍል</span>
                <span>2ኛ ኮፒ ለፓድ</span>
              </div>
              <div>
                <span>Distribution:-</span>
                <span>Original (Customer)</span>
                <span>1st Copy (Account)</span>
                <span>2nd Copy (Pad)</span>
              </div>
            </div>

            <div className="auth-sig">
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceForm;
