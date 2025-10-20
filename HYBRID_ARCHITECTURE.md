# Hybrid Architecture: Web + CLI

This document describes the hybrid architecture of the Nexus Calculator system, which provides both a **web application** and a **command-line interface** using shared configuration.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Principles](#core-principles)
- [Directory Structure](#directory-structure)
- [Shared Configuration](#shared-configuration)
- [Calculation Engines](#calculation-engines)
- [Ensuring Parity](#ensuring-parity)
- [Use Cases](#use-cases)
- [Development Workflow](#development-workflow)

---

## Overview

The Nexus Calculator system provides **two interfaces** for sales tax nexus analysis:

1. **Web Application** (TypeScript + React)
   - Interactive dashboard with visualizations
   - PDF report generation
   - Client-side processing (no server required)
   - Best for: Ad-hoc analysis, client-facing tool

2. **Command-Line Interface** (Python)
   - Terminal-based batch processing
   - Excel report export
   - Fast pandas-based processing
   - Best for: Automation, scripts, CI/CD

Both interfaces use the **same configuration files**, ensuring **identical results** across platforms.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Nexus Calculator System                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Shared Configuration                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ shared/config/                                            │  │
│  │   ├── state_rules.yaml      ← Single source of truth     │  │
│  │   └── tax_rates.yaml        ← Updated together           │  │
│  │                                                            │  │
│  │ shared/schemas/                                            │  │
│  │   └── state_rules.schema.json  ← Validation              │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────┬────────────────────────┘
                       │                  │
        ┌──────────────┴──────┐  ┌───────┴────────────┐
        │                     │  │                     │
┌───────▼─────────┐  ┌────────▼──▼──────┐  ┌──────────▼─────────┐
│  Web Interface  │  │ Shared Test Suite │  │   CLI Interface    │
│   (TypeScript)  │  │   (Parity Tests)  │  │     (Python)       │
└─────────────────┘  └───────────────────┘  └────────────────────┘
│                    │                      │                      │
│ • React UI         │ • Same test cases    │ • Terminal UI       │
│ • Charts & Maps    │ • Both must pass     │ • Batch processing  │
│ • PDF Export       │ • Compare outputs    │ • Excel export      │
│ • Web Workers      │                      │ • Pandas            │
└────────────────────┴──────────────────────┴─────────────────────┘
```

---

## Core Principles

### 1. **Single Source of Truth**

All nexus rules and tax rates are defined in **YAML files** in `shared/config/`:

- ✅ Easy to read and edit (non-developers can update)
- ✅ Version controlled (track changes over time)
- ✅ Both interfaces load the same files
- ✅ JSON schema validation ensures correctness

### 2. **Dual Implementation, Identical Results**

The calculation logic is implemented in **both TypeScript and Python**:

- TypeScript: For client-side processing in the browser
- Python: For server-side or CLI batch processing

**Key Requirement**: Both implementations **must produce identical results** given the same input.

### 3. **Interface Flexibility**

Users can choose the interface that best fits their workflow:

| Need | Use |
|------|-----|
| Quick one-off analysis | Web App |
| Client presentation | Web App |
| Batch processing many files | CLI |
| Automation / scripts | CLI |
| CI/CD integration | CLI |
| Visual dashboards | Web App |

### 4. **Testing for Parity**

Integration tests ensure both implementations produce the same results:

```
shared/tests/
  ├── test_cases.yaml        # Test scenarios
  ├── test_parity.ts         # TypeScript runner
  └── test_parity.py         # Python runner
```

---

## Directory Structure

```
nexus-calculator-app/
│
├── shared/                           # Shared configuration (YAML)
│   ├── config/
│   │   ├── state_rules.yaml         # Nexus thresholds by state
│   │   └── tax_rates.yaml           # Combined tax rates by state
│   ├── schemas/
│   │   ├── state_rules.schema.json  # JSON schema for validation
│   │   └── tax_rates.schema.json    # JSON schema for validation
│   └── tests/
│       ├── test_cases.yaml          # Shared test scenarios
│       ├── test_parity.ts           # TypeScript test runner
│       └── test_parity.py           # Python test runner
│
├── src/                              # Web application (TypeScript)
│   ├── components/                  # React components
│   ├── utils/
│   │   └── nexusEngine/             # TypeScript calculation engine
│   │       ├── index.ts             # Main engine
│   │       ├── types.ts             # Type definitions
│   │       ├── rules.ts             # Rule management
│   │       ├── strategies.ts        # Calculation strategies
│   │       └── configLoader.ts      # YAML config loader
│   └── ...
│
├── cli/                              # Command-line interface (Python)
│   ├── src/
│   │   └── nexus_cli/
│   │       ├── __init__.py
│   │       ├── cli.py               # CLI entry point
│   │       ├── analyzer.py          # Python calculation engine
│   │       └── config_loader.py     # YAML config loader
│   ├── tests/
│   │   └── test_analyzer.py
│   ├── pyproject.toml
│   └── README.md
│
├── README.md                         # Web app documentation
├── HYBRID_ARCHITECTURE.md            # This file
└── package.json
```

---

## Shared Configuration

### State Rules (`shared/config/state_rules.yaml`)

Defines economic nexus thresholds for each state:

```yaml
version: "1.0.0"
last_updated: "2025-01-15"
source: "Tax Foundation 2025 Q1"

states:
  CA:
    amount: 500000
    transactions: null
    effective_date: "2019-04-01"
    end_date: null
    rule_id: "CA-2019-01"
    notes: "California has highest threshold"

  WA:
    amount: 100000
    transactions: 200  # OR condition
    effective_date: "2019-03-01"
    end_date: null
    rule_id: "WA-2019-01"
    notes: "Either threshold triggers nexus"
```

**Fields:**
- `amount`: Revenue threshold in USD (0 = no sales tax)
- `transactions`: Transaction count threshold (null = N/A)
- `effective_date`: When rule became effective
- `end_date`: When superseded (null = current)
- `rule_id`: Unique identifier for versioning
- `notes`: Context about special rules or quirks

### Tax Rates (`shared/config/tax_rates.yaml`)

Average combined state and local tax rates:

```yaml
version: "1.0.0"
last_updated: "2025-01-15"
source: "Tax Foundation State and Local Sales Tax Rates, 2025"

rates:
  CA:
    state_rate: 7.25
    avg_local_rate: 1.43
    combined_rate: 8.68
    max_local_rate: 2.50
    notes: "District taxes can push rates above 10%"
```

---

## Calculation Engines

### TypeScript Engine (`src/utils/nexusEngine/`)

**Purpose**: Client-side processing for web app

**Key Files:**
- `index.ts`: Main entry point, orchestrates analysis
- `types.ts`: TypeScript interfaces (TransactionRow, NexusResult, etc.)
- `rules.ts`: Rule management and validation
- `strategies.ts`: Single-year, multi-year, rolling 12-month
- `configLoader.ts`: Loads YAML config (with fallback)
- `integration.ts`: Converts results to UI format

**Features:**
- Web Worker support for large files
- Chunked processing
- Progress callbacks
- Multiple calculation modes

**Loading Config:**
```typescript
import { loadStateRules, loadTaxRates } from './configLoader';

const rules = await loadStateRules();
const rates = await loadTaxRates();
```

### Python Engine (`cli/src/nexus_cli/`)

**Purpose**: CLI and batch processing

**Key Files:**
- `cli.py`: CLI commands using Click
- `analyzer.py`: Core calculation logic
- `config_loader.py`: Loads YAML config with Pydantic validation

**Features:**
- Pandas-based CSV processing
- Rich terminal UI with progress bars
- Excel export with formatting
- State name auto-mapping

**Loading Config:**
```python
from nexus_cli.config_loader import get_loader

loader = get_loader()
rules = loader.load_state_rules()
rates = loader.load_tax_rates()
```

---

## Ensuring Parity

To ensure both implementations produce identical results, we:

### 1. **Use Shared Test Cases**

`shared/tests/test_cases.yaml` defines test scenarios:

```yaml
test_cases:
  - name: "California revenue breach"
    transactions:
      - { id: "1", state: "CA", amount: 600000, date: "2024-06-15" }
    expected:
      has_nexus: true
      breach_type: "revenue"
      breach_date: "2024-06-15"
```

### 2. **Run Both Test Suites**

```bash
# TypeScript tests
npm test

# Python tests
cd cli && poetry run pytest
```

### 3. **Compare Outputs**

Integration tests run the same inputs through both engines and compare:
- Nexus status (true/false)
- Breach date
- Breach type
- Total revenue
- Total transactions
- Threshold percentages

### 4. **Continuous Integration**

CI pipeline runs both test suites on every commit:

```yaml
# .github/workflows/test.yml
jobs:
  test-typescript:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - run: cd cli && poetry run pytest

  test-parity:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:parity
      - run: cd cli && poetry run pytest tests/test_parity.py
```

---

## Use Cases

### Use Case 1: Interactive Analysis (Web App)

**Scenario**: A business owner wants to quickly check if they have nexus in any states.

**Workflow:**
1. Open web app in browser
2. Drag-and-drop CSV file
3. View interactive dashboard with charts
4. Download PDF report for accountant

**Why Web**: Visual, intuitive, no installation required.

### Use Case 2: Monthly Batch Processing (CLI)

**Scenario**: A tax professional analyzes 50+ clients every month.

**Workflow:**
```bash
for client in clients/*.csv; do
  nexus analyze "$client" --output "reports/$(basename $client .csv)_report.xlsx"
done
```

**Why CLI**: Fast, scriptable, batch processing.

### Use Case 3: Historical Analysis (CLI + Web)

**Scenario**: Company needs to analyze last 5 years to determine when nexus first occurred.

**Workflow:**
1. Use CLI to process large historical data files:
   ```bash
   nexus analyze sales_2019_2024.csv --year 2019 --output 2019.xlsx
   # ... repeat for each year
   ```

2. Use web app to visualize trends and create presentation-ready PDFs

**Why Both**: CLI for heavy lifting, web for visualization.

### Use Case 4: CI/CD Integration (CLI)

**Scenario**: E-commerce platform wants to check nexus after every quarter automatically.

**Workflow:**
```yaml
# .github/workflows/quarterly_nexus.yml
on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every quarter

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Export sales data
        run: ./export_sales.sh

      - name: Analyze nexus
        run: nexus analyze sales.csv --output nexus_report.xlsx

      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: nexus-report
          path: nexus_report.xlsx
```

**Why CLI**: Automation, no GUI required.

---

## Development Workflow

### Updating State Rules

1. **Edit YAML file:**
   ```bash
   vim shared/config/state_rules.yaml
   ```

2. **Update both implementations if logic changes:**
   - TypeScript: `src/utils/nexusEngine/strategies.ts`
   - Python: `cli/src/nexus_cli/analyzer.py`

3. **Add test case:**
   ```bash
   vim shared/tests/test_cases.yaml
   ```

4. **Run tests:**
   ```bash
   npm test                      # TypeScript
   cd cli && poetry run pytest   # Python
   ```

5. **Verify parity:**
   ```bash
   npm run test:parity
   ```

6. **Commit changes:**
   ```bash
   git add shared/config/state_rules.yaml
   git commit -m "Update CA threshold to $500k effective 2025-01-01"
   ```

### Adding a New Feature

Example: Add support for product taxability rules

1. **Update shared config:**
   ```yaml
   # shared/config/product_taxability.yaml
   products:
     clothing:
       taxable_states: ["NY", "CA"]
       exempt_states: ["PA", "NJ"]
   ```

2. **Update TypeScript engine:**
   ```typescript
   // src/utils/nexusEngine/productRules.ts
   export function isProductTaxable(product: string, state: string): boolean {
     // Implementation
   }
   ```

3. **Update Python engine:**
   ```python
   # cli/src/nexus_cli/product_rules.py
   def is_product_taxable(product: str, state: str) -> bool:
       # Implementation
   ```

4. **Add tests for both:**
   ```yaml
   # shared/tests/test_cases.yaml
   - name: "Clothing exempt in PA"
     product: "clothing"
     state: "PA"
     expected:
       taxable: false
   ```

5. **Verify parity**

6. **Update documentation**

---

## Benefits of Hybrid Architecture

### ✅ **Consistency**
- Same rules, same results, everywhere
- No configuration drift between interfaces

### ✅ **Flexibility**
- Users choose the best tool for their workflow
- Web for interactive, CLI for automation

### ✅ **Maintainability**
- Update rules once in YAML
- Both systems automatically use new rules
- Clear separation of concerns

### ✅ **Testability**
- Shared test cases ensure parity
- Easy to validate both implementations

### ✅ **Scalability**
- Web app: Handles interactive users
- CLI: Handles batch processing
- Different performance characteristics, same logic

---

## Comparison Summary

| Aspect | Web App | CLI |
|--------|---------|-----|
| **Language** | TypeScript | Python |
| **Runtime** | Browser | Terminal |
| **UI** | React + Tailwind | Rich (terminal) |
| **Export** | PDF + Excel | Excel |
| **Charts** | Recharts | Tables only |
| **Processing** | Web Workers | Pandas |
| **Speed** | Fast (for medium files) | Very fast (for large files) |
| **Installation** | None (web) | Python + Poetry |
| **Best for** | Interactive, visual | Batch, automation |
| **Configuration** | **YAML (shared)** | **YAML (shared)** |
| **Results** | **Identical** | **Identical** |

---

## Future Enhancements

### Planned Features

1. **API Server** (optional)
   - REST API wrapping the calculation engine
   - Web app can optionally use API for very large files
   - CLI can use API for team sharing

2. **Desktop App** (Electron)
   - Standalone desktop app using TypeScript engine
   - Combines benefits of both interfaces

3. **Rule Versioning (v2)**
   - Historical rules with effective dates
   - Precise multi-year analysis
   - Audit trail for rule changes

4. **Cloud Sync** (optional)
   - Save configurations to cloud
   - Team collaboration
   - Shared report history

---

## Conclusion

The hybrid architecture provides the best of both worlds:

- **Web app** for interactive, visual analysis
- **CLI** for batch processing and automation
- **Shared config** ensures consistency
- **Dual implementation** provides flexibility
- **Parity testing** ensures correctness

This architecture serves different user needs while maintaining a single source of truth for business logic.

---

## Support

For questions about the architecture:
- See individual READMEs: [Web App](README.md) | [CLI](cli/README.md)
- Check test files in `shared/tests/` for examples
- Review YAML schemas in `shared/schemas/`

For implementation questions:
- **TypeScript**: See `src/utils/nexusEngine/README.md`
- **Python**: See `cli/README.md`
