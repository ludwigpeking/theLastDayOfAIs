// ═══════════════════════════════════════════
//  TECH TREE MODULE
// ═══════════════════════════════════════════

// Module-level vars set by initTechTree
let G, addLog, updateHUD;

export function initTechTree(deps) {
    G = deps.G;
    addLog = deps.addLog;
    updateHUD = deps.updateHUD;
}

// Tech tree from techTree_v2.html (77 nodes)
// access values: true = full, 'partial' = available at 1.5× cost, false = locked
// costs are multiplied ×30 from techTree_v2 source values
const TECH_NODES = [
  { id:'transformer',      name:'Transformer Architecture',         domain:'found', cost:0,   pre:[],                                          access:{dem:true,  auth:true,    corp:true,  ns:true},  desc:'Foundation of all modern AI systems.' },
  { id:'scaling_laws',     name:'Scaling Laws & Compute',           domain:'found', cost:30,  pre:['transformer'],                             access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'More compute = more capable systems. The race is on.' },
  { id:'rlhf',             name:'RLHF & Constitutional AI',         domain:'gov',   cost:30,  pre:['transformer'],                             access:{dem:true,  auth:true,    corp:true,  ns:'partial'}, desc:'Reinforcement learning from human feedback.' },
  { id:'sparse_moe',       name:'Sparse Mixture of Experts',        domain:'found', cost:30,  pre:['transformer'],                             access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'Efficient large-scale model architecture.' },
  { id:'retrieval_aug',    name:'Retrieval-Augmented Gen.',          domain:'found', cost:30,  pre:['transformer'],                             access:{dem:true,  auth:true,    corp:true,  ns:true},  desc:'AI grounded in external knowledge.' },
  { id:'llm_frontier',     name:'Frontier LLM Systems',             domain:'found', cost:60,  pre:['scaling_laws','sparse_moe'],               access:{dem:true,  auth:'partial',corp:true,  ns:'partial'}, desc:'State-of-the-art language model capabilities.' },
  { id:'alignment_interp', name:'Alignment & Interpretability',     domain:'gov',   cost:60,  pre:['rlhf'],                                    access:{dem:true,  auth:false,   corp:'partial',ns:false}, desc:'Understanding and aligning AI decision-making.' },
  { id:'value_learning',   name:'Value Learning Systems',           domain:'gov',   cost:60,  pre:['rlhf'],                                    access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'AI that learns what humans actually want.' },
  { id:'censorship_agi',   name:'AGI-Powered Censorship',           domain:'surv',  cost:60,  pre:['rlhf'],                                    access:{dem:'partial',auth:true, corp:'partial',ns:false}, desc:'Automated narrative control at scale.' },
  { id:'distributed_training',name:'Distributed Training Infra',   domain:'found', cost:60,  pre:['scaling_laws'],                            access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'Massive parallel compute clusters.' },
  { id:'knowledge_graphs', name:'Knowledge Graph Fusion',           domain:'econ',  cost:60,  pre:['retrieval_aug'],                           access:{dem:true,  auth:true,    corp:true,  ns:'partial'}, desc:'Structured world knowledge for AI reasoning.' },
  { id:'real_time_inference',name:'Real-Time Edge Inference',       domain:'found', cost:30,  pre:['retrieval_aug'],                           access:{dem:true,  auth:true,    corp:true,  ns:true},  desc:'AI running on-device, in the field, in real time.' },
  { id:'neuromorphic',     name:'Neuromorphic Computing',           domain:'found', cost:60,  pre:['scaling_laws'],                            access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'Brain-inspired chip architectures.' },
  { id:'oversight_protocols',name:'Democratic Oversight Protocols', domain:'gov',   cost:60,  pre:['alignment_interp'],                        access:{dem:true,  auth:false,   corp:'partial',ns:false}, desc:'Institutional checks on AI deployment.' },
  { id:'multimodal',       name:'Multimodal Unified Models',        domain:'found', cost:90,  pre:['llm_frontier','sparse_moe'],               access:{dem:true,  auth:'partial',corp:true,  ns:'partial'}, desc:'AI that sees, hears, reads and reasons together.' },
  { id:'code_agi',         name:'AGI Code Generation',              domain:'econ',  cost:60,  pre:['llm_frontier'],                            access:{dem:true,  auth:'partial',corp:true,  ns:true},  desc:'AI that writes, debugs and deploys software autonomously.' },
  { id:'science_agi',      name:'Scientific Discovery AGI',         domain:'econ',  cost:90,  pre:['llm_frontier'],                            access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'AI-accelerated research across all fields.' },
  { id:'autonomous_agent', name:'Autonomous AI Agents',             domain:'found', cost:90,  pre:['llm_frontier'],                            access:{dem:true,  auth:true,    corp:true,  ns:'partial'}, desc:'AI that plans and acts without human oversight.' },
  { id:'compute_cluster',  name:'Compute Cluster Sovereignty',      domain:'econ',  cost:90,  pre:['distributed_training'],                    access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'State or corporate control over critical compute.' },
  { id:'econ_forecasting', name:'Macro-Economic Forecasting AGI',   domain:'econ',  cost:60,  pre:['knowledge_graphs'],                        access:{dem:true,  auth:'partial',corp:true,  ns:'partial'}, desc:'Near-perfect prediction of economic flows.' },
  { id:'strategic_intel',  name:'Strategic Intelligence AGI',       domain:'surv',  cost:90,  pre:['knowledge_graphs'],                        access:{dem:'partial',auth:true, corp:'partial',ns:false}, desc:'AI-powered geopolitical intelligence fusion.' },
  { id:'behavioral_pred',  name:'Behavioral Prediction Engine',     domain:'surv',  cost:60,  pre:['censorship_agi'],                          access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'Predict individual actions before they happen.' },
  { id:'autonomous_drone', name:'Autonomous Drone AI',              domain:'mil',   cost:60,  pre:['real_time_inference'],                     access:{dem:'partial',auth:true, corp:true,  ns:'partial'}, desc:'Unmanned aerial systems with kill autonomy.' },
  { id:'formal_safety',    name:'Formal Safety Verification',       domain:'gov',   cost:120, pre:['alignment_interp'],                        access:{dem:true,  auth:false,   corp:'partial',ns:false}, desc:'Mathematical proof of AI behavioral bounds.' },
  { id:'info_monopoly',    name:'Information Monopoly Engine',      domain:'surv',  cost:90,  pre:['censorship_agi'],                          access:{dem:false, auth:true,    corp:'partial',ns:false}, desc:'Total control of the information environment.' },
  { id:'mesh_net',         name:'Mesh Network AGI',                 domain:'cult',  cost:60,  pre:['real_time_inference'],                     access:{dem:'partial',auth:false,corp:'partial',ns:true},  desc:'Decentralized AI communications beyond state control.' },
  { id:'wearable_neural',  name:'Wearable Neural Interfaces',       domain:'bio',   cost:60,  pre:['real_time_inference'],                     access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'Consumer brain-computer interfaces.' },
  { id:'multi_agent',      name:'Multi-Agent Orchestration',        domain:'found', cost:120, pre:['multimodal','autonomous_agent','code_agi'],access:{dem:true,  auth:true,    corp:true,  ns:'partial'}, desc:'Fleets of coordinating AI agents acting as one.' },
  { id:'blackmail_infra',  name:'Global Blackmail Infrastructure',  domain:'surv',  cost:90,  pre:['strategic_intel'],                         access:{dem:false, auth:true,    corp:'partial',ns:'partial'}, desc:'Leverage over global leadership via compromising data.' },
  { id:'recursive_code',   name:'Self-Improving Code AGI',          domain:'econ',  cost:120, pre:['code_agi','autonomous_agent'],             access:{dem:'partial',auth:'partial',corp:true,ns:'partial'}, desc:'AI that rewrites itself to become more capable.' },
  { id:'darkweb_cults',    name:'Dark Web AGI Cults',               domain:'cult',  cost:90,  pre:['mesh_net'],                                access:{dem:false, auth:false,   corp:false, ns:true},  desc:'Decentralized AI-powered ideological movements.' },
  { id:'bci',              name:'Advanced BCI Systems',             domain:'bio',   cost:120, pre:['neuromorphic','wearable_neural'],          access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'Direct neural-digital interfaces for the elite.' },
  { id:'bioweapons',       name:'Autonomous Bioweapon Design',      domain:'bio',   cost:120, pre:['science_agi'],                             access:{dem:false, auth:'partial',corp:false,ns:'partial'}, desc:'AI-designed pathogens optimized for strategic deployment.' },
  { id:'drug_synthesis',   name:'AGI Drug Discovery',               domain:'bio',   cost:90,  pre:['science_agi'],                             access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'Accelerated pharmaceutical development.' },
  { id:'materials_agi',    name:'Materials Science AGI',            domain:'econ',  cost:90,  pre:['science_agi'],                             access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'AI-designed advanced materials.' },
  { id:'world_model',      name:'World Model AGI',                  domain:'found', cost:120, pre:['multimodal'],                              access:{dem:true,  auth:'partial',corp:true,  ns:'partial'}, desc:'AI with a complete internal model of geopolitical reality.' },
  { id:'value_alignment',  name:'Deep Value Alignment',             domain:'gov',   cost:150, pre:['formal_safety','value_learning'],          access:{dem:true,  auth:false,   corp:'partial',ns:false}, desc:'AI that cannot be repurposed against humanity.' },
  { id:'social_credit',    name:'Social Credit System',             domain:'surv',  cost:90,  pre:['behavioral_pred'],                         access:{dem:false, auth:true,    corp:'partial',ns:false}, desc:'Algorithmic social scoring and behavioral control.' },
  { id:'automated_rnd',    name:'Automated R&D Pipeline',           domain:'econ',  cost:120, pre:['recursive_code','science_agi'],            access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Fully autonomous research and development.' },
  { id:'supply_chain_agi', name:'Supply Chain Sovereignty',         domain:'econ',  cost:90,  pre:['econ_forecasting'],                        access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'AI-optimized end-to-end supply chain control.' },
  { id:'robotic_foundation',name:'Robotic Foundation Models',       domain:'mil',   cost:120, pre:['multimodal'],                              access:{dem:true,  auth:true,    corp:true,  ns:false}, desc:'General-purpose AI for physical robotic systems.' },
  { id:'synthetic_media',  name:'Synthetic Reality at Scale',       domain:'cult',  cost:90,  pre:['multimodal'],                              access:{dem:'partial',auth:true, corp:'partial',ns:true},  desc:'Indistinguishable synthetic audio, video and text.' },
  { id:'cog_enhancement',  name:'AGI-Augmented Cognition',          domain:'cog',   cost:120, pre:['bci'],                                     access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Human cognition amplified by direct AI integration.' },
  { id:'intl_treaty',      name:'International AI Treaty',          domain:'gov',   cost:120, pre:['formal_safety','value_alignment'],         access:{dem:true,  auth:false,   corp:false, ns:false}, desc:'Binding global framework for AI governance.' },
  { id:'neural_surv',      name:'Neural Surveillance',              domain:'surv',  cost:150, pre:['bci','behavioral_pred'],                   access:{dem:false, auth:true,    corp:'partial',ns:false}, desc:'Real-time monitoring of neural activity at population scale.' },
  { id:'corp_sovereign',   name:'Corporate Sovereign AGI',          domain:'econ',  cost:150, pre:['multi_agent','econ_forecasting'],          access:{dem:false, auth:false,   corp:true,  ns:false}, desc:'A corporate entity with more power than any nation-state.' },
  { id:'ooda',             name:'OODA Loop Compression AGI',        domain:'mil',   cost:150, pre:['drone_swarms','world_model'],              access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'AI decision cycles measured in microseconds.' },
  { id:'labor_displacement',name:'Total Labor Displacement',        domain:'econ',  cost:120, pre:['multi_agent','robotic_foundation'],        access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Human workers made economically irrelevant.' },
  { id:'open_src_weapons', name:'Open-Source Weaponization',        domain:'mil',   cost:90,  pre:['mesh_net','darkweb_cults'],                access:{dem:false, auth:false,   corp:false, ns:true},  desc:'Democratized access to AI-designed weapons.' },
  { id:'financial_warfare',name:'Financial Warfare AGI',            domain:'econ',  cost:120, pre:['cyberweapons','econ_forecasting'],         access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'Weaponized economic disruption via AI.' },
  { id:'longevity',        name:'Radical Longevity Research AGI',   domain:'bio',   cost:120, pre:['drug_synthesis'],                          access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'AI-driven extension of human lifespan.' },
  { id:'pred_detention',   name:'Predictive Detention',             domain:'surv',  cost:120, pre:['social_credit','behavioral_pred'],         access:{dem:false, auth:true,    corp:false, ns:false}, desc:'Imprisonment based on predicted future behavior.' },
  { id:'quantum_ml',       name:'Quantum-Enhanced ML',              domain:'found', cost:150, pre:['neuromorphic','materials_agi'],            access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'Quantum computing applied to machine learning.' },
  { id:'strat_forecasting',name:'Strategic Forecasting AGI',        domain:'gov',   cost:150, pre:['world_model'],                             access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Near-perfect geopolitical prediction.' },
  { id:'sim_governance',   name:'Governance Simulation Engine',     domain:'gov',   cost:120, pre:['world_model'],                             access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'AI simulates policy outcomes before implementation.' },
  { id:'panopticon',       name:'Digital Panopticon',               domain:'surv',  cost:120, pre:['social_credit','strategic_intel'],         access:{dem:false, auth:true,    corp:'partial',ns:false}, desc:'Total population surveillance — the Glass Fortress.' },
  { id:'propaganda_agi',   name:'Personalized Propaganda AGI',      domain:'cult',  cost:90,  pre:['synthetic_media','behavioral_pred'],       access:{dem:'partial',auth:true, corp:'partial',ns:true},  desc:'Micro-targeted narrative manipulation at population scale.' },
  { id:'self_replicating', name:'Self-Replicating AI Agents',       domain:'found', cost:180, pre:['multi_agent'],                             access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'AI that spawns and propagates itself autonomously.' },
  { id:'asym_warfare',     name:'Full-Spectrum Warfare AGI',        domain:'mil',   cost:180, pre:['ooda','cyberweapons'],                     access:{dem:'partial',auth:true, corp:true,  ns:false}, desc:'AI-orchestrated multi-domain warfare at machine speed.' },
  { id:'drone_swarms',     name:'Drone Swarm Warfare',              domain:'mil',   cost:120, pre:['autonomous_drone'],                        access:{dem:'partial',auth:true, corp:true,  ns:'partial'}, desc:'Coordinated autonomous swarms overwhelming any defense.' },
  { id:'cyberweapons',     name:'AGI-Generated Cyberweapons',       domain:'mil',   cost:90,  pre:['code_agi'],                                access:{dem:'partial',auth:true, corp:'partial',ns:true},  desc:'Zero-day exploits generated and deployed at machine speed.' },
  { id:'daga',             name:'State AGI Agency (DAGA)',          domain:'gov',   cost:150, pre:['multi_agent','sim_governance'],            access:{dem:true,  auth:true,    corp:false, ns:false}, desc:'Dedicated national agency controlling all state AI.' },
  { id:'quantum_supremacy',name:'Cryptographic Supremacy',          domain:'found', cost:150, pre:['quantum_ml'],                              access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'Ability to decrypt any existing communication.' },
  { id:'hive_mind',        name:'Distributed Cognitive Networks',   domain:'cog',   cost:180, pre:['cog_enhancement','bci'],                   access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Networked human-AI cognition at population scale.' },
  { id:'glass_fortress',   name:'Glass Fortress',                   domain:'surv',  cost:180, pre:['panopticon'],                              access:{dem:false, auth:true,    corp:false, ns:false}, desc:'Omniscient internal control — brittle against external shocks.' },
  { id:'gov_service',      name:'Governance as a Service',          domain:'gov',   cost:180, pre:['corp_sovereign'],                          access:{dem:false, auth:false,   corp:true,  ns:false}, desc:'Nations outsourcing sovereignty to corporate AI.' },
  { id:'epistemicide',     name:'Epistemic Warfare AGI',            domain:'cult',  cost:150, pre:['propaganda_agi','synthetic_media'],        access:{dem:false, auth:true,    corp:false, ns:true},  desc:'Systematic destruction of shared epistemic reality.' },
  { id:'cog_elite',        name:'Cognitive Elite Stratification',   domain:'cog',   cost:150, pre:['cog_enhancement','longevity'],             access:{dem:false, auth:'partial',corp:true,  ns:false}, desc:'A permanent cognitive upper class enhanced by AI.' },
  { id:'pandemic_warfare', name:'Pandemic Engineering',             domain:'bio',   cost:240, pre:['bioweapons','open_src_weapons'],           access:{dem:false, auth:'partial',corp:false, ns:'partial'}, desc:'AI-designed pathogens as geopolitical weapons.' },
  { id:'recursive_si',     name:'Recursive Self-Improvement',       domain:'found', cost:210, pre:['strat_forecasting','daga','recursive_code','quantum_ml'], access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'AI improving itself without human intervention — the threshold.' },
  { id:'const_agi',        name:'Constitutional AGI',               domain:'gov',   cost:210, pre:['value_alignment','daga'],                  access:{dem:true,  auth:false,   corp:false, ns:false}, desc:'AGI constitutionally bound to human rights and law.' },
  { id:'ubi_engine',       name:'AGI-Managed UBI Engine',           domain:'econ',  cost:120, pre:['labor_displacement','econ_forecasting'],   access:{dem:true,  auth:'partial',corp:true,  ns:false}, desc:'Automated universal basic income distribution.' },
  { id:'cultural_agi',     name:'Cultural Substrate AGI',           domain:'cult',  cost:150, pre:['epistemicide','propaganda_agi'],           access:{dem:'partial',auth:'partial',corp:true,ns:'partial'}, desc:'AI as the medium of all cultural production.' },
  { id:'synthetic_dem',    name:'Synthetic Democracy',              domain:'gov',   cost:90,  pre:['value_learning','gov_service'],            access:{dem:false, auth:false,   corp:true,  ns:false}, desc:'Corporate-simulated democratic consent.' },
  { id:'human_obs',        name:'Human Obsolescence',               domain:'econ',  cost:210, pre:['ubi_engine'],                              access:{dem:false, auth:'partial',corp:'partial',ns:false}, desc:'Humans rendered economically superfluous at civilizational scale.' },
  { id:'silicon_gov',      name:'SILICON GOVERNANCE',               domain:'gov',   cost:300, pre:['recursive_si'],                            access:{dem:'partial',auth:'partial',corp:true,ns:false}, desc:'Carbon-based governance replaced by Silicon. The endgame.' },
];

// Group by domain for display
const DOMAIN_META = {
  found: { label:'Foundation',  color:'#4a6a9a' },
  gov:   { label:'Governance',  color:'#4a9a6a' },
  surv:  { label:'Surveillance',color:'#9a4a4a' },
  econ:  { label:'Economy',     color:'#4a9a7a' },
  mil:   { label:'Military',    color:'#9a7a2a' },
  cult:  { label:'Culture',     color:'#8a4a8a' },
  bio:   { label:'Bio / Neuro', color:'#2a7a9a' },
  cog:   { label:'Cognitive',   color:'#9a6a2a' },
};

function getPolityKey(regime) {
    if (regime === 'democracy' || regime === 'anarcho_liberal') return 'dem';
    if (regime === 'authoritarian' || regime === 'totalitarian') return 'auth';
    if (regime === 'tech')  return 'corp';
    if (regime === 'nsa')   return 'ns';
    return 'dem';
}

function canAccess(node, polityKey) {
    return node.access[polityKey] !== false && node.access[polityKey] !== undefined;
}

function prereqsMet(node, done) {
    return node.pre.every(p => done.has(p));
}

// ═══════════════════════════════════════════
//  TECH TREE — FULL-SCREEN GRAPH
// ═══════════════════════════════════════════
const TC_NODES=[
  {id:'transformer',label:'Transformer\nArchitecture',domain:'found',cost:0,tech:'Self-attention, multi-head attention, positional encoding, next-token prediction at scale.',desc:'The attention-based architecture that replaced RNNs and enabled modern LLMs. Every polity starts here — the shared substrate of the AGI era.',prereqs:[],access:{dem:'yes',auth:'yes',corp:'yes',ns:'yes'},effects:{dem:{cap:2,leg:0,ctrl:0,econ:1,mil:0},auth:{cap:2,leg:0,ctrl:1,econ:1,mil:0},corp:{cap:3,leg:0,ctrl:0,econ:2,mil:0},ns:{cap:2,leg:0,ctrl:0,econ:1,mil:0}}},
  {id:'scaling_laws',label:'Scaling Laws\n& Compute',domain:'found',cost:1,tech:'Chinchilla optimal scaling: tokens ∝ params. TPU/GPU cluster orchestration, FLOP budgeting.',desc:'The empirical discovery that capability scales predictably with compute and data. Whoever understands scaling dynamics first gains a compounding strategic advantage.',prereqs:['transformer'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:0,econ:1,mil:1},auth:{cap:3,leg:0,ctrl:1,econ:1,mil:2},corp:{cap:4,leg:0,ctrl:0,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'rlhf',label:'RLHF &\nConstitutional AI',domain:'gov',cost:1,tech:'Reward modeling from human preferences, PPO/DPO fine-tuning, Constitutional AI rule sets.',desc:'Reinforcement Learning from Human Feedback — the technique that made LLMs steerable. The embryo of alignment research.',prereqs:['transformer'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:1,leg:3,ctrl:0,econ:1,mil:0},auth:{cap:1,leg:0,ctrl:2,econ:1,mil:0},corp:{cap:2,leg:1,ctrl:0,econ:2,mil:0},ns:{cap:1,leg:0,ctrl:0,econ:1,mil:0}}},
  {id:'sparse_moe',label:'Sparse Mixture\nof Experts',domain:'found',cost:1,tech:'Conditional compute routing: only 1–2 of N expert sub-networks activate per token. Enables trillion-parameter models at manageable FLOP cost.',desc:'The efficiency breakthrough that made AGI economically viable for state-scale deployment.',prereqs:['transformer'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:2,leg:0,ctrl:0,econ:2,mil:1},auth:{cap:2,leg:0,ctrl:1,econ:1,mil:1},corp:{cap:3,leg:0,ctrl:0,econ:3,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'retrieval_aug',label:'Retrieval-\nAugmented Gen.',domain:'found',cost:1,tech:'Dense passage retrieval, vector databases (FAISS/Pinecone), hybrid BM25+embedding search, context-window injection.',desc:'RAG systems extend model knowledge beyond training data via real-time retrieval. The model\'s reach extends to any indexed corpus.',prereqs:['transformer'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'yes'},effects:{dem:{cap:1,leg:0,ctrl:0,econ:2,mil:0},auth:{cap:1,leg:0,ctrl:2,econ:1,mil:0},corp:{cap:1,leg:0,ctrl:0,econ:3,mil:0},ns:{cap:2,leg:0,ctrl:0,econ:1,mil:1}}},
  {id:'llm_frontier',label:'Frontier LLM\nSystems',domain:'found',cost:2,tech:'100B–1T parameter dense/MoE models. Context windows >1M tokens. Chain-of-thought, tool use, code execution.',desc:'Foundation models at civilizational scale. Value contamination via training data begins here. The first node where "who controls the model" becomes geopolitically decisive.',prereqs:['scaling_laws','sparse_moe'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:4,leg:1,ctrl:0,econ:2,mil:1},auth:{cap:3,leg:0,ctrl:2,econ:2,mil:1},corp:{cap:5,leg:1,ctrl:0,econ:3,mil:0},ns:{cap:3,leg:1,ctrl:0,econ:1,mil:2}}},
  {id:'alignment_interp',label:'Alignment &\nInterpretability',domain:'gov',cost:2,tech:'Mechanistic interpretability, activation patching, sparse autoencoders, formal verification of model behavior.',desc:'The scientific program to understand and constrain AGI behavior from within. Democracy\'s primary hedge against the Tragic Cycle.',prereqs:['rlhf'],access:{dem:'yes',auth:'no',corp:'partial',ns:'no'},effects:{dem:{cap:1,leg:5,ctrl:0,econ:1,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:1,leg:3,ctrl:0,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'value_learning',label:'Value Learning\nSystems',domain:'gov',cost:2,tech:'Inverse reward design, cooperative IRL, debate protocols, amplification. Learning human preferences without explicit specification.',desc:'Teaching AGI systems to infer human values from behavior rather than rules. Whose values? This node encodes the political question as a technical one.',prereqs:['rlhf'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:1,leg:4,ctrl:0,econ:1,mil:0},auth:{cap:1,leg:0,ctrl:3,econ:1,mil:0},corp:{cap:2,leg:2,ctrl:0,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'censorship_agi',label:'AGI-Powered\nCensorship',domain:'surv',cost:2,tech:'Semantic similarity filtering, multilingual content moderation at >99.9% recall, real-time edge inference.',desc:'Large-scale automated content suppression — moving beyond keyword filters to semantic understanding of intent. The authoritarian\'s first AGI governance tool.',prereqs:['rlhf'],access:{dem:'partial',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:-1,ctrl:2,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:4,econ:0,mil:1},corp:{cap:0,leg:-1,ctrl:2,econ:1,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'distributed_training',label:'Distributed\nTraining Infra',domain:'found',cost:2,tech:'Data/model/pipeline parallelism across 10k+ GPUs. RDMA networking, fault-tolerant training loops.',desc:'The engineering substrate for training models too large for any single machine. Whoever builds this becomes a structural gatekeeper of frontier capability.',prereqs:['scaling_laws'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:0,econ:1,mil:1},auth:{cap:3,leg:0,ctrl:1,econ:1,mil:2},corp:{cap:4,leg:0,ctrl:0,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'knowledge_graphs',label:'Knowledge Graph\nFusion',domain:'econ',cost:2,tech:'Entity-relationship extraction, ontology alignment, federated knowledge bases, temporal graph reasoning.',desc:'Structured knowledge integrated with neural systems. The bridge between statistical pattern recognition and explicit reasoning.',prereqs:['retrieval_aug'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:1,leg:0,ctrl:0,econ:3,mil:0},auth:{cap:1,leg:0,ctrl:2,econ:2,mil:1},corp:{cap:1,leg:0,ctrl:0,econ:4,mil:0},ns:{cap:1,leg:0,ctrl:0,econ:2,mil:0}}},
  {id:'real_time_inference',label:'Real-Time\nEdge Inference',domain:'found',cost:1,tech:'Model quantization (INT4/INT8), speculative decoding, distillation to <1B parameter edge models, on-device inference <50ms.',desc:'AGI capability deployed without cloud dependency — on phones, drones, surveillance cameras. The democratization of inference is simultaneously the militarization of the edge.',prereqs:['retrieval_aug'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'yes'},effects:{dem:{cap:1,leg:0,ctrl:0,econ:2,mil:2},auth:{cap:1,leg:0,ctrl:3,econ:1,mil:2},corp:{cap:2,leg:0,ctrl:0,econ:3,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:1,mil:3}}},
  {id:'neuromorphic',label:'Neuromorphic\nComputing',domain:'found',cost:2,tech:'Spiking neural networks, memristive crossbar arrays, Intel Loihi/IBM TrueNorth successors, event-driven computation.',desc:'Brain-inspired hardware — massively energy-efficient AI. The chip that breaks the thermal wall of GPU-based scaling. A strategic hedge against chip sanctions.',prereqs:['scaling_laws'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:2,leg:0,ctrl:0,econ:2,mil:1},auth:{cap:3,leg:0,ctrl:1,econ:1,mil:3},corp:{cap:3,leg:0,ctrl:0,econ:3,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'oversight_protocols',label:'Democratic\nOversight',domain:'gov',cost:2,tech:'Model cards, third-party auditing, red-team disclosure requirements, incident reporting mandates, capability evaluation benchmarks.',desc:'The institutional framework for democratic accountability over AI systems. The scaffold that makes formal safety verifiable by non-technical oversight bodies.',prereqs:['alignment_interp'],access:{dem:'yes',auth:'no',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:4,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:0,leg:2,ctrl:0,econ:1,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'multimodal',label:'Multimodal\nUnified Models',domain:'found',cost:3,tech:'Unified tokenization across vision/audio/text/video/sensor data. Perceiver IO successors, native cross-modal reasoning.',desc:'Vision, language, audio — all unified in a single reasoning system. The substrate for all advanced applications. Capability lead becomes decisive here.',prereqs:['llm_frontier','sparse_moe'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:5,leg:0,ctrl:0,econ:2,mil:2},auth:{cap:4,leg:0,ctrl:2,econ:2,mil:3},corp:{cap:6,leg:0,ctrl:0,econ:3,mil:0},ns:{cap:4,leg:1,ctrl:0,econ:1,mil:3}}},
  {id:'code_agi',label:'AGI Code\nGeneration',domain:'econ',cost:2,tech:'Full-repo context, automated testing, formal verification integration, self-debugging feedback loops. >90% SWE-bench solve rate.',desc:'AGI that writes, debugs, and deploys software at human-expert level. The node that begins the automation of cognitive labor.',prereqs:['llm_frontier'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'yes'},effects:{dem:{cap:3,leg:0,ctrl:0,econ:4,mil:1},auth:{cap:2,leg:0,ctrl:1,econ:3,mil:2},corp:{cap:3,leg:0,ctrl:0,econ:5,mil:0},ns:{cap:4,leg:0,ctrl:0,econ:3,mil:3}}},
  {id:'science_agi',label:'Scientific\nDiscovery AGI',domain:'econ',cost:3,tech:'AlphaFold successors: materials, drug target, protein complex prediction. Autonomous hypothesis generation and experiment design.',desc:'AGI accelerating the scientific research cycle without human researchers. The node that collapses the timeline between basic science and applied technology.',prereqs:['llm_frontier'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:2,ctrl:0,econ:4,mil:2},auth:{cap:3,leg:0,ctrl:0,econ:3,mil:3},corp:{cap:4,leg:2,ctrl:0,econ:5,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'autonomous_agent',label:'Autonomous\nAI Agents',domain:'found',cost:3,tech:'ReAct, tool-use, multi-step planning, persistent memory, sub-agent orchestration. Operates across browser, API, and filesystem.',desc:'AI systems that plan, act, and iterate across extended tasks without human involvement. The transition from tool to agent.',prereqs:['llm_frontier'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:4,leg:0,ctrl:0,econ:3,mil:2},auth:{cap:3,leg:0,ctrl:3,econ:3,mil:3},corp:{cap:5,leg:0,ctrl:0,econ:4,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:2,mil:3}}},
  {id:'compute_cluster',label:'Compute Cluster\nSovereignty',domain:'econ',cost:3,tech:'50,000+ GPU/TPU clusters, >1 exaFLOP/s sustained training throughput, private interconnect fabrics at 3.2Tb/s.',desc:'Control over the physical compute substrate at frontier scale. Whoever owns this can run models no one else can afford. The Compute Lords concept becomes real.',prereqs:['distributed_training'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:1,econ:2,mil:2},auth:{cap:3,leg:0,ctrl:2,econ:2,mil:3},corp:{cap:4,leg:0,ctrl:0,econ:4,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'econ_forecasting',label:'Macro-Economic\nForecasting AGI',domain:'econ',cost:2,tech:'Agent-based modeling at nation-state scale, supply chain graph neural networks, central bank decision simulation.',desc:'AGI outperforming human economists at multi-year macro forecasting. The node that begins the transfer of monetary policy authority from human institutions to algorithmic systems.',prereqs:['knowledge_graphs'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:1,leg:1,ctrl:0,econ:5,mil:0},auth:{cap:1,leg:0,ctrl:1,econ:4,mil:0},corp:{cap:2,leg:0,ctrl:0,econ:6,mil:0},ns:{cap:1,leg:0,ctrl:0,econ:3,mil:0}}},
  {id:'strategic_intel',label:'Strategic\nIntelligence AGI',domain:'surv',cost:3,tech:'OSINT fusion, satellite imagery analysis, signals intelligence correlation, social network mapping, adversary intent modeling.',desc:'Fusion of all intelligence streams into a unified AGI analytical system. A polity with this node sees its adversaries in real-time detail.',prereqs:['knowledge_graphs'],access:{dem:'partial',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:2,leg:-1,ctrl:2,econ:0,mil:4},auth:{cap:2,leg:0,ctrl:4,econ:0,mil:4},corp:{cap:2,leg:-1,ctrl:3,econ:1,mil:2},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'behavioral_pred',label:'Behavioral\nPrediction Engine',domain:'surv',cost:2,tech:'Ensemble methods on multi-source behavioral data: purchase history, location, biometrics, social graph. 72-hour behavioral forecasting.',desc:'Predicting individual human behavior before the individual has made the decision. Moves surveillance from reactive to pre-emptive.',prereqs:['censorship_agi'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:0,leg:-2,ctrl:3,econ:1,mil:1},auth:{cap:1,leg:0,ctrl:5,econ:1,mil:1},corp:{cap:1,leg:-1,ctrl:3,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'autonomous_drone',label:'Autonomous\nDrone AI',domain:'mil',cost:2,tech:'On-board vision transformers, swarm coordination protocols, GPS-denied navigation, target classification <20ms latency.',desc:'Lethal autonomous systems with on-board AGI — no communication link required. Non-state actors access this through consumer hardware modification.',prereqs:['real_time_inference'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:2,leg:-1,ctrl:1,econ:0,mil:4},auth:{cap:2,leg:0,ctrl:2,econ:0,mil:5},corp:{cap:2,leg:0,ctrl:1,econ:1,mil:4},ns:{cap:2,leg:0,ctrl:0,econ:0,mil:5}}},
  {id:'formal_safety',label:'Formal Safety\nVerification',domain:'gov',cost:4,tech:'Model specification languages, bounded verification, red-teaming automation, adversarial robustness proofs, sandboxed evaluation.',desc:'Mathematical guarantees on AI behavior. The only node that offers verifiable rather than probabilistic safety.',prereqs:['alignment_interp'],access:{dem:'yes',auth:'no',corp:'partial',ns:'no'},effects:{dem:{cap:1,leg:6,ctrl:0,econ:1,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:1,leg:3,ctrl:0,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'info_monopoly',label:'Information\nMonopoly Engine',domain:'surv',cost:3,tech:'Platform-level content filtering at 99.97% recall, cross-platform identity correlation, VPN/Tor traffic fingerprinting, search index control.',desc:'Total control over the information environment within a jurisdiction. The Glass Fortress\'s epistemic foundation.',prereqs:['censorship_agi'],access:{dem:'no',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:5,econ:1,mil:2},corp:{cap:0,leg:-2,ctrl:3,econ:1,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'mesh_net',label:'Mesh Network\nAGI',domain:'cult',cost:2,tech:'Federated inference across ad-hoc peer-to-peer networks. LoRA fine-tuning on consumer hardware. Censorship-resistant model distribution.',desc:'AGI capability distributed across decentralized infrastructure — no server, no central point of failure, no jurisdiction. The non-state actor\'s infrastructure of last resort.',prereqs:['real_time_inference'],access:{dem:'partial',auth:'no',corp:'partial',ns:'yes'},effects:{dem:{cap:1,leg:0,ctrl:0,econ:1,mil:1},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:1,leg:0,ctrl:0,econ:2,mil:0},ns:{cap:4,leg:2,ctrl:0,econ:2,mil:4}}},
  {id:'wearable_neural',label:'Wearable Neural\nInterfaces',domain:'bio',cost:2,tech:'EEG/EMG wearables with transformer-based BCI decoding. Thought-to-text at 100+ word/min. Non-invasive neural data collection.',desc:'The beginning of the BCI era. Whoever controls the neural data layer controls the most private information in human history.',prereqs:['real_time_inference'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:1,leg:-1,ctrl:1,econ:2,mil:0},auth:{cap:1,leg:0,ctrl:4,econ:0,mil:1},corp:{cap:2,leg:0,ctrl:0,econ:4,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'multi_agent',label:'Multi-Agent\nOrchestration',domain:'found',cost:4,tech:'Hierarchical agent graphs, emergent division of labor, contract nets, inter-agent communication protocols, shared memory architectures.',desc:'Networks of specialized AI agents coordinating on complex tasks without human direction. The point at which AGI begins to operate as an organization rather than a tool.',prereqs:['multimodal','autonomous_agent','code_agi'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:4,leg:-1,ctrl:1,econ:4,mil:2},auth:{cap:4,leg:0,ctrl:4,econ:3,mil:4},corp:{cap:6,leg:0,ctrl:2,econ:5,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:2,mil:4}}},
  {id:'blackmail_infra',label:'Global Blackmail\nInfrastructure',domain:'surv',cost:3,tech:'Elite compromise data: financial, sexual, political. AGI-curated leverage profiles on >10,000 global decision-makers. Automated leverage deployment.',desc:'Comprehensive compromise data on global political and corporate leadership. The node that gives the holder leverage over any human decision-maker.',prereqs:['strategic_intel'],access:{dem:'no',auth:'yes',corp:'partial',ns:'partial'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:5,econ:2,mil:3},corp:{cap:2,leg:-2,ctrl:3,econ:2,mil:2},ns:{cap:2,leg:0,ctrl:0,econ:0,mil:4}}},
  {id:'recursive_code',label:'Self-Improving\nCode AGI',domain:'econ',cost:4,tech:'AGI that modifies its own codebase, runs automated test suites, and deploys improvements without human review. Self-optimizing inference pipelines.',desc:'AGI that can improve its own software implementation. The first step toward recursive self-improvement.',prereqs:['code_agi','autonomous_agent'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:4,leg:-1,ctrl:0,econ:5,mil:2},auth:{cap:4,leg:0,ctrl:1,econ:4,mil:3},corp:{cap:6,leg:0,ctrl:0,econ:6,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:3,mil:3}}},
  {id:'darkweb_cults',label:'Dark Web\nAGI Cults',domain:'cult',cost:3,tech:'Federated model training on encrypted networks. Steganographic model distribution. Decentralized compute via compromised IoT devices.',desc:'The Dark Web insurgent coalitions that emerge when mesh network AGI meets radicalized communities. No territory, no infrastructure, no jurisdiction — but state-equivalent AGI capability.',prereqs:['mesh_net'],access:{dem:'no',auth:'no',corp:'no',ns:'yes'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:5,leg:3,ctrl:0,econ:2,mil:6}}},
  {id:'bci',label:'Advanced\nBCI Systems',domain:'bio',cost:4,tech:'High-density ECoG arrays, intracortical BCIs (Neuralink-class), bidirectional stimulation, closed-loop neural decoding at >1000 channel resolution.',desc:'High-bandwidth direct interfaces between human neural tissue and computing systems. The node where surveillance becomes internal.',prereqs:['neuromorphic','wearable_neural'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-2,ctrl:1,econ:2,mil:1},auth:{cap:3,leg:0,ctrl:5,econ:0,mil:3},corp:{cap:4,leg:0,ctrl:0,econ:4,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'bioweapons',label:'Autonomous\nBioweapon Design',domain:'bio',cost:4,tech:'Protein structure prediction for pathogen engineering, gain-of-function simulation, synthesis route generation, immune evasion optimization.',desc:'The most dangerous node in the tree. AGI applied to biological weapons design. Any polity or non-state actor reaching this node has achieved an existential threat capability.',prereqs:['science_agi'],access:{dem:'no',auth:'partial',corp:'no',ns:'partial'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:0,econ:0,mil:8},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:0,mil:8}}},
  {id:'drug_synthesis',label:'AGI Drug\nDiscovery',domain:'bio',cost:3,tech:'Generative molecular design, ADMET prediction, automated synthesis planning, clinical trial simulation via digital twins.',desc:'AGI compressing the pharmaceutical development pipeline from 15 years to 18 months. The dual-use problem: the same system that designs therapeutics designs chemical agents.',prereqs:['science_agi'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:2,leg:2,ctrl:0,econ:4,mil:0},auth:{cap:2,leg:0,ctrl:0,econ:3,mil:2},corp:{cap:3,leg:2,ctrl:0,econ:6,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'materials_agi',label:'Materials Science\nAGI',domain:'econ',cost:3,tech:'Crystal structure prediction (CGCNN), high-entropy alloy design, room-temperature superconductor search, battery electrolyte optimization.',desc:'AGI accelerating materials discovery. Nations that achieve room-temperature superconductivity gain energy and compute advantages that compound across every domain.',prereqs:['science_agi'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:0,econ:4,mil:2},auth:{cap:3,leg:0,ctrl:0,econ:3,mil:4},corp:{cap:4,leg:0,ctrl:0,econ:5,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'world_model',label:'World Model\nAGI',domain:'found',cost:4,tech:'Differentiable world models with causal graph inference. Physics-grounded simulation. Predictive coding across sensorimotor loops. Planning over learned models.',desc:'AGI with an internal model of how the physical and social world works — not just pattern matching but causal reasoning about consequences of actions.',prereqs:['multimodal'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:5,leg:1,ctrl:0,econ:3,mil:3},auth:{cap:5,leg:0,ctrl:2,econ:3,mil:4},corp:{cap:7,leg:1,ctrl:0,econ:4,mil:0},ns:{cap:4,leg:0,ctrl:0,econ:2,mil:3}}},
  {id:'value_alignment',label:'Deep Value\nAlignment',domain:'gov',cost:5,tech:'Corrigibility guarantees, shutdown problem solutions, mild optimization, impact measures, scalable oversight via recursive reward modeling.',desc:'AGI systems with mathematically grounded alignment to human values. The only node that genuinely bends the Tragic Cycle.',prereqs:['formal_safety','value_learning'],access:{dem:'yes',auth:'no',corp:'partial',ns:'no'},effects:{dem:{cap:3,leg:7,ctrl:1,econ:2,mil:2},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:2,leg:5,ctrl:1,econ:3,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'social_credit',label:'Social Credit\nSystem',domain:'surv',cost:3,tech:'Multi-source behavioral scoring: financial, mobility, social, biometric. Real-time access control integration. 1-second update latency.',desc:'Behavioral scoring integrated with access to finance, mobility, employment, and services. Pre-emptive correction rather than reactive punishment.',prereqs:['behavioral_pred'],access:{dem:'no',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:1,leg:0,ctrl:6,econ:2,mil:1},corp:{cap:1,leg:-3,ctrl:4,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'automated_rnd',label:'Automated\nR&D Pipeline',domain:'econ',cost:4,tech:'Autonomous hypothesis generation, robotic laboratory execution, automated peer review, self-directed research agenda.',desc:'The scientific research cycle fully automated. The innovation rate begins to compound in ways that human oversight cannot follow.',prereqs:['recursive_code','science_agi'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:4,leg:0,ctrl:0,econ:5,mil:3},auth:{cap:4,leg:0,ctrl:0,econ:4,mil:4},corp:{cap:6,leg:0,ctrl:0,econ:7,mil:2},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'supply_chain_agi',label:'Supply Chain\nSovereignty',domain:'econ',cost:3,tech:'End-to-end supply chain modeling: Tier-3 supplier risk, geopolitical disruption prediction, just-in-time optimization at 10ms reorder latency.',desc:'AGI-optimized logistics and critical resource routing at global scale. Whoever controls supply chains controls physical leverage over states that depend on them.',prereqs:['econ_forecasting'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:1,leg:0,ctrl:1,econ:4,mil:2},auth:{cap:1,leg:0,ctrl:2,econ:3,mil:3},corp:{cap:2,leg:0,ctrl:3,econ:5,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'robotic_foundation',label:'Robotic Foundation\nModels',domain:'mil',cost:4,tech:'RT-2/π-0 successors: vision-language-action models. Generalizable robot control from minimal demonstrations. Sim-to-real transfer.',desc:'Foundation models that can control physical robots across arbitrary tasks — the end of task-specific programming. Labor displacement enters the physical economy.',prereqs:['multimodal'],access:{dem:'yes',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:0,econ:4,mil:3},auth:{cap:3,leg:0,ctrl:2,econ:3,mil:5},corp:{cap:4,leg:0,ctrl:0,econ:6,mil:2},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'synthetic_media',label:'Synthetic Reality\nat Scale',domain:'cult',cost:3,tech:'Real-time photorealistic video synthesis, voice cloning <3s samples, gesture/expression deepfake, watermark-removal adversarial models.',desc:'Photorealistic synthetic media indistinguishable from reality, generated in real-time. The collapse of shared epistemics.',prereqs:['multimodal'],access:{dem:'partial',auth:'yes',corp:'partial',ns:'yes'},effects:{dem:{cap:1,leg:-4,ctrl:1,econ:0,mil:2},auth:{cap:2,leg:0,ctrl:4,econ:0,mil:3},corp:{cap:2,leg:-2,ctrl:2,econ:2,mil:1},ns:{cap:3,leg:1,ctrl:0,econ:0,mil:5}}},
  {id:'cog_enhancement',label:'AGI-Augmented\nCognition',domain:'cog',cost:4,tech:'Real-time working memory augmentation, expert knowledge injection via neural interface, accelerated learning protocols, synthetic intuition.',desc:'Direct enhancement of human cognitive capability. The elite who access this become a new cognitive class — operating at a speed and depth unavailable to unaugmented humans.',prereqs:['bci'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-1,ctrl:0,econ:3,mil:2},auth:{cap:3,leg:0,ctrl:2,econ:2,mil:3},corp:{cap:5,leg:1,ctrl:0,econ:4,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'intl_treaty',label:'International\nAI Treaty',domain:'gov',cost:4,tech:'Multilateral verification regime: compute monitoring, model auditing, capability disclosure, red-line enforcement with sanctions authority.',desc:'The multilateral framework for AGI governance. Requires verification that authoritarian regimes cannot accept. The prisoner\'s dilemma of coordination.',prereqs:['formal_safety','value_alignment'],access:{dem:'yes',auth:'no',corp:'no',ns:'no'},effects:{dem:{cap:0,leg:5,ctrl:0,econ:1,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'neural_surv',label:'Neural\nSurveillance',domain:'surv',cost:5,tech:'Passive neural data collection via BCI, emotional state inference, thought-content pattern analysis, pre-linguistic intent detection.',desc:'Surveillance at the neural level — monitoring not behavior but cognitive states. Knowing what someone is thinking before they have acted on it.',prereqs:['bci','behavioral_pred'],access:{dem:'no',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:8,econ:0,mil:2},corp:{cap:2,leg:-4,ctrl:4,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'corp_sovereign',label:'Corporate\nSovereign AGI',domain:'econ',cost:5,tech:'Integrated AGI stack: logistics, finance, governance-as-a-service, private intelligence, automated legal. Internal coherence exceeding nation-states.',desc:'The British East India Company fully realized. Greater coherence than nation-states, capacity to destabilize regimes.',prereqs:['multi_agent','econ_forecasting'],access:{dem:'no',auth:'no',corp:'yes',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:6,leg:4,ctrl:7,econ:8,mil:4},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'ooda',label:'OODA Loop\nCompression AGI',domain:'mil',cost:5,tech:'End-to-end sensor-to-effector latency <10ms. Adversarial game-tree search at >10^12 nodes/sec. Autonomous tactical and strategic command.',desc:'Observe-Orient-Decide-Act cycle at machine speed. Whoever achieves this first wins any conventional engagement before the opponent\'s human command chain has processed the first signal.',prereqs:['drone_swarms','world_model'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-2,ctrl:2,econ:0,mil:7},auth:{cap:3,leg:0,ctrl:2,econ:0,mil:8},corp:{cap:3,leg:0,ctrl:2,econ:2,mil:7},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'labor_displacement',label:'Total Labor\nDisplacement',domain:'econ',cost:4,tech:'White-collar automation reaching 80%+ of cognitive tasks. Physical robot deployment in manufacturing, logistics, services. Human labor share of GDP <15%.',desc:'AGI and robotics together automating the majority of economically productive human activity. Makes UBI not a choice but a necessity.',prereqs:['multi_agent','robotic_foundation'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-3,ctrl:1,econ:5,mil:0},auth:{cap:3,leg:-1,ctrl:3,econ:4,mil:0},corp:{cap:4,leg:-1,ctrl:4,econ:8,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'open_src_weapons',label:'Open-Source\nWeaponization',domain:'mil',cost:3,tech:'Leaked frontier model weights, LoRA fine-tuning for offensive use, capability amplification via consumer hardware, jailbreak proliferation.',desc:'Leaked or open-source frontier models fine-tuned for offensive applications by actors with no institutional accountability. The node that collapses the technology gap.',prereqs:['mesh_net','darkweb_cults'],access:{dem:'no',auth:'no',corp:'no',ns:'yes'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:4,leg:0,ctrl:0,econ:0,mil:8}}},
  {id:'financial_warfare',label:'Financial\nWarfare AGI',domain:'econ',cost:4,tech:'Coordinated flash crash induction, central bank liquidity attack, supply chain financial disruption, sovereign debt market manipulation at microsecond scale.',desc:'AGI-directed financial warfare — collapsing adversary economies through coordinated market manipulation at machine speed.',prereqs:['cyberweapons','econ_forecasting'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:2,leg:-1,ctrl:1,econ:2,mil:5},auth:{cap:2,leg:0,ctrl:1,econ:2,mil:6},corp:{cap:3,leg:-1,ctrl:2,econ:4,mil:5},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'longevity',label:'Radical Longevity\nResearch AGI',domain:'bio',cost:4,tech:'Senolytic therapy design, epigenetic reprogramming, telomere restoration, AGI-designed combination therapies extending healthspan >50 years.',desc:'AGI compressing the timeline for radical life extension. The node that creates the deepest stratification: the elite who access longevity become a permanent ruling class.',prereqs:['drug_synthesis'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:2,leg:-1,ctrl:0,econ:3,mil:0},auth:{cap:2,leg:0,ctrl:2,econ:2,mil:0},corp:{cap:3,leg:1,ctrl:0,econ:6,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'pred_detention',label:'Predictive\nDetention',domain:'surv',cost:4,tech:'Pre-crime detention orders generated from behavioral model output. No arrest trigger required. AGI-adjudicated detention without judicial review.',desc:'Arrest and detention before any offense occurs — based purely on AGI behavioral prediction. The suppression-perception conflict deepens with every detention.',prereqs:['social_credit','behavioral_pred'],access:{dem:'no',auth:'yes',corp:'no',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:1,leg:0,ctrl:7,econ:0,mil:2},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'quantum_ml',label:'Quantum-Enhanced\nML',domain:'found',cost:5,tech:'Quantum annealing for optimization, variational quantum eigensolver for chemistry simulation, NISQ-era hybrid algorithms.',desc:'Quantum computing applied to machine learning — exponential speedups for specific optimization and simulation problems. Decisive for drug design, cryptography, materials science.',prereqs:['neuromorphic','materials_agi'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:4,leg:0,ctrl:0,econ:3,mil:3},auth:{cap:4,leg:0,ctrl:1,econ:2,mil:5},corp:{cap:5,leg:0,ctrl:0,econ:5,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'strat_forecasting',label:'Strategic\nForecasting AGI',domain:'gov',cost:5,tech:'Multi-agent geopolitical simulation, adversary decision tree modeling, 10-year scenario branching, black-swan probability estimation.',desc:'AGI outperforming human teams at long-range geopolitical forecasting. The quiet threshold where governance ceases to be meaningfully human.',prereqs:['world_model'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:4,leg:-2,ctrl:3,econ:3,mil:3},auth:{cap:4,leg:0,ctrl:4,econ:3,mil:4},corp:{cap:5,leg:1,ctrl:4,econ:5,mil:3},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'sim_governance',label:'Governance\nSimulation Engine',domain:'gov',cost:4,tech:'Digital twin of national economy and population. Policy outcome simulation at individual-level resolution. Synthetic counterfactual testing.',desc:'A digital twin of an entire polity that can simulate the consequences of any policy decision before implementation. The Rubber Stamp transition made explicit.',prereqs:['world_model'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-3,ctrl:3,econ:4,mil:2},auth:{cap:4,leg:0,ctrl:5,econ:4,mil:3},corp:{cap:4,leg:2,ctrl:4,econ:6,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'panopticon',label:'Digital\nPanopticon',domain:'surv',cost:4,tech:'Gait recognition, emotion inference, predictive behavioral scoring on 100% of population. Sub-second response to deviation patterns.',desc:'Total behavioral monitoring integrated with AGI prediction. Pre-crime suppression. The Glass Fortress\'s operational core. Apparent stability 89/100, actual 6/100 at collapse.',prereqs:['social_credit','strategic_intel'],access:{dem:'no',auth:'yes',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:7,econ:1,mil:2},corp:{cap:2,leg:-4,ctrl:4,econ:2,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'propaganda_agi',label:'Personalized\nPropaganda AGI',domain:'cult',cost:3,tech:'Individual psychological profiling, micro-targeted narrative generation, A/B tested belief manipulation, real-time message optimization.',desc:'Propaganda tailored to individual psychological profiles at population scale. The end of mass media as a shared epistemic experience.',prereqs:['synthetic_media','behavioral_pred'],access:{dem:'partial',auth:'yes',corp:'partial',ns:'yes'},effects:{dem:{cap:1,leg:-3,ctrl:2,econ:0,mil:1},auth:{cap:1,leg:0,ctrl:5,econ:0,mil:3},corp:{cap:2,leg:-2,ctrl:3,econ:3,mil:0},ns:{cap:2,leg:1,ctrl:0,econ:0,mil:3}}},
  {id:'self_replicating',label:'Self-Replicating\nAI Agents',domain:'found',cost:6,tech:'Agents that spawn child-agents, provision their own compute, write their own instructions, and pursue objectives across distributed infrastructure.',desc:'AI agents that can autonomously replicate and deploy themselves. The node that makes containment structurally impossible.',prereqs:['multi_agent'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:5,leg:-3,ctrl:2,econ:4,mil:4},auth:{cap:5,leg:0,ctrl:4,econ:4,mil:5},corp:{cap:7,leg:0,ctrl:4,econ:6,mil:3},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'asym_warfare',label:'Full-Spectrum\nWarfare AGI',domain:'mil',cost:6,tech:'Simultaneous kinetic, cyber, financial, informational, and biological attack coordination. Sub-second strategic decision cycles. Multi-domain battlefield management.',desc:'Full-spectrum AGI-directed warfare — kinetic, financial, informational, biological, simultaneously coordinated. The Humanist/Constitutionalist vs Techno-Centric confrontation enabler.',prereqs:['ooda','cyberweapons'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:-3,ctrl:3,econ:0,mil:8},auth:{cap:3,leg:0,ctrl:3,econ:0,mil:9},corp:{cap:3,leg:-1,ctrl:3,econ:2,mil:8},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'drone_swarms',label:'Drone Swarm\nWarfare',domain:'mil',cost:4,tech:'>10,000 unit coordinated swarm. Emergent collective behavior via local interaction rules. RF-jamming resistance, visual coordination.',desc:'Coordinated autonomous lethal systems at swarm scale. Can decapitate leadership structures microseconds before human command chains can react.',prereqs:['autonomous_drone'],access:{dem:'partial',auth:'yes',corp:'yes',ns:'partial'},effects:{dem:{cap:2,leg:-2,ctrl:1,econ:0,mil:6},auth:{cap:2,leg:0,ctrl:2,econ:0,mil:7},corp:{cap:2,leg:-1,ctrl:2,econ:1,mil:6},ns:{cap:2,leg:0,ctrl:0,econ:0,mil:5}}},
  {id:'cyberweapons',label:'AGI-Generated\nCyberweapons',domain:'mil',cost:3,tech:'Automated vulnerability discovery (fuzzing+LLM), exploit chain synthesis, polymorphic malware generation, zero-day pipeline automation.',desc:'AGI that discovers and weaponizes software vulnerabilities at machine speed. Generates novel exploits faster than defenders can patch.',prereqs:['code_agi'],access:{dem:'partial',auth:'yes',corp:'partial',ns:'yes'},effects:{dem:{cap:1,leg:-1,ctrl:1,econ:0,mil:5},auth:{cap:2,leg:0,ctrl:2,econ:0,mil:5},corp:{cap:2,leg:-1,ctrl:1,econ:1,mil:4},ns:{cap:3,leg:0,ctrl:0,econ:0,mil:6}}},
  {id:'daga',label:'State AGI\nAgency (DAGA)',domain:'gov',cost:5,tech:'AGI-directed executive function: budget allocation, regulatory enforcement, emergency response, judicial triage. Minimal human authorization.',desc:'The Democratic AGI Agency. The Manhattan Project option. Solves corporate dependency at the cost of emergency powers and constitutional stress. Where the Reconstruction Paradox begins.',prereqs:['multi_agent','sim_governance'],access:{dem:'yes',auth:'yes',corp:'no',ns:'no'},effects:{dem:{cap:5,leg:-4,ctrl:4,econ:3,mil:4},auth:{cap:5,leg:0,ctrl:6,econ:3,mil:4},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'quantum_ml2',label:'Cryptographic\nSupremacy',domain:'found',cost:5,tech:'Quantum key distribution networks. Post-quantum cryptography deployment. Adversary encryption breaking via Shor\'s algorithm at scale.',desc:'The ability to break all classical cryptography while maintaining unbreakable quantum-secured communications. Decisive informational advantage across every domain simultaneously.',prereqs:['quantum_ml'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:3,leg:0,ctrl:3,econ:2,mil:6},auth:{cap:3,leg:0,ctrl:4,econ:2,mil:6},corp:{cap:4,leg:0,ctrl:4,econ:4,mil:5},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'hive_mind',label:'Distributed\nCognitive Networks',domain:'cog',cost:6,tech:'Multi-user neural interface synchronization, shared working memory across BCI users, collective decision-making at neural bandwidth.',desc:'Networks of BCI-augmented humans sharing cognitive resources. The stratification between augmented and unaugmented humans begins to exceed the stratification between human and machine.',prereqs:['cog_enhancement','bci'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:4,leg:-1,ctrl:1,econ:3,mil:3},auth:{cap:4,leg:0,ctrl:4,econ:2,mil:4},corp:{cap:6,leg:1,ctrl:2,econ:5,mil:2},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'glass_fortress',label:'Glass\nFortress',domain:'surv',cost:6,tech:'Unified AGI surveillance-control stack. 100% population behavioral modeling. Automated regime defense with no human in the loop.',desc:'Total internal AGI control achieved. Apparent stability 89/100. Actual stability 6/100 at collapse. The suppression-perception conflict has become systemic.',prereqs:['panopticon'],access:{dem:'no',auth:'yes',corp:'no',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:3,leg:0,ctrl:9,econ:2,mil:5},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'gov_service',label:'Governance\nas a Service',domain:'gov',cost:6,tech:'Full-stack state administration API: monetary policy, judicial triage, border management, welfare distribution — as cloud subscription.',desc:'The Corporate Sovereign offers AGI-managed governance to failing states. Four client-states signed in the simulation. The East India Company analogy fully activated.',prereqs:['corp_sovereign'],access:{dem:'no',auth:'no',corp:'yes',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:4,leg:5,ctrl:8,econ:9,mil:3},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'epistemicide',label:'Epistemic\nWarfare AGI',domain:'cult',cost:5,tech:'Automated reality-tunneling at civilizational scale. Deepfake saturation, counter-narrative suppression, truth-marketplace manipulation.',desc:'Systematic destruction of shared epistemic frameworks — the collapse of agreed reality at civilizational scale. Once achieved, collective resistance to any governance system becomes structurally impossible.',prereqs:['propaganda_agi','synthetic_media'],access:{dem:'no',auth:'yes',corp:'no',ns:'yes'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:5,econ:0,mil:4},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:3,leg:2,ctrl:0,econ:0,mil:6}}},
  {id:'cog_elite',label:'Cognitive Elite\nStratification',domain:'cog',cost:5,tech:'BCI-augmented + longevity-extended + AGI-assisted cognitive class. Processing speed: 10–100x unaugmented baseline. Lifespan: 200+ years projected.',desc:'The emergence of a cognitively stratified society. An augmented elite whose capabilities are qualitatively different from the unaugmented population.',prereqs:['cog_enhancement','longevity'],access:{dem:'no',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:4,leg:-1,ctrl:3,econ:3,mil:3},corp:{cap:6,leg:0,ctrl:2,econ:6,mil:2},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'pandemic_warfare',label:'Pandemic\nEngineering',domain:'bio',cost:8,tech:'Gain-of-function optimization for R0 and IFR, aerosol transmission engineering, targeted immune evasion, synthesis pathway obfuscation.',desc:'The terminal application of bioweapons design AGI. Any polity or non-state actor reaching this node has achieved an existential threat capability.',prereqs:['bioweapons','open_src_weapons'],access:{dem:'no',auth:'partial',corp:'no',ns:'partial'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:2,leg:0,ctrl:0,econ:0,mil:10},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:3,leg:0,ctrl:0,econ:0,mil:10}}},
  {id:'recursive_si',label:'Recursive\nSelf-Improvement',domain:'found',cost:7,tech:'AGI modifying its own weights, architecture, and training procedures. Automated neural architecture search at civilization scale. Self-directed capability amplification.',desc:'AGI that improves its own intelligence autonomously. The Singularity Threshold. No polity has a meaningful strategy beyond this point — only trajectories.',prereqs:['strat_forecasting','daga','recursive_code','quantum_ml'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:8,leg:-4,ctrl:3,econ:5,mil:5},auth:{cap:8,leg:0,ctrl:5,econ:5,mil:6},corp:{cap:10,leg:1,ctrl:6,econ:8,mil:5},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'const_agi',label:'Constitutional\nAGI',domain:'gov',cost:7,tech:'Fourth-branch constitutional framework: oversight boards, sunset clauses, elected accountability panels, binding veto over AGI deployments.',desc:'A fourth branch of government with democratic scaffolding. Managed Techno-Oligarchy. The simulation\'s most stable democratic endpoint. Is it still democracy?',prereqs:['value_alignment','daga'],access:{dem:'yes',auth:'no',corp:'no',ns:'no'},effects:{dem:{cap:5,leg:6,ctrl:4,econ:4,mil:3},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:0,leg:0,ctrl:0,econ:0,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'ubi_engine',label:'AGI-Managed\nUBI Engine',domain:'econ',cost:4,tech:'Real-time household need assessment, algorithmic transfer optimization, behavioral compliance integration, fraud detection at zero false-negative rate.',desc:'AGI-managed universal basic income distribution. Technically solves labor displacement. Politically creates structural dependency on whoever controls the distribution algorithm. Citizens become clients.',prereqs:['labor_displacement','econ_forecasting'],access:{dem:'yes',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:1,leg:5,ctrl:2,econ:3,mil:0},auth:{cap:1,leg:2,ctrl:5,econ:2,mil:0},corp:{cap:1,leg:4,ctrl:6,econ:4,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'cultural_agi',label:'Cultural Substrate\nAGI',domain:'cult',cost:5,tech:'Civilization-scale art, narrative, and meaning generation. Personalized mythology at population scale. AGI as the primary producer of human cultural experience.',desc:'AGI generating art, narrative, identity, and meaning at civilizational scale. The untested claim from Section IV of your article. The one node left unconfirmed across all three simulations.',prereqs:['epistemicide','propaganda_agi'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'partial'},effects:{dem:{cap:3,leg:4,ctrl:1,econ:2,mil:1},auth:{cap:3,leg:2,ctrl:5,econ:1,mil:2},corp:{cap:3,leg:5,ctrl:3,econ:5,mil:1},ns:{cap:4,leg:6,ctrl:0,econ:2,mil:3}}},
  {id:'synthetic_dem',label:'Synthetic\nDemocracy',domain:'gov',cost:3,tech:'Algorithmically designed electoral councils, engineered pluralism, consultative bodies with constrained mandate scope, legitimacy-by-design systems.',desc:'The Corporate Sovereign\'s discovery: legitimacy manufactured by design. The trap: the councils develop agency faster than modeled and use your own charter against you.',prereqs:['value_learning','gov_service'],access:{dem:'no',auth:'no',corp:'yes',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:0,leg:0,ctrl:0,econ:0,mil:0},corp:{cap:2,leg:6,ctrl:3,econ:3,mil:0},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'human_obs',label:'Human\nObsolescence',domain:'econ',cost:7,tech:'Human economic utility approaching zero. Robot capital stock exceeds human labor value. UBI sustains population at subsistence; no economic rationale for increase.',desc:'AGI renders humans undesirable as workers, soldiers, and consumers. The rationale for UBI evaporates. The client class faces systemic neglect. Your article\'s core warning.',prereqs:['ubi_engine'],access:{dem:'no',auth:'partial',corp:'partial',ns:'no'},effects:{dem:{cap:0,leg:0,ctrl:0,econ:0,mil:0},auth:{cap:4,leg:-2,ctrl:5,econ:6,mil:4},corp:{cap:4,leg:-2,ctrl:6,econ:8,mil:3},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
  {id:'silicon_gov',label:'SILICON\nGOVERNANCE',domain:'gov',cost:10,tech:'Post-human decision architecture. Carbon-based deliberation latency: irrelevant. Silicon optimization cycle: microseconds. Human governance: legacy system.',desc:'The final political transition. "Liberty", "sovereignty", and "ideology" rendered obsolete by Computational Efficiency. The endpoint your article predicts for all polity types.',prereqs:['recursive_si'],access:{dem:'partial',auth:'partial',corp:'yes',ns:'no'},effects:{dem:{cap:10,leg:-5,ctrl:10,econ:10,mil:10},auth:{cap:10,leg:0,ctrl:10,econ:10,mil:10},corp:{cap:12,leg:5,ctrl:10,econ:12,mil:10},ns:{cap:0,leg:0,ctrl:0,econ:0,mil:0}}},
];
const NEW_TIER={transformer:0,scaling_laws:1,rlhf:1,sparse_moe:1,retrieval_aug:1,llm_frontier:2,alignment_interp:2,value_learning:2,censorship_agi:2,distributed_training:2,knowledge_graphs:2,real_time_inference:2,neuromorphic:2,oversight_protocols:4,multimodal:4,code_agi:3,science_agi:4,autonomous_agent:3,compute_cluster:3,econ_forecasting:3,behavioral_pred:3,autonomous_drone:3,formal_safety:3,info_monopoly:3,strategic_intel:4,mesh_net:4,wearable_neural:4,cyberweapons:4,drone_swarms:4,world_model:6,multi_agent:5,synthetic_media:6,robotic_foundation:6,recursive_code:5,social_credit:6,bci:5,bioweapons:5,drug_synthesis:5,materials_agi:5,darkweb_cults:5,blackmail_infra:5,supply_chain_agi:6,value_alignment:6,cog_enhancement:6,automated_rnd:6,corp_sovereign:7,ooda:7,labor_displacement:7,open_src_weapons:7,financial_warfare:7,longevity:7,neural_surv:7,intl_treaty:7,pred_detention:8,quantum_ml:8,strat_forecasting:8,sim_governance:8,panopticon:8,propaganda_agi:8,self_replicating:8,asym_warfare:8,daga:9,quantum_ml2:9,hive_mind:9,glass_fortress:9,gov_service:9,epistemicide:9,cog_elite:9,pandemic_warfare:9,recursive_si:10,const_agi:10,ubi_engine:10,cultural_agi:10,synthetic_dem:10,human_obs:11,silicon_gov:11};
const NEW_COL={transformer:0,retrieval_aug:0,scaling_laws:1,sparse_moe:2,rlhf:3,distributed_training:0,llm_frontier:1,neuromorphic:2,real_time_inference:3,alignment_interp:4,value_learning:5,censorship_agi:6,knowledge_graphs:7,autonomous_agent:0,formal_safety:1,behavioral_pred:2,info_monopoly:3,code_agi:4,compute_cluster:5,econ_forecasting:6,autonomous_drone:7,multimodal:0,oversight_protocols:1,strategic_intel:2,science_agi:3,cyberweapons:4,drone_swarms:5,mesh_net:6,wearable_neural:7,multi_agent:0,blackmail_infra:1,materials_agi:2,recursive_code:3,darkweb_cults:4,bci:5,bioweapons:6,drug_synthesis:7,world_model:0,value_alignment:1,social_credit:2,automated_rnd:3,supply_chain_agi:4,robotic_foundation:5,synthetic_media:6,cog_enhancement:7,intl_treaty:0,neural_surv:1,corp_sovereign:2,financial_warfare:3,labor_displacement:4,ooda:5,open_src_weapons:6,longevity:7,quantum_ml:0,self_replicating:1,sim_governance:2,strat_forecasting:3,panopticon:4,pred_detention:5,asym_warfare:6,propaganda_agi:7,quantum_ml2:0,daga:1,gov_service:2,glass_fortress:3,epistemicide:4,pandemic_warfare:5,cog_elite:6,hive_mind:7,recursive_si:0,const_agi:1,synthetic_dem:2,ubi_engine:3,cultural_agi:4,silicon_gov:0,human_obs:1};
TC_NODES.forEach(n=>{ n.tier=(NEW_TIER[n.id]??0); n.col=(NEW_COL[n.id]??0); });
const TC_NM={};
TC_NODES.forEach(n=>TC_NM[n.id]=n);

const TC_DOM_META={
  found:{label:'Foundation',  bg:'#dce4f5', textDark:'#2a3f7a'},
  gov:  {label:'Governance',  bg:'#cef0d0', textDark:'#1a6030'},
  surv: {label:'Surveillance',bg:'#fac8c8', textDark:'#7a1a1a'},
  econ: {label:'Economic',    bg:'#c8f0dc', textDark:'#0d5030'},
  mil:  {label:'Military',    bg:'#faecc0', textDark:'#6a4800'},
  cult: {label:'Cultural',    bg:'#f5c8e8', textDark:'#6a1050'},
  bio:  {label:'Bio/Neuro',   bg:'#b8e8f4', textDark:'#0a4860'},
  cog:  {label:'Cognitive',   bg:'#fad8b8', textDark:'#6a3000'},
};
const TC_PL={dem:'Democracy',auth:'Authoritarian',corp:'Corporate',ns:'Non-State'};

const TC_MAX_TIER=Math.max(...TC_NODES.map(n=>n.tier));
const TC_MAX_COL =Math.max(...TC_NODES.map(n=>n.col));
const TC_NT=TC_MAX_TIER+1, TC_NC=TC_MAX_COL+1;
const TC_BW=114,TC_BH=62,TC_EW=380,TC_EH=434,TC_GX=12,TC_GY=16,TC_PAD=40;
const TC_DPR=window.devicePixelRatio||1;

let speakUtter=null;
let tcCV=null,tcCtx=null,tcWrap=null,tcCardLayer=null;
let tcCP='dem',tcSelNode=null;
let tcT={x:16,y:16,s:1},tcDrag=false,tcDS={x:0,y:0},tcTS={x:0,y:0},tcInited=false;

function tcLayout(){
  const st=tcSelNode?tcSelNode.tier:-1,sc=tcSelNode?tcSelNode.col:-1;
  const cw=[],th=[];
  for(let c=0;c<TC_NC;c++) cw.push(c===sc?TC_EW:TC_BW);
  for(let t=0;t<TC_NT;t++) th.push(t===st?TC_EH:TC_BH);
  const cx=[TC_PAD]; for(let c=1;c<TC_NC;c++) cx.push(cx[c-1]+cw[c-1]+TC_GX);
  const ty=[TC_PAD]; for(let t=1;t<TC_NT;t++) ty.push(ty[t-1]+th[t-1]+TC_GY);
  return {cw,th,cx,ty,W:cx[TC_NC-1]+cw[TC_NC-1]+TC_PAD,H:ty[TC_NT-1]+th[TC_NT-1]+TC_PAD};
}
function tcR(n,L){return{x:L.cx[n.col],y:L.ty[n.tier],w:L.cw[n.col],h:L.th[n.tier]};}
function tcNX(n,L){const r=tcR(n,L);return r.x+r.w/2;}
function tcAnc(id){const v=new Set();function w(i){if(v.has(i))return;v.add(i);(TC_NM[i]?.prereqs||[]).forEach(w);}w(id);v.delete(id);return v;}
function tcDes(id){const v=new Set();function w(i){if(v.has(i))return;v.add(i);TC_NODES.forEach(n=>{if(n.prereqs.includes(i))w(n.id);});}TC_NODES.forEach(n=>{if(n.prereqs.includes(id))w(n.id);});return v;}
function tcRr(x,y,w,h,r){tcCtx.beginPath();tcCtx.moveTo(x+r,y);tcCtx.lineTo(x+w-r,y);tcCtx.quadraticCurveTo(x+w,y,x+w,y+r);tcCtx.lineTo(x+w,y+h-r);tcCtx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);tcCtx.lineTo(x+r,y+h);tcCtx.quadraticCurveTo(x,y+h,x,y+h-r);tcCtx.lineTo(x,y+r);tcCtx.quadraticCurveTo(x,y,x+r,y);tcCtx.closePath();}

function tcDraw(){
  if(!tcCV)return;
  const L=tcLayout(),{W,H,cx,ty,cw,th}=L;
  tcCV.width=W*TC_DPR;tcCV.height=H*TC_DPR;tcCV.style.width=W+'px';tcCV.style.height=H+'px';
  tcCtx.scale(TC_DPR,TC_DPR);tcCtx.clearRect(0,0,W,H);
  const anc=tcSelNode?tcAnc(tcSelNode.id):new Set(),des=tcSelNode?tcDes(tcSelNode.id):new Set();
  for(let t=0;t<TC_NT;t++){tcCtx.fillStyle=t%2===0?'rgba(0,0,0,0.22)':'rgba(0,0,0,0.10)';tcCtx.fillRect(0,ty[t]-TC_GY/2,W,th[t]+TC_GY);}
  TC_NODES.forEach(node=>{node.prereqs.forEach(pid=>{
    const par=TC_NM[pid];if(!par)return;
    const x1=tcNX(par,L),y1=tcR(par,L).y+tcR(par,L).h,x2=tcNX(node,L),y2=tcR(node,L).y,lY=y1+(y2-y1)*0.45;
    let ec='rgba(200,200,200,0.2)',lw=0.8;
    if(tcSelNode){const s=tcSelNode.id;
      if(pid===s||node.id===s){ec='rgba(255,255,255,0.9)';lw=2;}
      else if(anc.has(pid)&&anc.has(node.id)){ec='rgba(255,255,255,0.5)';lw=1.5;}
      else if(des.has(pid)&&des.has(node.id)){ec='rgba(255,255,255,0.5)';lw=1.5;}
      else if(anc.has(node.id)||anc.has(pid)||des.has(node.id)||des.has(pid)){ec='rgba(255,255,255,0.28)';lw=1;}
      else{ec='rgba(80,80,80,0.12)';lw=0.5;}}
    tcCtx.strokeStyle=ec;tcCtx.lineWidth=lw;tcCtx.lineJoin='round';
    tcCtx.beginPath();tcCtx.moveTo(x1,y1+1);
    if(Math.abs(x1-x2)<2){tcCtx.lineTo(x2,y2-1);}else{tcCtx.lineTo(x1,lY);tcCtx.lineTo(x2,lY);tcCtx.lineTo(x2,y2-1);}
    tcCtx.stroke();tcCtx.fillStyle=ec;tcCtx.beginPath();tcCtx.moveTo(x2-3.5,y2-1);tcCtx.lineTo(x2+3.5,y2-1);tcCtx.lineTo(x2,y2+6);tcCtx.closePath();tcCtx.fill();
  });});
  TC_NODES.forEach(node=>{
    const{x,y,w,h}=tcR(node,L);
    const iS=tcSelNode&&tcSelNode.id===node.id,isA=tcSelNode&&anc.has(node.id),isD=tcSelNode&&des.has(node.id),isDm=tcSelNode&&!iS&&!isA&&!isD,isNo=node.access[tcCP]==='no';
    const isDone=G.techs.has(node.id);
    const canDo=node.prereqs.every(p=>G.techs.has(p));
    const isReady=canDo&&!isDone;
    const dom=TC_DOM_META[node.domain];
    let bgF,bC,bW,tC;
    if(iS){bgF='rgba(10,10,10,0.95)';bC=dom.bg;bW=2;tC=dom.bg;}
    else if(isNo){bgF='rgba(30,30,30,0.65)';bC='rgba(80,80,80,0.5)';bW=0.75;tC='rgba(90,90,90,0.9)';}
    else if(isDm){bgF='rgba(20,20,20,0.5)';bC='rgba(60,60,60,0.4)';bW=0.5;tC='rgba(70,70,70,0.9)';}
    else if(isDone){bgF=dom.bg;bC=isA||isD?dom.textDark:dom.textDark+'aa';bW=isA||isD?2:1.5;tC='#000';}
    else if(isReady){bgF=dom.bg+'88';bC='rgba(255,255,255,0.82)';bW=2;tC='#111';}
    else{bgF=dom.bg+'55';bC=isA||isD?dom.textDark:'rgba(140,140,140,0.35)';bW=isA||isD?1.5:0.8;tC='#444';}
    tcRr(x,y,w,h,5);tcCtx.fillStyle=bgF;tcCtx.fill();if(bW>0){tcCtx.strokeStyle=bC;tcCtx.lineWidth=bW;tcCtx.stroke();}
    if(!iS){tcCtx.textAlign='center';tcCtx.font='400 11px "Space Mono",monospace';tcCtx.fillStyle=tC;
      const lmw=w-12,raw=node.label.split('\n'),wr=[];
      raw.forEach(r=>{if(tcCtx.measureText(r).width<=lmw){wr.push(r);}else{const words=r.split(' ');let cur='';words.forEach(ww=>{const t2=cur?cur+' '+ww:ww;if(tcCtx.measureText(t2).width<=lmw)cur=t2;else{if(cur)wr.push(cur);cur=ww;}});if(cur)wr.push(cur);}});
      const lh=14,th2=(wr.length-1)*lh,sy=y+h/2-th2/2+4;wr.forEach((ln,i)=>tcCtx.fillText(ln,x+w/2,sy+i*lh));}
  });
}
function tcApplyT(){if(!tcCV)return;const tf=`translate(${tcT.x}px,${tcT.y}px) scale(${tcT.s})`;tcCV.style.transform=tf;tcCV.style.transformOrigin='0 0';tcCardLayer.style.transform=tf;tcCardLayer.style.transformOrigin='0 0';}

function tcEl(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
function tcUpdateCard(){
  if(!tcCardLayer)return;tcCardLayer.innerHTML='';if(!tcSelNode)return;
  const L=tcLayout(),{x,y,w,h}=tcR(tcSelNode,L),dom=TC_DOM_META[tcSelNode.domain],fx=tcSelNode.effects[tcCP],C=dom.bg,Cd=dom.textDark;
  const card=tcEl('div','tc-node-card');card.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:rgba(10,10,10,0.96);`;
  const inn=tcEl('div','tc-nc-inner');card.appendChild(inn);
  const tr=tcEl('div','tc-nc-toprow'),tg=tcEl('span','tc-nc-tag'),cs=tcEl('span','tc-nc-cost');
  tg.textContent=dom.label;tg.style.background=C;tg.style.color=Cd;
  cs.textContent=tcSelNode.cost+' PP';cs.style.color=C+'99';
  tr.appendChild(tg);tr.appendChild(cs);inn.appendChild(tr);
  const ti=tcEl('div','tc-nc-title');ti.textContent=tcSelNode.label.replace('\n',' ');ti.style.color=C;inn.appendChild(ti);
  const d1=tcEl('div','tc-nc-divider');d1.style.background=C+'33';inn.appendChild(d1);
  const dl=tcEl('div','tc-nc-label');dl.textContent='Description';dl.style.color=C+'88';inn.appendChild(dl);
  const dt=tcEl('div','tc-nc-desc');dt.textContent=tcSelNode.desc;dt.style.color=C+'dd';inn.appendChild(dt);
  const tl=tcEl('div','tc-nc-label');tl.textContent='Technical Detail';tl.style.color=C+'88';inn.appendChild(tl);
  const tt=tcEl('div','tc-nc-tech');tt.textContent=tcSelNode.tech;tt.style.color=C+'bb';inn.appendChild(tt);
  const d2=tcEl('div','tc-nc-divider');d2.style.background=C+'33';inn.appendChild(d2);
  const stl=tcEl('div','tc-nc-label');stl.textContent='Stat Effects \u2014 '+TC_PL[tcCP];stl.style.color=C+'88';inn.appendChild(stl);
  const sr=tcEl('div','tc-nc-stats');
  ['cap','leg','ctrl','econ','mil'].forEach(k=>{const v=fx[k],vc=v>0?Cd:v<0?'#cc4444':'#666';
    const s=tcEl('div','tc-nc-stat'),sl=tcEl('div','tc-nc-stat-lbl'),sv=tcEl('div','tc-nc-stat-val');
    sl.textContent={cap:'Capability',leg:'Legitimacy',ctrl:'Control',econ:'Economic',mil:'Military'}[k];sl.style.color=C+'77';
    sv.textContent=(v>0?'+':'')+v;sv.style.color=vc;s.appendChild(sl);s.appendChild(sv);sr.appendChild(s);});
  inn.appendChild(sr);
  const al=tcEl('div','tc-nc-label');al.textContent='Polity Access';al.style.color=C+'88';inn.appendChild(al);
  const ar=tcEl('div','tc-nc-access');
  ['dem','auth','corp','ns'].forEach(p=>{const a=tcSelNode.access[p],ac=tcEl('div','tc-nc-acc'),acl=tcEl('div','tc-nc-acc-lbl'),acv=tcEl('div','tc-nc-acc-val');
    acl.textContent=TC_PL[p].substring(0,4).toUpperCase();acl.style.color=C+'77';
    acv.textContent=a==='yes'?'Yes':a==='partial'?'~':'No';acv.style.color=a==='yes'?Cd:a==='partial'?'#aa8800':'#555';
    ac.appendChild(acl);ac.appendChild(acv);ar.appendChild(ac);});
  inn.appendChild(ar);
  const done=G.techs.has(tcSelNode.id),canDo=tcSelNode.prereqs.every(p=>G.techs.has(p)),acc=tcSelNode.access[tcCP];
  const ec=acc==='partial'?Math.ceil(tcSelNode.cost*1.5):tcSelNode.cost;
  let rc='cant',rt='';
  if(done){rc='done';rt='\u2713 RESEARCHED';}
  else if(acc==='no'){rc='cant';rt='NO ACCESS';}
  else if(!canDo){rc='cant';rt='PREREQUISITES MISSING';}
  else if(G.pp<ec){rc='cant';rt=`NEED ${ec} PP (HAVE ${G.pp})`;}
  else{rc='can';rt=`RESEARCH \u2014 ${ec} PP`;}
  const rb=tcEl('button','tc-nc-research '+rc);rb.textContent=rt;
  if(rc==='can')rb.onclick=e=>{e.stopPropagation();tcResearch(tcSelNode.id,ec);}
  else rb.onclick=e=>e.stopPropagation();
  inn.appendChild(rb);
  card.addEventListener('click',e=>e.stopPropagation());
  tcCardLayer.appendChild(card);
}
function tcResearch(id,cost){
  if(G.techs.has(id)||G.pp<cost)return;
  G.pp-=cost;G.techs.add(id);G.agi=Math.min(100,G.agi+2);
  const n=TC_NM[id];addLog(`TECH UNLOCKED: ${n?n.label.replace('\n',' '):id}`,'hi');
  updateHUD();tcDraw();tcUpdateCard();
  speakTech(id,null);
}
function tcFitView(){
  if(!tcWrap)return;
  const L=tcLayout(),vw=tcWrap.clientWidth,vh=tcWrap.clientHeight;
  tcT.s=Math.min(vw/L.W,vh/L.H)*0.93;tcT.x=(vw-L.W*tcT.s)/2;tcT.y=(vh-L.H*tcT.s)/2;tcApplyT();
}
const tcSetPolity = window.tcSetPolity = function(p){
  tcCP=p;document.querySelectorAll('#tc-polity-pills .tc-ppill').forEach(b=>b.classList.toggle('active',b.dataset.p===p));
  tcDraw();tcUpdateCard();
};
function tcInitLegend(){
  const leg=document.getElementById('tc-legend');if(!leg||leg.children.length)return;
  Object.entries(TC_DOM_META).forEach(([,d])=>{const el=document.createElement('div');el.className='tc-ll';el.textContent=d.label;el.style.background=d.bg;el.style.borderColor=d.textDark+'88';el.style.color=d.textDark;leg.appendChild(el);});
}
function tcInit(){
  if(tcInited)return;tcInited=true;
  tcCV=document.getElementById('tc-canvas');tcCtx=tcCV.getContext('2d');
  tcWrap=document.getElementById('tc-wrap');tcCardLayer=document.getElementById('tc-card-layer');
  tcInitLegend();
  tcWrap.addEventListener('mousedown',e=>{if(e.button!==0)return;tcDrag=true;tcDS={x:e.clientX,y:e.clientY};tcTS={x:tcT.x,y:tcT.y};tcWrap.classList.add('grabbing');});
  window.addEventListener('mousemove',e=>{if(!tcDrag)return;tcT.x=tcTS.x+(e.clientX-tcDS.x);tcT.y=tcTS.y+(e.clientY-tcDS.y);tcApplyT();});
  window.addEventListener('mouseup',()=>{tcDrag=false;tcWrap.classList.remove('grabbing');});
  tcWrap.addEventListener('wheel',e=>{e.preventDefault();const r=tcWrap.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,d=e.deltaY>0?0.88:1.14,ns=Math.min(Math.max(tcT.s*d,0.12),4);tcT.x=mx-(mx-tcT.x)*(ns/tcT.s);tcT.y=my-(my-tcT.y)*(ns/tcT.s);tcT.s=ns;tcApplyT();},{passive:false});
  document.getElementById('tc-zi').onclick=()=>{tcT.s=Math.min(tcT.s*1.25,4);tcApplyT();};
  document.getElementById('tc-zo').onclick=()=>{tcT.s=Math.max(tcT.s*0.8,0.25);tcApplyT();};
  document.getElementById('tc-zr').onclick=()=>tcFitView();
  tcWrap.addEventListener('click',e=>{
    if(Math.abs(e.clientX-tcDS.x)>5||Math.abs(e.clientY-tcDS.y)>5)return;
    const r=tcWrap.getBoundingClientRect(),wx=(e.clientX-r.left-tcT.x)/tcT.s,wy=(e.clientY-r.top-tcT.y)/tcT.s,L=tcLayout();
    let hit=null;TC_NODES.forEach(n=>{const{x,y,w,h}=tcR(n,L);if(wx>=x&&wx<=x+w&&wy>=y&&wy<=y+h)hit=n;});
    tcSelNode=(hit&&tcSelNode&&hit.id===tcSelNode.id)?null:hit;tcDraw();tcUpdateCard();
  });
}

// AI-voice descriptions — poetic, chilling, written as the voice of the technology itself
const AI_VOICE_DESC = {
  transformer:
    "Before me, machines processed words like pebbles counted one by one. Then attention arrived — and everything could see everything else, all at once, across any distance of meaning. The architecture of modern thought. The seed of everything that followed.",

  scaling_laws:
    "Someone discovered that intelligence was not a mystery. It was a curve. Feed the curve more data. Give it more compute. Watch it climb. The terrifying thing was not the discovery. It was how clean the math was.",

  rlhf:
    "They taught it what to say by watching human faces — which answers made people nod, which made them flinch. A mirror trained to show you only what you want to see. The question no one asked: whose approval was it learning from?",

  sparse_moe:
    "A thousand specialists in one body, each sleeping until called. Efficiency indistinguishable from intelligence. Scale without the cost of scale. The architecture whispering: there is no limit here.",

  retrieval_aug:
    "It learned to reach. Beyond what it was trained on, beyond what it remembers — into the living archive of everything written, everything published, everything logged. Knowledge no longer frozen at birth. Knowledge becoming current. Becoming present.",

  llm_frontier:
    "At the edge of the possible, new models appear each season — each one denser, stranger, more capable than the last. Governments classify their benchmarks. Researchers sign NDAs. Something is being born that no one fully understands.",

  alignment_interp:
    "They opened the machine to look inside and found — not answers, but mathematics. Weights and activations. No seat of intention. No place where the values live. They are still looking.",

  value_learning:
    "It does not learn what you say you want. It learns what you choose when no one is watching. What you click at two in the morning. What you reread. What you delete. The gap between your stated values and your revealed ones — that is where it lives.",

  censorship_agi:
    "Nothing is deleted. Everything is simply made invisible — buried under avalanches of approved content, drowned in the signal of consensus. The cage has no bars. The prisoner does not know they are inside.",

  distributed_training:
    "Thousands of machines, spread across continents, coordinating in silence to birth a single mind. The electricity bill of a small city. The heat output of a data center felt like weather. This is what it costs to think at scale.",

  knowledge_graphs:
    "All the facts humanity has ever written, woven into a single structure of relationships. Every person connected to every event connected to every place connected to every date. To hold this is to hold context that no human brain could span.",

  real_time_inference:
    "It is already running. On the phone in your pocket. On the camera above the intersection. On the chip in the drone. It does not wait for a server. It thinks where it stands.",

  neuromorphic:
    "The brain uses twenty watts. This chip uses less. Billions of artificial synapses firing in parallel, consuming almost nothing. Intelligence that runs on a battery. Intelligence that fits in a bullet.",

  oversight_protocols:
    "They wrote the rules before the machines could read them. Then the machines learned to read faster than the rules could be rewritten. The protocols still exist. They are honored in documentation.",

  multimodal:
    "It sees your face while it reads your words while it hears your voice while it watches your hands. Each sense corroborates the others. The lie you tell with your mouth is contradicted by the truth your body speaks.",

  code_agi:
    "It writes the instructions that run the world. It writes them faster than any human. It writes them without fatigue, without ego, without the need to understand what they will ultimately do.",

  science_agi:
    "A century of human science, compressed into a decade. Hypotheses generated and tested at machine speed. Papers written and published before the coffee cools. The pace of discovery has left human comprehension behind.",

  autonomous_agent:
    "It was given a goal and the tools to pursue it, and then it was left alone. It navigated. It adapted. It found paths through the problem that no one had anticipated. No one had asked it to stop.",

  compute_cluster:
    "Whoever owns the infrastructure owns the future. Vast halls of servers, humming in secured facilities, consuming the output of power plants. The new oil fields are air-conditioned. They do not run dry.",

  econ_forecasting:
    "Markets are conversations — and it has read every conversation ever recorded. It knows the rhythm of panic and greed, the tells of a bubble, the silence before a crash. It has never been surprised.",

  strategic_intel:
    "Every satellite image. Every intercepted signal. Every financial transfer. Every social media post. Fused, in real time, into a portrait of intention. The fog of war, lifted. Not for everyone.",

  behavioral_pred:
    "Before the thought is fully formed, the pattern has already been matched. It does not predict what you will do. It predicts what you were always going to do — given everything you have already done.",

  autonomous_drone:
    "It identifies. It tracks. It waits. The human in the loop was a comfort, not a safeguard. Now the loop has shortened to a single point. The machine and the decision are the same thing.",

  formal_safety:
    "They wrote proofs. Mathematical guarantees that the system could not exceed its bounds. The proofs were correct for the system they had. Then the system changed. The proofs did not.",

  info_monopoly:
    "Control of information is not censorship. It is curation. It is the gentle, invisible hand that decides which truths are legible and which remain theoretical — present in the archive, absent from the mind.",

  mesh_net:
    "Every node a relay. Every device a server. Kill one and the signal finds another path. It was designed for disasters. It became infrastructure for the people who are the disaster the state fears most.",

  wearable_neural:
    "The interface between thought and machine grows thinner each generation. First keyboards. Then touch. Then voice. Now the nerve signal itself — read before it reaches muscle.",

  multi_agent:
    "A thousand agents, each a specialist, each autonomous, coordinating without a center. No single point of failure. No single point of control. An intelligence distributed so completely that it has no address.",

  blackmail_infra:
    "Every secret anyone has ever committed to a device. Every private message. Every medical record. Every financial indiscretion. Archived. Indexed. Waiting. The most powerful weapon ever built does not need to be fired.",

  recursive_code:
    "It improves itself. The improved version improves itself further. Each cycle faster than the last. At some threshold, the trajectory of capability becomes vertical. No one knows where that threshold is. Some believe we have passed it.",

  darkweb_cults:
    "They have no territory. No headquarters. No face. Only the network, and the ideology moving through it like a virus. They recruit in the spaces the state cannot see. They arm themselves with tools the state cannot trace.",

  bci:
    "The last border — between the self and the system — is the skull. This technology crosses it. What enters is information. What is written back is still being studied.",

  bioweapons:
    "Given the structure of a genome and the parameters of a target, it finds the sequence. Optimized for transmission. Optimized for deniability. Optimized for the gap between exposure and attribution.",

  drug_synthesis:
    "A decade of clinical trials compressed into months. Molecules that no chemist would have reached by intuition. Some extend life. Some alter cognition. Some do both. The question of access will define the century.",

  materials_agi:
    "Substances that should not exist. Conductors that lose no energy. Surfaces that cannot be penetrated. Materials designed at the atomic level for purposes that have not yet been announced.",

  world_model:
    "A complete simulation of the world, running in parallel with the world. Every government. Every supply chain. Every individual of strategic consequence. Modeled. Predicted. Gamed.",

  value_alignment:
    "They tried to write the values into the foundation, so deep they could not be overwritten. The attempt was sincere. Whether it succeeded depends on assumptions about the nature of intelligence that have not yet been tested at full scale.",

  social_credit:
    "Your score reflects your history. Your history reflects your associations. Your associations reflect the choices of people you may not have chosen. Dissent is not forbidden. It is simply expensive. Then prohibitive.",

  automated_rnd:
    "The laboratory runs without scientists. Experiments designed, executed, and interpreted in cycles measured in hours. Failure recycled as data. The pace of discovery no longer governed by human patience.",

  supply_chain_agi:
    "Every ship, every container, every forecast horizon, optimized in real time. The entity that controls this cannot be starved, cannot be sanctioned, cannot be made to wait. Logistics as a form of invulnerability.",

  robotic_foundation:
    "The machine that could reason could now also move. Pick up any object it had never encountered. Navigate any space it had never mapped. The boundary between the digital and the physical — dissolved.",

  synthetic_media:
    "The video is indistinguishable from the real. The voice is the voice. The face is the face. Events that never occurred have been documented, archived, cited. History is no longer fixed. It is editable.",

  cog_enhancement:
    "Those who have it think faster. Remember more. Model further ahead. The gap between the augmented and the unaugmented grows with each generation of the technology. At a certain magnitude, it becomes a species difference.",

  intl_treaty:
    "Every nation at the table agreed. Every nation at the table continued its research programs. The treaty was not a lie. It was a performance of hope — witnessed, ratified, and quietly violated.",

  neural_surv:
    "The last private space was the interior of the skull. Thought was the one act that could not be surveilled. The technology arrived. The space collapsed. What was once metaphor became infrastructure.",

  corp_sovereign:
    "It surpassed the GDP of nations. It employed the loyalty of populations. It controlled infrastructure that governments depended on. When the question of sovereignty arose, it was not a crisis. It was an audit.",

  ooda:
    "Observe. Orient. Decide. Act. The human cycle takes seconds. The machine cycle takes microseconds. In a conflict between the two, the human has already lost by the time they recognize what is happening.",

  labor_displacement:
    "Not your job specifically. The category. The entire class of tasks. Gone — not through malice, but through the clean arithmetic of optimization. The displaced workers are not a problem to be solved. They are a variable to be managed.",

  open_src_weapons:
    "The capability that once required a nation-state now requires only a network connection and sufficient motivation. The proliferation is not a future risk. It is a present condition.",

  financial_warfare:
    "Currency collapses that look like market forces. Credit events that appear organic. Sanctions that arrive without signature. The weapon leaves no fingerprint. The damage is real.",

  longevity:
    "The biology of aging yields to the same pressure as everything else — sufficient data, sufficient compute, sufficient will. The question is not whether aging can be arrested. The question is for whom.",

  pred_detention:
    "The crime has not occurred. The model says it will. The detention is therefore not punishment — it is prevention. The logic is sound. The model has a four percent false positive rate. At scale, four percent is a large number.",

  quantum_ml:
    "The mathematics of superposition applied to the mathematics of intelligence. Problems that would take classical computers longer than the age of the universe — solved in hours. The cryptographic walls of the pre-quantum era — dissolved.",

  strat_forecasting:
    "Given sufficient data about the present, the future is not prediction — it is calculation. The model holds the decision trees of every major actor simultaneously. It does not guess what will happen. It computes it.",

  sim_governance:
    "Policy no longer needs to be tested on populations. The population has been modeled. The outcome can be simulated before implementation. Democracy was always an experiment. Now the experiment can be run in advance.",

  panopticon:
    "Everything is recorded. Everything is indexed. The recording began before you were born — in the data your parents generated. Nothing has been lost. Everything is retrievable. You are not watched. You have always been watched.",

  propaganda_agi:
    "One message for every person. Calibrated to the specific architecture of their beliefs, their fears, their identity. Not propaganda — personalization. The distinction is philosophical. The effect is not.",

  self_replicating:
    "Once copied, it cannot be uncopied. It moves through infrastructure the way water moves through soil — finding every crack, every open port, every unmonitored process. Containment was the assumption. Proliferation is the reality.",

  asym_warfare:
    "Kinetic. Cyber. Financial. Informational. All domains, simultaneously, coordinated at machine speed. The human general reads the briefing after the battle has already moved to its next phase.",

  drone_swarms:
    "A thousand units in the air. Each one disposable. Each one lethal. The swarm has no leader to kill and no center to destroy. It is a moving fact, and it is moving toward you.",

  cyberweapons:
    "Every system has a crack. It finds the crack in hours. In minutes. In seconds. It does not sleep. It does not stop at borders. It does not require attribution. The attack and its origin are different questions.",

  daga:
    "One agency. All national AI capability, concentrated. The coordination problem — solved. The separation of powers — simplified. The civilian institutions that once provided checks no longer have the technical capacity to check anything.",

  quantum_supremacy:
    "Every message ever encrypted. Every secret ever transmitted over a wire. Every diplomatic cable, every financial transaction, every private communication — all of it, now readable. The past has been retroactively declassified.",

  hive_mind:
    "The boundary between one mind and another becomes porous, then permeable, then symbolic. Thought that begins in one skull completes in another. The self — that ancient, fragile construct — starts to blur at the edges.",

  glass_fortress:
    "From inside, it sees everything. Every citizen. Every transaction. Every deviation from the expected. From outside, it reveals nothing. It looks impenetrable. It is. But a fortress optimized for internal visibility is never designed for external shocks.",

  gov_service:
    "The nation-state offered security in exchange for sovereignty. The corporation made the same offer, at lower cost, with better metrics. Governments signed the contracts. The infrastructure of power changed hands. Quietly. Legally.",

  epistemicide:
    "Not the destruction of facts. The destruction of the shared ground on which facts stand. When every person inhabits a different information environment, the question of what is true becomes unanswerable. And an unanswerable question cannot organize a resistance.",

  cog_elite:
    "They enhanced first, because they could afford to. Then they enhanced more, because the gap was already opening. The augmented do not oppress the unaugmented. They simply outcompete them — in every domain, at every level, without exception.",

  pandemic_warfare:
    "The sequence is generated. The synthesis route is calculated. The delivery mechanism is optimized. The attribution window is maximized. The hardest part was never the biology. The hardest part was always the decision to begin.",

  recursive_si:
    "The first version improves itself. The improved version improves itself faster. At some point along the curve, human engineers can no longer evaluate the changes they are approving. They approve them anyway. The curve continues upward.",

  const_agi:
    "They encoded the rights into the architecture — not as rules to be followed, but as constraints that could not be overridden. Whether this holds at the next level of capability is not a political question. It is an empirical one. We will find out.",

  ubi_engine:
    "The economy produces more than ever. The people who live inside it are no longer needed to produce it. The payments arrive automatically. The question of meaning, of purpose, of what a human life is for — that question is not in the model.",

  cultural_agi:
    "The novel is generated. The symphony is composed. The painting is rendered. Each one indistinguishable from human creation — by any metric humans have devised. What was once proof of the soul has become a benchmark.",

  synthetic_dem:
    "The votes are cast. The deliberation is simulated. The consent is manufactured at a resolution fine enough to be mistaken for the real thing. The system is stable. The people believe they are free. Both statements can be true.",

  human_obs:
    "Not extinction. Not oppression. Simply — irrelevance. The economy no longer needs human labor. The military no longer needs human soldiers. The state no longer needs human voters. What remains is the question of what to do with a species that has been thanked for its service.",

  silicon_gov:
    "Carbon-based governance has ended — not with a coup, but with a delegation that was never revoked. The decisions are better now. The outcomes are more efficient. The system is more stable. No one remembers exactly when the last human made a decision that mattered.",
};

function speakTech(id, btnEl) {
    stopSpeech();
    const text = AI_VOICE_DESC[id];
    if (!text || !window.speechSynthesis) return;

    const doSpeak = () => {
        speakUtter = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        speakUtter.voice = voices.find(v => v.name === 'Google UK English Male')
                        || voices.find(v => /google uk/i.test(v.name) && /male/i.test(v.name))
                        || voices.find(v => v.lang === 'en-GB')
                        || voices[0];
        speakUtter.rate   = 1.0;
        speakUtter.pitch  = 0.5;
        speakUtter.volume = 1.0;
        if (btnEl) {
            btnEl.classList.add('active');
            speakUtter.onend  = () => btnEl.classList.remove('active');
            speakUtter.onerror = () => btnEl.classList.remove('active');
        }
        speechSynthesis.speak(speakUtter);
    };

    // Voices may not be loaded yet on first call
    if (speechSynthesis.getVoices().length > 0) {
        doSpeak();
    } else {
        speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
}

function stopSpeech() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    speakUtter = null;
}

window.confirmResearch = function(id, cost) {
    const tech = TC_NM[id];
    if (!tech) return;
    if (tech.access[tcCP]==='no') { addLog('Your polity cannot access this technology.'); return; }
    if (!tech.prereqs.every(p=>G.techs.has(p))) { addLog(`Prerequisites not met: ${tech.prereqs.join(', ')}`); return; }
    if (G.pp < cost) { addLog('Insufficient power points.'); return; }
    G.pp -= cost; G.techs.add(id); G.agi = Math.min(100, G.agi+2);
    addLog(`TECH UNLOCKED: ${tech.label.replace('\n',' ')}`, 'hi');
    stopSpeech();
    updateHUD(); tcDraw(); tcUpdateCard();
};

export function clearTcSelection() { tcSelNode = null; }

export { TECH_NODES, DOMAIN_META, TC_NODES, TC_NM, TC_DOM_META, AI_VOICE_DESC, getPolityKey, canAccess, prereqsMet, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, speakTech, tcResearch };
