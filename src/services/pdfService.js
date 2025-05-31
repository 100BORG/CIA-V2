import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APP_CONFIG } from '../config/appConfig';

/**
 * PDF service for generating PDF documents
 */
const pdfService = {
  /**
   * Generate a PDF from an HTML element
   * @param {HTMLElement} element - The element to convert to PDF
   * @param {string} filename - The filename for the PDF
   * @returns {Promise<void>}
   */
  generatePDF: async (element, filename) => {
    try {
      const canvas = await html2canvas(element, {
        scale: APP_CONFIG.pdf.scale,
        useCORS: true,
        scrollY: 0,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', APP_CONFIG.pdf.quality);
      const pdf = new jsPDF({
        orientation: APP_CONFIG.pdf.orientation,
        unit: 'mm',
        format: APP_CONFIG.pdf.format
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },
  
  /**
   * Wait for an element to be available in the DOM
   * @param {string} elementId - ID of the element to wait for
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<HTMLElement>} - The found element
   */
  waitForElement: (elementId, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      // Track if we've already timed out to prevent continued checking
      let isTimedOut = false;
      
      const checkElement = () => {
        if (isTimedOut) return;
        
        const element = document.getElementById(elementId);
        if (element) {
          resolve(element);
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      // Start checking
      checkElement();
      
      // Add timeout to avoid infinite checking
      setTimeout(() => {
        isTimedOut = true;
        reject(new Error(`Element ${elementId} not found within ${timeout}ms`));
      }, timeout);
    });
  }
};

export default pdfService;