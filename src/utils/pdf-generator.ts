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

    // Define colors matching AST brand
    const colors = {
      primary: [220, 38, 38] as [number, number, number], // Red matching AST
      secondary: [31, 41, 55] as [number, number, number], // Dark gray
      danger: [239, 68, 68] as [number, number, number], // Red
      success: [34, 197, 94] as [number, number, number], // Green
      warning: [251, 146, 60] as [number, number, number], // Orange
      light: [249, 250, 251] as [number, number, number], // Light gray
      background: [248, 248, 248] as [number, number, number], // Background gray
      text: [55, 65, 81] as [number, number, number], // Text gray
    };

    const { nexusStates, totalLiability, priorityStates, dataRange, salesByState } = data;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        addPageHeader(pdf, margin, colors);
        return true;
      }
      return false;
    };

    // Add AST-style header
    const addPageHeader = (pdf: jsPDF, margin: number, colors: any) => {
      // Company name in red
      pdf.setFontSize(24);
      pdf.setTextColor(...colors.primary);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AST', margin, 15);
      
      // Tagline
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'normal');
      pdf.text('SALES & USE TAX SPECIALISTS', margin, 20);
    };

    // Add header to first page
    addPageHeader(pdf, margin, colors);

    // Prepared for info (top right)
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.text(`Prepared for: [Client Name]`, pageWidth - margin - 50, 15);
    pdf.text(`Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin - 50, 20);
    pdf.text(`Prepared by: AST Advisory Services`, pageWidth - margin - 50, 25);

    yPosition = 35;

    // Main title
    pdf.setFontSize(20);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sales & Use Tax Nexus Analysis', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive Multi-State Compliance Assessment', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.text(`Analysis Period: ${formatDateRange(dataRange.start)} - ${formatDateRange(dataRange.end)}`, margin, yPosition);
    yPosition += 15;

    // Key metrics boxes (AST style)
    const boxWidth = (pageWidth - 2 * margin - 15) / 4;
    const boxHeight = 30;
    const boxSpacing = 5;

    // Draw metric boxes
    const metrics = [
      { value: `$${totalLiability.toLocaleString()}`, label: 'ESTIMATED LIABILITY', color: colors.primary },
      { value: nexusStates.length.toString(), label: 'STATES WITH NEXUS', color: colors.secondary },
      { value: nexusStates.filter(s => {
        const days = Math.ceil((new Date(s.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days <= 30;
      }).length.toString(), label: 'OVERDUE REGISTRATIONS', color: colors.primary },
      { value: `${Math.max(...salesByState.map(s => Math.ceil((new Date(dataRange.end).getTime() - new Date(dataRange.start).getTime()) / (1000 * 60 * 60 * 24))))}`, label: 'MAX DAYS OVERDUE', color: colors.secondary }
    ];

    metrics.forEach((metric, index) => {
      const x = margin + (boxWidth + boxSpacing) * index;
      
      // Box background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, yPosition, boxWidth, boxHeight, 'F');
      
      // Box border (subtle)
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.rect(x, yPosition, boxWidth, boxHeight, 'S');
      
      // Value
      pdf.setFontSize(20);
      pdf.setTextColor(...metric.color);
      pdf.setFont('helvetica', 'bold');
      const valueWidth = pdf.getTextWidth(metric.value);
      pdf.text(metric.value, x + (boxWidth - valueWidth) / 2, yPosition + 15);
      
      // Label
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'normal');
      const labelWidth = pdf.getTextWidth(metric.label);
      pdf.text(metric.label, x + (boxWidth - labelWidth) / 2, yPosition + 22);
    });

    yPosition += boxHeight + 15;

    // Priority State Analysis section
    if (nexusStates.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(...colors.secondary);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Priority State Analysis', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'normal');
      pdf.text('All registrations overdue • Immediate action required', margin, yPosition);
      yPosition += 10;

      // Priority states table with enhanced styling
      autoTable(pdf, {
        startY: yPosition,
        head: [['STATE', 'NEXUS ESTABLISHED', 'REGISTRATION DUE', 'DAYS OVERDUE', 'REVENUE SUBJECT', 'TAX RATE', 'STATUS', 'EST. LIABILITY']],
        body: priorityStates.slice(0, 5).map(state => {
          const daysUntilDeadline = Math.ceil(
            (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysOverdue = Math.max(0, -daysUntilDeadline);

          return [
            state.name,
            formatDate(state.nexusDate),
            formatDate(state.registrationDeadline),
            daysOverdue > 0 ? daysOverdue.toString() : '-',
            `$${state.totalRevenue.toLocaleString()}`,
            `${state.taxRate}%`,
            '● Critical',
            `$${state.liability.toLocaleString()}`
          ];
        }),
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: colors.text,
          fontSize: 8,
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [230, 230, 230],
          cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.secondary,
          lineWidth: 0.1,
          lineColor: [230, 230, 230],
          cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { left: margin, right: margin },
        theme: 'plain',
        didParseCell: (data) => {
          // Style the status column
          if (data.column.index === 6 && data.section === 'body') {
            data.cell.styles.textColor = colors.primary;
            data.cell.styles.fontStyle = 'bold';
          }
          // Style the liability column
          if (data.column.index === 7 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // Estimated Tax Liability by State visualization
    checkNewPage(80);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Estimated Tax Liability by State', margin, yPosition);
    yPosition += 10;

    // Create bar chart visualization
    if (nexusStates.length > 0) {
      const chartHeight = 40;
      const chartWidth = pageWidth - 2 * margin;
      const barWidth = chartWidth / 5;
      const maxLiability = Math.max(...priorityStates.slice(0, 5).map(s => s.liability));

      priorityStates.slice(0, 5).forEach((state, index) => {
        const barHeight = (state.liability / maxLiability) * chartHeight;
        const x = margin + (barWidth * index);
        const y = yPosition + chartHeight - barHeight;

        // Draw bar
        pdf.setFillColor(...colors.primary);
        pdf.rect(x + 10, y, barWidth - 20, barHeight, 'F');

        // State label
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.text);
        pdf.text(state.name, x + barWidth / 2, yPosition + chartHeight + 5, { align: 'center' });

        // Value label
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.secondary);
        pdf.text(`$${(state.liability / 1000).toFixed(0)}k`, x + barWidth / 2, y - 2, { align: 'center' });
      });

      yPosition += chartHeight + 20;
    }

    // Compliance Recommendations section
    checkNewPage(100);
    
    // Box with recommendations
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 80, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 80, 'S');

    pdf.setFontSize(12);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Compliance Recommendations', margin + 5, yPosition + 8);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Prioritized action plan', margin + pageWidth - 2 * margin - 50, yPosition + 8);

    yPosition += 15;

    const recommendations = nexusStates.length > 0 ? [
      { title: 'IMMEDIATE ACTIONS (0-30 DAYS)', items: [
        'Initiate voluntary disclosure agreements across all five states',
        'Engage AST\'s nexus tax counsel network for penalty mitigation',
        'Implement immediate compliance hold on non-registered state sales'
      ]},
      { title: 'LONG-TERM COMPLIANCE (30-90 DAYS)', items: [
        'Implement AST\'s best-of-breed tax automation platform',
        'Establish systematic revenue monitoring across all jurisdictions',
        'Deploy AST\'s comprehensive compliance calendar system',
        'Activate post-Wayfair nexus threshold monitoring'
      ]}
    ] : [
      { title: 'PROACTIVE MONITORING', items: [
        'Continue tracking sales by state on monthly basis',
        'Set up alerts for states approaching 75% of thresholds',
        'Review nexus thresholds quarterly for changes',
        'Prepare tax collection systems for future nexus'
      ]}
    ];

    let recY = yPosition;
    recommendations.forEach((section, sectionIndex) => {
      // Section title
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.primary);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, margin + 10, recY);
      recY += 6;

      // Items
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'normal');
      section.items.forEach(item => {
        const lines = pdf.splitTextToSize(item, pageWidth - 2 * margin - 25);
        lines.forEach(line => {
          pdf.text(line, margin + 15, recY);
          recY += 4;
        });
      });
      
      if (sectionIndex < recommendations.length - 1) {
        recY += 2;
      }
    });

    // Financial Impact Analysis section
    pdf.addPage();
    yPosition = margin;
    addPageHeader(pdf, margin, colors);
    yPosition = 35;

    pdf.setFontSize(14);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Impact Analysis', margin, yPosition);
    yPosition += 10;

    // Financial ranges boxes
    const finBoxWidth = (pageWidth - 2 * margin - 10) / 2;
    const finBoxHeight = 35;

    // Estimated back taxes box
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, finBoxWidth, finBoxHeight, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, finBoxWidth, finBoxHeight, 'S');

    pdf.setFontSize(18);
    pdf.setTextColor(...colors.primary);
    pdf.setFont('helvetica', 'bold');
    const backTaxMin = Math.round(totalLiability * 0.8);
    const backTaxMax = Math.round(totalLiability * 1.2);
    pdf.text(`$${backTaxMin.toLocaleString()} - $${backTaxMax.toLocaleString()}`, margin + 5, yPosition + 15);

    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.text('ESTIMATED BACK TAX LIABILITY', margin + 5, yPosition + 25);
    pdf.text('(INCLUDES INTEREST & PENALTIES)', margin + 5, yPosition + 30);

    // Registration costs box
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin + finBoxWidth + 10, yPosition, finBoxWidth, finBoxHeight, 'F');
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.rect(margin + finBoxWidth + 10, yPosition, finBoxWidth, finBoxHeight, 'S');

    pdf.setFontSize(18);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'bold');
    const regMin = nexusStates.length * 2000;
    const regMax = nexusStates.length * 3000;
    pdf.text(`$${regMin.toLocaleString()} - $${regMax.toLocaleString()}`, margin + finBoxWidth + 15, yPosition + 15);

    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.text('COMPLIANCE IMPLEMENTATION COSTS', margin + finBoxWidth + 15, yPosition + 25);
    pdf.text('(REGISTRATION, SOFTWARE, FILING)', margin + finBoxWidth + 15, yPosition + 30);

    // Footer disclaimer
    yPosition = pageHeight - 35;
    
    pdf.setFillColor(...colors.background);
    pdf.rect(0, yPosition - 5, pageWidth, 40, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Important Disclaimer', margin, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const disclaimerText = 'This report provides estimates for informational purposes only and does not constitute legal or tax advice. State tax laws and regulations are subject to frequent changes. Professional consultation is strongly recommended before making any compliance decisions. AST Advisory Services assumes no liability for actions taken based on this analysis.';
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, pageWidth - 2 * margin);
    disclaimerLines.forEach((line, index) => {
      pdf.text(line, margin, yPosition + 5 + (index * 3.5));
    });

    // Page numbering
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `AST_SALT_Nexus_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Helper functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateRange = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};