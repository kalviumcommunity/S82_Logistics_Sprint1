Cascading Logistics Delay Intelligence Platform
A high-throughput, event-driven MERN-stack decision support engine designed to ingest fragmented logistics records, reconstruct multi-leg shipment journeys, expose hidden operational bottlenecks, model downstream delay propagation, and simulate preventive network interventions in real time.

System Overview & Architecture Evolution
Traditional logistics tracking software operates reactively, storing shipment scans, warehouse records, and transit exceptions in isolated data silos. This architectural fragmentation makes it impossible to detect or predict cascading delays—disruptions where a minor upstream variance (e.g., a 2-hour yard delay at an inbound hub) propagates downstream, causing missed connection windows and widespread contractual SLA violations.

This platform bridges that gap by unifying transactional data streams into an active, in-memory directed graph network (Warehouses represented as Nodes, Transit Routes as Edges).

Key Architectural Evolutions over Standard MERN:
High-Throughput Ingestion Buffering: Rather than writing high-frequency tracking scans directly to MongoDB—which induces severe database locks at scale—ingested event packets are stream-buffered via Redis Streams with sub-2ms absorption latencies.

Asynchronous Journey Reconstruction: Decoupled BullMQ background workers consume event batches from Redis Streams asynchronously, rebuilding immutable tracking sequences without degrading the user-facing API gateway.

Hybrid Graph-Cache Strategy: Network topology, route dependencies, and downstream reachability evaluations are computed directly within an in-memory adjacency matrix inside Redis, bypassing slow recursive relational queries or heavy document aggregations.

Dynamic Role-Based Presentation (RBAC): Built as a unified single-page client deployment that morphs its UI component matrix dynamically based on securely signed cryptographical claims embedded in the user's JWT.

Core Objectives
Data Synthesis: Integrate fragmented tracking points into structured, chronological, multi-modal paths.

Anomaly & Sequence Validation: Detect structural data anomalies (e.g., out-of-order timestamps, impossible geographical leaps).

Network Graph Resolution: Expose active transit bottlenecks and critical dependencies using graph traversal mechanics.

Cascade Modeling: Calculate downstream delay risk indices (0-100) using real-time traffic anomalies and granular weather matrices.

Cost-Aware Interventions: Compute financial trade-offs of preventative actions (e.g., comparing rerouting costs directly against SLA breach penalties).

Isolated Network Simulations: Provision sandboxed environment execution to evaluate "what-if" operational infrastructure changes without modifying live data.

Technology Stack
Frontend Core
React 19 & Vite: Component compilation and ultra-fast HMR building framework.

Tailwind CSS: Fully responsive, utility-first design language.

React Router v6: Secure client-side application routing with declarative, nested role guards.

TanStack Query (React Query) & Axios: Declarative server-state caching, automatic synchronization, and HTTP transport layer.

Data Visualization Layer: Cytoscape.js (interactive graph rendering) and Leaflet.js (geospatial tile tracking mapping).

Recharts: High-performance, declarative charting components.

Socket.IO Client: State synchronization and push notifications via persistent WebSockets.

Backend & Ingestion Core
Node.js & Express.js: Fast, minimalist backend runtime environment.

Redis & Redis Streams: High-velocity write target buffer, session storage, and live application graph cache.

BullMQ: Robust, Redis-backed distributed message queue handling resource-intensive background processing tasks.

Zod: Runtime type validation for API input protection and structural schema safety.

Socket.IO: Real-time event broadcasting to authenticated user clusters.

Pino: High-performance, structured JSON logger optimized for enterprise observability.

Data Layer
MongoDB Atlas: Highly scalable document repository.

MongoDB Time Series Collections: High-density, optimized storage partition optimized for rapid chronological ingestion of shipmentEvents.

Mongoose ODM: Explicit schemas, strong validation, and query modeling.

Repository Architecture
Plaintext
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
Dynamic Role-Based Access Interface (RBAC)
The application enforces a single frontend code bundle which dynamically adjusts visible features, actions, and layouts through 4 distinct logical clearances:

1. ADMIN (System Controller)
Scope: Full CRUD authorizations across all database collections.

Dashboard View: System performance panels, active user management grids, audit trails, and third-party API integration consumption meters (Weather/Traffic budgets).

2. OPERATIONS_MANAGER (Network Decision Maker)
Scope: Global situational awareness across the entire supply chain network.

Dashboard View: Interactive macro maps, alternative-route recommenders, financial penalty estimation models, and the complete What-If simulation execution engine.

3. WAREHOUSE_MANAGER (Local Hub Supervisor)
Scope: Specialized operations restricted to a single warehouse facility node.

Dashboard View: Inbound checklists, upcoming transfer connections, yard utilization gauges, and local dwell-time metric analytics.

4. VIEWER (Field Worker / Customer Success)
Scope: Read-only access to specific high-level shipment paths.

Dashboard View: Basic tracking lookup inputs and consumer-facing vertical timeline progress blocks.

Core Database Models
Plaintext
users                   # Administrative credentials, profile info, and RBAC claim tags.
warehouses              # Logistics network nodes (geographical points, handling metrics).
routes                  # Network transit edges linking warehouse nodes.
shipments               # High-level cargo records with target SLAs and billing reference points.
shipmentEvents          # Time Series Collection. Immutable event tracking log data.
shipmentJourneys        # Structured, reconstructed step-by-step route timelines.
transfers               # Inter-warehouse handoff records and vehicle assignment details.
delayReports            # Exception declarations tied to route paths or facilities.
weatherSnapshots        # Cached climate states linked to critical route hot-spots.
trafficSnapshots        # Real-time velocity metrics along route coordinates.
riskAssessments         # Generated risks indices, calculated weights, and anomaly tracking points.
recommendations         # Validated network optimization paths generated by the system.
simulations             # Sandbox scenarios tracking modifications versus standard models.
alerts                  # Real-time notifications pushed down active communication layers.
auditLogs               # Cryptographically verifiable logs recording major administrative updates.
Core API Specification
Authentication & Telemetry
POST /api/v1/auth/login - Authenticate users and dispatch signed JWT access and refresh configurations.

GET /api/v1/health - Expose container service state, Redis memory pools, and database connection metrics.

Logistics Core & Ingestion
POST /api/v1/shipment-events - Ingestion gateway. Buffers incoming telemetry streams directly into Redis Streams.

GET /api/v1/shipments/:id/journey - Returns the fully compiled, chronologically constructed journey data for a single target container tracking ID.

Analytics & Intelligence
GET /api/v1/network/graph - Generates adjacency schema tracking route constraints, active bottlenecks, and connection links.

POST /api/v1/simulations/run - Instantiates isolated what-if execution modules against current cache states. (Restricted: ADMIN, OPERATIONS_MANAGER)

POST /api/v1/recommendations/:id/approve - Validates alternative routes, rewrites operational paths, and alerts downstream teams. (Restricted: ADMIN, OPERATIONS_MANAGER)

Operational Installation Sequence
Prerequisite Checklist
Node.js Engine (v20+ recommended)

Docker Desktop & Docker Compose Engine

Access keys for Weather and Map/Traffic service platforms

Local Deployment Matrix
Clone the project infrastructure:

Bash
git clone <repository-url>
cd cascading-logistics-delay-platform
Initialize service environment values:

Bash
cp .env.example .env
# Populate newly generated .env variables with respective local parameters
Orchestrate back-end caching and persistent storage layers:

Bash
docker compose up -d
Install root dependencies and spin up core services:

Bash
# Build and execute the background ingestion and API engines
cd server
npm install
npm run dev

# Open a separate shell terminal instance to launch the single-page interface
cd ../client
npm install
npm run dev
