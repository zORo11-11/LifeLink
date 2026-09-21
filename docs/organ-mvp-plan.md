# LifeLink Organ Donation & Allocation Module — Economical MVP Plan

## 1. One-Time Repository Inspection Summary

* **Backend Entry Point**: `backend/server.js` (Express + Socket.IO server running on port 5000/env PORT).
* **Frontend Entry Point**: `src/index.js` rendering `src/App.js` with Parcel bundler.
* **Existing Models**:
  * `backend/models/Hospitals.js` (Hospital schema & authentication model)
  * `backend/models/Donor.js` (Donor/User schema with location coordinates and blood group)
  * `backend/models/BloodRequest.js` (Blood request schema)
  * `backend/models/Inventory.js` (Blood inventory schema)
  * `backend/models/AuditLog.js` (Audit log schema)
* **Existing Authentication Middleware**: `backend/middleware/auth.js` (`verifyToken`, `requireRole`, JWT token decoding).
* **Existing Dashboard**: `src/pages/HospitalDashboard.js` (tab-based UI: Emergency, Map, Inventory, Check-In, Reports).
* **Existing API Service**: `src/services/api.js` (wraps `fetch` with JWT headers).
* **Existing File Upload System**: None pre-installed. Metadata-only record references will be used for medical records to avoid adding complex storage dependencies.
* **Existing Notification System**: Toast notifications on frontend + Socket.IO server broadcast capabilities (`req.app.get('io')`). An `OrganNotification` schema or embedded notification state will be added.
* **Existing Test Commands**: `npm test` in `backend` (currently default `exit 1`).
* **Existing Blood Donation Models & Routes**: `BloodRequest.js`, `Inventory.js`, `AuditLog.js`, `reqRoutes.js`, `inventoryRoutes.js`, `hospitalauth.js`, `auth.js`, `donorRoutes.js`.

---

## 2. File Strategy

### Existing Relevant Files to Reuse
* `backend/middleware/auth.js` — Authentication & JWT role check middleware.
* `backend/models/Hospitals.js` — Hospital schema for donor/recipient hospital references and coordinates.
* `backend/models/AuditLog.js` — Audit history patterns.
* `src/services/api.js` — Client HTTP helper with bearer token authorization.
* `src/context/AuthContext.js` — JWT session and current user state.
* `src/context/SocketContext.js` — WebSocket connection.

### Files to Create
* `docs/organ-mvp-plan.md` — This architecture plan (Phase 0).
* `docs/organ-priority-policy.md` — Priority calculation policy documentation (Phase 2).
* `docs/organ-travel-policy.md` — Distance and viability window calculation documentation (Phase 3).
* `backend/models/OrganRecipient.js` — Organ Recipient schema with blood group, urgency, HLA markers, and medical metadata (Phase 1).
* `backend/models/OrganDonor.js` — Organ Donor and available organ schema with GeoJSON location and 2dsphere index (Phase 1).
* `backend/models/OrganAllocation.js` — Organ Allocation, recommendation, and offer lifecycle schema (Phase 1).
* `backend/models/OrganNotification.js` — In-app organ notification schema (Phase 1/6).
* `backend/services/organMatchingService.js` — Core matching logic: Haversine distance, travel time estimation, blood group compatibility, viability filtering, priority scoring (Phase 2 & 3).
* `backend/routes/organRoutes.js` — API routes for Recipients, Donors, Organs, Matching, and Offers (Phase 4).
* `backend/tests/organModule.test.js` — Minimal backend integration unit/module tests (Phase 7).
* `src/components/Hospital/OrganWaitlist.js` — Recipient waitlist management component (Phase 5).
* `src/components/Hospital/OrganProcurement.js` — Donor and available organ registration component (Phase 5).
* `src/components/Hospital/OrganMatchingResults.js` — Ranked matching output display component (Phase 5).
* `src/components/Hospital/OrganOffers.js` — Incoming and outgoing allocation offer management component (Phase 5).
* `src/components/Hospital/OrganAllocationStatus.js` — Status tracking and audit log display component (Phase 5).

### Files to Modify
* `backend/server.js` — Mount `/api/organ` routes (Phase 4).
* `src/pages/HospitalDashboard.js` — Integrate Organ Donation module navigation tabs & notification counter (Phase 5).
* `README.md` — Update documentation with organ donation API endpoints, priority scoring rules, and demo setup instructions (Phase 8).

### Missing Dependencies
* None required for core functionality. (Native Node `http`, `crypto`, `mongoose`, `express`, `jsonwebtoken` are sufficient). Standard Node test runner (`node --test`) can be used for zero-dependency testing.

---

## 3. Implementation Plan by Phase

1. **Phase 0 — Plan Documentation**: Inspect repo and output `docs/organ-mvp-plan.md`.
2. **Phase 1 — Minimal Database Models**: Implement `OrganRecipient`, `OrganDonor`, `OrganAllocation`, and `OrganNotification` schemas with `2dsphere` indexes and validation.
3. **Phase 2 — Simple Matching Engine & Policies**: Implement `organMatchingService.js` (priority scoring, blood compatibility, HLA matching) and write `docs/organ-priority-policy.md`.
4. **Phase 3 — Economical Distance & Viability Filter**: Implement local Haversine distance, travel time estimation, and viability window buffer filtering; write `docs/organ-travel-policy.md`.
5. **Phase 4 — Backend API Routes**: Build `/api/organ` endpoints for Recipients, Donors/Organs, Matching Engine, and Offers (Creation, Acceptance, Decline, Expiry).
6. **Phase 5 — Minimal Hospital Dashboard UI**: Build organ management tabs in Hospital Dashboard (Waitlist, Procurement, Matching, Offers, Allocation Status).
7. **Phase 6 — Medical Records & In-App Notifications**: Implement metadata-only medical record references and simple idempotent in-app notification triggers.
8. **Phase 7 — Testing & Integration**: Run automated unit/integration tests for matching, offer state transitions, duplicate acceptance prevention, and existing blood module regression.
9. **Phase 8 — Final Audit & Documentation**: Verify constraints, security, error handling, and update `README.md`.
