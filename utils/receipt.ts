// Receipt generation utility

interface ReceiptData {
  transactionId: string;
  propertyName: string;
  propertyLocation: string;
  date: string;
  shares: number;
  pricePerShare: string;
  totalPaid: string;
  userEmail?: string;
  userName?: string;
}

export const downloadReceipt = (data: ReceiptData): void => {
  const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Receipt - ${data.transactionId}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1F2937;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0bda73;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 900;
      color: #0bda73;
      margin-bottom: 10px;
    }
    .receipt-title {
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0 10px;
    }
    .receipt-subtitle {
      color: #6B7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #111827;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #F3F4F6;
    }
    .info-label {
      color: #6B7280;
      font-weight: 500;
    }
    .info-value {
      font-weight: 600;
      color: #111827;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 20px 0;
      margin-top: 20px;
      border-top: 2px solid #0bda73;
      font-size: 20px;
      font-weight: 700;
    }
    .total-label {
      color: #111827;
    }
    .total-value {
      color: #0bda73;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 12px;
    }
    .verified-badge {
      display: inline-block;
      background: #D1FAE5;
      color: #065F46;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Vest</div>
    <div class="receipt-title">Investment Receipt</div>
    <div class="receipt-subtitle">Transaction ID: ${data.transactionId}</div>
  </div>

  <div class="section">
    <div class="section-title">Property Information</div>
    <div class="info-row">
      <span class="info-label">Property Name:</span>
      <span class="info-value">${data.propertyName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Location:</span>
      <span class="info-value">${data.propertyLocation}</span>
    </div>
    <div class="verified-badge">✓ Verified Property</div>
  </div>

  <div class="section">
    <div class="section-title">Transaction Details</div>
    <div class="info-row">
      <span class="info-label">Transaction ID:</span>
      <span class="info-value">${data.transactionId}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Date & Time:</span>
      <span class="info-value">${data.date}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Share Quantity:</span>
      <span class="info-value">${data.shares.toLocaleString()} Units</span>
    </div>
    <div class="info-row">
      <span class="info-label">Price per Share:</span>
      <span class="info-value">${data.pricePerShare}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Platform Fees:</span>
      <span class="info-value">0.00 ₮</span>
    </div>
  </div>

  ${data.userName || data.userEmail ? `
  <div class="section">
    <div class="section-title">Investor Information</div>
    ${data.userName ? `
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${data.userName}</span>
    </div>
    ` : ''}
    ${data.userEmail ? `
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${data.userEmail}</span>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="total-row">
    <span class="total-label">Total Paid:</span>
    <span class="total-value">${data.totalPaid}</span>
  </div>

  <div class="footer">
    <p>This is an official receipt for your investment transaction.</p>
    <p>Secure Transaction via Blockchain Ledger</p>
    <p>Vest - Fractional Real Estate Investment Platform</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  // Create a blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${data.transactionId}-${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
