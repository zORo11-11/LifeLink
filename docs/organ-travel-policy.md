# LifeLink Organ Travel & Viability Policy

> **ACADEMIC DEMONSTRATION NOTICE**
> This policy document and the related backend utilities (`organLogisticsService.js`) are created for **academic demonstration and mathematical modeling only**.
> They do **NOT** utilize real-world traffic data, ambulance routing, or clinical viability validation, and must **NOT** be used for actual medical transport or allocation decisions.

---

## 1. Geographic Distance Calculation

The engine calculates distance locally without relying on external third-party paid APIs like Google Maps.

* **Algorithm**: Haversine Formula (calculates the great-circle distance between two points on a sphere).
* **Input Coordinates**: standard GeoJSON format `[Longitude, Latitude]`.
* **Output Unit**: Kilometers (km).
* **Limitation Warning**: The Haversine distance is a straight-line "as the crow flies" measurement. It does not account for road networks, terrain, or natural barriers (lakes, mountains).

---

## 2. Approximate Travel-Time Estimation

Because straight-line distance is used, the travel time is heavily approximated for demonstration:

* **Assumed Average Speed**: `60 km/h` (configurable parameter `AVERAGE_TRAVEL_SPEED_KMH`).
* **Formula**: `Travel Time (hours) = Distance (km) / Average Speed (km/h)`.
* **Base Logistics Buffer**: A fixed buffer (e.g., `30 minutes`) is added to represent procurement handoff and hospital prep time.
* **Disclaimer**: This will wildly vary from actual road transport times. It simply serves to demonstrate the *concept* of filtering recipients by travel time against organ viability.

---

## 3. Organ Viability Windows

Organs have a strict timeframe (ischemic time) between procurement (clamping) and transplantation. If the estimated travel time exceeds the remaining viability window, the candidate hospital is discarded from the match list.

### Configurable Academic Default Windows

| Organ Type | Viability Limit | Notes |
| :--- | :--- | :--- |
| **Heart** | 4 hours | Highly time-sensitive. |
| **Lung** | 4 hours | Highly time-sensitive. |
| **Liver** | 8 hours | Moderate viability. |
| **Pancreas** | 12 hours | Configurable academic default. |
| **Kidney** | 24 hours | Highest viability window, can often travel the furthest in real models. |

### Evaluation Workflow

1. Calculate `Expiry Timestamp = Procurement Timestamp + Viability Limit`.
2. Check if Current Time > Expiry Timestamp. If yes -> **EXPIRED**.
3. Calculate `Estimated Arrival = Current Time + Estimated Travel Time`.
4. If `Estimated Arrival > Expiry Timestamp` -> **EXCEEDED_VIABILITY_LIMIT**. Waitlist candidate is disqualified.
