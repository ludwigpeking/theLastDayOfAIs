# The Last Day of AIs - Game Zero State

An integrated game simulation dashboard combining geopolitical data, technology trees, soft-power networks, and narrative context.

## What's Included

### 1. **Database: `game_start_state.db` / `game_start_state.sql`**
   - **30 Countries**: 4 major powers, 26 minor states, 2 havens
   - **Soft Power Matrix**: 870 bilateral relationships (30 × 29)
   - **Ideology Distribution**: 10 ideological groups per country (regime + non-state actors)
   - **Economic Share**: 143 economy entries covering governments, companies, and minor business
   - **Country Attributes**: Infrastructure, literacy, internet openness, population
   - **Derived Metrics**: 
     - GDP = popSize × √infrastructure × literacy⁴ × internetOpenness
     - Military = GDP / ideologyEntropy
   - **Tech Trees**: 19 technologies across 5 categories
   - **Tech Progress**: 570 entries (30 countries × 19 techs)

### 2. **Game Dashboard: `game-dashboard.html`**
   A 3-panel interactive interface combining:
   - **Story Panel** (left-top): Narrative context and player archetypes
   - **3D Globe** (center): Interactive Three.js globe visualization
   - **Global Metrics** (right-top): Country counts, GDP, regime breakdown, top military powers
   - **Countries List** (left-bottom): Sortable country registry with regimes and power indices
   - **Tech Tree** (right-bottom): Available technologies by category with research costs

### 3. **Original Game State Files**
   - `index.html`: Original Three.js globe (replaced by dashboard)
   - `main.js`: Globe logic
   - `techTree_v2.html`: Tech tree visualization reference
   - `agi_tech_tree.html`: Alternative tech tree view
   - `Simulation.md`: Design document
   - `storyBoard.md`: Narrative framework

## How to Run

### Local Development
```bash
cd /path/to/repo
python -m http.server 8000
# Open http://localhost:8000/game-dashboard.html
```

### Or use the provided serve script
```bash
./serve.sh
# Then open http://localhost:8000/game-dashboard.html
```

## Database Schema

### Core Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `countries` | 30 | Country master data (name, type, regime, faction) |
| `country_attributes` | 30 | Geopolitical attributes (infrastructure, literacy, etc.) |
| `country_power_metrics` | 30 | Derived GDP and military power |
| `soft_power_projection` | 870 | Bilateral soft power (0-100 points, complete matrix) |
| `ideology_groups` | 10 | Reg regimes + non-state ideologies |
| `country_ideology_distribution` | 300 | Per-country ideology percentages (sum to 100%) |
| `economic_entities` | 23 | Government, companies, minor business |
| `country_economic_share` | 213 | Per-country economic ownership (sum to 100%) |
| `tech_trees` | 19 | Available technology research nodes |
| `country_tech_progress` | 570 | Research progress (0-1) and RP accumulation |

### Views

| View | Purpose |
|------|---------|
| `country_power_metrics` | Computed GDP, military, ideology entropy per country |

## Country Archetypes

### By Regime
- **Democracy** (10): USA, EU, India, Brazil, Ukraine, Japan, S. Korea, Taiwan, Indonesia, Philippines, Nigeria, UK, Canada, Australia, Israel
- **Authoritarian** (16): China, Russia, Vietnam, Pakistan, Turkey, Egypt, Bangladesh, Ethiopia, DR Congo, Saudi Arabia, Iran
- **Totalitarian** (1): North Korea
- **Anarcho-Liberal** (2): Singapore, Vanuatu (havens)

### By Type
- **Major** (4): USA, China, India, EU
- **Minor** (24): Faction-aligned states
- **Haven** (2): Neutral, minimal governance

## Ideological Diversity

Each country has a unique ideology distribution blending:
- **Regime Ideologies**: Democracy, Authoritarianism, Totalitarianism, Anarcho-Liberalism
- **Non-State Actors**: Catholic Church, Buddhist Networks, Islamic Cooperation, Green Peace, Open Society (Soros), Mars Society

Example: USA is 46% democracy but also 13% Catholic, 10% Anarcho-liberal, 8% Green Peace, 4% Soros Foundation.

## Economic Representation

Countries have ownership stakes in:
- **Government** (sector)
- **Major Companies**: Google, Microsoft, Tesla, Apple, NVIDIA, Tencent, Huawei, Alibaba, ASML, Samsung, etc.
- **Minor Business** (catch-all)

Example: USA: Government 35%, Google 8%, Microsoft 7%, OpenAI 5%, Tesla 4%, Apple 6%, NVIDIA 5%, Minor 30%.

## Tech Tree Structure

### AI Foundation (4 techs)
- Core Language Models → Autonomous Systems → Multi-Agent Coordination → AGI Foundation

### Military (4 techs)
- Drone Swarms, Cyber Warfare, Autonomous Weapons, Total War Doctrine

### Surveillance (4 techs)
- Predictive Analytics → Mass Monitoring → Behavioral Prediction → Digital Panopticon

### Economy (4 techs)
- Market Automation → Financial AI → Resource Optimization → Economic Singularity

### Culture (3 techs)
- Human Culture Preservation, Ethical AI Alignment, Hybrid Human-AI Systems

## Extending the Game

To add game mechanics:

1. **Add player action tables** (e.g., `diplomatic_actions`, `military_campaigns`)
2. **Create turn-based simulation logic** (e.g., resolve conflicts, tech progression, soft-power shifts)
3. **Update derived views** to reflect dynamic state changes
4. **Extend dashboard** with action buttons and real-time updates

## Narrative Context

"The Last Day of AIs" uses this database as a **zero-shot starting state** for a geopolitical simulation where:
- Five polity archetypes compete for AGI dominance
- Soft-power accumulation drives ideological drift
- Tech tree progression enables military, surveillance, and economic advantage
- Culture and creativity serve as human evolutionary redundancy against computational efficiency

The game tracks how power consolidates toward either:
- **Techno-Totalitarianism** (algorithmic dominance)
- **Humanist Resistance** (constitution-based alliance)
- **Corporate Sovereignty** (private infrastructure rule)
- **Fragmented Chaos** (collapse of centralized order)

---

**Created**: March 17, 2026  
**Status**: Game Zero State Initialized  
**Data Integration**: Complete  
**Ready for**: Gameplay, Simulation, Analysis
