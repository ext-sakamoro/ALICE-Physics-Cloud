use axum::{extract::State, response::Json, routing::{get, post}, Router};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

struct AppState { start_time: Instant, stats: Mutex<Stats> }
struct Stats { total_simulations: u64, total_collisions: u64, total_raycasts: u64, bodies_processed: u64 }

#[derive(Serialize)]
struct Health { status: String, version: String, uptime_secs: u64, total_ops: u64 }

#[derive(Deserialize)]
struct SimulateRequest { world_id: Option<String>, bodies: u32, timestep_ms: Option<f64>, gravity: Option<[f64; 3]>, solver_iterations: Option<u32> }
#[derive(Serialize)]
struct SimulateResponse { sim_id: String, world_id: String, bodies: u32, timestep_ms: f64, solver_iterations: u32, total_contacts: u32, avg_penetration_mm: f64, energy_joules: f64, elapsed_us: u128 }

#[derive(Deserialize)]
struct CollisionRequest { world_id: Option<String>, body_a: String, body_b: String, velocity_a: Option<[f64; 3]>, velocity_b: Option<[f64; 3]> }
#[derive(Serialize)]
struct CollisionResponse { collision_id: String, detected: bool, contact_point: [f64; 3], normal: [f64; 3], penetration_depth: f64, impulse_magnitude: f64, restitution: f64, elapsed_us: u128 }

#[derive(Deserialize)]
struct RaycastRequest { origin: [f64; 3], direction: [f64; 3], max_distance: Option<f64>, layer_mask: Option<u32> }
#[derive(Serialize)]
struct RaycastResponse { ray_id: String, hit: bool, hit_point: [f64; 3], hit_normal: [f64; 3], distance: f64, body_id: String, elapsed_us: u128 }

#[derive(Deserialize)]
struct ConstraintRequest { body_a: String, body_b: String, constraint_type: Option<String>, anchor_a: Option<[f64; 3]>, anchor_b: Option<[f64; 3]> }
#[derive(Serialize)]
struct ConstraintResponse { constraint_id: String, constraint_type: String, body_a: String, body_b: String, max_force: f64, error_correction: f64, status: String }

#[derive(Serialize)]
struct StatsResponse { total_simulations: u64, total_collisions: u64, total_raycasts: u64, bodies_processed: u64 }

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "physics_engine=info".into())).init();
    let state = Arc::new(AppState { start_time: Instant::now(), stats: Mutex::new(Stats { total_simulations: 0, total_collisions: 0, total_raycasts: 0, bodies_processed: 0 }) });
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/physics/simulate", post(simulate))
        .route("/api/v1/physics/collision", post(collision))
        .route("/api/v1/physics/raycast", post(raycast))
        .route("/api/v1/physics/constraint", post(constraint))
        .route("/api/v1/physics/stats", get(stats))
        .layer(cors).layer(TraceLayer::new_for_http()).with_state(state);
    let addr = std::env::var("PHYSICS_ADDR").unwrap_or_else(|_| "0.0.0.0:8081".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("Physics Engine on {addr}");
    axum::serve(listener, app).await.unwrap();
}

async fn health(State(s): State<Arc<AppState>>) -> Json<Health> {
    let st = s.stats.lock().unwrap();
    Json(Health { status: "ok".into(), version: env!("CARGO_PKG_VERSION").into(), uptime_secs: s.start_time.elapsed().as_secs(), total_ops: st.total_simulations + st.total_collisions + st.total_raycasts })
}

async fn simulate(State(s): State<Arc<AppState>>, Json(req): Json<SimulateRequest>) -> Json<SimulateResponse> {
    let t = Instant::now();
    let world = req.world_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let dt = req.timestep_ms.unwrap_or(16.667);
    let iters = req.solver_iterations.unwrap_or(8);
    let h = fnv1a(world.as_bytes());
    let contacts = (req.bodies as f64 * 0.3) as u32;
    let penetration = (h % 100) as f64 * 0.01;
    let energy = req.bodies as f64 * 9.81 * 10.0 + (h % 1000) as f64;
    { let mut st = s.stats.lock().unwrap(); st.total_simulations += 1; st.bodies_processed += req.bodies as u64; }
    Json(SimulateResponse { sim_id: uuid::Uuid::new_v4().to_string(), world_id: world, bodies: req.bodies, timestep_ms: dt, solver_iterations: iters, total_contacts: contacts, avg_penetration_mm: penetration, energy_joules: energy, elapsed_us: t.elapsed().as_micros() })
}

async fn collision(State(s): State<Arc<AppState>>, Json(req): Json<CollisionRequest>) -> Json<CollisionResponse> {
    let t = Instant::now();
    let h = fnv1a(format!("{}:{}", req.body_a, req.body_b).as_bytes());
    let detected = h % 3 != 0;
    let point = [(h % 100) as f64 * 0.1, ((h >> 8) % 100) as f64 * 0.1, ((h >> 16) % 100) as f64 * 0.1];
    let normal = [0.0, 1.0, 0.0];
    let depth = if detected { (h % 50) as f64 * 0.01 } else { 0.0 };
    let impulse = if detected { (h % 200) as f64 + 10.0 } else { 0.0 };
    s.stats.lock().unwrap().total_collisions += 1;
    Json(CollisionResponse { collision_id: uuid::Uuid::new_v4().to_string(), detected, contact_point: point, normal, penetration_depth: depth, impulse_magnitude: impulse, restitution: 0.6, elapsed_us: t.elapsed().as_micros() })
}

async fn raycast(State(s): State<Arc<AppState>>, Json(req): Json<RaycastRequest>) -> Json<RaycastResponse> {
    let t = Instant::now();
    let max_dist = req.max_distance.unwrap_or(1000.0);
    let h = fnv1a(&req.origin[0].to_le_bytes());
    let hit = h % 4 != 0;
    let dist = if hit { (h % (max_dist as u64).max(1)) as f64 } else { max_dist };
    let hit_pt = [req.origin[0] + req.direction[0] * dist, req.origin[1] + req.direction[1] * dist, req.origin[2] + req.direction[2] * dist];
    s.stats.lock().unwrap().total_raycasts += 1;
    Json(RaycastResponse { ray_id: uuid::Uuid::new_v4().to_string(), hit, hit_point: hit_pt, hit_normal: [0.0, 1.0, 0.0], distance: dist, body_id: if hit { format!("body-{:06}", h % 999999) } else { String::new() }, elapsed_us: t.elapsed().as_micros() })
}

async fn constraint(State(s): State<Arc<AppState>>, Json(req): Json<ConstraintRequest>) -> Json<ConstraintResponse> {
    let ctype = req.constraint_type.unwrap_or_else(|| "hinge".into());
    s.stats.lock().unwrap().total_simulations += 1;
    Json(ConstraintResponse { constraint_id: uuid::Uuid::new_v4().to_string(), constraint_type: ctype, body_a: req.body_a, body_b: req.body_b, max_force: 10000.0, error_correction: 0.2, status: "active".into() })
}

async fn stats(State(s): State<Arc<AppState>>) -> Json<StatsResponse> {
    let st = s.stats.lock().unwrap();
    Json(StatsResponse { total_simulations: st.total_simulations, total_collisions: st.total_collisions, total_raycasts: st.total_raycasts, bodies_processed: st.bodies_processed })
}

fn fnv1a(data: &[u8]) -> u64 { let mut h: u64 = 0xcbf2_9ce4_8422_2325; for &b in data { h ^= b as u64; h = h.wrapping_mul(0x0100_0000_01b3); } h }
