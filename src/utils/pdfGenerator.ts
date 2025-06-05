import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ProcessedData } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePDF = async (data: ProcessedData): Promise<void> => {
  try {
    const pdf = new jsPDF();
    const { nexusStates, totalLiability, priorityStates, dataRange } = data;
    
    // Title
    pdf.setFontSize(20);
    pdf.text('SALT Nexus Analysis Report', 20, 20);
    
    // Date and Analysis Period
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    pdf.text(`Analysis Period: ${dataRange.start} to ${dataRange.end}`, 20, 40);

    // Executive Summary
    pdf.setFontSize(16);
    pdf.text('Executive Summary', 20, 60);
    
    pdf.setFontSize(12);
    const summary = [
      `Total States with Nexus: ${nexusStates.length}`,
      `Total Estimated Liability: $${totalLiability.toLocaleString()}`,
      `Priority States: ${priorityStates.length}`,
    ];
    
    summary.forEach((line, index) => {
      pdf.text(line, 30, 75 + (index * 10));
    });

    // Priority States Table
    if (nexusStates.length > 0) {
      pdf.text('Priority States Analysis', 20, 120);
      
      pdf.autoTable({
        startY: 130,
        head: [['State', 'Nexus Date', 'Registration Due', 'Est. Liability', 'Status']],
        body: priorityStates.map(state => {
          const daysUntilDeadline = Math.ceil(
            (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return [
            state.name,
            new Date(state.nexusDate).toLocaleDateString(),
            new Date(state.registrationDeadline).toLocaleDateString(),
            `$${state.liability.toLocaleString()}`,
            daysUntilDeadline <= 0 ? 'OVERDUE' : `${daysUntilDeadline} days`
          ];
        }),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    // State Analysis
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Detailed State Analysis', 20, 20);
    
    pdf.autoTable({
      startY: 30,
      head: [['State', 'Total Revenue', 'Nexus Date', 'Tax Rate', 'Est. Liability']],
      body: nexusStates.map(state => [
        state.name,
        `$${state.totalRevenue.toLocaleString()}`,
        new Date(state.nexusDate).toLocaleDateString(),
        `${state.taxRate}%`,
        `$${state.liability.toLocaleString()}`
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Recommendations
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Recommendations', 20, 20);
    
    pdf.setFontSize(12);
    const recommendations = [
      'Immediate Actions:',
      '• Register for sales tax permits in states with established nexus',
      '• Calculate exact tax liabilities from nexus dates',
      '• Set up tax collection systems',
      '',
      'Ongoing Compliance:',
      '• Monitor sales by state monthly',
      '• Track approaching thresholds',
      '• Maintain compliance calendar'
    ];
    
    recommendations.forEach((line, index) => {
      pdf.text(line, 20, 40 + (index * 10));
    });

    // Disclaimer
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    const disclaimer = 'This report is for informational purposes only. Consult with a qualified tax professional before making compliance decisions.';
    pdf.text(disclaimer, 20, pdf.internal.pageSize.height - 20);

    // Save the PDF
    const filename = `SALT_Nexus_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};