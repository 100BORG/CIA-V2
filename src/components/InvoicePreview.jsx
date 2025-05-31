import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClassicTemplate, ModernTemplate, ProfessionalTemplate } from './InvoiceTemplates';

// Default logo if none is provided
const defaultLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAADnVJREFUeJzt3XmUVNWdwPHvrarqBpruhm6gWWQHEVkUF1RABXdFE43RmMk4ZuKWOaqZnGMmmSWOmZjEzWSMccx4YuISUYlKokRc0LiAsgiyC0KzyNJssrV013frnfnHvT391j093fXequrv55w6h+5X9d797V8b8c5j6+urg0rALpeLuro6ampqqK6upqqqiqqqKqqrq3G73bjdbmpqaoiNjSUqKgqXy0VsbCwA/f399Pb24vV66e3tpbu7m46ODrq7u+np6aG9vZ329nb8fj+dnZ10dXXR1dVFb29vyTKqqiQlJREdHU1UVBRVVVW43e7B/WpqaoiLixvMUWxsLJGRkbhcLlRVERERQUSERGlp8TzPWUjk5+fLbxHLRUZGkpGRQWZmJrm5uWRlZZGTk0N6ejrp6elkZGSQkZFh2Y+0qNDT00NbWxttbW0cP36c1tZWWlpaaGlpobm5mebmZlpaWjh69KgtkQkfUVw+++yz2z9f9bXY2FhSUlJITk4mOTmZtLQ00tPTycrKIi8vj7y8PPLz8x3xA7QPJJ6n9vb3oq9dSUlJLFu2jGXLlrFw4UJmz55NRkZGKFILGLfbHZA/0d3d3dTX19PQ0EBtbS01NTV88cUXfPHFF7S1tQWkjaDV09MTcfDgwcr6+vro0tLSiBUrVrBo0SIWLlzIokWLyMnJCXV6jhQVFcWUKVOYMmWK7md9fX0cPnyYw4cPU1VVRWVlJfv376e7u9v+RANs1apVkYWFhZH79++P2LBhAzfeeCO5ubmhTitsRUVFMXv2bGbPns2dd94JQG9vL+Xl5ZSXl7N//36OHDkS4iyDRN3WFBUVqRs2bIjYtGmT+uqrr6q7d+9W29vbQ71ZG3YaGxvVsrIyde3aterChQvVyMhIFQj71yWXXKJu375dbWtrC/XmadioqqpSX3zxRfXqq69W3W73hfFP/fLLL1f37t0b6s3OsMnq1avVGTNmhHR75+bFx8er999/v1pRURHqzdCtI04dYSM8NDQ0qLt371Y3btyoZmVlhWQbp6enqzt27FD7+vpCvVkYNvH7/eqJEyfUFStWqNHR0SHZxitXrlS//PJL+/IW0TCs0NfXx549e9i9eze7d++mtrY2ZLksX76cp556iqysLFsKjUJosLKykg0bNrBnz56Q5ZGZmcnzzz/PrbfeGpzP//jjj4eQQcLI+fPneeedd9i5cyc7duygqakpZLm4XC5eeOEFbr31VqKiooKav9UvxXbJV155ZUZRUZHr0KFDmvKj4wSyXsS8FuPfnXEtxrWISFg619jYyKFDh/jggw/YtWsXZ86cCVke2dnZPP/889x+++1ER0cHNX+rl62qdnjxxRfjV61aFfH000/T3t5u2o/GSU+hJ5DFTQgRRE1NTezatYutW7eybdu2kB6azMvL4+WXXw76Ia4Q0SgtLY184okniI+PN+xH4+SmCJxAFjchRIh0d3dTVlbGe++9xwcffMCRI0dCcuUHYNasWbz++uvMnz8/qPmHdDqcICJiamtr2bp1Kx9++CEff/wx58+fD0kes2bN4tVXX2X+/Pmye0SIoFFVleHxaJGgbGpqYu/evZSWlrJ161ZqamqCnoeiKNx8880UFRWxcOHCoOYftkUYTiJEGKmrq2Pnzp1s376d7du309zcHPQcIiMjWbVqFSUlJcyaNSto+YuIiBBmampq2L59Ox999BHbt2+nvb096DnExMTw0EMP8cgjj5CeHpwBiiIiIiLS19fH/v372bZtG9u3b2ffvn34fL6g5xEfH88TTzzBypUri76aWw6jhHC0np4edu/ezbZt29iyZQuNjY1BzyEhIYFnn32We+65h5iYmIDmLSIiIiKKorBz505KS0vZsmULjY2NQT1TDZCcnMzzzz/PnXfe6crPzw9o/iIiIiICUFlZyZYtW9iyZQtlZWV0dXUFPYfp06dTUlLCsmXLApq3VG/DcHfJJZewcuVKVq5cSXd3N3v37mXz5s1s3ryZ6urqoOVRVVXF66+/zsyZM1mwYEHA8hURCZJgH/4Yl5CQwLJly9i0aRNNTU1s2bKFt99+m127dgUtB6/Xy9atW5kzZw7z5s0LSL4iIhG+nPIPFfCHbcJzn2kMf4yLiYnhuuuu4y9/+QsNDQ28//77vPHGG5SXlwftMtrq6mrmzJnD3Llzrc9UREQkbCQnJ3PHHXewfft2Ghoa2LRpE6+99hp79+5l4L7hQPJ4PMyYMYPJkydbnrcdR9H+b3NLzZ+/gvvvvz/UaQTV2bNnKSsrY8uWLWzcuDGohfU333yTRx99lMTEREvzFRFxCLs3y6qqKjZv3syf//xntm7dyr333suaNWuYN29ewK8ASkhIYNq0aZSWllqbsYhImLNbqJw+fZpt27axceNG3n//6JKW9c5d2XI1S0xsLHFxcfh8PiqrUAH/ADE+PCO/FL+XIN2JcnLiYm1Hty7F+me9Hj+H2TR5jL6uRuPMDVedPIW+XL7y8vKI/Px8qqurVYbXl3G/mt8p1vWjrjP1W8ewr41+p75SB//3ue1NLmGGf894XRrN3xRjH6q+/4GfCroP0t1ZWXzrvvuIjIryvTsSiMhsXqGcv8jJc0CFsoAiFMJ1G6uq+jGwBYgAEoGXVNWXNXm8UlVVxezZs6mvr/8qgJhgJ2k3J+/AnJSbk4gbe1y26q23eKm01Puf3/8+BfT3MkOFEf7NYHITYqgSGutkw7+TDJezRg5Gy1tRn6K/bPgXpH3d6MsdfW668pm/DwcPjx7Y4nXrXjv6PLV1XUbLqaOWtzK/ve2t8dbqrUd+vPvOO04BfwWw4X7QMRARkcX88pNSDGFhZV2HXQUYVrCzrsOOOg4767jGm09UdDRLS0rONdTXJ7/53HPfqqmtRe24GAsEUDGs59DezKLbT2NFHYfdOzmr6juM+nCs+Z3kZGZyy5o1FN10kxIVFaXcePvtd9y+du2WvwJ+3T2IEGE5LDJcL2F+z6G3Z9DuEffu3Ut3d3dBfn4+6sWLF9Pb2ztw7Ye410pE5KutdPQIk9GuO/I7RV9MTAzXFhWxavVq5hcUkJKSMvz7ZeVK3ElJHDt27MpNGzf+18aNG1/r7e3NkBERISJmDx48SGRkZMH8+fMZHh46tHcc4eBldVRUFAvmz2flypXMmzePSZMmab8x9D+5ubnk5uayZMmSOzs7O1M3btz42nvvvffturo6DshRsIjIsOLiYpYuXRqxc+dORvvr3/7G0WPHmDdvHnNmz2ba1KnDM4aRI3ymT81Wrlz5T3feeed/nD59+vK//OUvX/vLX/5i8PMFQkRsFBUVxezZs5k5cyZ+vx+fz8fACxcvXnT53wEGsrKyIrZv3z7w3lsbN27stfUCRxGRsbB1lK5eT2fU81lRZ2H1DIVjzc+qOguraxwGvP322xw/ftyuEp+Q3CFCROC4UbQxMTFMmzaNpUuXsmzZMryUUlScwo7ZBiOcnJuTcxMvvniRxK4JR4cPH6a8vJyqqio8Ho9d5QpSk25TPYgQEWa0/yhBuETG7XZTUlJCb2+v3WeRpQ5diDAjXhsXYT+/38+OHTvsLs8J2U46LXUREbcQUFVVZXcR6wZelOvQRURErNbX10dTU5PdxWyo1+vaJnUgQoTR1q1bd8XFxVFYWBj0nO68806OHTtm95GpiIjTKallZWVbCwsLucbG6Z/9fj979+7leONxnn7qaSe/wEqIMBcVFcVHH320Jykpie99//tELF0a+AyCRIgIYVMnpLbt3/+tLz//fLsqYtsWT0RkjHJzczl54oTdZYiICKd53pA9/fRP7S5ChM6UKVM4d+6c3WWIiAjbXXjhglKi76233ko6cMAuLs5h97BePQ5OX0REpKKi4qP58+dzw29+g+LgF0MEgRARRgJxCunkSZOw+Uowd1JSUvrpU6ey/3z3bl/OvHl8+NZbeBsbQ52XE4mIiAkx2RC+6qqr7C5CUHz1VXzJaekpUy5fuDDxm7fdtnXevHnZdXV1TJgwIdTpOYWIiIiIiI2MbvV5SIiAiU3t7ei9OystLnzZvnfo4AzudskkiIcOKQ4ewiIuHD6rpJERERERGRy2wURSkBPnftuaZcE2VgKgExVkOfgGkisJSgP/pE6tRFhBhkrOpT7L60yjRVVd+yvNc+efJko9fr9dlRgDAMs67iRBz2uU5KTmZ/WVnMAw88EJRlReRbCxe6Ozs7o5qbm4cLJtyp5/N2O4qkxpOUlOQNQT5OYfn3khwVpXg8npj8/HxXR0dHUPdZdhxii4iEAbO6y4DWnWdlZUWfOnXKVVpaGkPw96QC6HwipdIiIhfY+aC/oihY/UDQYUZGRkZERsYoT0Z0kL6+vqAf/ssgi3DjxLqRMbO6XiTobyMcuNorbCYJEhFiAveV4TTj+1h/+VkgnvslIO+RYqytXlZViIyBVW9cvc7uQUzW1agbaoTI9dcXRzQ2NkaXHygfa01GECjg9XrV8+fOtR88dCjX6/X22V2g0QUEZX/iuGfaiYiEI7v2JkE5chZCiP/VX/8f5YVFuQD+ONYAAAAASUVORK5CYII=";

const InvoicePreview = ({ invoiceData, formatDate, onClose }) => {
  // Add state for template selection
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  
  // Add state for loading indicator
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  
  // Normalize invoice data to ensure proper structure for rendering
  const [normalizedItems, setNormalizedItems] = useState([]);

  // Normalize the invoice items to ensure consistent structure
  useEffect(() => {
    if (invoiceData && invoiceData.items) {
      const normalized = invoiceData.items.map(item => {
        // If the item doesn't have a type property, assume it's a main service
        if (!item.type) {
          return {
            ...item,
            type: 'main',
            // Convert nestedRows to subServices if needed
            subServices: item.subServices || item.nestedRows || []
          };
        }
        // If it already has a type, just ensure subServices exists
        return {
          ...item,
          subServices: item.subServices || []
        };
      });
      setNormalizedItems(normalized);
    }
  }, [invoiceData]);

  // Extract exchange rate from the invoiceData or use default
  const exchangeRate = invoiceData.exchangeRate || 82;

  // Add an effect to reduce the PDF container's padding before PDF generation
  const [pdfMode, setPdfMode] = useState(false);
  
  useEffect(() => {
    const container = document.querySelector('.a4-preview-container');
    if (container) {
      if (pdfMode) {
        // Apply reduced padding for PDF generation (reduced from 10mm to 5mm)
        container.style.padding = '5mm';
      } else {
        // Restore original padding for display
        container.style.padding = '20mm';
      }
    }
    
    return () => {
      // Restore original padding when component unmounts
      if (container && pdfMode) {
        container.style.padding = '20mm';
      }
    };
  }, [pdfMode]);
  
  // Generate PDF in single-page compact format
  const downloadPDF = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating PDF...');
    
    try {
      // Set PDF mode to reduce padding before generating
      setPdfMode(true);
      
      // Give time for the padding change to take effect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const previewElement = document.getElementById('invoicePreviewContent');
      
      if (!previewElement) {
        throw new Error('Preview element not found');
      }
      
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Scale the content to fit on one page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Use template name in filename
      pdf.save(`Invoice_${invoiceData.invoiceNumber}_${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}.pdf`);
      setGenerationStatus('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGenerationStatus('Failed to generate PDF. Please try again.');
    } finally {
      // Reset to display mode
      setPdfMode(false);
      setIsGenerating(false);
    }
  };

  // Render the selected template
  const renderTemplate = () => {
    const templateProps = {
      invoiceData,
      normalizedItems, 
      formatDate,
      defaultLogo,
      exchangeRate
    };

    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'professional':
        return <ProfessionalTemplate {...templateProps} />;
      case 'classic':
      default:
        return <ClassicTemplate {...templateProps} />;
    }
  };

  // Template selection component
  const TemplateSelector = () => {
    return (
      <div className="template-selector" style={{ marginBottom: '20px' }}>
        <h3>Choose Template Style</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {/* Classic Template Option */}
          <div 
            className={`template-option ${selectedTemplate === 'classic' ? 'selected' : ''}`} 
            style={{ 
              border: selectedTemplate === 'classic' ? '2px solid #4CAF50' : '1px solid #ccc', 
              borderRadius: '5px', 
              padding: '10px', 
              cursor: 'pointer',
              width: '110px',
              backgroundColor: selectedTemplate === 'classic' ? '#f9fff9' : '#fff'
            }}
            onClick={() => setSelectedTemplate('classic')}
          >
            <div style={{ 
              width: '90px', 
              height: '120px', 
              backgroundColor: '#fff', 
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              padding: '5px',
              marginBottom: '8px'
            }}>
              <div style={{ height: '10px', backgroundColor: '#f5f5f5', marginBottom: '5px' }}></div>
              <div style={{ height: '5px', backgroundColor: '#f5f5f5', width: '70%', marginBottom: '10px' }}></div>
              <div style={{ height: '60px', backgroundColor: '#f5f5f5', marginBottom: '5px' }}></div>
              <div style={{ height: '5px', backgroundColor: '#f5f5f5', width: '30%', alignSelf: 'flex-end' }}></div>
            </div>
            <p style={{ textAlign: 'center', margin: '5px 0', fontWeight: selectedTemplate === 'classic' ? 'bold' : 'normal' }}>Classic</p>
          </div>

          {/* Modern Template Option */}
          <div 
            className={`template-option ${selectedTemplate === 'modern' ? 'selected' : ''}`} 
            style={{ 
              border: selectedTemplate === 'modern' ? '2px solid #2196F3' : '1px solid #ccc', 
              borderRadius: '5px', 
              padding: '10px', 
              cursor: 'pointer',
              width: '110px',
              backgroundColor: selectedTemplate === 'modern' ? '#f0f8ff' : '#fff'
            }}
            onClick={() => setSelectedTemplate('modern')}
          >
            <div style={{ 
              width: '90px', 
              height: '120px', 
              backgroundColor: '#fff', 
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              padding: '5px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ height: '10px', backgroundColor: '#2196F3', width: '20px' }}></div>
                <div style={{ height: '10px', backgroundColor: '#2196F3', width: '40px' }}></div>
              </div>
              <div style={{ height: '15px', backgroundColor: '#f0f8ff', marginBottom: '5px' }}></div>
              <div style={{ height: '40px', backgroundColor: '#f0f8ff', marginBottom: '8px' }}></div>
              <div style={{ height: '15px', backgroundColor: '#2196F3', marginTop: 'auto' }}></div>
            </div>
            <p style={{ textAlign: 'center', margin: '5px 0', fontWeight: selectedTemplate === 'modern' ? 'bold' : 'normal' }}>Modern</p>
          </div>

          {/* Professional Template Option */}
          <div 
            className={`template-option ${selectedTemplate === 'professional' ? 'selected' : ''}`} 
            style={{ 
              border: selectedTemplate === 'professional' ? '2px solid #2c3e50' : '1px solid #ccc', 
              borderRadius: '5px', 
              padding: '10px', 
              cursor: 'pointer',
              width: '110px',
              backgroundColor: selectedTemplate === 'professional' ? '#f5f8fa' : '#fff'
            }}
            onClick={() => setSelectedTemplate('professional')}
          >
            <div style={{ 
              width: '90px', 
              height: '120px', 
              backgroundColor: '#fff', 
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              padding: '5px',
              marginBottom: '8px'
            }}>
              <div style={{ height: '15px', backgroundColor: '#2c3e50', marginBottom: '10px' }}></div>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                <div style={{ height: '5px', backgroundColor: '#2c3e50', width: '40%' }}></div>
                <div style={{ height: '5px', backgroundColor: '#2c3e50', width: '40%' }}></div>
              </div>
              <div style={{ height: '40px', backgroundColor: '#f5f8fa', marginBottom: '10px' }}></div>
              <div style={{ height: '15px', backgroundColor: '#2c3e50', marginTop: 'auto' }}></div>
            </div>
            <p style={{ textAlign: 'center', margin: '5px 0', fontWeight: selectedTemplate === 'professional' ? 'bold' : 'normal' }}>Professional</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="invoice-preview">
      {/* Template selection and action buttons */}
      <div className="actions" style={{ marginBottom: '20px' }}>
        <TemplateSelector />
        
        <div className="pdf-options" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
            <button 
              className="btn" 
              onClick={downloadPDF}
              disabled={isGenerating}
              style={{ 
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download PDF
            </button>
          </div>
          {isGenerating && (
            <div className="spinner-container" style={{ marginTop: '10px' }}>
              <div className="spinner" style={{ 
                display: 'inline-block', 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                border: '2px solid #ccc', 
                borderTopColor: '#333', 
                animation: 'spin 1s linear infinite' 
              }}></div>
              <span style={{ marginLeft: '10px' }}>{generationStatus}</span>
            </div>
          )}
          {!isGenerating && generationStatus && (
            <div style={{ marginTop: '10px' }}>
              <p>{generationStatus}</p>
            </div>
          )}
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={onClose}
          style={{ 
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Invoice
        </button>
      </div>
      
      {/* A4 Size Content for PDF Generation */}
      <div id="invoicePreviewContent" className="a4-preview-container">
        {/* Render the selected template */}
        {renderTemplate()}
      </div>
      
      {/* Add keyframes animation for spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default InvoicePreview;
