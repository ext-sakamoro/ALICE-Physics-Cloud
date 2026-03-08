-- ALICE Physics Cloud: Domain-specific tables
-- Physics simulation, collision detection, constraint management

CREATE TABLE IF NOT EXISTS physics_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    world_id TEXT NOT NULL,
    bodies INTEGER NOT NULL DEFAULT 1,
    timestep_ms DOUBLE PRECISION NOT NULL DEFAULT 16.667,
    gravity DOUBLE PRECISION[3] NOT NULL DEFAULT '{0,-9.81,0}',
    solver_iterations INTEGER NOT NULL DEFAULT 8,
    total_contacts INTEGER DEFAULT 0,
    avg_penetration_mm DOUBLE PRECISION DEFAULT 0,
    energy_joules DOUBLE PRECISION DEFAULT 0,
    simulation_type TEXT NOT NULL CHECK (simulation_type IN ('rigid-body','soft-body','fluid','cloth','particle','hybrid')),
    elapsed_us BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_physics_sim_project ON physics_simulations(project_id);
CREATE INDEX idx_physics_sim_world ON physics_simulations(world_id);

CREATE TABLE IF NOT EXISTS collision_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES physics_simulations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    body_a TEXT NOT NULL,
    body_b TEXT NOT NULL,
    detected BOOLEAN NOT NULL DEFAULT false,
    contact_point DOUBLE PRECISION[3],
    normal DOUBLE PRECISION[3],
    penetration_depth DOUBLE PRECISION DEFAULT 0,
    impulse_magnitude DOUBLE PRECISION DEFAULT 0,
    restitution DOUBLE PRECISION DEFAULT 0.6,
    elapsed_us BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collision_sim ON collision_events(simulation_id);

CREATE TABLE IF NOT EXISTS physics_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES physics_simulations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    body_a TEXT NOT NULL,
    body_b TEXT NOT NULL,
    constraint_type TEXT NOT NULL CHECK (constraint_type IN ('hinge','ball-socket','slider','fixed','spring','distance','cone-twist')),
    anchor_a DOUBLE PRECISION[3],
    anchor_b DOUBLE PRECISION[3],
    max_force DOUBLE PRECISION DEFAULT 10000.0,
    error_correction DOUBLE PRECISION DEFAULT 0.2,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','broken','disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_constraint_sim ON physics_constraints(simulation_id);

-- Row Level Security
ALTER TABLE physics_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE physics_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulations" ON physics_simulations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own collisions" ON collision_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own constraints" ON physics_constraints FOR ALL USING (auth.uid() = user_id);
