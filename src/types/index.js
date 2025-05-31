/**
 * @typedef {Object} InvoiceItem
 * @property {string} id - Unique identifier
 * @property {string} description - Item description
 * @property {number} amountUSD - Amount in USD
 * @property {number} amountINR - Amount in INR
 */

/**
 * @typedef {Object} InvoiceData
 * @property {string} id - Unique identifier for the invoice
 * @property {string} invoiceNumber - Invoice identifier (display purposes)
 * @property {string} invoiceDate - ISO format date
 * @property {number} taxRate - Tax percentage
 * @property {string} currency - Primary currency (USD or INR)
 * @property {string} logoUrl - Company logo URL or data URI
 * @property {string} senderName - Company name
 * @property {string} senderAddress - Company address
 * @property {string} senderGSTIN - Company GSTIN
 * @property {string} recipientName - Client name
 * @property {string} recipientEmail - Client email
 * @property {string} recipientAddress - Client address
 * @property {string} recipientPhone - Client phone
 * @property {string} recipientGSTIN - Client GSTIN
 * @property {string} recipientPAN - Client PAN
 * @property {string} notes - Payment details and notes
 * @property {InvoiceItem[]} items - List of invoice items
 * @property {number} subtotalUSD - Subtotal in USD
 * @property {number} subtotalINR - Subtotal in INR
 * @property {number} taxAmountUSD - Tax amount in USD
 * @property {number} taxAmountINR - Tax amount in INR
 * @property {number} totalUSD - Total amount in USD
 * @property {number} totalINR - Total amount in INR
 */

/**
 * @typedef {Object} User
 * @property {string} email - User email
 * @property {string} lastLogin - Last login datetime
 */

/**
 * Type exports
 * @type {InvoiceData}
 */
export const invoiceDataType = null;

/**
 * @type {InvoiceItem}
 */
export const invoiceItemType = null;

/**
 * @type {User}
 */
export const userType = null;