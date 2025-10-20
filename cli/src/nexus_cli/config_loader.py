"""Configuration loader for Nexus CLI.

Loads YAML configuration files from the shared/config directory.
This ensures both the web app and CLI use the same configuration.
"""

import yaml
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator


class StateRule(BaseModel):
    """Economic nexus rule for a single state."""

    state_code: str
    amount: float = Field(ge=0, description="Revenue threshold in USD")
    transactions: Optional[int] = Field(None, ge=1, description="Transaction count threshold")
    effective_date: date
    end_date: Optional[date] = None
    rule_id: str = Field(pattern=r"^[A-Z]{2}-\d{4}-\d{2}$")
    notes: Optional[str] = None

    @validator("end_date")
    def end_date_must_be_after_effective(cls, v: Optional[date], values: dict) -> Optional[date]:
        """Validate that end_date is after effective_date."""
        if v and "effective_date" in values and v <= values["effective_date"]:
            raise ValueError("end_date must be after effective_date")
        return v


class TaxRateInfo(BaseModel):
    """Tax rate information for a state."""

    state_rate: float = Field(ge=0, le=100)
    avg_local_rate: float = Field(ge=0, le=100)
    combined_rate: float = Field(ge=0, le=100)
    max_local_rate: float = Field(ge=0, le=100)
    notes: Optional[str] = None


class StateRulesConfig(BaseModel):
    """Complete state rules configuration."""

    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    last_updated: date
    source: str
    states: Dict[str, StateRule]
    historical_rules: Optional[Dict[str, StateRule]] = None

    @validator("states")
    def validate_state_codes(cls, v: Dict[str, StateRule]) -> Dict[str, StateRule]:
        """Validate that state codes match the keys."""
        for state_code, rule in v.items():
            if rule.state_code != state_code:
                raise ValueError(
                    f"State code mismatch: key is {state_code} but rule.state_code is {rule.state_code}"
                )
        return v


class TaxRatesConfig(BaseModel):
    """Complete tax rates configuration."""

    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    last_updated: date
    source: str
    source_url: Optional[str] = None
    rates: Dict[str, TaxRateInfo]


class ConfigLoader:
    """Loads and validates YAML configuration files."""

    def __init__(self, config_dir: Optional[Path] = None):
        """Initialize the config loader.

        Args:
            config_dir: Path to the shared/config directory.
                       If None, uses the default location relative to this file.
        """
        if config_dir is None:
            # Navigate to shared/config from cli/src/nexus_cli/
            self.config_dir = (
                Path(__file__).parent.parent.parent.parent / "shared" / "config"
            )
        else:
            self.config_dir = config_dir

        if not self.config_dir.exists():
            raise FileNotFoundError(
                f"Config directory not found: {self.config_dir}\n"
                "Make sure you're running from the project root."
            )

    def load_state_rules(self) -> StateRulesConfig:
        """Load state nexus rules from YAML.

        Returns:
            Validated StateRulesConfig object.

        Raises:
            FileNotFoundError: If state_rules.yaml doesn't exist.
            ValueError: If the YAML is invalid or doesn't match the schema.
        """
        rules_file = self.config_dir / "state_rules.yaml"

        if not rules_file.exists():
            raise FileNotFoundError(f"State rules file not found: {rules_file}")

        with open(rules_file, "r") as f:
            raw_config = yaml.safe_load(f)

        # Convert string dates to date objects in the raw config
        raw_config = self._convert_dates(raw_config)

        # Parse and validate with Pydantic
        try:
            # Parse state rules
            states = {}
            for state_code, rule_data in raw_config.get("states", {}).items():
                rule_data["state_code"] = state_code
                states[state_code] = StateRule(**rule_data)

            raw_config["states"] = states

            # Parse historical rules if present
            if "historical_rules" in raw_config and raw_config["historical_rules"]:
                historical = {}
                for rule_id, rule_data in raw_config["historical_rules"].items():
                    historical[rule_id] = StateRule(**rule_data)
                raw_config["historical_rules"] = historical

            config = StateRulesConfig(**raw_config)
            return config

        except Exception as e:
            raise ValueError(f"Invalid state rules configuration: {e}") from e

    def load_tax_rates(self) -> TaxRatesConfig:
        """Load tax rates from YAML.

        Returns:
            Validated TaxRatesConfig object.

        Raises:
            FileNotFoundError: If tax_rates.yaml doesn't exist.
            ValueError: If the YAML is invalid or doesn't match the schema.
        """
        rates_file = self.config_dir / "tax_rates.yaml"

        if not rates_file.exists():
            raise FileNotFoundError(f"Tax rates file not found: {rates_file}")

        with open(rates_file, "r") as f:
            raw_config = yaml.safe_load(f)

        # Convert string dates to date objects
        raw_config = self._convert_dates(raw_config)

        # Parse and validate with Pydantic
        try:
            rates = {}
            for state_code, rate_data in raw_config.get("rates", {}).items():
                rates[state_code] = TaxRateInfo(**rate_data)

            raw_config["rates"] = rates

            config = TaxRatesConfig(**raw_config)
            return config

        except Exception as e:
            raise ValueError(f"Invalid tax rates configuration: {e}") from e

    def get_current_rules(self) -> List[StateRule]:
        """Get all current (non-expired) state rules.

        Returns:
            List of StateRule objects with no end_date or future end_date.
        """
        config = self.load_state_rules()
        today = date.today()

        current_rules = []
        for rule in config.states.values():
            if rule.end_date is None or rule.end_date > today:
                current_rules.append(rule)

        return current_rules

    def get_rule_for_state(self, state_code: str) -> Optional[StateRule]:
        """Get the current rule for a specific state.

        Args:
            state_code: 2-letter state code (e.g., 'CA', 'NY')

        Returns:
            StateRule if found, None otherwise.
        """
        config = self.load_state_rules()
        state_code = state_code.upper()

        if state_code not in config.states:
            return None

        rule = config.states[state_code]

        # Check if rule is still current
        today = date.today()
        if rule.end_date and rule.end_date <= today:
            return None

        return rule

    def get_tax_rate(self, state_code: str) -> Optional[float]:
        """Get the combined tax rate for a state.

        Args:
            state_code: 2-letter state code (e.g., 'CA', 'NY')

        Returns:
            Combined tax rate as a percentage, or None if not found.
        """
        config = self.load_tax_rates()
        state_code = state_code.upper()

        if state_code not in config.rates:
            return None

        return config.rates[state_code].combined_rate

    def _convert_dates(self, config: dict) -> dict:
        """Recursively convert date strings to date objects.

        Args:
            config: Dictionary that may contain date strings

        Returns:
            Dictionary with date strings converted to date objects
        """
        if not isinstance(config, dict):
            return config

        converted = {}
        for key, value in config.items():
            if key in ("effective_date", "end_date", "last_updated"):
                if isinstance(value, str):
                    try:
                        # Parse YYYY-MM-DD format
                        year, month, day = map(int, value.split("-"))
                        converted[key] = date(year, month, day)
                    except (ValueError, AttributeError):
                        converted[key] = value
                else:
                    converted[key] = value
            elif isinstance(value, dict):
                converted[key] = self._convert_dates(value)
            else:
                converted[key] = value

        return converted


# Singleton instance
_loader: Optional[ConfigLoader] = None


def get_loader() -> ConfigLoader:
    """Get the singleton ConfigLoader instance.

    Returns:
        ConfigLoader instance.
    """
    global _loader
    if _loader is None:
        _loader = ConfigLoader()
    return _loader
