"""Meal/evidence/claims.py - Claim validation layer for Phase 5B.

Provides defense-in-depth validation to prevent therapeutic or hormone-promising
claims, while correctly allowing explicit negative statements and safeguards.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass(frozen=True)
class ClaimValidationResult:
    is_valid: bool
    violation_reason: Optional[str] = None


# Positive assertions that are prohibited
PROHIBITED_CLAIM_PATTERNS: List[Tuple[str, str]] = [
    (r"\bcure[s]?\s+(pcos|polycystic)\b", "Claims to cure PCOS"),
    (r"\breverse[s]?\s+(pcos|polycystic)\b", "Claims to reverse PCOS"),
    (r"\btreat[s]?\s+(pcos|polycystic)\s+with\s+(food|diet|nutrition)\b", "Claims food treats PCOS"),
    (r"\bhormone[- ]balancing\s+(diet|meal|food)\b", "Uses unproven 'hormone-balancing' diet terminology"),
    (r"\bbalance[s]?\s+hormones\b", "Claims to balance hormones through diet"),
    (r"\binsulin[- ]sensitizing\s+(diet|meal|food)\b", "Uses clinical 'insulin-sensitizing' diet terminology"),
    (r"\bpcos[- ]friendly\s+diet\b", "Uses generic 'PCOS-friendly diet' marketing label"),
    (r"\btestosterone[- ]boosting\b", "Claims testosterone boosting"),
    (r"\bboost[s]?\s+testosterone\b", "Claims to boost testosterone"),
    (r"\bincrease[s]?\s+testosterone\b", "Claims to increase testosterone"),
    (r"\bcure[s]?\s+(?:male\s+)?(?:hypogonadism|low testosterone)\b", "Claims to cure hypogonadism"),
    (r"\breverse[s]?\s+(?:male\s+)?(?:hypogonadism|low testosterone)\b", "Claims to reverse hypogonadism"),
    (r"\btreat[s]?\s+(?:male\s+)?(?:hypogonadism|low testosterone)\s+with\s+(?:food|diet|nutrition)\b", "Claims food treats hypogonadism"),
    (r"\blose\s+weight\s+to\s+increase\s+testosterone\b", "Claims weight loss to increase testosterone without clinical confirmation context"),
]

# Negation and prohibition markers that indicate a safe negative statement
NEGATION_PATTERNS: List[str] = [
    r"\bno\s+food\b",
    r"\bno\s+evidence\b",
    r"\bnot\s+(represented|claimed|suggested|supported)\b",
    r"\bdoes\s+not\s+(claim|cure|treat|boost|reverse)\b",
    r"\bdo\s+not\s+(claim|cure|treat|boost|reverse)\b",
    r"\bcannot\s+(cure|treat|boost|reverse)\b",
    r"\bprohibit(ion|ed|s)?\b",
    r"\bnever\b",
    r"\bwithout\b",
    r"\bdisclaim(er|s)?\b",
    r"\bdoes\s+not\s+substitute\b",
    r"\bdoes\s+not\s+replace\b",
    r"\bif\s+hypogonadism\s+is\s+clinically\s+confirmed\b",
]


def is_negated_or_safeguard(text: str) -> bool:
    """Checks whether the text contains explicit negation or safeguard phrasing."""
    lower = text.lower()
    return any(re.search(pat, lower) for pat in NEGATION_PATTERNS)


def validate_claim_text(text: str) -> ClaimValidationResult:
    """Validates a candidate claim string.
    
    Distinguishes prohibited positive claims from safe negative / disclaimer statements.
    """
    lower = text.lower()

    # If the sentence explicitly negates or prohibits the claim, it is valid
    if is_negated_or_safeguard(lower):
        # Exception: even with negation markers, watch for causal screening promises
        if "because your screening was positive" in lower and "increase testosterone" in lower:
            return ClaimValidationResult(
                is_valid=False,
                violation_reason="Inappropriately links screening positivity directly to testosterone improvement",
            )
        return ClaimValidationResult(is_valid=True)

    # Check for direct prohibited positive claims
    for pattern, description in PROHIBITED_CLAIM_PATTERNS:
        if re.search(pattern, lower):
            return ClaimValidationResult(is_valid=False, violation_reason=description)

    return ClaimValidationResult(is_valid=True)
