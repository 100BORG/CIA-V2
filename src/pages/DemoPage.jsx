import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DemoPage = () => {
  const [libraryStatus, setLibraryStatus] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkLibraries();
  }, []);

  const checkLibraries = () => {
    let html = '<h3>Library Status:</h3>';
    
    // Check jsPDF
    if (typeof jsPDF !== 'undefined') {
      html += '<p style="color: green">✓ jsPDF is available</p>';
    } else {
      html += '<p style="color: red">✗ jsPDF is not loaded</p>';
    }
    
    // Check html2canvas
    if (typeof html2canvas !== 'undefined') {
      html += '<p style="color: green">✓ html2canvas is available</p>';
    } else {
      html += '<p style="color: red">✗ html2canvas is not loaded</p>';
    }
    
    setLibraryStatus(html);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating PDF...');
    
    try {
      // Create sample content to capture
      const demoContent = document.getElementById('demoContent');
      
      // Generate PDF
      const canvas = await html2canvas(demoContent, {
        scale: 2,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save('demo.pdf');
      
      setGenerationStatus('PDF successfully generated and downloaded!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGenerationStatus(`Error generating PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="demo-container">
      <h1 className="demo-title">PDF Generation Demo</h1>
      <p>This page demonstrates the PDF generation capabilities of the invoice application.</p>
      
      <div className="card-nav">
        <Link to="/" className="btn btn-secondary">Go to Main App</Link>
        <Link to="/login" className="btn btn-secondary">Go to Login</Link>
        <Link to="/debug" className="btn btn-secondary">Go to Debug</Link>
        <Link to="/diagnostic" className="btn btn-secondary">Go to Diagnostics</Link>
      </div>
      
      <div className="card">
        <h2 className="card-title">Library Check</h2>
        <div dangerouslySetInnerHTML={{ __html: libraryStatus }}></div>
      </div>
      
      <div className="card">
        <h2 className="card-title">Demo Content</h2>
        <div id="demoContent" style={{ padding: '20px', border: '1px solid #ddd', backgroundColor: 'white', color: 'black' }}>
          <h1 style={{ color: '#e07fa9', textAlign: 'center' }}>Sample Invoice</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3>From:</h3>
              <p>Sama Tributa Solutions</p>
              <p>123 Company Street</p>
              <p>Business District, BZ 12345</p>
              <p>GSTIN: 12ABCDE3456F7Z8</p>
            </div>
            <div>
              <h3>To:</h3>
              <p>Demo Client</p>
              <p>456 Client Avenue</p>
              <p>Client City, CL 54321</p>
              <p>Email: client@example.com</p>
            </div>
          </div>
          
          <div>
            <h3>Invoice Details:</h3>
            <p>Invoice #: DEMO-2025-001</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f3f3' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Item</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Amount (USD)</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Service 1</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Professional consulting services</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>$1,000.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>₹82,000.00</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Service 2</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Technical implementation</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>$500.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>₹41,000.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd' }}><strong>Subtotal:</strong></td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>$1,500.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>₹123,000.00</td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd' }}><strong>Tax (5%):</strong></td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>$75.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>₹6,150.00</td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd' }}><strong>Total:</strong></td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>$1,575.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>₹129,150.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
            <h3>Payment Details:</h3>
            <p>Account Name: Sama Tributa Solutions</p>
            <p>Bank Name: Demo International Bank</p>
            <p>Account Number: 1234567890</p>
            <p>IFSC Code: DEMO1234567</p>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="card-title">PDF Generation</h2>
        <button 
          className="btn" 
          onClick={generatePDF} 
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </button>
        <div style={{ marginTop: '15px' }}>
          <p>{generationStatus}</p>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;