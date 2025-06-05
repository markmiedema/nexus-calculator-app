# SALT Nexus Calculator

A web application for analyzing State and Local Tax (SALT) nexus obligations based on sales data.

## 🚀 Features

- **CSV/Excel Upload**: Process sales data from CSV or Excel files
- **Multi-Year Analysis**: Analyze up to 4 years of sales data
- **Nexus Detection**: Automatically identify states where nexus thresholds are exceeded
- **Tax Liability Estimation**: Calculate estimated tax liabilities by state
- **Compliance Timeline**: View registration deadlines and filing requirements
- **Interactive Visualizations**: Charts showing revenue progression and liability distribution
- **PDF Report Generation**: Download comprehensive compliance reports

## 📋 Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/markmiedema/nexus-calculator-app.git
   cd nexus-calculator-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## 📊 Data Format Requirements

Your CSV/Excel file must include the following columns:

| Column | Type | Required | Format | Example |
|--------|------|----------|--------|---------|
| date | string | Yes | YYYY-MM-DD | 2024-01-15 |
| state | string | Yes | 2-letter code | CA |
| sale_amount | number | Yes | Decimal | 1500.00 |
| transaction_count | number | No | Integer | 1 |
| customer_address | string | No | Text | 123 Main St |

### Example CSV:
```csv
date,state,sale_amount,transaction_count
2024-01-15,CA,1500.00,1
2024-01-16,TX,2500.00,2
2024-01-17,NY,3000.00,1
```

## 🎯 Usage Guide

1. **Prepare Your Data**: Export your sales data in CSV or Excel format with the required columns
2. **Upload File**: Drag and drop your file or click "Browse Files" to upload
3. **Review Analysis**: Navigate through the tabs to view:
   - Executive Summary: Overview of nexus obligations
   - State Analysis: Detailed breakdown by state
   - Compliance Timeline: Registration deadlines
   - Recommendations: Next steps for compliance
4. **Download Report**: Click "Download PDF" to save a comprehensive report

## ⚡ Performance Tips

- For best performance, keep files under 10MB
- Files up to 50MB are supported but may take longer to process
- Consider splitting very large datasets by year

## 🔧 Configuration

Tax rates and nexus thresholds are based on 2024 regulations. The app includes:
- Economic nexus thresholds for all US states
- Estimated combined state and local tax rates
- Registration deadline calculations

## ⚠️ Important Disclaimers

- This tool provides **estimates only** and is for informational purposes
- State tax laws change frequently - verify current requirements
- Always consult with a qualified tax professional before making compliance decisions
- No data is stored or transmitted - all processing happens in your browser

## 🐛 Troubleshooting

### File Upload Issues
- Ensure your file is in CSV or Excel format
- Check that required columns are present
- Verify date format is YYYY-MM-DD

### Performance Issues
- Try reducing file size by filtering unnecessary data
- Close other browser tabs to free up memory
- Use Chrome or Firefox for best performance

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Styled with Tailwind CSS
- Charts powered by Recharts
- Icons from Lucide React