import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProcessedData, NexusState } from '../types';

// Define custom type for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const generatePDF = async (data: ProcessedData): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Define colors
    const colors = {
      primary: [25, 118, 210] as [number, number, number], // Blue
      secondary: [66, 66, 66] as [number, number, number], // Dark gray
      danger: [220, 38, 38] as [number, number, number], // Red
      success: [16, 185, 129] as [number, number, number], // Green
      warning: [245, 158, 11] as [number, number, number], // Amber
      light: [249, 250, 251] as [number, number, number], // Light gray
    };

    const { nexusStates, totalLiability, priorityStates, dataRange, salesByState } = data;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Add company logo placeholder
    pdf.setFillColor(...colors.primary);
    pdf.rect(margin, yPosition, 10, 10, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('SALT', margin + 2, yPosition + 6);

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(...colors.secondary);
    pdf.text('SALT Nexus Analysis Report', margin + 15, yPosition + 7);

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, pageWidth - margin - 50, yPosition + 7);

    yPosition += 20;

    // Add a separator line
    pdf.setDrawColor(...colors.light);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Executive Summary Section
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.primary);
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 10;

    // Summary boxes
    const boxWidth = (pageWidth - 2 * margin - 10) / 2;
    const boxHeight = 25;

    // Total Liability Box
    pdf.setFillColor(...colors.light);
    pdf.roundedRect(margin, yPosition, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.secondary);
    pdf.text('Total Estimated Tax Liability', margin + 5, yPosition + 8);
    pdf.setFontSize(18);
    pdf.setTextColor(...colors.danger);
    pdf.text(`$${totalLiability.toLocaleString()}`, margin + 5, yPosition + 18);

    // Nexus States Box
    pdf.setFillColor(...colors.light);
    pdf.roundedRect(margin + boxWidth + 10, yPosition, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.secondary);
    pdf.text('States with Nexus Established', margin + boxWidth + 15, yPosition + 8);
    pdf.setFontSize(18);
    pdf.setTextColor(...colors.primary);
    pdf.text(`${nexusStates.length} States`, margin + boxWidth + 15, yPosition + 18);

    yPosition += boxHeight + 10;

    // Analysis Period
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.secondary);
    pdf.text(`Analysis Period: ${dataRange.start} to ${dataRange.end}`, margin, yPosition);
    yPosition += 10;

    // Key Findings
    if (nexusStates.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.secondary);
      pdf.text('Key Findings', margin, yPosition);
      yPosition += 7;

      const findings = [
        `Sales activities have triggered nexus obligations in ${nexusStates.length} states`,
        `Immediate registration required in ${nexusStates.filter(s => {
          const days = Math.ceil((new Date(s.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return days <= 30;
        }).length} states`,
        `Highest liability state: ${priorityStates[0]?.name || 'N/A'} ($${priorityStates[0]?.liability.toLocaleString() || '0'})`
      ];

      pdf.setFontSize(10);
      findings.forEach((finding, index) => {
        pdf.setTextColor(...colors.secondary);
        pdf.text(`• ${finding}`, margin + 5, yPosition + (index * 6));
      });
      yPosition += findings.length * 6 + 5;
    }

    // Priority States Table
    if (nexusStates.length > 0) {
      checkNewPage(60);
      yPosition += 10;

      pdf.setFontSize(16);
      pdf.setTextColor(...colors.primary);
      pdf.text('Priority States - Immediate Action Required', margin, yPosition);
      yPosition += 10;

      autoTable(pdf, {
        startY: yPosition,
        head: [['State', 'Nexus Date', 'Registration Deadline', 'Est. Tax Liability', 'Status']],
        body: priorityStates.slice(0, 5).map(state => {
          const daysUntilDeadline = Math.ceil(
            (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          const status = daysUntilDeadline <= 0 ? 'OVERDUE' : `${daysUntilDeadline} days`;

          return [
            state.name,
            new Date(state.nexusDate).toLocaleDateString(),
            new Date(state.registrationDeadline).toLocaleDateString(),
            `$${state.liability.toLocaleString()}`,
            status
          ];
        }),
        headStyles: {
          fillColor: colors.primary,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: colors.light
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          // Color code the status column
          if (data.column.index === 4 && data.cell.raw === 'OVERDUE') {
            data.cell.styles.textColor = colors.danger;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
    }

    // State-by-State Analysis
    checkNewPage(100);
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setTextColor(...colors.primary);
    pdf.text('State-by-State Analysis', margin, yPosition);
    yPosition += 10;

    // All states table
    const stateTableData = salesByState
      .sort((a, b) => b.thresholdProximity - a.thresholdProximity)
      .map(state => {
        const hasNexus = nexusStates.find(n => n.code === state.code);
        return [
          state.name,
          `$${state.totalRevenue.toLocaleString()}`,
          state.transactionCount.toLocaleString(),
          `${state.thresholdProximity}%`,
          hasNexus ? 'Nexus Established' : state.thresholdProximity >= 75 ? 'Monitor Closely' : 'Safe'
        ];
      });

    autoTable(pdf, {
      startY: yPosition,
      head: [['State', 'Total Revenue', 'Transactions', 'Threshold %', 'Status']],
      body: stateTableData,
      headStyles: {
        fillColor: colors.primary,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: colors.light
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.column.index === 4) {
          const status = data.cell.raw as string;
          if (status === 'Nexus Established') {
            data.cell.styles.textColor = colors.danger;
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Monitor Closely') {
            data.cell.styles.textColor = colors.warning;
          } else {
            data.cell.styles.textColor = colors.success;
          }
        }
      }
    });

    // Compliance Recommendations
    pdf.addPage();
    yPosition = margin;

    pdf.setFontSize(16);
    pdf.setTextColor(...colors.primary);
    pdf.text('Compliance Recommendations', margin, yPosition);
    yPosition += 10;

    const recommendations = nexusStates.length > 0 ? [
      {
        title: 'Immediate Actions Required',
        items: [
          'Register for sales tax permits in all states where nexus has been established',
          'Calculate exact tax liabilities from nexus establishment dates',
          'Set up tax collection systems for ongoing compliance',
          'Consider voluntary disclosure agreements for past liabilities'
        ]
      },
      {
        title: 'Ongoing Compliance',
        items: [
          'Implement automated tax calculation and collection systems',
          'Establish monthly sales tracking by state',
          'Create filing calendars for all nexus states',
          'Monitor states approaching nexus thresholds'
        ]
      }
    ] : [
      {
        title: 'Proactive Monitoring',
        items: [
          'Continue tracking sales by state on a monthly basis',
          'Set up alerts for states approaching 75% of thresholds',
          'Review nexus thresholds quarterly for any changes',
          'Prepare tax collection systems for future nexus'
        ]
      }
    ];

    recommendations.forEach(section => {
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.secondary);
      pdf.text(section.title, margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      section.items.forEach(item => {
        const lines = pdf.splitTextToSize(`• ${item}`, pageWidth - 2 * margin - 5);
        lines.forEach(line => {
          checkNewPage(10);
          pdf.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });
      yPosition += 5;
    });

    // Disclaimer
    checkNewPage(40);
    yPosition = pageHeight - 40;

    pdf.setFillColor(...colors.light);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Important Disclaimer', margin + 5, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const disclaimerText = 'This report provides estimates for informational purposes only. State tax laws change frequently. Professional tax advice is required before making compliance decisions. The user assumes all responsibility for compliance with applicable tax laws.';
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 10);
    disclaimerLines.forEach((line, index) => {
      pdf.text(line, margin + 5, yPosition + 5 + (index * 4));
    });

    // Footer on each page
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `SALT_Nexus_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};