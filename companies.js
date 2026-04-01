// companies.js — Major corporate actors in The Last Day of AIs
//
// initial_techs: tier 0–2 techs the company owns at game start (~2026).
// These are broad foundational capabilities, not future AGI milestones.
// All tier 3+ techs must be climbed to by any player.

export const COMPANIES = [

  // ── FOUNDATION ────────────────────────────────────────────────────────
  {
    id: 'google',
    name: 'Google / Alphabet',
    hq: 'us',
    domain: 'found',
    desc: 'Invented the Transformer. Controls search-scale data, the leading foundation model research stack, and the largest knowledge graph on the public internet.',
    initial_techs: [
      'transformer',            // invented at Google Brain
      'sparse_moe',             // Switch Transformer, Gemini MoE
      'retrieval_aug',          // Google Search grounding
      'knowledge_graphs',       // Google Knowledge Graph
      'behavioral_ml',          // Google Ads behavioral targeting
      'recognition_ml',         // Google Photos, Lens, Maps
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    hq: 'us',
    domain: 'found',
    desc: 'Largest enterprise AI deployer via Azure. GitHub Copilot is the first mass-market AI coding product; OpenAI partnership gives access to frontier models.',
    initial_techs: [
      'rlhf',                   // OpenAI partnership, InstructGPT
      'retrieval_aug',          // Bing AI, Azure Cognitive Search
      'computational_law',      // Microsoft compliance / legal AI (Nuance, Harvey)
      'predictive_logistics',   // Microsoft Supply Chain Platform
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    hq: 'us',
    domain: 'found',
    desc: 'Originated RLHF-based alignment and the first consumer AGI. Leads recursive self-improvement research; alignment work is both its moat and its mission.',
    initial_techs: [
      'scaling_laws',           // the scaling hypothesis — OpenAI core thesis
      'rlhf',                   // invented Constitutional AI / RLHF
      'value_learning',         // alignment core research
      'generative_ai',          // DALL-E, Sora — diffusion at scale
    ],
  },

  // ── HARDWARE / PHYSICAL ───────────────────────────────────────────────
  {
    id: 'nvidia',
    name: 'Nvidia',
    hq: 'us',
    domain: 'econ',
    desc: 'Controls the compute substrate all AI runs on. GPU monopoly makes Nvidia the de facto infrastructure layer of the intelligence economy.',
    initial_techs: [
      'scaling_laws',           // CUDA made scaling economically viable
      'advanced_semiconductor', // GPU chip design and fabrication know-how
      'recognition_ml',         // computer vision roots (cuDNN, CUDA CV)
      'battlefield_perception', // military simulation (Modulus, Omniverse)
    ],
  },
  {
    id: 'tesla_spacex',
    name: 'Tesla / SpaceX',
    hq: 'us',
    domain: 'econ',
    desc: 'Bridges physical automation and orbital infrastructure. Optimus is the first mass-market humanoid; Starlink is the world\'s largest mesh network.',
    initial_techs: [
      'recognition_ml',         // FSD computer vision stack
      'battlefield_perception', // Starlink used in Ukraine battlefield ops
      'autonomous_agent',       // FSD autonomous driving agent
      'mesh_net',               // Starlink satellite constellation
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    hq: 'us',
    domain: 'econ',
    desc: 'Dominates on-device AI — inference at the edge without cloud dependency. Apple Health is the largest longitudinal biometric dataset on earth.',
    initial_techs: [
      'neuro_science',          // Apple Watch biometrics, Health longitudinal research
      'advanced_semiconductor', // Apple Silicon (M-series, A-series chip design)
      'recognition_ml',         // Face ID, photo ML, object detection
      'wearable_neural',        // Apple Watch, Vision Pro, AirPods sensors
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    hq: 'us',
    domain: 'cult',
    desc: 'Controls the largest social graph on earth. Llama open-weights and the Facebook ad engine together form the dominant AI-driven reality distortion apparatus.',
    initial_techs: [
      'retrieval_aug',          // Llama RAG, social search
      'generative_ai',          // Make-A-Video, Llama image gen
      'behavioral_ml',          // Facebook ad targeting — the canonical case
      'info_monopoly',          // 3.2B MAU across Facebook/Instagram/WhatsApp
    ],
  },
  {
    id: 'alibaba',
    name: 'Alibaba',
    hq: 'cn',
    domain: 'econ',
    desc: 'China\'s dominant e-commerce and cloud platform. Cainiao logistics is the world\'s most sophisticated AI-managed supply chain; Ant Group controls payments for over a billion users.',
    initial_techs: [
      'knowledge_graphs',       // product/entity graph for Taobao/Tmall
      'behavioral_ml',          // Taobao recommendation engine
      'predictive_logistics',   // Cainiao last-mile demand prediction
      'recognition_ml',         // Alibaba City Brain, face pay
    ],
  },
  {
    id: 'tencent',
    name: 'Tencent',
    hq: 'cn',
    domain: 'econ',
    desc: 'WeChat is the most complete behavioral platform embedded in a consumer product — payments, messaging, social scoring, and government services in one app.',
    initial_techs: [
      'retrieval_aug',          // WeChat search, content recommendation
      'behavioral_ml',          // WeChat behavioral engine, ad targeting
      'recognition_ml',         // WeChat face recognition, payment
      'info_monopoly',          // WeChat 1.3B MAU: total platform
    ],
  },
  {
    id: 'huawei',
    name: 'Huawei',
    hq: 'cn',
    domain: 'surv',
    desc: '5G infrastructure in 170 countries; Safe City surveillance programs in 80+. Huawei is the physical export layer of authoritarian AI governance.',
    initial_techs: [
      'advanced_semiconductor', // Kirin chip design, HiSilicon
      'recognition_ml',         // Safe City face recognition at scale
      'mesh_net',               // 5G global network infrastructure
      'censorship_agi',         // Great Firewall deep integration
    ],
  },
  {
    id: 'asml',
    name: 'ASML',
    hq: 'nl',
    domain: 'econ',
    desc: 'Sole manufacturer of EUV lithography machines — the physical chokepoint of the entire semiconductor industry. No advanced chip exists without ASML equipment.',
    initial_techs: [
      'advanced_semiconductor', // EUV lithography: they define the frontier
      'neuro_science',          // computational optics, physics-ML for photon modeling
    ],
  },
  {
    id: 'tsmc',
    name: 'TSMC',
    hq: 'tw',
    domain: 'econ',
    desc: 'Manufactures 92% of the world\'s advanced chips. The most strategically critical and geopolitically vulnerable industrial asset on earth.',
    initial_techs: [
      'advanced_semiconductor', // 3nm/2nm process — they define the state of the art
      'neuromorphic',           // advanced process nodes enabling neuromorphic designs
    ],
  },
  {
    id: 'samsung',
    name: 'Samsung',
    hq: 'kr',
    domain: 'econ',
    desc: 'Vertically integrated across chips, displays, and biologics. Serious competitor to TSMC in advanced fab; largest memory manufacturer; major contract biopharma.',
    initial_techs: [
      'advanced_semiconductor', // 3nm GAA, HBM memory design
      'recognition_ml',         // camera AI, Galaxy AI
      'molecular_ml',           // Samsung Biologics — contract biopharma at scale
    ],
  },
  {
    id: 'schneider',
    name: 'Schneider Electric',
    hq: 'fr',
    domain: 'econ',
    desc: 'Controls energy management software and hardware for industrial civilization — from data center power to smart grids to building automation.',
    initial_techs: [
      'knowledge_graphs',       // industrial asset knowledge graphs (EcoStruxure)
      'predictive_logistics',   // industrial operations forecasting
      'computational_law',      // EU regulatory compliance automation (CSRD, ESG)
    ],
  },
  {
    id: 'arm',
    name: 'ARM',
    hq: 'uk',
    domain: 'econ',
    desc: 'Designs processor architecture inside 99% of mobile devices and a growing share of data center silicon. ARM IP is the silent substrate of computing.',
    initial_techs: [
      'advanced_semiconductor', // ARM chip architecture IP — the design layer
      'neuromorphic',           // ARM Research neuromorphic IP cores
    ],
  },
  {
    id: 'sony',
    name: 'Sony',
    hq: 'jp',
    domain: 'cult',
    desc: 'Straddles entertainment and sensor hardware. PlayStation\'s AI ecosystem is one of the largest entertainment deployments; CMOS sensors power most of the world\'s machine vision.',
    initial_techs: [
      'neuro_science',          // sensory research, haptics, human perception science
      'recognition_ml',         // CMOS image sensors — Sony supplies 45% of global market
      'generative_ai',          // PlayStation game AI, Sony Music generative tools
    ],
  },
  {
    id: 'saudi_aramco',
    name: 'Saudi Aramco',
    hq: 'sa',
    domain: 'econ',
    desc: 'Controls 15% of global oil production. AGI deployment in field operations and predictive maintenance. The world\'s most profitable company investing in AI-driven industrial transformation.',
    initial_techs: [
      'knowledge_graphs',       // industrial asset intelligence, reservoir modeling
      'predictive_logistics',   // global petroleum supply chain optimization
    ],
  },
  {
    id: 'sk_hynix',
    name: 'SK Hynix',
    hq: 'kr',
    domain: 'econ',
    desc: 'Dominant supplier of HBM — the specialized memory that makes AI accelerators viable. Controls a critical physical bottleneck in the AI compute stack.',
    initial_techs: [
      'advanced_semiconductor', // HBM fabrication — memory at the frontier
      'neuromorphic',           // HBM architecture enables neural computing at scale
    ],
  },
  {
    id: 'tata',
    name: 'Tata Group',
    hq: 'in',
    domain: 'econ',
    desc: 'India\'s largest industrial conglomerate spanning IT services (TCS), steel, automotive, and pharma. The primary vehicle for India\'s AGI industrial strategy.',
    initial_techs: [
      'knowledge_graphs',       // TCS enterprise knowledge systems (120+ governments)
      'predictive_logistics',   // Tata Motors, Tata Steel supply chain
      'computational_law',      // TCS legal/regulatory AI services
      'molecular_ml',           // Tata Chemicals, generic pharma research
    ],
  },
  {
    id: 'reliance',
    name: 'Reliance Industries',
    hq: 'in',
    domain: 'econ',
    desc: 'Controls Jio — India\'s dominant telecom. 450M Jio subscribers make Reliance the largest non-state information aggregator in the developing world.',
    initial_techs: [
      'behavioral_ml',          // Jio behavioral data at 450M subscriber scale
      'info_monopoly',          // Jio: dominant telecom + retail + media platform
      'predictive_logistics',   // Reliance Retail nationwide supply chain
    ],
  },
  {
    id: 'bhp',
    name: 'BHP',
    hq: 'au',
    domain: 'econ',
    desc: 'World\'s largest miner, controlling critical minerals for batteries, chips, and construction. Autonomous mining is the largest industrial robotics deployment outside manufacturing.',
    initial_techs: [
      'battlefield_perception', // autonomous mine perception (haul trucks, sensors)
      'predictive_logistics',   // global commodity supply chain optimization
    ],
  },

];

export const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map(c => [c.id, c]));

export function getCompanyInitialTechs(companyId) {
  const c = COMPANY_BY_ID[companyId];
  return c ? new Set(c.initial_techs) : new Set();
}
