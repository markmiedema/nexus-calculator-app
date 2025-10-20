# Getting Started with Nexus Calculator (Hybrid Version)

Welcome! This guide will help you get started with the hybrid Nexus Calculator system, which provides both a web application and a command-line interface.

## Quick Start

### Option 1: Use the Web App (No Installation)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:5173
   ```

4. **Upload a CSV file** and view your nexus analysis!

### Option 2: Use the CLI (For Automation)

1. **Install Python dependencies:**
   ```bash
   cd cli
   poetry install
   ```

2. **Run the CLI:**
   ```bash
   poetry run nexus analyze your_sales.csv
   ```

3. **View the Excel report:**
   ```
   nexus_report.xlsx
   ```

---

## What's New: Hybrid Architecture

This version combines the **best of both** previous versions:

### From the Python Version ✨
- ✅ **YAML-based configuration** (easy to update rules)
- ✅ **Command-line interface** (batch processing, automation)
- ✅ **Excel export** with professional formatting
- ✅ **Pydantic validation** for config files

### From the React Version ✨
- ✅ **Modern web UI** with interactive dashboards
- ✅ **PDF export** for reports
- ✅ **Visual charts and maps** (Recharts)
- ✅ **Rolling 12-month calculation**
- ✅ **Web Workers** for performance
- ✅ **Comprehensive test coverage**

### New Features 🎉
- ✅ **Shared configuration** between web and CLI
- ✅ **Parity testing** ensures identical results
- ✅ **Single source of truth** for rules and rates
- ✅ **Choose the interface** that fits your workflow

---

## Directory Structure

```
nexus-calculator-app/
│
├── shared/                      # ⭐ NEW: Shared configuration
│   ├── config/
│   │   ├── state_rules.yaml    # Nexus thresholds (single source of truth)
│   │   └── tax_rates.yaml      # Tax rates with sources
│   ├── schemas/                 # JSON schemas for validation
│   └── tests/                   # Shared test cases
│
├── src/                         # React web application
│   └── utils/nexusEngine/      # TypeScript calculation engine
│
├── cli/                         # ⭐ NEW: Python CLI
│   ├── src/nexus_cli/          # Python calculation engine
│   └── tests/                   # Python tests
│
├── README.md                    # Web app documentation
├── HYBRID_ARCHITECTURE.md       # ⭐ NEW: Architecture overview
└── GETTING_STARTED.md          # This file
```

---

## Understanding the Hybrid System

### The Problem We Solved

Previously, you had **two separate codebases**:
- Python CLI with YAML config (maintainable but no UI)
- React web app with hardcoded rules (great UI but hard to update)

**Issue:** Rules could drift out of sync between versions.

### The Solution: Hybrid Architecture

Both interfaces now use the **same YAML configuration files**:

```
┌─────────────────────────────────────┐
│   shared/config/state_rules.yaml   │  ← Single source of truth
│   shared/config/tax_rates.yaml     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴──────┐
       │              │
┌──────▼──────┐  ┌───▼──────┐
│  Web App    │  │   CLI    │
│ (TypeScript)│  │ (Python) │
└─────────────┘  └──────────┘
```

**Result:** Update rules once, both interfaces automatically use new rules!

---

## When to Use Each Interface

### Use the Web App 🌐

**Best for:**
- ✅ Quick one-off analysis
- ✅ Client presentations (visual charts, PDF reports)
- ✅ Non-technical users
- ✅ Interactive exploration
- ✅ No installation required (just open in browser)

**Example workflow:**
```
1. Open web app in browser
2. Drag and drop CSV file
3. View interactive dashboard
4. Download PDF report for stakeholders
```

### Use the CLI 💻

**Best for:**
- ✅ Batch processing many files
- ✅ Automation and scripts
- ✅ CI/CD integration
- ✅ Monthly recurring analysis
- ✅ Very large datasets (faster with pandas)

**Example workflow:**
```bash
# Analyze all client files
for client in clients/*.csv; do
  nexus analyze "$client" --output "reports/$(basename $client .csv)_report.xlsx"
done
```

### Use Both! 🚀

**Common pattern:**
1. Use **CLI** for initial batch processing
2. Use **Web App** to create visual presentations
3. Both produce identical results!

---

## Configuration Files

### State Rules (`shared/config/state_rules.yaml`)

Defines economic nexus thresholds:

```yaml
states:
  CA:
    amount: 500000           # $500k revenue threshold
    transactions: null       # No transaction threshold
    effective_date: "2019-04-01"
    rule_id: "CA-2019-01"
    notes: "California has highest threshold"

  WA:
    amount: 100000           # $100k revenue OR
    transactions: 200        # 200 transactions
    effective_date: "2019-03-01"
    rule_id: "WA-2019-01"
    notes: "Either threshold triggers nexus"
```

### Tax Rates (`shared/config/tax_rates.yaml`)

Average combined state and local rates:

```yaml
rates:
  CA:
    state_rate: 7.25
    avg_local_rate: 1.43
    combined_rate: 8.68       # Used for liability calculations
    notes: "District taxes vary by locality"
```

### Updating Configuration

1. **Edit YAML file:**
   ```bash
   vim shared/config/state_rules.yaml
   ```

2. **Both interfaces automatically use new rules** (no rebuild needed)

3. **Commit changes with clear notes:**
   ```bash
   git add shared/config/state_rules.yaml
   git commit -m "Update CA threshold to $500k effective 2025-01-01"
   ```

---

## Testing

### Web App Tests

```bash
npm test
```

Runs tests for:
- Nexus engine (10+ test files)
- Components
- Integration tests

### CLI Tests

```bash
cd cli
poetry run pytest
```

Runs tests for:
- Config loading
- CSV parsing
- Nexus calculation
- **Parity tests** (ensures matches web app)

### Parity Tests ⭐ NEW

Shared test cases ensure both implementations produce **identical results**:

```bash
# TypeScript
npm run test:parity

# Python
cd cli && poetry run pytest tests/test_parity.py
```

Test cases are defined in `shared/tests/test_cases.yaml` and run against both engines.

---

## Example Workflows

### Workflow 1: Monthly Client Analysis

```bash
#!/bin/bash
# monthly_analysis.sh

for client in clients/*.csv; do
  echo "Analyzing $client..."

  # Run CLI analysis
  nexus analyze "$client" \
    --year 2024 \
    --output "reports/$(basename $client .csv)_report.xlsx"

  echo "Report generated: reports/$(basename $client .csv)_report.xlsx"
done

echo "All analyses complete!"
```

### Workflow 2: Visual Presentation

1. Upload CSV to web app
2. Toggle between years using year selector
3. View interactive charts showing revenue progression
4. Download PDF report with executive summary
5. Share PDF with stakeholders

### Workflow 3: Automated Monitoring

```yaml
# .github/workflows/quarterly_nexus.yml
name: Quarterly Nexus Analysis

on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every quarter

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Export sales data
        run: ./scripts/export_sales.sh

      - name: Analyze nexus
        run: |
          cd cli
          poetry run nexus analyze ../data/sales.csv \
            --output ../reports/nexus_report.xlsx

      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: nexus-report
          path: reports/nexus_report.xlsx

      - name: Notify if new nexus states
        run: ./scripts/notify_if_changes.sh
```

---

## Common Tasks

### View All State Rules

```bash
nexus states
```

Shows table with all states, thresholds, and effective dates.

### Check Specific State

```bash
nexus state-info CA
```

Shows detailed info for California including tax rate and notes.

### Analyze with Options

```bash
nexus analyze sales.csv \
  --output custom_report.xlsx \
  --year 2024 \
  --ignore-marketplace \
  --include-negatives
```

### View Configuration

```bash
nexus config-info
```

Shows loaded configuration versions and sources.

---

## Troubleshooting

### Web App Won't Start

```bash
# Install dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Start dev server
npm run dev
```

### CLI Not Found

```bash
# Install CLI
cd cli
poetry install

# Run with poetry
poetry run nexus --help

# Or activate shell
poetry shell
nexus --help
```

### Configuration Errors

```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('shared/config/state_rules.yaml'))"

# Check config info
nexus config-info
```

### Tests Failing

```bash
# Web app
npm test -- --run

# CLI
cd cli
poetry run pytest -v

# Specific test
poetry run pytest tests/test_parity.py -v
```

---

## What's Different from Previous Versions?

### Compared to Python-Only Version

**Improvements:**
- ✅ Added web interface for visual analysis
- ✅ More comprehensive test coverage
- ✅ Rolling 12-month calculation implemented
- ✅ PDF export capability
- ✅ Interactive charts and visualizations

**Kept:**
- ✅ YAML configuration (shared between both)
- ✅ CLI interface (improved)
- ✅ Excel export
- ✅ Pydantic validation

### Compared to React-Only Version

**Improvements:**
- ✅ Added CLI for batch processing
- ✅ Moved rules to YAML (easier to update)
- ✅ Added parity testing
- ✅ Better documentation
- ✅ Shared configuration ensures consistency

**Kept:**
- ✅ Modern web UI
- ✅ Interactive dashboard
- ✅ PDF export
- ✅ Web Workers for performance
- ✅ Comprehensive tests

---

## Next Steps

1. **Try the web app:**
   ```bash
   npm install && npm run dev
   ```

2. **Try the CLI:**
   ```bash
   cd cli && poetry install
   poetry run nexus states
   ```

3. **Read the architecture docs:**
   - [HYBRID_ARCHITECTURE.md](HYBRID_ARCHITECTURE.md) - Full architecture overview
   - [README.md](README.md) - Web app documentation
   - [cli/README.md](cli/README.md) - CLI documentation

4. **Explore the shared config:**
   - `shared/config/state_rules.yaml` - Nexus rules
   - `shared/config/tax_rates.yaml` - Tax rates

5. **Run the tests:**
   ```bash
   npm test                           # Web tests
   cd cli && poetry run pytest        # CLI tests
   ```

---

## Support & Contributing

### Questions?

- Check [HYBRID_ARCHITECTURE.md](HYBRID_ARCHITECTURE.md) for architecture details
- See [Troubleshooting](#troubleshooting) section above
- Review test files for examples

### Contributing

When contributing:

1. **Update YAML config** if changing rules or rates
2. **Update both implementations** if changing calculation logic
3. **Add test cases** to `shared/tests/test_cases.yaml`
4. **Run parity tests** to ensure consistency
5. **Update documentation** as needed

### Best Practices

- ✅ Keep YAML config as single source of truth
- ✅ Run tests before committing
- ✅ Document why rules changed (not just what)
- ✅ Use semantic versioning for config files
- ✅ Add source citations for tax rates

---

## Key Benefits of Hybrid Architecture

### 1. **Consistency** 🎯
Same rules, same results, everywhere. No configuration drift.

### 2. **Flexibility** 🔄
Choose the best interface for each task.

### 3. **Maintainability** 🛠️
Update rules once in YAML, both systems use new rules.

### 4. **Testability** ✅
Shared test cases ensure both implementations stay in sync.

### 5. **Scalability** 📈
Web app for interactive users, CLI for batch processing.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    Nexus Calculator                          │
│                   Quick Reference                            │
└─────────────────────────────────────────────────────────────┘

WEB APP
  Start:     npm run dev
  Test:      npm test
  Build:     npm run build
  URL:       http://localhost:5173

CLI
  Install:   cd cli && poetry install
  Analyze:   nexus analyze file.csv
  States:    nexus states
  Info:      nexus state-info CA
  Help:      nexus --help

CONFIGURATION
  Rules:     shared/config/state_rules.yaml
  Rates:     shared/config/tax_rates.yaml
  Tests:     shared/tests/test_cases.yaml

TESTS
  Web:       npm test
  CLI:       cd cli && poetry run pytest
  Parity:    npm run test:parity

DOCUMENTATION
  Web:       README.md
  CLI:       cli/README.md
  Hybrid:    HYBRID_ARCHITECTURE.md
  Start:     GETTING_STARTED.md (this file)
```

---

**Happy analyzing! 🚀**
