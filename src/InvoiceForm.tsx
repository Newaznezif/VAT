import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
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

  const exportWord = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Could not generate image blob");
      const arrayBuffer = await blob.arrayBuffer();
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 700, 
                    height: (canvas.height * 700) / canvas.width,
                  },
                }),
              ],
            }),
          ],
        }],
      });

      const docBlob = await Packer.toBlob(doc);
      saveAs(docBlob, "Invoice.docx");
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
            {items.map((item, index) => (
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
        <div style={{ display: 'flex' }}>
          <div style={{ flexGrow: 1 }}></div>
          
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ flexGrow: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>ሰርቪስ ቻርጅ ሐሳ/</span>
                <span>Service Charge</span>
              </div>
              <div style={{ width: '40%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                 <input type="number" style={{ width: '100%', height: '100%', textAlign: 'center' }} value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ flexGrow: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>ድምር</span>
                <span>Total</span>
              </div>
              <div style={{ width: '40%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalWithService > 0 && totalWithService.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '30px' }}>
              <div style={{ flexGrow: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ.  15%/</span>
                <span>VAT</span>
              </div>
              <div style={{ width: '40%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vat > 0 && vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '40px' }}>
              <div style={{ flexGrow: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>ተ.እ.ታ. ጨምሮ ጠቅላላ ዋጋ</span>
                <span style={{ whiteSpace: 'nowrap' }}>Total Selling Price Including VAT</span>
              </div>
              <div style={{ width: '40%', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {grandTotal > 0 && grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
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
