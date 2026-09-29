"""Meal/optimizer/solver.py - Deterministic Two-Pass Linear Programming Portion Optimizer.

Mathematical Formulation:
- Decision Variables: food gram quantities x_1, ..., x_n in [L_i, U_i].
- Range Violation Variables: u_k >= 0 (below-target), v_k >= 0 (above-target) for k in {E, P, C, F}.
- Primary Objective: Minimize total normalized range violation:
    J_primary = sum_k w_k * (u_k + v_k) / S_k
  where S_k are deterministic engineering normalization scales and w_k are engineering weights.
- Secondary Tie-Breaker (Pass 2):
    Constrain J_primary <= J* + primary_tolerance.
    If preferred_grams p_i supplied for any foods, minimize sum_{i in pref} |x_i - p_i| / max(U_i - L_i, 1.0).
    Otherwise, minimize total grams sum_i x_i strictly as a mathematical tie-breaker.
- Solver Backend: scipy.optimize.linprog(method='highs')
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.optimize import linprog

from Meal.optimizer.schemas import SecondaryObjectiveMode


@dataclass(frozen=True)
class SolverSolution:
    """Raw mathematical solution returned by the LP solver."""
    success: bool
    optimized_grams: List[float]
    violations: Dict[str, Tuple[float, float]]  # nutrient -> (below_violation, above_violation)
    primary_objective_value: float
    objective_components: Dict[str, float]
    objective_weights_used: Dict[str, float]
    normalization_scales_used: Dict[str, float]
    solver_name: str = "scipy.optimize.linprog(highs)"
    solver_version: str = "1.17.0"
    solver_status: str = "UNKNOWN"
    solver_message: str = ""
    iterations: int = 0
    secondary_objective_mode: Optional[SecondaryObjectiveMode] = None

    @property
    def status_code(self) -> int:
        return 0 if self.success else 1

    @property
    def message(self) -> str:
        return self.solver_message

    @property
    def secondary_objective_value(self) -> float:
        if "secondary_preference_deviation" in self.objective_components:
            return self.objective_components["secondary_preference_deviation"]
        return self.objective_components.get("secondary_tie_breaker_total_grams", 0.0)

    @property
    def secondary_objective_recomputed(self) -> Optional[float]:
        return self.objective_components.get("secondary_objective_recomputed")

    @property
    def secondary_objective_solver(self) -> Optional[float]:
        return self.objective_components.get("secondary_objective_solver")


def solve_portion_lp(
    nutrient_coefficients: Dict[str, List[float]],
    target_ranges: Dict[str, Tuple[float, float]],
    gram_bounds: List[Tuple[float, float]],
    preferred_grams: Optional[List[Optional[float]]] = None,
    objective_weights: Optional[Dict[str, float]] = None,
    normalization_scales: Optional[Dict[str, float]] = None,
    primary_tolerance: float = 0.0,
) -> SolverSolution:
    """Solves the portion optimization LP deterministically.
    
    Args:
        nutrient_coefficients: per-gram nutrient yield for each food (e.g. per_100g / 100.0).
                               Keys: 'energy', 'protein', 'carb', 'fat'.
        target_ranges: (target_min, target_max) for each core nutrient.
        gram_bounds: (min_grams, max_grams) for each food.
        preferred_grams: optional target grams for foods (None for foods without preference).
        objective_weights: optional engineering weights (default 1.0 for all).
        normalization_scales: optional scaling denominators S_k.
        primary_tolerance: slack allowed in Pass 2 to maintain primary optimality.
    """
    n_foods = len(gram_bounds)
    if n_foods == 0:
        raise ValueError("gram_bounds cannot be empty.")

    nutrients = ["energy", "protein", "carb", "fat"]
    for nut in nutrients:
        if nut not in nutrient_coefficients:
            raise KeyError(f"Missing nutrient coefficients for '{nut}'.")
        if len(nutrient_coefficients[nut]) != n_foods:
            raise ValueError(f"Coefficient count for '{nut}' ({len(nutrient_coefficients[nut])}) != food count ({n_foods}).")
        if nut not in target_ranges:
            raise KeyError(f"Missing target range for '{nut}'.")

    # 1. Deterministic Normalization Scales S_k
    scales: Dict[str, float] = {}
    if normalization_scales is not None:
        scales = dict(normalization_scales)
    else:
        for nut in nutrients:
            t_min, t_max = target_ranges[nut]
            scales[nut] = max((t_min + t_max) / 2.0, 1.0)

    # 2. Engineering Objective Weights w_k
    weights: Dict[str, float] = {}
    if objective_weights is not None:
        weights = dict(objective_weights)
    else:
        for nut in nutrients:
            weights[nut] = 1.0

    # 3. Variable Layout (Pass 1):
    # Indices:
    # 0 .. n_foods - 1: x_i (food grams)
    # n_foods + 0: u_energy
    # n_foods + 1: v_energy
    # n_foods + 2: u_protein
    # n_foods + 3: v_protein
    # n_foods + 4: u_carb
    # n_foods + 5: v_carb
    # n_foods + 6: u_fat
    # n_foods + 7: v_fat
    n_vars_pass1 = n_foods + 8

    # Objective vector c_pass1:
    c_pass1 = np.zeros(n_vars_pass1, dtype=float)
    for idx, nut in enumerate(nutrients):
        coeff = weights[nut] / scales[nut]
        u_idx = n_foods + 2 * idx
        v_idx = n_foods + 2 * idx + 1
        c_pass1[u_idx] = coeff
        c_pass1[v_idx] = coeff

    # Inequality constraints A_ub * var <= b_ub:
    # For each nutrient:
    # -sum_i c_{k,i} * x_i - u_k <= -t_min
    #  sum_i c_{k,i} * x_i - v_k <=  t_max
    A_ub_rows: List[List[float]] = []
    b_ub_vals: List[float] = []

    for idx, nut in enumerate(nutrients):
        t_min, t_max = target_ranges[nut]
        c_k = nutrient_coefficients[nut]

        # Below target constraint: -A_k(x) - u_k <= -t_min
        row_below = [0.0] * n_vars_pass1
        for i in range(n_foods):
            row_below[i] = -c_k[i]
        row_below[n_foods + 2 * idx] = -1.0
        A_ub_rows.append(row_below)
        b_ub_vals.append(-t_min)

        # Above target constraint: A_k(x) - v_k <= t_max
        row_above = [0.0] * n_vars_pass1
        for i in range(n_foods):
            row_above[i] = c_k[i]
        row_above[n_foods + 2 * idx + 1] = -1.0
        A_ub_rows.append(row_above)
        b_ub_vals.append(t_max)

    # Variable bounds:
    bounds_pass1: List[Tuple[float, Optional[float]]] = []
    for L_i, U_i in gram_bounds:
        bounds_pass1.append((float(L_i), float(U_i)))
    for _ in range(8):
        bounds_pass1.append((0.0, None))

    # Solve Pass 1:
    res1 = linprog(
        c_pass1,
        A_ub=np.array(A_ub_rows, dtype=float),
        b_ub=np.array(b_ub_vals, dtype=float),
        bounds=bounds_pass1,
        method="highs",
    )

    if not res1.success:
        return SolverSolution(
            success=False,
            optimized_grams=[0.0] * n_foods,
            violations={nut: (0.0, 0.0) for nut in nutrients},
            primary_objective_value=float("inf"),
            objective_components={nut: 0.0 for nut in nutrients},
            objective_weights_used=weights,
            normalization_scales_used=scales,
            solver_status=str(res1.status),
            solver_message=str(res1.message),
        )

    J_star = float(res1.fun)
    total_iters = getattr(res1, "nit", 0)

    # 4. Pass 2 (Deterministic Secondary Tie-Breaking):
    # Constrain J_primary <= J* + primary_tolerance:
    A_ub_pass2 = [list(r) for r in A_ub_rows]
    b_ub_pass2 = list(b_ub_vals)

    # Primary violation ceiling row: c_pass1 * vars <= J* + primary_tolerance
    row_primary_ceiling = list(c_pass1)
    A_ub_pass2.append(row_primary_ceiling)
    b_ub_pass2.append(J_star + primary_tolerance)

    # Check preferred grams:
    has_preferences = False
    pref_indices: List[int] = []
    if preferred_grams is not None:
        for i, p in enumerate(preferred_grams):
            if p is not None:
                has_preferences = True
                pref_indices.append(i)

    if has_preferences:
        # For each preferred food i: introduce d_i^+ >= 0, d_i^- >= 0
        # such that x_i - d_i^+ + d_i^- = p_i
        # Minimize sum_{i in pref} (d_i^+ + d_i^-) / max(U_i - L_i, 1.0)
        n_pref = len(pref_indices)
        n_vars_pass2 = n_vars_pass1 + 2 * n_pref

        # Extend inequality matrix to new width
        for r in A_ub_pass2:
            r.extend([0.0] * (2 * n_pref))

        c_pass2 = np.zeros(n_vars_pass2, dtype=float)
        A_eq_pass2: List[List[float]] = []
        b_eq_pass2: List[float] = []
        bounds_pass2 = list(bounds_pass1)

        for p_idx, food_i in enumerate(pref_indices):
            p_val = float(preferred_grams[food_i])
            L_i, U_i = gram_bounds[food_i]
            span_scale = max(float(U_i) - float(L_i), 1.0)

            d_pos_idx = n_vars_pass1 + 2 * p_idx
            d_neg_idx = n_vars_pass1 + 2 * p_idx + 1

            # Objective weight for deviation:
            c_pass2[d_pos_idx] = 1.0 / span_scale
            c_pass2[d_neg_idx] = 1.0 / span_scale

            # Equality constraint: x_food_i - d_pos + d_neg = p_val
            eq_row = [0.0] * n_vars_pass2
            eq_row[food_i] = 1.0
            eq_row[d_pos_idx] = -1.0
            eq_row[d_neg_idx] = 1.0
            A_eq_pass2.append(eq_row)
            b_eq_pass2.append(p_val)

            bounds_pass2.append((0.0, None))
            bounds_pass2.append((0.0, None))

        res2 = linprog(
            c_pass2,
            A_ub=np.array(A_ub_pass2, dtype=float),
            b_ub=np.array(b_ub_pass2, dtype=float),
            A_eq=np.array(A_eq_pass2, dtype=float),
            b_eq=np.array(b_eq_pass2, dtype=float),
            bounds=bounds_pass2,
            method="highs",
        )
    else:
        # Minimize total grams as a mathematical tie-breaker:
        c_pass2 = np.zeros(n_vars_pass1, dtype=float)
        for i in range(n_foods):
            c_pass2[i] = 1.0  # minimize total grams

        res2 = linprog(
            c_pass2,
            A_ub=np.array(A_ub_pass2, dtype=float),
            b_ub=np.array(b_ub_pass2, dtype=float),
            bounds=bounds_pass1,
            method="highs",
        )

    mode = (
        SecondaryObjectiveMode.PREFERENCE_DEVIATION
        if has_preferences
        else SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER
    )

    if not res2.success:
        # Pass 2 numerical or infeasibility failure must be explicitly reported
        return SolverSolution(
            success=False,
            optimized_grams=[0.0] * n_foods,
            violations={nut: (0.0, 0.0) for nut in nutrients},
            primary_objective_value=J_star,
            objective_components={},
            objective_weights_used=weights,
            normalization_scales_used=scales,
            solver_status="SECONDARY_SOLVER_FAILURE",
            solver_message=f"Secondary Pass 2 optimization failed: {res2.message}",
            iterations=total_iters + getattr(res2, "nit", 0),
            secondary_objective_mode=mode,
        )

    final_x = res2.x
    total_iters += getattr(res2, "nit", 0)
    status_msg = res2.message
    solver_stat = str(res2.status)

    optimized_grams = [float(final_x[i]) for i in range(n_foods)]

    violations: Dict[str, Tuple[float, float]] = {}
    obj_components: Dict[str, float] = {}

    for idx, nut in enumerate(nutrients):
        u_val = float(final_x[n_foods + 2 * idx])
        v_val = float(final_x[n_foods + 2 * idx + 1])
        violations[nut] = (u_val, v_val)
        norm_v = (u_val + v_val) / scales[nut]
        obj_components[nut] = norm_v

    # Independent secondary objective recomputation and verification
    secondary_solver = float(res2.fun)
    if has_preferences:
        recomp_val = sum(
            abs(float(final_x[food_i]) - float(preferred_grams[food_i]))
            / max(float(gram_bounds[food_i][1]) - float(gram_bounds[food_i][0]), 1.0)
            for food_i in pref_indices
        )
        assert abs(secondary_solver - recomp_val) <= 1e-4, (
            f"Secondary objective mismatch: solver={secondary_solver}, recomputed={recomp_val}"
        )
        obj_components["secondary_preference_deviation"] = recomp_val
        obj_components["secondary_objective_solver"] = secondary_solver
        obj_components["secondary_objective_recomputed"] = recomp_val
    else:
        recomp_val = sum(float(final_x[i]) for i in range(n_foods))
        assert abs(secondary_solver - recomp_val) <= 1e-4, (
            f"Secondary objective tie-breaker mismatch: solver={secondary_solver}, recomputed={recomp_val}"
        )
        obj_components["secondary_tie_breaker_total_grams"] = recomp_val
        obj_components["secondary_objective_solver"] = secondary_solver
        obj_components["secondary_objective_recomputed"] = recomp_val

    return SolverSolution(
        success=True,
        optimized_grams=optimized_grams,
        violations=violations,
        primary_objective_value=J_star,
        objective_components=obj_components,
        objective_weights_used=weights,
        normalization_scales_used=scales,
        solver_status=solver_stat,
        solver_message=status_msg,
        iterations=total_iters,
        secondary_objective_mode=mode,
    )
