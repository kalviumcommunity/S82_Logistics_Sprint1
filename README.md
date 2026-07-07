# Cascading Logistics Delay Intelligence Platform

A full-stack MERN-based logistics intelligence and decision-support platform designed to integrate fragmented shipment records, reconstruct shipment journeys, identify recurring operational bottlenecks, detect cascading delivery delays, incorporate real-time weather and traffic conditions, calculate dynamic route risk, and recommend preventive operational interventions.

---

## Overview

Modern logistics networks generate large volumes of operational data through shipment scans, warehouse transfers, delay reports, route records, weather conditions, and traffic information.

These datasets are often stored and analyzed independently.

As a result, logistics operators struggle to understand:

* where delays originate,
* which routes consistently produce delays,
* which warehouses act as operational bottlenecks,
* how delays propagate through downstream transfers,
* whether a shipment will miss its next connection,
* how weather and traffic conditions affect delivery performance,
* which shipments and warehouses will be affected by an existing disruption,
* whether rerouting or holding a shipment is the better decision.

The Cascading Logistics Delay Intelligence Platform solves this problem by transforming fragmented logistics data into unified shipment journeys, operational analytics, dynamic risk assessments, cascade intelligence, simulations, alerts, and actionable recommendations.

---

## Problem Statement

A logistics company tracks shipment scans, delay reports, and warehouse transfer records separately, making it impossible to predict which operational routes consistently produce cascading delivery delays.

Traditional shipment-tracking applications primarily display shipment status and historical events.

They do not adequately answer:

1. Where did a delay originate?
2. Why did the delay occur?
3. Which routes and warehouses repeatedly generate delays?
4. Will the delay propagate downstream?
5. Which shipments, transfers, warehouses, and customers will be affected?
6. How will weather and traffic conditions influence the shipment?
7. What intervention should operations teams perform?
8. Is rerouting worth the additional operational cost?

This project addresses these problems through a unified logistics intelligence platform.

---

## Core Objectives

The platform is designed to:

* integrate fragmented logistics datasets,
* validate and normalize operational records,
* reconstruct complete shipment journeys,
* calculate route and warehouse performance metrics,
* identify recurring bottlenecks,
* detect historical cascading delays,
* estimate the probability of future delay propagation,
* incorporate weather conditions,
* incorporate real-time traffic conditions,
* calculate dynamic shipment and route risk,
* estimate dynamic arrival times,
* detect likely missed transfer connections,
* analyze logistics network dependencies,
* discover alternative routes,
* evaluate intervention costs,
* recommend preventive operational actions,
* simulate what-if scenarios,
* generate real-time operational alerts,
* explain the factors contributing to risk scores and recommendations.

---

## Major Platform Capabilities

### Unified Shipment Journey Reconstruction

Combines shipment scans, transfers, warehouse events, delays, and external conditions into chronological shipment journeys.

### Data Quality Intelligence

Detects:

* duplicate events,
* missing timestamps,
* invalid references,
* impossible event sequences,
* incomplete shipment journeys.

### Route Performance Analytics

Analyzes:

* shipment volume,
* transit duration,
* average delays,
* delay frequency,
* missed transfers,
* SLA violations,
* route reliability.

### Warehouse Bottleneck Detection

Identifies warehouses experiencing:

* excessive dwell time,
* high utilization,
* processing delays,
* queue congestion,
* missed outbound transfers,
* downstream delay propagation.

### Cascading Delay Intelligence

Detects how an upstream disruption propagates across:

Shipment → Route → Warehouse → Transfer → Downstream Route → Final Delivery.

### Dynamic ETA Estimation

Calculates arrival estimates using:

* historical performance,
* upstream delays,
* warehouse congestion,
* weather conditions,
* traffic conditions,
* transfer waiting times.

### Transfer Risk Analysis

Classifies upcoming shipment transfers as:

* SAFE,
* AT RISK,
* LIKELY MISSED,
* MISSED.

### Dynamic Route Risk Scoring

Combines:

* historical delay risk,
* warehouse congestion,
* transfer risk,
* weather risk,
* traffic risk,
* cascade propagation risk.

Routes receive a configurable risk score from 0 to 100.

### Weather Intelligence

Collects weather conditions for warehouses and important route locations.

Analyzes:

* rainfall,
* storms,
* flooding,
* visibility,
* wind speed,
* extreme temperatures.

### Traffic Intelligence

Collects:

* normal route duration,
* current travel duration,
* congestion levels,
* incidents,
* road closures.

### Logistics Network Analysis

Represents warehouses as nodes and transfer routes as edges.

Analyzes:

* critical warehouses,
* route dependencies,
* downstream reachability,
* network bottlenecks,
* alternative paths.

### Alternative Route Discovery

Uses graph algorithms to identify alternative shipment paths.

Routes are evaluated using:

* distance,
* predicted duration,
* congestion,
* weather,
* warehouse risk,
* cascade probability,
* operational cost.

### Intervention Recommendation Engine

Evaluates actions including:

* continue current route,
* reroute shipment,
* hold shipment,
* dispatch earlier,
* delay dispatch,
* prioritize shipment,
* redistribute shipment volume,
* temporarily disable a route.

### Cost-Aware Decision Support

Compares:

* transportation costs,
* rerouting costs,
* delay costs,
* handling costs,
* SLA penalties,
* estimated cascade impact.

### What-If Simulation

Allows operators to simulate:

* route closures,
* warehouse closures,
* severe weather,
* traffic congestion,
* capacity reductions,
* shipment-volume increases,
* dispatch-time changes,
* rerouting strategies.

### Real-Time Alerts

Generates operational alerts for:

* critical routes,
* severe weather,
* major traffic incidents,
* likely missed transfers,
* high cascade probability,
* warehouse overload,
* newly generated recommendations.

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router
* TanStack Query
* Axios
* Recharts
* Cytoscape.js
* Leaflet
* Socket.IO Client
* React Hook Form
* Zod

### Backend

* Node.js
* Express.js
* JavaScript
* Mongoose
* JWT
* bcrypt
* Zod
* Socket.IO
* BullMQ
* Redis
* Pino
* Swagger/OpenAPI

### Database

* MongoDB Atlas
* MongoDB Time Series Collections
* Mongoose ODM

### External Integrations

* Weather Provider API
* Traffic and Routing Provider API
* Optional Geocoding Provider

### Testing

* Vitest
* React Testing Library
* Jest
* Supertest
* Playwright

### Infrastructure

* Docker
* Docker Compose
* NGINX
* GitHub Actions
* MongoDB Atlas
* Redis
* Cloud Deployment Platform

---

## Repository Structure

```text
cascading-logistics-delay-platform/
│
├── client/
├── server/
├── shared/
├── infrastructure/
├── docs/
│   ├── ARCHITECTURE.md
│   └── PIPELINE_ARCHITECTURE.md
├── tests/
├── .github/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Main Platform Modules

### Authentication and Authorization

JWT-based authentication with Role-Based Access Control.

Supported roles:

* ADMIN
* OPERATIONS_MANAGER
* ROUTE_ANALYST
* WAREHOUSE_MANAGER
* VIEWER

### Logistics Domain Management

Manages:

* warehouses,
* routes,
* shipments,
* shipment events,
* transfers,
* delay reports.

### Journey Reconstruction Engine

Creates complete shipment journeys from fragmented operational events.

### Analytics Engine

Calculates route, warehouse, transfer, and shipment metrics.

### External Intelligence Layer

Collects, normalizes, caches, and stores weather and traffic information.

### Risk Intelligence Layer

Calculates:

* shipment risk,
* transfer risk,
* warehouse risk,
* route risk,
* cascade risk.

### Network Intelligence Engine

Performs logistics graph analysis and alternative route discovery.

### Intervention Engine

Generates operational actions based on detected risks.

### Recommendation Engine

Evaluates and ranks interventions.

### Simulation Engine

Executes isolated what-if scenarios.

### Alert Engine

Generates and manages real-time operational alerts.

---

## Main MongoDB Collections

```text
users

refreshTokens

warehouses

routes

shipments

shipmentEvents

shipmentJourneys

transfers

delayReports

weatherSnapshots

trafficSnapshots

routeMetrics

warehouseMetrics

riskAssessments

cascadeIncidents

recommendations

simulations

alerts

auditLogs

providerHealth

systemConfigurations
```

---

## API Domains

```text
/api/v1/auth

/api/v1/users

/api/v1/shipments

/api/v1/shipment-events

/api/v1/journeys

/api/v1/warehouses

/api/v1/routes

/api/v1/transfers

/api/v1/delays

/api/v1/weather

/api/v1/traffic

/api/v1/analytics

/api/v1/risks

/api/v1/cascades

/api/v1/network

/api/v1/recommendations

/api/v1/simulations

/api/v1/alerts

/api/v1/admin

/api/v1/audit-logs

/api/v1/health
```

---

## Getting Started

### Prerequisites

Install:

* Node.js
* npm
* Docker
* Docker Compose
* Git

Create accounts or services for:

* MongoDB Atlas
* Weather API provider
* Traffic API provider

---

## Installation

Clone the repository.

```bash
git clone <repository-url>
cd cascading-logistics-delay-platform
```

Install frontend dependencies.

```bash
cd client
npm install
```

Install backend dependencies.

```bash
cd ../server
npm install
```

Create the environment file.

```bash
cp .env.example .env
```

Start infrastructure services.

```bash
docker compose up -d
```

Start the backend.

```bash
cd server
npm run dev
```

Start the frontend.

```bash
cd client
npm run dev
```

---

## Environment Variables

```env
NODE_ENV=development

PORT=

CLIENT_URL=

MONGODB_URI=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

REDIS_URL=

WEATHER_API_KEY=

TRAFFIC_API_KEY=

MAP_PROVIDER_API_KEY=

LOG_LEVEL=
```

Never commit actual environment secrets.

---

## Development Roadmap

### Phase 1 — Platform Foundation

Repository initialization, frontend, backend, MongoDB, authentication, authorization, development infrastructure.

### Phase 2 — Logistics Domain

Warehouses, routes, shipments, shipment events, transfers, and delay reports.

### Phase 3 — Data Integration

Data ingestion, validation, normalization, data-quality analysis, and journey reconstruction.

### Phase 4 — Operational Analytics

Route analytics, warehouse analytics, bottleneck detection, and command-center dashboard.

### Phase 5 — Network Intelligence

Logistics graph visualization, dependency analysis, critical-node analysis, and route discovery.

### Phase 6 — External Intelligence

Weather integration, traffic integration, caching, historical snapshots, and provider reliability.

### Phase 7 — Dynamic Risk Intelligence

Dynamic ETA, transfer risk, route risk, cascade detection, cascade risk estimation, and explainability.

### Phase 8 — Intervention Intelligence

Alternative-route evaluation, operational-cost calculation, and recommendation generation.

### Phase 9 — Simulation Platform

What-if simulation engine, baseline comparison, and impact analysis.

### Phase 10 — Real-Time Processing

Redis, BullMQ, background workers, Socket.IO, and alert lifecycle.

### Phase 11 — Enterprise Hardening

Security, audit logging, observability, testing, API documentation, and performance optimization.

### Phase 12 — Production Deployment

Docker production images, NGINX, CI/CD, cloud deployment, monitoring, backups, and disaster recovery.

---

## Documentation

Detailed technical documentation is maintained separately.

* `docs/ARCHITECTURE.md` — system structure, components, module boundaries, data stores, security, scalability, and deployment architecture.

* `docs/PIPELINE_ARCHITECTURE.md` — end-to-end data flow, request lifecycle, background processing, external intelligence, risk processing, recommendation generation, simulations, alerts, and frontend update pipelines.

---

## Project Vision

The Cascading Logistics Delay Intelligence Platform is not simply a shipment-tracking application.

It is an operational decision-support platform designed to answer:

Where did the delay originate?

Why did it happen?

Will it propagate?

What will be affected?

What action should be taken?

What will that action cost?

What outcome is expected?

The platform transforms fragmented logistics events into actionable operational intelligence.
