/**
 * PDF Export Utilities
 * Provides functions to export components and data to PDF format
 */

/**
 * Export a DOM element as PDF using html2canvas
 * @param elementId - ID of the element to export
 * @param filename - Name of the PDF file to download
 */
export async function exportElementToPDF(
  elementId: string,
  filename: string = 'export.pdf'
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const { default: html2canvas } = await import('html2canvas');
    
    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#1a1a2e',
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

/**
 * Export gradebook data as PDF using a formatted table
 * @param studentName - Name of the student
 * @param grades - Array of grade entries
 * @param stats - Statistics object
 * @param filename - Name of the PDF file
 */
export async function exportGradebookToPDF(
  studentName: string,
  grades: any[],
  stats: any,
  filename: string = 'gradebook.pdf'
): Promise<void> {
  try {
    const { default: html2canvas } = await import('html2canvas');

    // Create HTML content for the gradebook
    const html = `
      <div style="padding: 20px; font-family: Arial, sans-serif; background: white; color: black;">
        <h1>Student Gradebook</h1>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Statistics</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Overall GPA:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${stats?.overallGPA?.toFixed(2) || 'N/A'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Completion Rate:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${stats?.completionRate?.toFixed(1) || 'N/A'}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Best Score:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${stats?.bestScore?.toFixed(1) || 'N/A'}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Assessments Taken:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${stats?.assessmentsTaken || 0}</td>
          </tr>
        </table>

        <h2>Grade Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Assessment</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Module</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Score</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Percentage</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Submitted</th>
            </tr>
          </thead>
          <tbody>
            ${grades
              .map(
                (grade: any) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${grade.assessmentTitle || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${grade.bahagiTitle || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${grade.pointsEarned}/${grade.totalPoints}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${grade.percentage.toFixed(1)}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(grade.submittedAt).toLocaleDateString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
      // Clean up
      document.body.removeChild(tempDiv);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting gradebook to PDF:', error);
    throw error;
  }
}

/**
 * Export data as CSV (alternative to PDF)
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file
 * @param headers - Optional custom headers
 */
export function exportToCSV(
  data: any[],
  filename: string = 'export.csv',
  headers?: string[]
): void {
  try {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...data.map((row) =>
        csvHeaders
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Print a DOM element
 * @param elementId - ID of the element to print
 * @param title - Title for the print document
 */
export function printElement(elementId: string, title: string = 'Document'): void {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  } catch (error) {
    console.error('Error printing element:', error);
    throw error;
  }
}
