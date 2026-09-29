"""Meal/composition/equivalence.py - Food entity semantic equivalence registry & validation.

Defines provenance-backed equivalence groups for entities in the master planner
catalog that represent alternative representations of the same underlying selectable food.

Invariants:
1. Only entities with proven provenance/source equivalence are grouped.
2. A single meal combination may contain at most ONE entity from each equivalence group.
3. Requiring multiple entities from the same equivalence group immediately fails with
   CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE.
4. If multiple preferred entity IDs belong to the same equivalence group, selecting one
   member satisfies that food-concept preference without inflating preference coverage.
5. Equivalence filtering is applied before search-space counting, combination generation,
   and Phase 6B optimization.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Set, Tuple

# Provenance-backed equivalence groups in the Pakistani Master Planner Catalog.
# PK_DISH_001: Chapati (Canonical composite dish, whole wheat atta flatbread)
# PK_PORTION_001: Standard Whole Wheat Chapati (Dietary Guidelines standard portion, 80g cooked from 60g atta)
DEFAULT_ENTITY_EQUIVALENCE_GROUPS: Dict[str, Set[str]] = {
    "EQ_CHAPATI": {
        "PK_DISH_001",
        "PK_PORTION_001",
    },
}


def get_entity_equivalence_group(
    entity_id: str,
    groups: Optional[Dict[str, Set[str]]] = None,
) -> Optional[str]:
    """Returns the equivalence group name for the given entity ID, or None if ungrouped."""
    active_groups = groups if groups is not None else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    for group_name, members in active_groups.items():
        if entity_id in members:
            return group_name
    return None


def find_conflicting_equivalence_entities(
    entity_ids: Iterable[str],
    groups: Optional[Dict[str, Set[str]]] = None,
) -> Dict[str, List[str]]:
    """Identifies any equivalence groups with more than one entity present in entity_ids.

    Returns:
        Mapping of group_name -> list of conflicting entity IDs in that group.
    """
    active_groups = groups if groups is not None else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    members_by_group: Dict[str, List[str]] = {grp: [] for grp in active_groups}

    for eid in entity_ids:
        for grp_name, members in active_groups.items():
            if eid in members:
                members_by_group[grp_name].append(eid)

    return {grp: eids for grp, eids in members_by_group.items() if len(eids) > 1}


def validate_combination_equivalence(
    entity_ids: Iterable[str],
    groups: Optional[Dict[str, Set[str]]] = None,
) -> Tuple[bool, Optional[str]]:
    """Checks that entity_ids contains at most one entity from each equivalence group.

    Returns:
        (is_valid, rejection_reason)
        where rejection_reason is 'SEMANTIC_DUPLICATE_REPRESENTATION' if invalid.
    """
    conflicts = find_conflicting_equivalence_entities(entity_ids, groups)
    if conflicts:
        return False, "SEMANTIC_DUPLICATE_REPRESENTATION"
    return True, None


def map_to_preference_concepts(
    entity_ids: Iterable[str],
    groups: Optional[Dict[str, Set[str]]] = None,
) -> Set[str]:
    """Maps a collection of entity IDs to canonical preference concept identifiers.

    For entities in an equivalence group, the group identifier (e.g. 'EQ_CHAPATI')
    represents the underlying food concept. For ungrouped entities, the entity ID
    itself is the concept identifier.

    This ensures that multiple equivalent preferred entities map to a single
    concept and cannot inflate preference coverage.
    """
    active_groups = groups if groups is not None else DEFAULT_ENTITY_EQUIVALENCE_GROUPS
    concepts: Set[str] = set()
    for eid in entity_ids:
        grp = get_entity_equivalence_group(eid, active_groups)
        concepts.add(grp if grp is not None else eid)
    return concepts
