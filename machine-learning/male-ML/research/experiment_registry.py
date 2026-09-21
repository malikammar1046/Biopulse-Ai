"""
research/experiment_registry.py
-------------------------------
Lightweight, reproducible experiment registry for BioPulse AI Phase 3 research.
Records experiment configurations, feature sets, hyperparameters, and evaluation metrics
into machine-readable JSON format.
"""

from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class ExperimentRegistry:
    """
    Lightweight experiment registry for tracking machine learning research trials.
    Stores metadata and serialized performance metrics in a centralized JSON store.
    """

    def __init__(self, registry_file: Optional[str] = None):
        if registry_file is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            reports_dir = os.path.join(base_dir, "reports")
            os.makedirs(reports_dir, exist_ok=True)
            registry_file = os.path.join(reports_dir, "experiment_registry.json")
            
        self.registry_file = registry_file
        self.experiments: List[Dict[str, Any]] = self._load()

    def _load(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save(self) -> None:
        os.makedirs(os.path.dirname(self.registry_file), exist_ok=True)
        with open(self.registry_file, "w", encoding="utf-8") as f:
            json.dump(self.experiments, f, indent=2)

    def register_experiment(
        self,
        experiment_id: str,
        name: str,
        description: str,
        dataset: str,
        sample_size: Dict[str, Any],
        features: List[str],
        model_type: str,
        hyperparameters: Dict[str, Any],
        metrics: Dict[str, Any],
        notes: Optional[str] = None,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        """Records a new experiment entry in the registry."""
        entry = {
            "experiment_id": experiment_id,
            "name": name,
            "description": description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "random_seed": random_seed,
            "dataset": dataset,
            "sample_size": sample_size,
            "feature_count": len(features),
            "features": features,
            "model_type": model_type,
            "hyperparameters": hyperparameters,
            "metrics": metrics,
            "notes": notes or ""
        }

        # Replace existing with same ID or append
        existing_idx = next((i for i, e in enumerate(self.experiments) if e["experiment_id"] == experiment_id), None)
        if existing_idx is not None:
            self.experiments[existing_idx] = entry
        else:
            self.experiments.append(entry)

        self._save()
        return entry

    def get_experiment(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        return next((e for e in self.experiments if e["experiment_id"] == experiment_id), None)

    def list_experiments(self) -> List[Dict[str, Any]]:
        return list(self.experiments)
