# Nexus CLI

Command-line interface for sales tax nexus analysis. This CLI provides a terminal-based interface to the same nexus calculation engine used by the web application.

## Features

- 📊 **Analyze CSV files** for economic nexus obligations
- 📈 **Export to Excel** with detailed reports and visualizations
- 🔍 **List state rules** and view specific state information
- 🔄 **Shared configuration** with web app ensures consistent results
- ⚡ **Fast processing** for batch analysis
- 🎨 **Beautiful terminal UI** with progress indicators and tables

## Installation

### Using Poetry (Recommended)

```bash
cd cli
poetry install
poetry run nexus --help
```

### Using pip

```bash
cd cli
pip install -e .
nexus --help
```

## Usage

### Analyze a CSV File

```bash
nexus analyze sales.csv
```

With options:

```bash
nexus analyze sales.csv \
  --output my_report.xlsx \
  --year 2024 \
  --ignore-marketplace \
  --include-negatives
```

### List All State Rules

```bash
nexus states
```

Output:
```
┏━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┓
┃ State  ┃ Revenue Threshold  ┃ Transaction Threshold  ┃ Effective Date ┃
┡━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━┩
│ CA     │      $500,000      │           —            │   2019-04-01   │
│ NY     │      $500,000      │           —            │   2019-06-01   │
│ TX     │      $500,000      │           —            │   2019-10-01   │
│ ...    │        ...         │          ...           │      ...       │
└────────┴────────────────────┴────────────────────────┴────────────────┘
```

### View Specific State Information

```bash
nexus state-info CA
```

Output:
```
CA - Nexus Information

Rule ID             CA-2019-01
Effective Date      2019-04-01
Revenue Threshold   $500,000
Transaction Threshold  Not applicable
Combined Tax Rate   8.68%
Notes               California has highest threshold due to size of economy
```

### View Configuration Info

```bash
nexus config-info
```

## CSV File Format

Your CSV must include these columns:

| Column | Type | Required | Format | Example |
|--------|------|----------|--------|---------|
| `date` | string | Yes | YYYY-MM-DD | 2024-01-15 |
| `state` | string | Yes | 2-letter code | CA |
| `amount` | number | Yes | Decimal | 1500.00 |
| `transaction_count` | number | No | Integer | 1 |
| `revenue_type` | string | No | taxable/nontaxable/marketplace | taxable |

### Alternative Column Names

The CLI will automatically recognize these alternative column names:

- **Date**: `transaction_date`, `sale_date`, `order_date`
- **State**: `state_code`, `State`, `STATE`
- **Amount**: `sale_amount`, `sales_amount`, `revenue`, `total`

### Example CSV

```csv
date,state,amount,revenue_type
2024-01-15,CA,1500.00,taxable
2024-01-16,TX,2500.00,taxable
2024-01-17,NY,3000.00,taxable
```

## Command Reference

### `nexus analyze`

Analyze a CSV file for nexus obligations.

**Arguments:**
- `CSV_FILE`: Path to the CSV file to analyze

**Options:**
- `-o, --output PATH`: Output Excel file path (default: nexus_report.xlsx)
- `-y, --year INT`: Analysis year (default: current year)
- `--ignore-marketplace`: Ignore marketplace facilitator transactions
- `--include-negatives`: Include negative amounts (returns/refunds)
- `--help`: Show help message

### `nexus states`

List all state nexus rules with thresholds and effective dates.

### `nexus state-info`

Show detailed information for a specific state.

**Arguments:**
- `STATE_CODE`: 2-letter state code (e.g., CA, NY)

### `nexus config-info`

Show information about loaded configuration files.

## Output

The CLI generates an Excel file with multiple sheets:

### Executive Summary Sheet

- Total states with nexus
- Total estimated liability
- Transaction count
- Analysis metadata

### Nexus States Sheet

Detailed table with:
- State code
- Total revenue
- Revenue threshold
- Threshold percentage
- Transaction count
- Breach type (revenue/transactions)
- Breach date
- Tax rate
- Estimated liability

## Configuration

The CLI uses YAML configuration files from `shared/config/`:

- `state_rules.yaml`: Economic nexus thresholds for each state
- `tax_rates.yaml`: Combined state and local tax rates

These files are **shared with the web application**, ensuring both interfaces produce identical results.

### Updating Configuration

To update state rules or tax rates:

1. Edit the YAML files in `shared/config/`
2. The changes will automatically be used by both CLI and web app
3. Consider committing changes with clear notes about what changed and why

## Development

### Running Tests

```bash
poetry run pytest
```

### Type Checking

```bash
poetry run mypy src/nexus_cli
```

### Code Formatting

```bash
poetry run black src/nexus_cli
poetry run ruff check src/nexus_cli
```

## Architecture

The Nexus CLI is part of a **hybrid architecture**:

```
nexus-calculator-app/
├── shared/                    # Shared configuration
│   ├── config/
│   │   ├── state_rules.yaml  # State nexus rules (SHARED)
│   │   └── tax_rates.yaml    # Tax rates (SHARED)
│   └── schemas/              # JSON schemas for validation
├── src/                       # React web app
│   └── utils/nexusEngine/    # TypeScript calculation engine
└── cli/                       # Python CLI (this directory)
    └── src/nexus_cli/        # Python calculation engine
```

Both the TypeScript engine (web) and Python engine (CLI) use the **same YAML configuration**, ensuring consistent results.

## Troubleshooting

### "Config directory not found"

Make sure you're running the CLI from the project root:

```bash
cd nexus-calculator-app
poetry run nexus analyze data.csv
```

### "Missing required column"

The CSV must have `date`, `state`, and `amount` columns. Check your column names or rename them to match.

### "Invalid state code"

State codes must be 2-letter abbreviations (CA, NY, TX, etc.). Full state names will be auto-converted when possible.

## Examples

### Basic Analysis

```bash
nexus analyze sales_2024.csv
```

### Multi-Year Analysis (by year)

```bash
nexus analyze sales_2021.csv --year 2021 --output nexus_2021.xlsx
nexus analyze sales_2022.csv --year 2022 --output nexus_2022.xlsx
nexus analyze sales_2023.csv --year 2023 --output nexus_2023.xlsx
nexus analyze sales_2024.csv --year 2024 --output nexus_2024.xlsx
```

### Exclude Marketplace Sales

If you use Amazon FBA or other marketplace facilitators:

```bash
nexus analyze sales.csv --ignore-marketplace
```

### Include Returns/Refunds

By default, negative amounts are excluded. To include them:

```bash
nexus analyze sales.csv --include-negatives
```

## Comparison with Web App

| Feature | CLI | Web App |
|---------|-----|---------|
| **Interface** | Terminal | Browser |
| **Best for** | Batch processing, automation | Interactive analysis, presentations |
| **Installation** | Python + Poetry | None (just visit URL) |
| **Export** | Excel | PDF + Excel |
| **Visualizations** | Tables | Charts + Maps + Tables |
| **Speed** | Very fast (pandas) | Fast (Web Workers) |
| **Configuration** | Shared YAML | Shared YAML |
| **Calculation Engine** | Python | TypeScript |
| **Results** | **Identical** | **Identical** |

## Contributing

Contributions are welcome! When making changes:

1. **If you modify calculation logic**: Update both TypeScript and Python implementations
2. **If you update state rules**: Edit `shared/config/state_rules.yaml`
3. **If you update tax rates**: Edit `shared/config/tax_rates.yaml`
4. **Add tests** to ensure parity between implementations

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review the [web app README](../README.md) for general concepts
- Open an issue on GitHub

---

**Note**: This CLI shares configuration with the Nexus Calculator web application. Both tools produce identical results but serve different use cases.
