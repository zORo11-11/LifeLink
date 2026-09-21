# Optimum LifeLink Architecture Implementation

We have successfully refactored and transformed **LifeLink** into a production-ready, highly secure, scalable, and real-time blood donation platform.

---

## Key Refactoring & Optimization Pillars

### 1. **Secure JWT Authentication & Role-Based Access Control (RBAC)**
- **Backend Middleware (`backend/middleware/auth.js`)**: Implemented `verifyToken` and `requireRole` middleware. Protects sensitive API endpoints against unauthorized access.
- **JWT Generation**: Registration and login endpoints (`/api/donors/login`, `/api/hospitals/login`) generate signed JWT tokens (`expiresIn: 7d`).
- **Frontend Interceptor (`src/services/api.js`)**: Centralized API service automatically attaches `Authorization: Bearer <token>` to all HTTP requests.
- **Session Management (`src/context/AuthContext.js`)**: Global auth state management for donor/hospital sessions with auto-login recovery.
- **Route Guards (`src/components/ProtectedRoute.js`)**: Protects dashboard routes (`/dashboard/donor`, `/dashboard/hospital`) against unauthenticated access.

---

### 2. **Real-Time Event Sync via WebSockets (Socket.IO)**
- **Eliminated 3-second HTTP Polling**: Replaced expensive `setInterval` polling loops with event-driven WebSockets.
- **Server Gateway (`backend/server.js`)**: Configured Socket.IO instance.
- **Socket Broadcasts (`backend/routes/reqRoutes.js`)**: Instantly broadcasts `request_created` and `request_updated` events whenever requests are created, accepted, or status-updated.
- **Frontend Socket Provider (`src/context/SocketContext.js`)**: Supplies live socket listeners directly to `DonorDashboard` and `HospitalDashboard` for immediate UI synchronization.

---

### 3. **Persistent Database-Backed Inventory & Audit Logs**
- **Eliminated Browser `localStorage` Reliance**: Replaced temporary `localStorage` inventory with MongoDB Atlas persistent models.
- **MongoDB Schemas**:
  - `backend/models/Inventory.js`: Stores blood stock levels (`O+`, `O-`, `A+`, etc.) and active unit batches with expiry tracking.
  - `backend/models/AuditLog.js`: Records fulfillment history logs upon donation completion.
- **Inventory API Endpoints (`backend/routes/inventoryRoutes.js`)**:
  - `GET /api/inventory/:hospitalId`: Retrieves stock summaries & active batches.
  - `POST /api/inventory/add-batch`: Adds/replenishes stock.
  - `DELETE /api/inventory/batch/:hospitalId/:batchId`: Discards expired stock.
  - `GET /api/inventory/history/:hospitalId`: Fetches audit log history.

---

### 4. **Atomic Concurrency Locks (Preventing Double Acceptance)**
- **Race Condition Prevention (`backend/routes/reqRoutes.js`)**:
  - Updated `PATCH /api/requests/:id/accept` to execute atomic MongoDB updates (`findOneAndUpdate` with status constraint).
  - Ensures a blood request cannot be double-accepted by multiple donors simultaneously.

---

## Architectural Comparison

| Dimension | Previous Prototype State | Optimized Production State |
|---|---|---|
| **Data Persistence** | Volatile `localStorage` | Persistent MongoDB Atlas Schemas |
| **Authentication** | Unsigned JSON state | JWT Verification + Role-Based Access Control |
| **Real-Time Sync** | High-overhead 3s HTTP Polling | Bi-directional WebSockets (`Socket.IO`) |
| **Concurrency Control** | Client-side race conditions | Atomic MongoDB Locks |
| **Code Structure** | Monolithic inline fetches | Central API Service + Context API + Protected Guards |

---

## Verification & Next Steps
- Start the server using: `npm run dev` / `node backend/server.js`
- Test donor login/register, broadcast emergency requests from hospital dashboard, accept from donor dashboard, and verify live Socket updates.
