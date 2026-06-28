import { CalculationResult } from '../types';

/**
 * Export calculation results to PDF via print window
 * @param results - Array of calculation results to export
 */
export function exportToPDF(results: CalculationResult[]): void {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Retirement Fund Comparison</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Retirement Fund Comparison Report</h1>
        <table>
          <thead>
            <tr>
              <th>City</th>
              <th>Country</th>
              <th>Required Fund</th>
              <th>Monthly Need</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${r.city.name}</td>
                <td>${r.city.country}</td>
                <td>$${r.requiredFund.toLocaleString()}</td>
                <td>$${r.totalMonthlyNeed.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>Total cities compared:</strong> ${results.length}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

/**
 * Export calculation results to JSON file
 * @param results - Array of calculation results to export
 */
export function exportToJSON(results: CalculationResult[]): void {
  const dataStr = JSON.stringify(results, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `retirement-fund-comparison-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}