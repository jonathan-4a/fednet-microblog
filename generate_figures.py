"""
generate_figures.py — Produce paper figures from real simulation output.

Reads CSVs written by seeder/evaluator.py:
  seeder/results/agent_precision.csv   — per-agent, per-fold consumed precision
  seeder/results/fold_reachability.csv — per-fold content reachability
  seeder/results/fold_recovery.csv     — per-fold cross-instance recovery rate

Run evaluator first:
    cd seeder && python evaluator.py
Then produce figures:
    python generate_figures.py
"""

import os
import sys
import csv

import numpy as np
import matplotlib.pyplot as plt

RESULTS_DIR = os.path.join("seeder", "results")
FIGURES_DIR = "figures"

os.makedirs(FIGURES_DIR, exist_ok=True)


def load_csv(path: str) -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def check_results():
    needed = [
        os.path.join(RESULTS_DIR, "agent_precision.csv"),
        os.path.join(RESULTS_DIR, "fold_reachability.csv"),
        os.path.join(RESULTS_DIR, "fold_recovery.csv"),
    ]
    missing = [p for p in needed if not os.path.exists(p)]
    if missing:
        print("ERROR: Missing simulation output files:")
        for p in missing:
            print(f"  {p}")
        print("\nRun the evaluator first:")
        print("  cd seeder && python evaluator.py")
        sys.exit(1)


check_results()

# ── Load data ──────────────────────────────────────────────────────────────

prec_rows  = load_csv(os.path.join(RESULTS_DIR, "agent_precision.csv"))
reach_rows = load_csv(os.path.join(RESULTS_DIR, "fold_reachability.csv"))
recov_rows = load_csv(os.path.join(RESULTS_DIR, "fold_recovery.csv"))

# Per-agent consumed precision (averaged across folds per agent)
from collections import defaultdict

agent_prec: dict[str, dict[str, list[float]]] = defaultdict(lambda: {"chron": [], "rando": [], "perso": []})
for row in prec_rows:
    aid = row["agent_id"]
    agent_prec[aid]["chron"].append(float(row["chron_precision"]))
    agent_prec[aid]["rando"].append(float(row["rando_precision"]))
    agent_prec[aid]["perso"].append(float(row["perso_precision"]))

chron_prec = np.array([np.mean(v["chron"]) for v in agent_prec.values()])
rando_prec = np.array([np.mean(v["rando"]) for v in agent_prec.values()])
perso_prec = np.array([np.mean(v["perso"]) for v in agent_prec.values()])

# Per-fold reachability
rand_r  = np.array([float(r["random_reachability"]) for r in reach_rows])
chron_r = np.array([float(r["chron_reachability"])  for r in reach_rows])
pers_r  = np.array([float(r["pers_reachability"])   for r in reach_rows])

# Per-fold recovery
base_rec = np.array([float(r["baseline_recovery"]) for r in recov_rows])
pers_rec = np.array([float(r["pers_recovery"])     for r in recov_rows])

print(f"Consumed precision — Random: {rando_prec.mean():.3f}  "
      f"Chron: {chron_prec.mean():.3f}  Pers: {perso_prec.mean():.3f}")
print(f"Reachability — Random: {rand_r.mean():.3f}  "
      f"Chron: {chron_r.mean():.3f}  Pers: {pers_r.mean():.3f}")
print(f"Recovery — Baseline: {base_rec.mean():.3f}  Pers: {pers_rec.mean():.3f}")

# ── Figure 1: per-agent consumed precision strip plot ──────────────────────

fig1, ax = plt.subplots()

data   = [rando_prec, chron_prec, perso_prec]
labels = ["Random", "Chronological", "Personalized"]

rng = np.random.default_rng(17)
for i, d in enumerate(data):
    xj = rng.uniform(i + 0.85, i + 1.15, len(d))
    ax.scatter(xj, d, s=8, alpha=0.5)
    q25, q75 = np.percentile(d, [25, 75])
    ax.vlines(i + 1, q25, q75, colors="black", linewidths=3)
    m = d.mean()
    ax.hlines(m, i + 0.82, i + 1.18, colors="black", linewidths=1.5)
    ax.text(i + 1.22, m, f"μ={m:.2f}", va="center", fontsize=8)

ax.set_xticks([1, 2, 3])
ax.set_xticklabels(labels)
ax.set_ylabel("Consumed Precision")
ax.set_title(
    f"Per-agent consumed precision by ranking strategy\n"
    f"n = {len(chron_prec)} agents, {len(reach_rows)}-fold average"
)

plt.tight_layout()
fig1.savefig(os.path.join(FIGURES_DIR, "relevance_distribution.png"), bbox_inches="tight")
plt.close(fig1)
print("Figure 1 saved.")

# ── Figure 2: reachability + recovery bar charts ───────────────────────────

fig2, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4))

fold_data = [rand_r, chron_r, pers_r]
means_r = [d.mean() for d in fold_data]
stds_r  = [d.std()  for d in fold_data]

for i, (m, s) in enumerate(zip(means_r, stds_r)):
    ax1.bar(i + 1, m, yerr=s, capsize=4, alpha=0.55)
rng2 = np.random.default_rng(99)
for i, fv in enumerate(fold_data):
    xj = rng2.uniform(i + 0.88, i + 1.12, len(fv))
    ax1.scatter(xj, fv, color="black", s=12, zorder=3, alpha=0.6)
ax1.set_xticks([1, 2, 3])
ax1.set_xticklabels(["Random", "Chronological", "Personalized"])
ax1.set_ylabel("Content Reachability")
ax1.set_title(f"In-graph seed reachability\nacross {len(reach_rows)} folds")

disc_data  = [base_rec, pers_rec]
disc_means = [d.mean() for d in disc_data]
disc_stds  = [d.std()  for d in disc_data]

for i, (m, s) in enumerate(zip(disc_means, disc_stds)):
    ax2.bar(i + 1, m, yerr=s, capsize=4, alpha=0.55)
rng3 = np.random.default_rng(88)
for i, fv in enumerate(disc_data):
    xj = rng3.uniform(i + 0.88, i + 1.12, len(fv))
    ax2.scatter(xj, fv, color="black", s=12, zorder=3, alpha=0.6)
ax2.set_xticks([1, 2])
ax2.set_xticklabels(["Baseline\n(random sample)", "Personalized\ndiscovery"])
ax2.set_ylabel("Recovery Rate")
ax2.set_title(f"Cross-instance out-of-graph recovery\nacross {len(recov_rows)} folds")

plt.tight_layout()
fig2.savefig(os.path.join(FIGURES_DIR, "results_comparison.png"), bbox_inches="tight")
plt.close(fig2)
print("Figure 2 saved.")
