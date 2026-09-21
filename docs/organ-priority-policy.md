# LifeLink Organ Donation Priority Scoring Policy

> **ACADEMIC DEMONSTRATION NOTICE**
> This policy document and the corresponding software algorithms are created strictly for **academic demonstration and educational decision-support prototyping**. It is **NOT** a clinically validated medical transplant allocation policy (such as UNOS/OPTN or Eurotransplant) and must **NOT** be used for actual clinical organ allocation decisions.

---

## 1. Overview & Policy Objective

The LifeLink Organ Allocation Engine scores and ranks eligible waitlist recipients for an available donor organ using a deterministic, transparent academic point system.

```text
Total Priority Score = Base Urgency Score + Waiting Days Score + HLA Match Score
```

---

## 2. Scoring Components & Weights

### A. Base Urgency Score
Medical urgency reflects the immediate critical status of the recipient on the waitlist.

| Urgency Category | Base Points | Description |
| :--- | :--- | :--- |
| **Critical** | `100` | Immediate life-support or acute organ failure requiring urgent transplant within 24-48 hours. |
| **High** | `60` | Severe functional impairment with frequent hospitalizations. |
| **Moderate** | `30` | Stable waitlist candidate receiving standard maintenance treatment. |

---

### B. Waiting Days Score
To ensure fairness for patients registered on the waitlist over extended periods:

* **Rate**: `1 point` per full waiting day registered.
* **Cap**: Maximum **`30 points`** (equivalent to 30 days).
* **Rationale**: Capping waiting-time points prevents long wait times from overriding critical medical urgency.

---

### C. HLA (Human Leukocyte Antigen) Similarity Score
Optional tissue typing matching between donor and recipient:

* **Evaluated Loci**: HLA-A, HLA-B, and HLA-DR.
* **Points**: `10 points` per matching locus.
* **Maximum HLA Score**: **`30 points`** (3/3 locus match).
* **Missing Data Policy**: If HLA typing is missing or incomplete for either donor or recipient, the algorithm safely assigns `0 points` for unassessed loci rather than disqualifying the candidate or assuming a full match.

---

## 3. Strict Compatibility Pre-Filters

Before any candidate recipient is scored or ranked, they must pass three strict boolean pre-filters:

1. **Organ Type Match**: Recipient’s requested organ type must exactly match the donor organ type (`Heart`, `Lung`, `Liver`, `Kidney`, or `Pancreas`).
2. **Organ Availability**: The organ status must be active (`Available`).
3. **ABO / Rh Blood Group Compatibility**: The donor blood group must be strictly compatible with the recipient blood group according to standard ABO/Rh compatibility rules.

### ABO/Rh Compatibility Matrix

| Donor Group | Compatible Recipient Blood Groups |
| :--- | :--- |
| **O-** | `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+` (Universal Donor) |
| **O+** | `O+`, `A+`, `B+`, `AB+` |
| **A-** | `A-`, `A+`, `AB-`, `AB+` |
| **A+** | `A+`, `AB+` |
| **B-** | `B-`, `B+`, `AB-`, `AB+` |
| **B+** | `B+`, `AB+` |
| **AB-** | `AB-`, `AB+` |
| **AB+** | `AB+` (Universal Recipient) |

---

## 4. Summary of Minimum and Maximum Scores

| Score Component | Minimum | Maximum |
| :--- | :---: | :---: |
| Base Urgency | 30 | 100 |
| Waiting Days | 0 | 30 |
| HLA Match | 0 | 30 |
| **Total Score Range** | **30** | **160** |

---

## 5. Candidate Ranking Policy

1. All candidates are evaluated for blood, organ type, and status compatibility.
2. Ineligible candidates are separated into an `ineligibleCandidates` list with explicit exclusion reasons documented.
3. Eligible candidates are ranked in descending order of `totalScore`.
4. The candidate with the highest `totalScore` is designated as the `topCandidate`.
