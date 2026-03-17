PRAGMA foreign_keys = ON;

-- Game starting-state database seed script (SQLite-compatible)
-- Covers:
-- 1) Country-to-country soft power projection matrix
-- 2) Country ideology spectrum (including representative non-state ideologies)
-- 3) Country economic share by representative entities

DROP TABLE IF EXISTS country_economic_share;
DROP TABLE IF EXISTS economic_entities;
DROP TABLE IF EXISTS country_ideology_distribution;
DROP TABLE IF EXISTS ideology_groups;
DROP TABLE IF EXISTS soft_power_projection;
DROP VIEW IF EXISTS country_power_metrics;
DROP TABLE IF EXISTS country_attributes;
DROP TABLE IF EXISTS countries;

CREATE TABLE countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    country_type TEXT NOT NULL CHECK (country_type IN ('major', 'minor', 'haven')),
    starting_regime TEXT NOT NULL CHECK (starting_regime IN ('democracy', 'authoritarian', 'totalitarian', 'anarcho_liberal')),
    faction_leader_code TEXT NULL REFERENCES countries(code)
);

CREATE TABLE soft_power_projection (
    source_country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    target_country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points BETWEEN 0 AND 100),
    PRIMARY KEY (source_country_id, target_country_id),
    CHECK (source_country_id <> target_country_id)
);

CREATE TABLE ideology_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    group_type TEXT NOT NULL CHECK (group_type IN ('regime', 'non_state_actor'))
);

CREATE TABLE country_ideology_distribution (
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    ideology_group_id INTEGER NOT NULL REFERENCES ideology_groups(id) ON DELETE CASCADE,
    percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    PRIMARY KEY (country_id, ideology_group_id)
);

CREATE TABLE economic_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('government', 'company', 'minor_business'))
);

CREATE TABLE country_economic_share (
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    entity_id INTEGER NOT NULL REFERENCES economic_entities(id) ON DELETE CASCADE,
    percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    PRIMARY KEY (country_id, entity_id)
);

CREATE TABLE country_attributes (
    country_id INTEGER PRIMARY KEY REFERENCES countries(id) ON DELETE CASCADE,
    infrastructure REAL NOT NULL CHECK (infrastructure > 0),
    literacy REAL NOT NULL CHECK (literacy >= 0 AND literacy <= 1),
    internet_openness REAL NOT NULL CHECK (internet_openness >= 0 AND internet_openness <= 1),
    pop_size_millions REAL NOT NULL CHECK (pop_size_millions > 0)
);

INSERT INTO countries (code, name, country_type, starting_regime, faction_leader_code) VALUES
('USA', 'United States', 'major', 'democracy', NULL),
('CHN', 'China', 'major', 'authoritarian', NULL),
('IND', 'India', 'major', 'democracy', NULL),
('EU', 'European Union', 'major', 'democracy', NULL),
('RUS', 'Russia', 'minor', 'authoritarian', 'CHN'),
('UKR', 'Ukraine', 'minor', 'democracy', 'EU'),
('BRA', 'Brazil', 'minor', 'democracy', 'USA'),
('JPN', 'Japan', 'minor', 'democracy', 'USA'),
('GBR', 'United Kingdom', 'minor', 'democracy', 'USA'),
('CAN', 'Canada', 'minor', 'democracy', 'USA'),
('KOR', 'South Korea', 'minor', 'democracy', 'USA'),
('SAU', 'Saudi Arabia', 'minor', 'authoritarian', 'USA'),
('AUS', 'Australia', 'minor', 'democracy', 'USA'),
('PRK', 'North Korea', 'minor', 'totalitarian', 'CHN'),
('VNM', 'Vietnam', 'minor', 'authoritarian', 'USA'),
('ISR', 'Israel', 'minor', 'democracy', 'USA'),
('IRN', 'Iran', 'minor', 'authoritarian', 'CHN'),
('TWN', 'Taiwan', 'minor', 'democracy', 'USA'),
('MEX', 'Mexico', 'minor', 'democracy', 'USA'),
('IDN', 'Indonesia', 'minor', 'democracy', 'USA'),
('PAK', 'Pakistan', 'minor', 'authoritarian', 'CHN'),
('TUR', 'Turkey', 'minor', 'authoritarian', 'USA'),
('EGY', 'Egypt', 'minor', 'authoritarian', 'USA'),
('NGA', 'Nigeria', 'minor', 'democracy', 'USA'),
('BGD', 'Bangladesh', 'minor', 'authoritarian', 'IND'),
('ETH', 'Ethiopia', 'minor', 'authoritarian', 'CHN'),
('PHL', 'Philippines', 'minor', 'democracy', 'USA'),
('COD', 'DR Congo', 'minor', 'authoritarian', 'CHN'),
('SGP', 'Singapore', 'haven', 'anarcho_liberal', NULL),
('VUT', 'Vanuatu', 'haven', 'anarcho_liberal', NULL);

INSERT INTO ideology_groups (key_name, display_name, group_type) VALUES
('democracy', 'Democracy', 'regime'),
('authoritarian', 'Authoritarianism', 'regime'),
('totalitarian', 'Totalitarianism', 'regime'),
('anarcho_liberal', 'Anarcho-Liberal', 'regime'),
('catholic', 'Catholic Church', 'non_state_actor'),
('buddhist', 'Buddhist Networks', 'non_state_actor'),
('islamic_cooperation', 'Islamic Cooperation Org', 'non_state_actor'),
('green_peace', 'Green Peace', 'non_state_actor'),
('soros_foundation', 'Open Society (Soros)', 'non_state_actor'),
('mars_society', 'Mars Society', 'non_state_actor');

INSERT INTO economic_entities (key_name, display_name, entity_type) VALUES
('government', 'Government', 'government'),
('minor_business', 'Minor Business', 'minor_business'),
('google', 'Google', 'company'),
('microsoft', 'Microsoft', 'company'),
('openai', 'OpenAI', 'company'),
('tesla', 'Tesla/SpaceX', 'company'),
('apple', 'Apple', 'company'),
('nvidia', 'NVIDIA', 'company'),
('tiktok', 'TikTok', 'company'),
('alibaba', 'Alibaba', 'company'),
('tencent', 'Tencent', 'company'),
('huawei', 'Huawei', 'company'),
('asml', 'ASML', 'company'),
('tsmc', 'TSMC', 'company'),
('samsung', 'Samsung', 'company'),
('schneider', 'Schneider', 'company'),
('arm', 'ARM', 'company'),
('sony', 'Sony', 'company'),
('saudi_aramco', 'Saudi Aramco', 'company'),
('sk_hynix', 'SK Hynix', 'company'),
('tata', 'Tata', 'company'),
('reliance', 'Reliance Industries', 'company'),
('bhp', 'BHP', 'company');

-- Soft power matrix: one entry for each country receiving soft power from every other country.
-- Values are intentionally game-representative rather than historical data.
INSERT INTO soft_power_projection (source_country_id, target_country_id, points)
SELECT
    s.id,
    t.id,
    MIN(
        95,
        MAX(
            1,
            (
                CASE
                    WHEN s.code = 'USA' THEN 28
                    WHEN s.code = 'CHN' THEN 26
                    WHEN s.code = 'EU' THEN 23
                    WHEN s.code = 'IND' THEN 18
                    ELSE 8
                END
            )
            + (
                CASE
                    WHEN t.faction_leader_code = s.code THEN 14
                    ELSE 0
                END
            )
            + (
                CASE
                    WHEN s.country_type = 'major' AND t.country_type = 'major' THEN 6
                    ELSE 0
                END
            )
            + (
                CASE
                    WHEN s.code = 'USA' AND t.code IN ('JPN', 'KOR', 'AUS', 'GBR', 'CAN', 'TWN', 'ISR', 'SAU', 'BRA', 'VNM', 'MEX', 'IDN', 'NGA', 'PHL', 'TUR', 'EGY') THEN 10
                    WHEN s.code = 'CHN' AND t.code IN ('RUS', 'PRK', 'IRN', 'PAK', 'ETH', 'COD') THEN 12
                    WHEN s.code = 'EU' AND t.code IN ('UKR', 'GBR') THEN 8
                    WHEN s.code = 'IND' AND t.code IN ('VNM', 'SGP', 'BGD') THEN 6
                    ELSE 0
                END
            )
            + (
                CASE
                    WHEN t.country_type = 'haven' THEN -4
                    ELSE 0
                END
            )
        )
    ) AS points
FROM countries s
CROSS JOIN countries t
WHERE s.id <> t.id;

-- Ideology profiles
CREATE TEMP TABLE ideology_profile (
    profile_name TEXT NOT NULL,
    ideology_key TEXT NOT NULL,
    pct REAL NOT NULL
);

INSERT INTO ideology_profile (profile_name, ideology_key, pct) VALUES
('democracy_west', 'democracy', 46),
('democracy_west', 'authoritarian', 7),
('democracy_west', 'totalitarian', 3),
('democracy_west', 'anarcho_liberal', 10),
('democracy_west', 'catholic', 13),
('democracy_west', 'buddhist', 2),
('democracy_west', 'islamic_cooperation', 5),
('democracy_west', 'green_peace', 8),
('democracy_west', 'soros_foundation', 4),
('democracy_west', 'mars_society', 2),

('democracy_asia', 'democracy', 40),
('democracy_asia', 'authoritarian', 9),
('democracy_asia', 'totalitarian', 4),
('democracy_asia', 'anarcho_liberal', 10),
('democracy_asia', 'catholic', 5),
('democracy_asia', 'buddhist', 16),
('democracy_asia', 'islamic_cooperation', 3),
('democracy_asia', 'green_peace', 8),
('democracy_asia', 'soros_foundation', 3),
('democracy_asia', 'mars_society', 2),

('democracy_mixed', 'democracy', 38),
('democracy_mixed', 'authoritarian', 12),
('democracy_mixed', 'totalitarian', 4),
('democracy_mixed', 'anarcho_liberal', 8),
('democracy_mixed', 'catholic', 9),
('democracy_mixed', 'buddhist', 4),
('democracy_mixed', 'islamic_cooperation', 9),
('democracy_mixed', 'green_peace', 8),
('democracy_mixed', 'soros_foundation', 5),
('democracy_mixed', 'mars_society', 3),

('authoritarian_general', 'democracy', 16),
('authoritarian_general', 'authoritarian', 37),
('authoritarian_general', 'totalitarian', 10),
('authoritarian_general', 'anarcho_liberal', 5),
('authoritarian_general', 'catholic', 5),
('authoritarian_general', 'buddhist', 8),
('authoritarian_general', 'islamic_cooperation', 7),
('authoritarian_general', 'green_peace', 6),
('authoritarian_general', 'soros_foundation', 2),
('authoritarian_general', 'mars_society', 4),

('authoritarian_islamic', 'democracy', 10),
('authoritarian_islamic', 'authoritarian', 39),
('authoritarian_islamic', 'totalitarian', 12),
('authoritarian_islamic', 'anarcho_liberal', 4),
('authoritarian_islamic', 'catholic', 1),
('authoritarian_islamic', 'buddhist', 1),
('authoritarian_islamic', 'islamic_cooperation', 23),
('authoritarian_islamic', 'green_peace', 4),
('authoritarian_islamic', 'soros_foundation', 1),
('authoritarian_islamic', 'mars_society', 5),

('totalitarian_hard', 'democracy', 4),
('totalitarian_hard', 'authoritarian', 23),
('totalitarian_hard', 'totalitarian', 50),
('totalitarian_hard', 'anarcho_liberal', 2),
('totalitarian_hard', 'catholic', 1),
('totalitarian_hard', 'buddhist', 5),
('totalitarian_hard', 'islamic_cooperation', 3),
('totalitarian_hard', 'green_peace', 3),
('totalitarian_hard', 'soros_foundation', 1),
('totalitarian_hard', 'mars_society', 8),

('haven_network', 'democracy', 26),
('haven_network', 'authoritarian', 10),
('haven_network', 'totalitarian', 2),
('haven_network', 'anarcho_liberal', 27),
('haven_network', 'catholic', 6),
('haven_network', 'buddhist', 6),
('haven_network', 'islamic_cooperation', 5),
('haven_network', 'green_peace', 8),
('haven_network', 'soros_foundation', 5),
('haven_network', 'mars_society', 5);

CREATE TEMP TABLE country_profile_map (
    country_code TEXT NOT NULL,
    ideology_profile TEXT NOT NULL
);

INSERT INTO country_profile_map (country_code, ideology_profile) VALUES
('USA', 'democracy_west'),
('EU', 'democracy_west'),
('GBR', 'democracy_west'),
('CAN', 'democracy_west'),
('AUS', 'democracy_west'),
('ISR', 'democracy_west'),
('UKR', 'democracy_west'),
('BRA', 'democracy_mixed'),
('IND', 'democracy_mixed'),
('JPN', 'democracy_asia'),
('KOR', 'democracy_asia'),
('TWN', 'democracy_asia'),
('IDN', 'democracy_asia'),
('PHL', 'democracy_asia'),
('CHN', 'authoritarian_general'),
('RUS', 'authoritarian_general'),
('VNM', 'authoritarian_general'),
('TUR', 'authoritarian_general'),
('BGD', 'authoritarian_general'),
('ETH', 'authoritarian_general'),
('COD', 'authoritarian_general'),
('SAU', 'authoritarian_islamic'),
('IRN', 'authoritarian_islamic'),
('PAK', 'authoritarian_islamic'),
('EGY', 'authoritarian_islamic'),
('PRK', 'totalitarian_hard'),
('MEX', 'democracy_mixed'),
('NGA', 'democracy_mixed'),
('SGP', 'haven_network'),
('VUT', 'haven_network');

INSERT INTO country_ideology_distribution (country_id, ideology_group_id, percentage)
SELECT c.id, i.id, p.pct
FROM country_profile_map m
JOIN countries c ON c.code = m.country_code
JOIN ideology_profile p ON p.profile_name = m.ideology_profile
JOIN ideology_groups i ON i.key_name = p.ideology_key;

DROP TABLE country_profile_map;
DROP TABLE ideology_profile;

-- Economic profiles
CREATE TEMP TABLE economic_profile (
    profile_name TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    pct REAL NOT NULL
);

INSERT INTO economic_profile (profile_name, entity_key, pct) VALUES
('usa_major', 'government', 35),
('usa_major', 'google', 8),
('usa_major', 'microsoft', 7),
('usa_major', 'openai', 5),
('usa_major', 'tesla', 4),
('usa_major', 'apple', 6),
('usa_major', 'nvidia', 5),
('usa_major', 'minor_business', 30),

('china_major', 'government', 38),
('china_major', 'tencent', 9),
('china_major', 'huawei', 7),
('china_major', 'alibaba', 6),
('china_major', 'tiktok', 5),
('china_major', 'tesla', 1),
('china_major', 'apple', 2),
('china_major', 'minor_business', 32),

('eu_major', 'government', 37),
('eu_major', 'asml', 6),
('eu_major', 'schneider', 5),
('eu_major', 'arm', 4),
('eu_major', 'apple', 2),
('eu_major', 'google', 3),
('eu_major', 'microsoft', 3),
('eu_major', 'minor_business', 40),

('india_major', 'government', 33),
('india_major', 'tata', 11),
('india_major', 'reliance', 9),
('india_major', 'microsoft', 2),
('india_major', 'google', 2),
('india_major', 'minor_business', 43),

('democratic_minor', 'government', 34),
('democratic_minor', 'google', 4),
('democratic_minor', 'microsoft', 4),
('democratic_minor', 'apple', 4),
('democratic_minor', 'tesla', 2),
('democratic_minor', 'nvidia', 2),
('democratic_minor', 'minor_business', 50),

('authoritarian_minor', 'government', 42),
('authoritarian_minor', 'tencent', 4),
('authoritarian_minor', 'huawei', 4),
('authoritarian_minor', 'alibaba', 3),
('authoritarian_minor', 'tiktok', 2),
('authoritarian_minor', 'saudi_aramco', 3),
('authoritarian_minor', 'minor_business', 42),

('totalitarian_minor', 'government', 58),
('totalitarian_minor', 'tencent', 2),
('totalitarian_minor', 'huawei', 2),
('totalitarian_minor', 'minor_business', 38),

('haven_open', 'government', 8),
('haven_open', 'google', 6),
('haven_open', 'microsoft', 6),
('haven_open', 'apple', 4),
('haven_open', 'tencent', 4),
('haven_open', 'alibaba', 3),
('haven_open', 'tiktok', 3),
('haven_open', 'tesla', 2),
('haven_open', 'minor_business', 64);

CREATE TEMP TABLE country_economic_map (
    country_code TEXT NOT NULL,
    economic_profile TEXT NOT NULL
);

INSERT INTO country_economic_map (country_code, economic_profile) VALUES
('USA', 'usa_major'),
('CHN', 'china_major'),
('EU', 'eu_major'),
('IND', 'india_major'),
('RUS', 'authoritarian_minor'),
('SAU', 'authoritarian_minor'),
('VNM', 'authoritarian_minor'),
('IRN', 'authoritarian_minor'),
('PRK', 'totalitarian_minor'),
('UKR', 'democratic_minor'),
('BRA', 'democratic_minor'),
('JPN', 'democratic_minor'),
('GBR', 'democratic_minor'),
('CAN', 'democratic_minor'),
('KOR', 'democratic_minor'),
('AUS', 'democratic_minor'),
('ISR', 'democratic_minor'),
('TWN', 'democratic_minor'),
('MEX', 'democratic_minor'),
('IDN', 'democratic_minor'),
('NGA', 'democratic_minor'),
('PHL', 'democratic_minor'),
('PAK', 'authoritarian_minor'),
('TUR', 'authoritarian_minor'),
('EGY', 'authoritarian_minor'),
('BGD', 'authoritarian_minor'),
('ETH', 'authoritarian_minor'),
('COD', 'authoritarian_minor'),
('SGP', 'haven_open'),
('VUT', 'haven_open');

INSERT INTO country_economic_share (country_id, entity_id, percentage)
SELECT c.id, e.id, p.pct
FROM country_economic_map m
JOIN countries c ON c.code = m.country_code
JOIN economic_profile p ON p.profile_name = m.economic_profile
JOIN economic_entities e ON e.key_name = p.entity_key;

DROP TABLE country_economic_map;
DROP TABLE economic_profile;

INSERT INTO country_attributes (country_id, infrastructure, literacy, internet_openness, pop_size_millions)
SELECT c.id, v.infrastructure, v.literacy, v.internet_openness, v.pop_size_millions
FROM countries c
JOIN (
    SELECT 'USA' AS code, 88.0 AS infrastructure, 0.99 AS literacy, 0.86 AS internet_openness, 341.0 AS pop_size_millions
    UNION ALL SELECT 'CHN', 83.0, 0.97, 0.52, 1410.0
    UNION ALL SELECT 'IND', 62.0, 0.79, 0.58, 1430.0
    UNION ALL SELECT 'EU', 84.0, 0.98, 0.83, 449.0
    UNION ALL SELECT 'RUS', 68.0, 0.98, 0.44, 144.0
    UNION ALL SELECT 'UKR', 58.0, 0.98, 0.72, 37.0
    UNION ALL SELECT 'BRA', 61.0, 0.94, 0.70, 216.0
    UNION ALL SELECT 'JPN', 86.0, 0.99, 0.88, 123.0
    UNION ALL SELECT 'GBR', 87.0, 0.99, 0.89, 68.0
    UNION ALL SELECT 'CAN', 88.0, 0.99, 0.91, 41.0
    UNION ALL SELECT 'KOR', 89.0, 0.99, 0.90, 52.0
    UNION ALL SELECT 'SAU', 74.0, 0.96, 0.73, 37.0
    UNION ALL SELECT 'AUS', 85.0, 0.99, 0.92, 27.0
    UNION ALL SELECT 'PRK', 40.0, 0.92, 0.12, 26.0
    UNION ALL SELECT 'VNM', 64.0, 0.95, 0.67, 100.0
    UNION ALL SELECT 'ISR', 86.0, 0.98, 0.89, 10.0
    UNION ALL SELECT 'IRN', 63.0, 0.88, 0.43, 90.0
    UNION ALL SELECT 'TWN', 88.0, 0.99, 0.91, 24.0
    UNION ALL SELECT 'MEX', 64.0, 0.95, 0.71, 130.0
    UNION ALL SELECT 'IDN', 57.0, 0.92, 0.64, 280.0
    UNION ALL SELECT 'PAK', 49.0, 0.62, 0.38, 247.0
    UNION ALL SELECT 'TUR', 67.0, 0.90, 0.69, 87.0
    UNION ALL SELECT 'EGY', 55.0, 0.75, 0.57, 114.0
    UNION ALL SELECT 'NGA', 46.0, 0.62, 0.43, 232.0
    UNION ALL SELECT 'BGD', 54.0, 0.76, 0.48, 174.0
    UNION ALL SELECT 'ETH', 38.0, 0.56, 0.31, 128.0
    UNION ALL SELECT 'PHL', 58.0, 0.90, 0.67, 117.0
    UNION ALL SELECT 'COD', 29.0, 0.49, 0.24, 112.0
    UNION ALL SELECT 'SGP', 93.0, 0.99, 0.95, 6.0
    UNION ALL SELECT 'VUT', 38.0, 0.78, 0.45, 0.33
) v ON v.code = c.code;

-- Derived metrics based on requested formulas.
-- techTree is handled by game systems and is not seeded as a static country value here.
-- GDP = popSize * sqrt(infrastructure) * literacy^4 * internetOpenness
-- military = GDP / ideologyEntropy
-- ideologyEntropy uses Shannon entropy over ideology percentages.
CREATE VIEW country_power_metrics AS
WITH ideology_entropy AS (
    SELECT
        country_id,
        -SUM(
            CASE
                WHEN percentage > 0 THEN (percentage / 100.0) * ln(percentage / 100.0)
                ELSE 0
            END
        ) AS ideology_entropy
    FROM country_ideology_distribution
    GROUP BY country_id
)
SELECT
    c.id AS country_id,
    c.code,
    c.name,
    a.infrastructure,
    a.literacy,
    a.internet_openness,
    a.pop_size_millions,
    ie.ideology_entropy,
    (
        a.pop_size_millions
        * sqrt(a.infrastructure)
        * (a.literacy * a.literacy * a.literacy * a.literacy)
        * a.internet_openness
    ) AS gdp,
    (
        (
            a.pop_size_millions
            * sqrt(a.infrastructure)
            * (a.literacy * a.literacy * a.literacy * a.literacy)
            * a.internet_openness
        )
        / NULLIF(ie.ideology_entropy, 0)
    ) AS military
FROM countries c
JOIN country_attributes a ON a.country_id = c.id
JOIN ideology_entropy ie ON ie.country_id = c.id;

-- Sanity checks (uncomment to validate after import)
-- SELECT c.code, ROUND(SUM(d.percentage), 2) AS ideology_total
-- FROM country_ideology_distribution d
-- JOIN countries c ON c.id = d.country_id
-- GROUP BY c.code
-- ORDER BY c.code;

-- SELECT c.code, ROUND(SUM(s.percentage), 2) AS economy_total
-- FROM country_economic_share s
-- JOIN countries c ON c.id = s.country_id
-- GROUP BY c.code
-- ORDER BY c.code;

-- SELECT COUNT(*) AS soft_power_links FROM soft_power_projection;
-- Expected soft_power_links = country_count * (country_count - 1).

-- SELECT code, ROUND(gdp, 2) AS gdp, ROUND(military, 2) AS military
-- FROM country_power_metrics
-- ORDER BY gdp DESC;
