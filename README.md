# Cascading Logistics Delay Intelligence Platform

A high-throughput, event-driven MERN-stack decision support engine designed to ingest fragmented logistics records, reconstruct multi-leg shipment journeys, expose hidden operational bottlenecks, model downstream delay propagation, and simulate preventive network interventions in real time.

---

## System Overview & Architecture Evolution

Traditional logistics tracking software operates reactively, storing shipment scans, warehouse records, and transit exceptions in isolated data silos. This architectural fragmentation makes it impossible to detect or predict **cascading delays**—disruptions where a minor upstream variance (e.g., a 2-hour yard delay at an inbound hub) propagates downstream, causing missed connection windows and widespread contractual SLA violations.

This platform bridges that gap by unifying transactional data streams into an active, **in-memory directed graph network** (Warehouses represented as Nodes, Transit Routes as Edges). 

### Key Architectural Evolutions over Standard MERN:
* **High-Throughput Ingestion Buffering:** Rather than writing high-frequency tracking scans directly to MongoDB—which induces severe database locks at scale—ingested event packets are stream-buffered via **Redis Streams** with sub-2ms absorption latencies.
* **Asynchronous Journey Reconstruction:** Decoupled **BullMQ background workers** consume event batches from Redis Streams asynchronously, rebuilding immutable tracking sequences without degrading the user-facing API gateway.
* **Hybrid Graph-Cache Strategy:** Network topology, route dependencies, and downstream reachability evaluations are computed directly within an in-memory adjacency matrix inside **Redis**, bypassing slow recursive relational queries or heavy document aggregations.
* **Dynamic Role-Based Presentation (RBAC):** Built as a unified single-page client deployment that morphs its UI component matrix dynamically based on securely signed cryptographical claims embedded in the user's JWT.

---

## Core Objectives

* **Data Synthesis:** Integrate fragmented tracking points into structured, chronological, multi-modal paths.
* **Anomaly & Sequence Validation:** Detect structural data anomalies (e.g., out-of-order timestamps, impossible geographical leaps).
* **Network Graph Resolution:** Expose active transit bottlenecks and critical dependencies using graph traversal mechanics.
* **Cascade Modeling:** Calculate downstream delay risk indices (0-100) using real-time traffic anomalies and granular weather matrices.
* **Cost-Aware Interventions:** Compute financial trade-offs of preventative actions (e.g., comparing rerouting costs directly against SLA breach penalties).
* **Isolated Network Simulations:** Provision sandboxed environment execution to evaluate "what-if" operational infrastructure changes without modifying live data.

---

## Technology Stack

### Frontend Core
* **React 19 & Vite:** Component compilation and ultra-fast HMR building framework.
* **Tailwind CSS:** Fully responsive, utility-first design language.
* **React Router v6:** Secure client-side application routing with declarative, nested role guards.
* **TanStack Query (React Query) & Axios:** Declarative server-state caching, automatic synchronization, and HTTP transport layer.
* **Data Visualization Layer:** **Cytoscape.js** (interactive graph rendering) and **Leaflet.js** (geospatial tile tracking mapping).
* **Recharts:** High-performance, declarative charting components.
* **Socket.IO Client:** State synchronization and push notifications via persistent WebSockets.

### Backend & Ingestion Core
* **Node.js & Express.js:** Fast, minimalist backend runtime environment.
* **Redis & Redis Streams:** High-velocity write target buffer, session storage, and live application graph cache.
* **BullMQ:** Robust, Redis-backed distributed message queue handling resource-intensive background processing tasks.
* **Zod:** Runtime type validation for API input protection and structural schema safety.
* **Socket.IO:** Real-time event broadcasting to authenticated user clusters.
* **Pino:** High-performance, structured JSON logger optimized for enterprise observability.

### Data Layer
* **MongoDB Atlas:** Highly scalable document repository.
* **MongoDB Time Series Collections:** High-density, optimized storage partition optimized for rapid chronological ingestion of `shipmentEvents`.
* **Mongoose ODM:** Explicit schemas, strong validation, and query modeling.

---

## Repository Architecture

```text
cascading-logistics-delay-platform/
├── client/                     # Single-Page Architecture Front-End
│   ├── src/
│   │   ├── components/         # Shared Design Components (Buttons, Maps, Tables)
│   │   ├── context/            # Auth, WebSocket, and Global State Providers
│   │   ├── features/           # Contextual Domain Layouts
│   │   │   ├── command-center/ # Live maps, Cytoscape graph, Simulation Engine
│   │   │   ├── warehouse/      # Localized schedules, queue indicators
│   │   │   ├── admin/          # User management, telemetry dashboards
│   │   │   └── tracking/       # Simple lookup & chronological timeline steps
│   │   ├── hooks/              # Custom hook wrappers (useAuth, useSocket)
│   │   └── routes/             # Client-side protected route components
├── server/                     # Monolithic Express Gateway & Processors
│   ├── src/
│   │   ├── api/                # Route Registries & Controller Strategies
│   │   ├── middleware/         # Auth verification & RBAC interceptors
│   │   ├── models/             # Mongoose Data Modeling Schemas
│   │   ├── services/           # Reconstruction Engine & Graph Layer logic
│   │   └── workers/            # BullMQ background stream consumers
├── shared/                     # Shared Types and Validations
├── infrastructure/             # Docker, Orchestration, & Nginx Configurations
├── docker-compose.yml          # Containerized Orchestration Profile
└── README.md
