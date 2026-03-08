# ALICE Physics-Cloud

Cloud physics simulation with rigid body dynamics, collision detection, raycasting, and constraints.

## Architecture

```
Frontend (Next.js 15)       API Gateway (port 8081)
  /dashboard/console   →    POST /api/v1/physics/simulate
  /                         POST /api/v1/physics/collision
                            POST /api/v1/physics/raycast
                            POST /api/v1/physics/constraint
                            GET  /api/v1/stats
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     Dynamics Solver      Collision Engine      Constraint Solver
   (impulse-based 6DOF)  (GJK/EPA + BVH)     (joints + motors)
            │
     Scene State Store (persistent named scenes)
```

## Features

| Feature | Description |
|---------|-------------|
| Rigid Body Dynamics | 6-DOF impulse-based solver with CCD |
| Collision Detection | GJK/EPA narrow phase, BVH broad phase |
| Raycasting | Sub-millisecond scene-graph raycasting |
| Constraint Solver | Hinge, ball-socket, slider, fixed joints |
| Scene Management | Persistent scenes with snapshot / replay |
| Cloud-Native Scale | Deterministic, bit-exact cross-node results |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/v1/stats | Platform-wide statistics |
| POST | /api/v1/physics/simulate | Run a rigid-body simulation |
| POST | /api/v1/physics/collision | Compute collision between two shapes |
| POST | /api/v1/physics/raycast | Cast a ray into a named scene |
| POST | /api/v1/physics/constraint | Add or update a joint constraint |

### POST /api/v1/physics/simulate

```json
{
  "scene_id": "scene-0001",
  "bodies": [
    { "id": "box-a", "mass": 1.0, "position": [0, 5, 0], "shape": "box", "half_extents": [0.5, 0.5, 0.5] },
    { "id": "floor", "mass": 0.0, "position": [0, 0, 0], "shape": "plane", "normal": [0, 1, 0] }
  ],
  "gravity": [0, -9.81, 0],
  "dt": 0.016,
  "steps": 300
}
```

### POST /api/v1/physics/raycast

```json
{
  "scene_id": "scene-0001",
  "ray": { "origin": [0, 10, 0], "direction": [0, -1, 0], "max_distance": 100.0 },
  "filter_mask": "all",
  "return_normal": true
}
```

### POST /api/v1/physics/constraint

```json
{
  "scene_id": "scene-0001",
  "constraint": {
    "type": "hinge",
    "body_a": "box-a",
    "body_b": "box-b",
    "axis": [0, 0, 1],
    "limits": { "lower": -1.5708, "upper": 1.5708 }
  }
}
```

## Quick Start

```bash
docker compose up -d
# API:      http://localhost:8081
# Frontend: http://localhost:3000
```

## License

AGPL-3.0-or-later
