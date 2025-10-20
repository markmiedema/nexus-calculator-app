"""Nexus CLI - Command-line interface for sales tax nexus analysis.

This CLI wraps the core nexus calculation engine and provides
a terminal interface for batch processing CSV files.
"""

import click
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from typing import Optional

from .config_loader import get_loader
from .analyzer import NexusAnalyzer


console = Console()


@click.group()
@click.version_option(version="1.0.0")
def main() -> None:
    """Nexus CLI - Analyze sales tax nexus obligations from transaction data.

    This tool shares configuration with the Nexus Calculator web app,
    ensuring consistent results across both interfaces.
    """
    pass


@main.command()
@click.argument("csv_file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--output",
    "-o",
    type=click.Path(path_type=Path),
    help="Output Excel file path (default: nexus_report.xlsx)",
)
@click.option(
    "--year",
    "-y",
    type=int,
    help="Analysis year (default: current year)",
)
@click.option(
    "--ignore-marketplace",
    is_flag=True,
    help="Ignore marketplace facilitator transactions",
)
@click.option(
    "--include-negatives",
    is_flag=True,
    help="Include negative amounts (returns/refunds)",
)
def analyze(
    csv_file: Path,
    output: Optional[Path],
    year: Optional[int],
    ignore_marketplace: bool,
    include_negatives: bool,
) -> None:
    """Analyze a CSV file for nexus obligations.

    Reads transaction data from CSV_FILE and determines which states
    have economic nexus based on revenue and/or transaction thresholds.

    \b
    Required CSV columns:
      - date: Transaction date (YYYY-MM-DD)
      - state: 2-letter state code (e.g., CA, NY)
      - amount: Sale amount in USD

    \b
    Optional columns:
      - transaction_count: Number of transactions (default: 1)
      - revenue_type: 'taxable', 'nontaxable', or 'marketplace'
    """
    console.print(f"\n[bold blue]Nexus Analysis[/bold blue]")
    console.print(f"Input file: {csv_file}")

    # Determine output file
    if output is None:
        output = Path("nexus_report.xlsx")

    # Initialize analyzer
    analyzer = NexusAnalyzer()

    # Load and analyze
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Loading CSV file...", total=None)

        try:
            # Load CSV
            transactions = analyzer.load_csv(csv_file)
            progress.update(task, description=f"Loaded {len(transactions):,} transactions")

            # Analyze
            progress.update(task, description="Analyzing nexus...")
            results = analyzer.analyze(
                transactions=transactions,
                year=year,
                ignore_marketplace=ignore_marketplace,
                include_negatives=include_negatives,
            )

            progress.update(task, description="Generating report...")

            # Export to Excel
            analyzer.export_excel(results, output)

            progress.update(task, description="✓ Complete", completed=True)

        except Exception as e:
            progress.stop()
            console.print(f"[red]Error: {e}[/red]")
            raise click.Abort()

    # Display summary
    console.print(f"\n[bold green]✓ Analysis Complete[/bold green]\n")

    nexus_count = len([r for r in results.state_results if r.has_nexus])
    console.print(f"States with nexus: [bold]{nexus_count}[/bold] of {len(results.state_results)}")
    console.print(f"Total potential liability: [bold]${results.total_liability:,.2f}[/bold]")
    console.print(f"\nReport saved to: [cyan]{output}[/cyan]")

    # Show top states
    if nexus_count > 0:
        console.print("\n[bold]Top Nexus States:[/bold]")
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("State", style="cyan")
        table.add_column("Revenue", justify="right")
        table.add_column("Threshold", justify="right")
        table.add_column("Breach Type", justify="center")
        table.add_column("Breach Date")

        # Sort by revenue descending
        top_states = sorted(
            [r for r in results.state_results if r.has_nexus],
            key=lambda x: x.total_revenue,
            reverse=True,
        )[:10]

        for state in top_states:
            table.add_row(
                state.state_code,
                f"${state.total_revenue:,.0f}",
                f"${state.threshold_revenue:,.0f}",
                state.breach_type or "—",
                state.breach_date.strftime("%Y-%m-%d") if state.breach_date else "—",
            )

        console.print(table)


@main.command()
def states() -> None:
    """List all state nexus rules."""
    loader = get_loader()
    config = loader.load_state_rules()

    console.print(f"\n[bold]State Nexus Rules[/bold]")
    console.print(f"Version: {config.version}")
    console.print(f"Last updated: {config.last_updated}")
    console.print(f"Source: {config.source}\n")

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("State", style="cyan", width=6)
    table.add_column("Revenue Threshold", justify="right")
    table.add_column("Transaction Threshold", justify="right")
    table.add_column("Effective Date")
    table.add_column("Notes", max_width=40)

    for state_code in sorted(config.states.keys()):
        rule = config.states[state_code]

        revenue_str = f"${rule.amount:,.0f}" if rule.amount > 0 else "No tax"
        txn_str = f"{rule.transactions:,}" if rule.transactions else "—"

        table.add_row(
            state_code,
            revenue_str,
            txn_str,
            rule.effective_date.strftime("%Y-%m-%d"),
            rule.notes or "",
        )

    console.print(table)
    console.print(f"\n[dim]Total states: {len(config.states)}[/dim]")


@main.command()
@click.argument("state_code")
def state_info(state_code: str) -> None:
    """Show detailed information for a specific state.

    STATE_CODE: 2-letter state code (e.g., CA, NY)
    """
    state_code = state_code.upper()
    loader = get_loader()

    # Get rule
    rule = loader.get_rule_for_state(state_code)
    if rule is None:
        console.print(f"[red]State not found: {state_code}[/red]")
        raise click.Abort()

    # Get tax rate
    tax_rate = loader.get_tax_rate(state_code)

    # Display info
    console.print(f"\n[bold cyan]{state_code} - Nexus Information[/bold cyan]\n")

    info_table = Table(show_header=False, box=None)
    info_table.add_column("Field", style="bold")
    info_table.add_column("Value")

    info_table.add_row("Rule ID", rule.rule_id)
    info_table.add_row("Effective Date", rule.effective_date.strftime("%Y-%m-%d"))

    if rule.amount > 0:
        info_table.add_row("Revenue Threshold", f"${rule.amount:,.0f}")
    else:
        info_table.add_row("Revenue Threshold", "No sales tax")

    if rule.transactions:
        info_table.add_row("Transaction Threshold", f"{rule.transactions:,}")
    else:
        info_table.add_row("Transaction Threshold", "Not applicable")

    if tax_rate:
        info_table.add_row("Combined Tax Rate", f"{tax_rate:.2f}%")

    if rule.notes:
        info_table.add_row("Notes", rule.notes)

    console.print(info_table)


@main.command()
def config_info() -> None:
    """Show information about the loaded configuration."""
    loader = get_loader()

    console.print(f"\n[bold]Configuration Information[/bold]\n")

    # State rules
    rules_config = loader.load_state_rules()
    console.print(f"[cyan]State Rules:[/cyan]")
    console.print(f"  Version: {rules_config.version}")
    console.print(f"  Last updated: {rules_config.last_updated}")
    console.print(f"  Source: {rules_config.source}")
    console.print(f"  States: {len(rules_config.states)}")

    # Tax rates
    rates_config = loader.load_tax_rates()
    console.print(f"\n[cyan]Tax Rates:[/cyan]")
    console.print(f"  Version: {rates_config.version}")
    console.print(f"  Last updated: {rates_config.last_updated}")
    console.print(f"  Source: {rates_config.source}")
    if rates_config.source_url:
        console.print(f"  URL: {rates_config.source_url}")

    # Config location
    console.print(f"\n[cyan]Config Directory:[/cyan]")
    console.print(f"  {loader.config_dir}")


if __name__ == "__main__":
    main()
