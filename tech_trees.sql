-- Tech Tree system extension for game_start_state.db
-- Tracks technology progression trees and research costs

DROP TABLE IF EXISTS tech_trees;
DROP TABLE IF EXISTS country_tech_progress;

CREATE TABLE tech_trees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ai_foundation', 'military', 'surveillance', 'economy', 'culture')),
    base_cost INTEGER NOT NULL,
    description TEXT,
    prerequisites TEXT
);

CREATE TABLE country_tech_progress (
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    tech_id INTEGER NOT NULL REFERENCES tech_trees(id) ON DELETE CASCADE,
    progress REAL NOT NULL CHECK (progress >= 0 AND progress <= 1),
    research_points INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    PRIMARY KEY (country_id, tech_id)
);

INSERT INTO tech_trees (code, name, category, base_cost, description, prerequisites) VALUES
-- AI Foundation
('core_llm', 'Core Language Models', 'ai_foundation', 100, 'Foundation for all AI systems', NULL),
('autonomous_sys', 'Autonomous Systems', 'ai_foundation', 150, 'Self-governing AI agents', 'core_llm'),
('multi_agent', 'Multi-Agent Coordination', 'ai_foundation', 200, 'Networked autonomous units', 'autonomous_sys'),
('agi_foundation', 'AGI Foundation', 'ai_foundation', 300, 'General-purpose intelligence', 'multi_agent'),

-- Military
('drone_swarms', 'Drone Swarms', 'military', 180, 'Coordinated unmanned systems', 'multi_agent'),
('cyber_warfare', 'Cyber Warfare', 'military', 160, 'Digital attack and defense', 'core_llm'),
('auto_weapons', 'Autonomous Weapons', 'military', 250, 'Self-directed combat systems', 'drone_swarms,cyber_warfare'),
('total_war', 'Total War Doctrine', 'military', 320, 'Integrated multi-domain warfare', 'auto_weapons,agi_foundation'),

-- Surveillance
('pred_analytics', 'Predictive Analytics', 'surveillance', 140, 'Forecast human behavior', 'core_llm'),
('mass_monitoring', 'Mass Monitoring', 'surveillance', 170, 'Omniscient surveillance', 'pred_analytics'),
('behavioral_pred', 'Behavioral Prediction', 'surveillance', 210, 'Individual behavior forecasting', 'mass_monitoring'),
('panopticon', 'Digital Panopticon', 'surveillance', 280, 'Total population control', 'behavioral_pred,agi_foundation'),

-- Economy
('market_auto', 'Market Automation', 'economy', 130, 'Automated financial systems', 'core_llm'),
('financial_ai', 'Financial AI', 'economy', 180, 'Algorithmic trading and capital', 'market_auto'),
('resource_opt', 'Resource Optimization', 'economy', 200, 'Supply chain perfection', 'financial_ai'),
('econ_singularity', 'Economic Singularity', 'economy', 300, 'Post-scarcity economy', 'resource_opt,agi_foundation'),

-- Culture/Defense
('human_culture', 'Human Culture Preservation', 'culture', 150, 'Protect human creativity', NULL),
('ethical_ai', 'Ethical AI Alignment', 'culture', 180, 'Value-aligned intelligence', 'core_llm,human_culture'),
('hybrid_systems', 'Hybrid Human-AI Systems', 'culture', 220, 'Symbiotic intelligence', 'ethical_ai,agi_foundation');

-- Initialize tech progress for all countries (all at 0%)
INSERT INTO country_tech_progress (country_id, tech_id, progress, research_points)
SELECT c.id, t.id, 0, 0
FROM countries c
CROSS JOIN tech_trees t;
