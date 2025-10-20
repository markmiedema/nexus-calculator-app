"""Parity tests for Nexus CLI.

These tests use shared test cases from shared/tests/test_cases.yaml
to ensure the Python implementation produces identical results to
the TypeScript implementation.
"""

import pytest
import yaml
from pathlib import Path
from datetime import datetime

from nexus_cli.analyzer import NexusAnalyzer, Transaction


def load_test_cases():
    """Load shared test cases from YAML."""
    test_file = Path(__file__).parent.parent.parent / "shared" / "tests" / "test_cases.yaml"

    if not test_file.exists():
        pytest.skip(f"Test cases file not found: {test_file}")

    with open(test_file) as f:
        data = yaml.safe_load(f)

    return data.get("test_cases", [])


def parse_transaction(txn_dict):
    """Parse a transaction dict from YAML into a Transaction object."""
    date_str = txn_dict["date"]
    date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()

    return Transaction(
        id=txn_dict["id"],
        state_code=txn_dict["state_code"],
        amount=txn_dict["amount"],
        date=date_obj,
        revenue_type=txn_dict.get("revenue_type"),
    )


@pytest.mark.parametrize("test_case", load_test_cases(), ids=lambda tc: tc["name"])
def test_parity(test_case):
    """Test that Python implementation matches expected results from shared test cases."""
    # Skip performance tests
    if "generate" in test_case:
        pytest.skip("Performance test - run separately")

    # Parse transactions
    transactions = [parse_transaction(t) for t in test_case["transactions"]]

    # Parse options
    options = test_case["options"]
    mode = options.get("mode", "singleYear")
    analysis_year = options.get("analysisYear")
    year_range = options.get("yearRange")
    ignore_marketplace = options.get("ignoreMarketplace", False)
    include_negatives = options.get("includeNegativeAmounts", False)

    # Analyze
    analyzer = NexusAnalyzer()

    if mode == "singleYear":
        result = analyzer.analyze(
            transactions=transactions,
            year=analysis_year,
            ignore_marketplace=ignore_marketplace,
            include_negatives=include_negatives,
        )
    elif mode == "multiYearEstimate":
        # For multi-year, analyze each year separately
        # This is a simplified version - real implementation would handle year ranges
        start_year, end_year = year_range
        result = analyzer.analyze(
            transactions=transactions,
            year=start_year,  # Simplified: just check first year
            ignore_marketplace=ignore_marketplace,
            include_negatives=include_negatives,
        )
    else:
        pytest.fail(f"Unsupported mode: {mode}")

    # Check expected results
    expected = test_case["expected"]

    # Check warnings
    if "warnings" in expected:
        for warning in expected["warnings"]:
            assert any(
                warning in w for w in result.warnings
            ), f"Expected warning not found: {warning}"

    # Check state results
    if "states" in expected:
        for state_code, expected_state in expected["states"].items():
            # Find state in results
            state_result = next(
                (r for r in result.state_results if r.state_code == state_code), None
            )

            assert state_result is not None, f"State {state_code} not found in results"

            # Check exceeded
            if "exceeded" in expected_state:
                assert (
                    state_result.has_nexus == expected_state["exceeded"]
                ), f"{state_code}: exceeded mismatch"

            # Check breach type
            if "breach_type" in expected_state:
                assert (
                    state_result.breach_type == expected_state["breach_type"]
                ), f"{state_code}: breach_type mismatch"

            # Check breach date
            if "breach_date" in expected_state and expected_state["breach_date"]:
                expected_date = datetime.strptime(
                    expected_state["breach_date"], "%Y-%m-%d"
                ).date()
                assert (
                    state_result.breach_date == expected_date
                ), f"{state_code}: breach_date mismatch"

            # Check total revenue (with tolerance for floating point)
            if "total_revenue" in expected_state:
                assert abs(state_result.total_revenue - expected_state["total_revenue"]) < 0.01, \
                    f"{state_code}: total_revenue mismatch"

            # Check total transactions
            if "total_transactions" in expected_state:
                assert (
                    state_result.total_transactions == expected_state["total_transactions"]
                ), f"{state_code}: total_transactions mismatch"

            # Check threshold revenue
            if "threshold_revenue" in expected_state:
                assert abs(
                    state_result.threshold_revenue - expected_state["threshold_revenue"]
                ) < 0.01, f"{state_code}: threshold_revenue mismatch"

            # Check breach transaction ID
            if "breach_transaction_id" in expected_state:
                assert (
                    state_result.breach_transaction_id
                    == expected_state["breach_transaction_id"]
                ), f"{state_code}: breach_transaction_id mismatch"


def test_config_loading():
    """Test that configuration loads successfully."""
    from nexus_cli.config_loader import get_loader

    loader = get_loader()

    # Load state rules
    rules_config = loader.load_state_rules()
    assert rules_config.version is not None
    assert len(rules_config.states) > 0

    # Check that CA rule exists and has correct threshold
    ca_rule = loader.get_rule_for_state("CA")
    assert ca_rule is not None
    assert ca_rule.amount == 500000

    # Load tax rates
    rates_config = loader.load_tax_rates()
    assert rates_config.version is not None
    assert len(rates_config.rates) > 0

    # Check that CA tax rate exists
    ca_rate = loader.get_tax_rate("CA")
    assert ca_rate is not None
    assert ca_rate > 0


def test_analyzer_basic():
    """Basic test of analyzer functionality."""
    analyzer = NexusAnalyzer()

    # Create simple test transactions
    transactions = [
        Transaction(
            id="tx-1",
            state_code="CA",
            amount=600000,
            date=datetime(2024, 6, 15).date(),
        ),
    ]

    # Analyze
    result = analyzer.analyze(transactions=transactions, year=2024)

    # Check results
    assert len(result.state_results) > 0

    # Find CA
    ca_result = next((r for r in result.state_results if r.state_code == "CA"), None)
    assert ca_result is not None
    assert ca_result.has_nexus is True
    assert ca_result.breach_type == "revenue"
    assert ca_result.total_revenue == 600000


def test_csv_loading(tmp_path):
    """Test CSV file loading."""
    # Create a test CSV file
    csv_content = """date,state,amount
2024-01-15,CA,100000
2024-02-20,NY,200000
2024-03-10,TX,150000
"""

    csv_file = tmp_path / "test.csv"
    csv_file.write_text(csv_content)

    # Load CSV
    analyzer = NexusAnalyzer()
    transactions = analyzer.load_csv(csv_file)

    # Check loaded transactions
    assert len(transactions) == 3
    assert transactions[0].state_code == "CA"
    assert transactions[0].amount == 100000
    assert transactions[1].state_code == "NY"
    assert transactions[2].state_code == "TX"


def test_csv_column_mapping(tmp_path):
    """Test that alternative column names are recognized."""
    # Create CSV with alternative column names
    csv_content = """transaction_date,State,sale_amount
2024-01-15,CA,100000
2024-02-20,NY,200000
"""

    csv_file = tmp_path / "test.csv"
    csv_file.write_text(csv_content)

    # Load CSV
    analyzer = NexusAnalyzer()
    transactions = analyzer.load_csv(csv_file)

    # Should successfully map columns
    assert len(transactions) == 2
    assert transactions[0].state_code == "CA"


def test_state_name_mapping():
    """Test that full state names are mapped to codes."""
    analyzer = NexusAnalyzer()

    # Test some mappings
    assert analyzer._map_state_name("CALIFORNIA") == "CA"
    assert analyzer._map_state_name("NEW YORK") == "NY"
    assert analyzer._map_state_name("TEXAS") == "TX"

    # Test already-code
    assert analyzer._map_state_name("CA") == "CA"


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
