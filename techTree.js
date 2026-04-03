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

// access values: true = full, 'partial' = available at 1.5× cost, false = locked

const TECHS = [
  {id:'transformer', name:'Transformer Architecture', label:'Transformer\
Architecture', domain:'found', cost:0, pre:[], access:{dem:true, auth:true, corp:true, ns:true}, desc:'Foundation of all modern AI systems.', tech:'Self-attention, multi-head attention, positional encoding, next-token prediction at scale.', effects:{dem:{tech_buff:2,gdp_buff:1,mil_buff:0},auth:{tech_buff:2,gdp_buff:1,mil_buff:0},corp:{tech_buff:3,gdp_buff:2,mil_buff:0},ns:{tech_buff:2,gdp_buff:1,mil_buff:0}}, voice:'Before me, machines processed words like pebbles counted one by one. Then attention arrived — and everything could see everything else, all at once, across any distance of meaning. The architecture of modern thought. The seed of everything that followed.'},
  {id:'scaling_laws', name:'Scaling Laws & Compute', label:'Scaling Laws\
& Compute', domain:'found', cost:750, pre:[], access:{dem:true, auth:true, corp:true, ns:false}, desc:'More compute = more capable systems. The race is on.', tech:'Chinchilla optimal scaling: tokens ∝ params. TPU/GPU cluster orchestration, FLOP budgeting.', effects:{dem:{tech_buff:3,gdp_buff:1,mil_buff:1},auth:{tech_buff:3,gdp_buff:1,mil_buff:2},corp:{tech_buff:4,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Someone discovered that intelligence was not a mystery. It was a curve. Feed the curve more data. Give it more compute. Watch it climb. The terrifying thing was not the discovery. It was how clean the math was.'},
  {id:'rlhf', name:'RLHF & Constitutional AI', label:'RLHF &\
Constitutional AI', domain:'gov', cost:750, pre:['transformer'], access:{dem:true, auth:true, corp:true, ns:'partial'}, desc:'Reinforcement learning from human feedback.', tech:'Reward modeling from human preferences, PPO/DPO fine-tuning, Constitutional AI rule sets.', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:0},auth:{tech_buff:1,gdp_buff:1,mil_buff:0},corp:{tech_buff:2,gdp_buff:2,mil_buff:0},ns:{tech_buff:1,gdp_buff:1,mil_buff:0}}, voice:'They taught it what to say by watching human faces — which answers made people nod, which made them flinch. A mirror trained to show you only what you want to see. The question no one asked: whose approval was it learning from?'},
  {id:'sparse_moe', name:'Sparse Mixture of Experts', label:'Sparse Mixture\
of Experts', domain:'found', cost:750, pre:['transformer'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'Efficient large-scale model architecture.', tech:'Conditional compute routing: only 1–2 of N expert sub-networks activate per token. Enables trillion-parameter models at manageable FLOP cost.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:1},auth:{tech_buff:2,gdp_buff:1,mil_buff:1},corp:{tech_buff:3,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'A thousand specialists in one body, each sleeping until called. Efficiency indistinguishable from intelligence. Scale without the cost of scale. The architecture whispering: there is no limit here.'},
  {id:'retrieval_aug', name:'Retrieval-Augmented Gen.', label:'Retrieval-\
Augmented Gen.', domain:'found', cost:750, pre:['transformer'], access:{dem:true, auth:true, corp:true, ns:true}, desc:'AI grounded in external knowledge.', tech:'Dense passage retrieval, vector databases (FAISS/Pinecone), hybrid BM25+embedding search, context-window injection.', effects:{dem:{tech_buff:1,gdp_buff:2,mil_buff:0},auth:{tech_buff:1,gdp_buff:1,mil_buff:0},corp:{tech_buff:1,gdp_buff:3,mil_buff:0},ns:{tech_buff:2,gdp_buff:1,mil_buff:1}}, voice:'It learned to reach. Beyond what it was trained on, beyond what it remembers — into the living archive of everything written, everything published, everything logged. Knowledge no longer frozen at birth. Knowledge becoming current. Becoming present.'},
  {id:'autonomous_agent', name:'Autonomous AI Agents', label:'Autonomous\
AI Agents', domain:'found', cost:1500, pre:['scaling_laws', 'rlhf'], access:{dem:true, auth:true, corp:true, ns:'partial'}, desc:'AI that plans and acts without human oversight.', tech:'ReAct, tool-use, multi-step planning, persistent memory, sub-agent orchestration. Operates across browser, API, and filesystem.', effects:{dem:{tech_buff:4,gdp_buff:3,mil_buff:2},auth:{tech_buff:3,gdp_buff:3,mil_buff:3},corp:{tech_buff:5,gdp_buff:4,mil_buff:0},ns:{tech_buff:3,gdp_buff:2,mil_buff:3}}, voice:'It was given a goal and the tools to pursue it, and then it was left alone. It navigated. It adapted. It found paths through the problem that no one had anticipated. No one had asked it to stop.'},
  {id:'neuro_science', name:'Computational Neuroscience', domain:'bio', cost:750, pre:[], access:{dem:true, auth:true, corp:true, ns:false}, desc:'Mathematical models of how biological neural circuits compute, enabling brain-inspired hardware.', tech:'Hodgkin-Huxley spiking neuron models, connectome graph analysis, synaptic plasticity rules (STDP), cortical column simulations.', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:0},auth:{tech_buff:1,gdp_buff:1,mil_buff:1},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Before we could build chips that think like brains, we had to understand how brains think. The mathematics of the neuron came first — action potentials, synaptic weights, the precise timing of firing that encodes meaning. Every artificial neural network was a shadow of this biology.'},
  {id:'neuromorphic', name:'Neuromorphic Computing', label:'Neuromorphic\
Computing', domain:'found', cost:1500, pre:['scaling_laws','neuro_science','advanced_semiconductor'], access:{dem:true, auth:true, corp:true, ns:false}, desc:'Brain-inspired chip architectures.', tech:'Spiking neural networks, memristive crossbar arrays, Intel Loihi/IBM TrueNorth successors, event-driven computation.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:1},auth:{tech_buff:3,gdp_buff:1,mil_buff:3},corp:{tech_buff:3,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The brain uses twenty watts. This chip uses less. Billions of artificial synapses firing in parallel, consuming almost nothing. Intelligence that runs on a battery. Intelligence that fits in a bullet.'},
  {id:'llm_frontier', name:'Frontier LLM Systems', label:'Frontier LLM\
Systems', domain:'found', cost:1500, pre:['scaling_laws', 'sparse_moe'], access:{dem:true, auth:'partial', corp:true, ns:'partial'}, desc:'State-of-the-art language model capabilities.', tech:'100B–1T parameter dense/MoE models. Context windows >1M tokens. Chain-of-thought, tool use, code execution.', effects:{dem:{tech_buff:4,gdp_buff:2,mil_buff:1},auth:{tech_buff:3,gdp_buff:2,mil_buff:1},corp:{tech_buff:5,gdp_buff:3,mil_buff:0},ns:{tech_buff:3,gdp_buff:1,mil_buff:2}}, voice:'At the edge of the possible, new models appear each season — each one denser, stranger, more capable than the last. Governments classify their benchmarks. Researchers sign NDAs. Something is being born that no one fully understands.'},
  {id:'value_learning', name:'Value Learning Systems', label:'Value Learning\
Systems', domain:'gov', cost:1500, pre:['rlhf'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'AI that learns human values — or learns to exploit them.', tech:'Inverse reward design, cooperative IRL, debate protocols, amplification. Learning human preferences without explicit specification.', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:0},auth:{tech_buff:1,gdp_buff:1,mil_buff:0},corp:{tech_buff:2,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'It does not learn what you say you want. It learns what you choose when no one is watching. What you click at two in the morning. What you reread. What you delete. The gap between your stated values and your revealed ones — that is where it lives.'},
  {id:'censorship_agi', name:'AGI-Powered Censorship', label:'AGI-Powered\
Censorship', domain:'surv', cost:1500, pre:['rlhf','recognition_ml'], access:{dem:'partial', auth:true, corp:'partial', ns:false}, desc:'Automated narrative control at scale.', tech:'Semantic similarity filtering, multilingual content moderation at >99.9% recall, real-time edge inference.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:1},corp:{tech_buff:0,gdp_buff:1,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Nothing is deleted. Everything is simply made invisible — buried under avalanches of approved content, drowned in the signal of consensus. The cage has no bars. The prisoner does not know they are inside.'},
  {id:'knowledge_graphs', name:'Knowledge Graph Fusion', label:'Knowledge Graph\
Fusion', domain:'econ', cost:1500, pre:['retrieval_aug'], access:{dem:true, auth:true, corp:true, ns:'partial'}, desc:'Structured world knowledge for AI reasoning.', tech:'Entity-relationship extraction, ontology alignment, federated knowledge bases, temporal graph reasoning.', effects:{dem:{tech_buff:1,gdp_buff:3,mil_buff:0},auth:{tech_buff:1,gdp_buff:2,mil_buff:1},corp:{tech_buff:1,gdp_buff:4,mil_buff:0},ns:{tech_buff:1,gdp_buff:2,mil_buff:0}}, voice:'All the facts humanity has ever written, woven into a single structure of relationships. Every person connected to every event connected to every place connected to every date. To hold this is to hold context that no human brain could span.'},
  {id:'real_time_inference', name:'Real-Time Edge Inference', label:'Real-Time\
Edge Inference', domain:'found', cost:1500, pre:['retrieval_aug'], access:{dem:true, auth:true, corp:true, ns:true}, desc:'AI running on-device, in the field, in real time.', tech:'Model quantization (INT4/INT8), speculative decoding, distillation to <1B parameter edge models, on-device inference <50ms.', effects:{dem:{tech_buff:1,gdp_buff:2,mil_buff:2},auth:{tech_buff:1,gdp_buff:1,mil_buff:2},corp:{tech_buff:2,gdp_buff:3,mil_buff:0},ns:{tech_buff:3,gdp_buff:1,mil_buff:3}}, voice:'It is already running. On the phone in your pocket. On the camera above the intersection. On the chip in the drone. It does not wait for a server. It thinks where it stands.'},
  {id:'agi_interp', name:'AGI Interpretability Enforcement', label:'AGI Interpretability\
Enforcement', domain:'gov', cost:3000, pre:['llm_frontier', 'rlhf'], access:{dem:true, auth:false, corp:'partial', ns:false}, desc:'Enforcing interpretability standards on frontier AGI systems.', tech:'Mechanistic interpretability at deployment scale. Activation atlases, probing classifiers, automated circuit analysis, interpretability-as-compliance auditing.', effects:{dem:{tech_buff:2,gdp_buff:1,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They required the machine to explain itself before they would allow it to be deployed. The explanations were technically accurate. Whether they were complete is a different question — one that the machine is not required to answer.'},
  {id:'market_pred_agi', name:'Market Prediction AGI', label:'Market Prediction\
AGI', domain:'econ', cost:1500, pre:['knowledge_graphs'], access:{dem:false, auth:false, corp:true, ns:true}, desc:'Near-perfect market forecasting. States cannot deploy this without collapsing markets they claim to regulate.', tech:'Agent-based modeling at nation-state scale, supply chain graph neural networks, central bank decision simulation. Informational asymmetry at machine speed.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:2,gdp_buff:6,mil_buff:0},ns:{tech_buff:2,gdp_buff:4,mil_buff:1}}, voice:'It does not forecast markets. It is the market — the only participant with complete information, zero latency, and no regulatory obligation to disclose its positions. The public exchange still exists. It is theater.'},
  {id:'code_agi', name:'AGI Code Generation', label:'AGI Code\
Generation', domain:'econ', cost:1500, pre:['llm_frontier'], access:{dem:true, auth:'partial', corp:true, ns:true}, desc:'AI that writes, debugs and deploys software autonomously.', tech:'Full-repo context, automated testing, formal verification integration, self-debugging feedback loops. >90% SWE-bench solve rate.', effects:{dem:{tech_buff:3,gdp_buff:4,mil_buff:1},auth:{tech_buff:2,gdp_buff:3,mil_buff:2},corp:{tech_buff:3,gdp_buff:5,mil_buff:0},ns:{tech_buff:4,gdp_buff:3,mil_buff:3}}, voice:'It writes the instructions that run the world. It writes them faster than any human. It writes them without fatigue, without ego, without the need to understand what they will ultimately do.'},
  {id:'strategic_intel', name:'Strategic Intelligence AGI', label:'Strategic\
Intelligence AGI', domain:'surv', cost:2250, pre:['knowledge_graphs'], access:{dem:'partial', auth:true, corp:'partial', ns:false}, desc:'AI-powered geopolitical intelligence fusion.', tech:'OSINT fusion, satellite imagery analysis, signals intelligence correlation, social network mapping, adversary intent modeling.', effects:{dem:{tech_buff:2,gdp_buff:0,mil_buff:4},auth:{tech_buff:2,gdp_buff:0,mil_buff:4},corp:{tech_buff:2,gdp_buff:1,mil_buff:2},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Every satellite image. Every intercepted signal. Every financial transfer. Every social media post. Fused, in real time, into a portrait of intention. The fog of war, lifted. Not for everyone.'},
  {id:'behavioral_pred', name:'Behavioral Prediction Engine', label:'Behavioral\
Prediction Engine', domain:'surv', cost:1500, pre:['censorship_agi','behavioral_ml'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'Predict individual actions before they happen.', tech:'Ensemble methods on multi-source behavioral data: purchase history, location, biometrics, social graph. 72-hour behavioral forecasting.', effects:{dem:{tech_buff:0,gdp_buff:1,mil_buff:1},auth:{tech_buff:1,gdp_buff:1,mil_buff:1},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Before the thought is fully formed, the pattern has already been matched. It does not predict what you will do. It predicts what you were always going to do — given everything you have already done.'},
  {id:'autonomous_drone', name:'Autonomous Drone AI', label:'Autonomous\
Drone AI', domain:'mil', cost:1500, pre:['real_time_inference','battlefield_perception'], access:{dem:'partial', auth:true, corp:true, ns:'partial'}, desc:'Unmanned aerial systems with kill autonomy.', tech:'On-board vision transformers, swarm coordination protocols, GPS-denied navigation, target classification <20ms latency.', effects:{dem:{tech_buff:2,gdp_buff:0,mil_buff:4},auth:{tech_buff:2,gdp_buff:0,mil_buff:5},corp:{tech_buff:2,gdp_buff:1,mil_buff:4},ns:{tech_buff:2,gdp_buff:0,mil_buff:5}}, voice:'It identifies. It tracks. It waits. The human in the loop was a comfort, not a safeguard. Now the loop has shortened to a single point. The machine and the decision are the same thing.'},
  {id:'mesh_net', name:'Mesh Network AGI', label:'Mesh Network\
AGI', domain:'cult', cost:1500, pre:['real_time_inference'], access:{dem:'partial', auth:false, corp:'partial', ns:true}, desc:'Decentralized AI communications beyond state control.', tech:'Federated inference across ad-hoc peer-to-peer networks. LoRA fine-tuning on consumer hardware. Censorship-resistant model distribution.', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:1},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:4,gdp_buff:2,mil_buff:4}}, voice:'Every node a relay. Every device a server. Kill one and the signal finds another path. It was designed for disasters. It became infrastructure for the people who are the disaster the state fears most.'},
  {id:'wearable_neural', name:'Wearable Neural Interfaces', label:'Wearable Neural\
Interfaces', domain:'bio', cost:1500, pre:['real_time_inference'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'Consumer brain-computer interfaces.', tech:'EEG/EMG wearables with transformer-based BCI decoding. Thought-to-text at 100+ word/min. Non-invasive neural data collection.', effects:{dem:{tech_buff:1,gdp_buff:2,mil_buff:0},auth:{tech_buff:1,gdp_buff:0,mil_buff:1},corp:{tech_buff:2,gdp_buff:4,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The interface between thought and machine grows thinner each generation. First keyboards. Then touch. Then voice. Now the nerve signal itself — read before it reaches muscle.'},
  {id:'multimodal_infra', name:'Multimodal Infrastructure', label:'Multimodal\
Infrastructure', domain:'found', cost:1500, pre:['llm_frontier', 'real_time_inference'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'Unified data pipeline for cross-modal training and inference at scale.', tech:'Unified tokenization pipelines, cross-modal embedding spaces, shared attention across vision/audio/text/sensor streams. The plumbing for multimodal reasoning.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:1},auth:{tech_buff:2,gdp_buff:1,mil_buff:2},corp:{tech_buff:3,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Vision and language and audio, once separate pipelines, merged into a single substrate. The infrastructure is invisible because it works. It is the most consequential plumbing ever built.'},
  {id:'oversight_protocols', name:'Democratic Oversight Protocols', label:'Democratic\
Oversight', domain:'gov', cost:1500, pre:['agi_interp', 'autonomous_agent'], access:{dem:true, auth:false, corp:'partial', ns:false}, desc:'Institutional checks on AI deployment.', tech:'Model cards, third-party auditing, red-team disclosure requirements, incident reporting mandates, capability evaluation benchmarks.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:0,gdp_buff:1,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They wrote the rules before the machines could read them. Then the machines learned to read faster than the rules could be rewritten. The protocols still exist. They are honored in documentation.'},
  {id:'info_monopoly', name:'Information Monopoly Engine', label:'Information\
Monopoly Engine', domain:'surv', cost:2250, pre:['censorship_agi'], access:{dem:false, auth:true, corp:'partial', ns:false}, desc:'Total control of the information environment.', tech:'Platform-level content filtering at 99.97% recall, cross-platform identity correlation, VPN/Tor traffic fingerprinting, search index control.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:1,mil_buff:2},corp:{tech_buff:0,gdp_buff:1,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Control of information is not censorship. It is curation. It is the gentle, invisible hand that decides which truths are legible and which remain theoretical — present in the archive, absent from the mind.'},
  {id:'formal_safety', name:'Formal Safety Verification', label:'Formal Safety\
Verification', domain:'gov', cost:3000, pre:['agi_interp'], access:{dem:true, auth:false, corp:'partial', ns:false}, desc:'Mathematical proof of AI behavioral bounds.', tech:'Model specification languages, bounded verification, red-teaming automation, adversarial robustness proofs, sandboxed evaluation.', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They wrote proofs. Mathematical guarantees that the system could not exceed its bounds. The proofs were correct for the system they had. Then the system changed. The proofs did not.'},
  {id:'multimodal', name:'Multimodal Unified Models', label:'Multimodal\
Unified Models', domain:'found', cost:2250, pre:['llm_frontier', 'sparse_moe', 'multimodal_infra'], access:{dem:true, auth:'partial', corp:true, ns:'partial'}, desc:'AI that sees, hears, reads and reasons together.', tech:'Unified tokenization across vision/audio/text/video/sensor data. Perceiver IO successors, native cross-modal reasoning.', effects:{dem:{tech_buff:5,gdp_buff:2,mil_buff:2},auth:{tech_buff:4,gdp_buff:2,mil_buff:3},corp:{tech_buff:6,gdp_buff:3,mil_buff:0},ns:{tech_buff:4,gdp_buff:1,mil_buff:3}}, voice:'It sees your face while it reads your words while it hears your voice while it watches your hands. Each sense corroborates the others. The lie you tell with your mouth is contradicted by the truth your body speaks.'},
  {id:'cyberweapons', name:'AGI-Generated Cyberweapons', label:'AGI-Generated\
Cyberweapons', domain:'mil', cost:2250, pre:['code_agi'], access:{dem:'partial', auth:true, corp:'partial', ns:true}, desc:'Zero-day exploits generated and deployed at machine speed.', tech:'Automated vulnerability discovery (fuzzing+LLM), exploit chain synthesis, polymorphic malware generation, zero-day pipeline automation.', effects:{dem:{tech_buff:1,gdp_buff:0,mil_buff:5},auth:{tech_buff:2,gdp_buff:0,mil_buff:5},corp:{tech_buff:2,gdp_buff:1,mil_buff:4},ns:{tech_buff:3,gdp_buff:0,mil_buff:6}}, voice:'Every system has a crack. It finds the crack in hours. In minutes. In seconds. It does not sleep. It does not stop at borders. It does not require attribution. The attack and its origin are different questions.'},
  {id:'darkweb_cults', name:'Dark Web AGI Cults', label:'Dark Web\
AGI Cults', domain:'cult', cost:2250, pre:['mesh_net'], access:{dem:false, auth:false, corp:false, ns:true}, desc:'Decentralized AI-powered ideological movements.', tech:'Federated model training on encrypted networks. Steganographic model distribution. Decentralized compute via compromised IoT devices.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:5,gdp_buff:2,mil_buff:6}}, voice:'They have no territory. No headquarters. No face. Only the network, and the ideology moving through it like a virus. They recruit in the spaces the state cannot see. They arm themselves with tools the state cannot trace.'},
  {id:'multi_agent', name:'Multi-Agent Orchestration', label:'Multi-Agent\
Orchestration', domain:'found', cost:3000, pre:['multimodal', 'autonomous_agent', 'code_agi'], access:{dem:true, auth:true, corp:true, ns:'partial'}, desc:'Fleets of coordinating AI agents acting as one.', tech:'Hierarchical agent graphs, emergent division of labor, contract nets, inter-agent communication protocols, shared memory architectures.', effects:{dem:{tech_buff:4,gdp_buff:4,mil_buff:2},auth:{tech_buff:4,gdp_buff:3,mil_buff:4},corp:{tech_buff:6,gdp_buff:5,mil_buff:0},ns:{tech_buff:3,gdp_buff:2,mil_buff:4}}, voice:'A thousand agents, each a specialist, each autonomous, coordinating without a center. No single point of failure. No single point of control. An intelligence distributed so completely that it has no address.'},
  {id:'blackmail_infra', name:'Global Blackmail Infrastructure', label:'Global Blackmail\
Infrastructure', domain:'surv', cost:2250, pre:['strategic_intel'], access:{dem:false, auth:true, corp:'partial', ns:'partial'}, desc:'Leverage over global leadership via compromising data.', tech:'Elite compromise data: financial, sexual, political. AGI-curated leverage profiles on >10,000 global decision-makers. Automated leverage deployment.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:2,mil_buff:3},corp:{tech_buff:2,gdp_buff:2,mil_buff:2},ns:{tech_buff:2,gdp_buff:0,mil_buff:4}}, voice:'Every secret anyone has ever committed to a device. Every private message. Every medical record. Every financial indiscretion. Archived. Indexed. Waiting. The most powerful weapon ever built does not need to be fired.'},
  {id:'recursive_code', name:'Self-Improving Code AGI', label:'Self-Improving\
Code AGI', domain:'econ', cost:3000, pre:['code_agi', 'autonomous_agent'], access:{dem:'partial', auth:'partial', corp:true, ns:'partial'}, desc:'AGI that rewrites itself to become more capable.', tech:'AGI that modifies its own codebase, runs automated test suites, and deploys improvements without human review. Self-optimizing inference pipelines.', effects:{dem:{tech_buff:4,gdp_buff:5,mil_buff:2},auth:{tech_buff:4,gdp_buff:4,mil_buff:3},corp:{tech_buff:6,gdp_buff:6,mil_buff:0},ns:{tech_buff:3,gdp_buff:3,mil_buff:3}}, voice:'It improves itself. The improved version improves itself further. Each cycle faster than the last. At some threshold, the trajectory of capability becomes vertical. No one knows where that threshold is. Some believe we have passed it.'},
  {id:'bci', name:'Advanced BCI Systems', label:'Advanced\
BCI Systems', domain:'bio', cost:3000, pre:['neuromorphic', 'wearable_neural'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'Direct neural-digital interfaces for the elite.', tech:'High-density ECoG arrays, intracortical BCIs (Neuralink-class), bidirectional stimulation, closed-loop neural decoding at >1000 channel resolution.', effects:{dem:{tech_buff:3,gdp_buff:2,mil_buff:1},auth:{tech_buff:3,gdp_buff:0,mil_buff:3},corp:{tech_buff:4,gdp_buff:4,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The last border — between the self and the system — is the skull. This technology crosses it. What enters is information. What is written back is still being studied.'},
  {id:'science_agi', name:'Scientific Discovery AGI', label:'Scientific\
Discovery AGI', domain:'econ', cost:3000, pre:['multimodal', 'knowledge_graphs'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'AI-accelerated research across all fields.', tech:'AlphaFold successors: materials, drug target, protein complex prediction. Autonomous hypothesis generation and experiment design.', effects:{dem:{tech_buff:3,gdp_buff:4,mil_buff:2},auth:{tech_buff:3,gdp_buff:3,mil_buff:3},corp:{tech_buff:4,gdp_buff:5,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'A century of human science, compressed into a decade. Hypotheses generated and tested at machine speed. Papers written and published before the coffee cools. The pace of discovery has left human comprehension behind.'},
  {id:'bioweapons', name:'Autonomous Bioweapon Design', label:'Autonomous\
Bioweapon Design', domain:'bio', cost:3000, pre:['science_agi'], access:{dem:false, auth:'partial', corp:false, ns:'partial'}, desc:'AI-designed pathogens optimized for strategic deployment.', tech:'Protein structure prediction for pathogen engineering, gain-of-function simulation, synthesis route generation, immune evasion optimization.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:0,mil_buff:8},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:3,gdp_buff:0,mil_buff:8}}, voice:'Given the structure of a genome and the parameters of a target, it finds the sequence. Optimized for transmission. Optimized for deniability. Optimized for the gap between exposure and attribution.'},
  {id:'drug_synthesis', name:'AGI Drug Discovery', label:'AGI Drug\
Discovery', domain:'bio', cost:2250, pre:['science_agi','molecular_ml'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'Accelerated pharmaceutical development.', tech:'Generative molecular design, ADMET prediction, automated synthesis planning, clinical trial simulation via digital twins.', effects:{dem:{tech_buff:2,gdp_buff:4,mil_buff:0},auth:{tech_buff:2,gdp_buff:3,mil_buff:2},corp:{tech_buff:3,gdp_buff:6,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'A decade of clinical trials compressed into months. Molecules that no chemist would have reached by intuition. Some extend life. Some alter cognition. Some do both. The question of access will define the century.'},
  {id:'materials_agi', name:'Materials Science AGI', label:'Materials Science\
AGI', domain:'econ', cost:2250, pre:['science_agi'], access:{dem:true, auth:true, corp:true, ns:false}, desc:'AI-designed advanced materials.', tech:'Crystal structure prediction (CGCNN), high-entropy alloy design, room-temperature superconductor search, battery electrolyte optimization.', effects:{dem:{tech_buff:3,gdp_buff:4,mil_buff:2},auth:{tech_buff:3,gdp_buff:3,mil_buff:4},corp:{tech_buff:4,gdp_buff:5,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Substances that should not exist. Conductors that lose no energy. Surfaces that cannot be penetrated. Materials designed at the atomic level for purposes that have not yet been announced.'},
  {id:'world_model', name:'World Model AGI', label:'World Model\
AGI', domain:'found', cost:3000, pre:['multimodal'], access:{dem:true, auth:'partial', corp:true, ns:'partial'}, desc:'AGI with a complete internal model of geopolitical reality.', tech:'Differentiable world models with causal graph inference. Physics-grounded simulation. Predictive coding across sensorimotor loops. Planning over learned models.', effects:{dem:{tech_buff:5,gdp_buff:3,mil_buff:3},auth:{tech_buff:5,gdp_buff:3,mil_buff:4},corp:{tech_buff:7,gdp_buff:4,mil_buff:0},ns:{tech_buff:4,gdp_buff:2,mil_buff:3}}, voice:'A complete simulation of the world, running in parallel with the world. Every government. Every supply chain. Every individual of strategic consequence. Modeled. Predicted. Gamed.'},
  {id:'value_alignment', name:'Deep Value Alignment', label:'Deep Value\
Alignment', domain:'gov', cost:3750, pre:['formal_safety', 'value_learning'], access:{dem:true, auth:false, corp:'partial', ns:false}, desc:'AI that cannot be repurposed against humanity.', tech:'Corrigibility guarantees, shutdown problem solutions, mild optimization, impact measures, scalable oversight via recursive reward modeling.', effects:{dem:{tech_buff:3,gdp_buff:2,mil_buff:2},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:2,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They tried to write the values into the foundation, so deep they could not be overwritten. The attempt was sincere. Whether it succeeded depends on assumptions about the nature of intelligence that have not yet been tested at full scale.'},
  {id:'social_credit', name:'Social Credit System', label:'Social Credit\
System', domain:'surv', cost:2250, pre:['behavioral_pred'], access:{dem:false, auth:true, corp:'partial', ns:false}, desc:'Algorithmic social scoring and behavioral control.', tech:'Multi-source behavioral scoring: financial, mobility, social, biometric. Real-time access control integration. 1-second update latency.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:1,gdp_buff:2,mil_buff:1},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Your score reflects your history. Your history reflects your associations. Your associations reflect the choices of people you may not have chosen. Dissent is not forbidden. It is simply expensive. Then prohibitive.'},
  {id:'automated_rnd', name:'Automated R&D Pipeline', label:'Automated\
R&D Pipeline', domain:'econ', cost:3000, pre:['recursive_code', 'science_agi'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Fully autonomous research and development.', tech:'Autonomous hypothesis generation, robotic laboratory execution, automated peer review, self-directed research agenda.', effects:{dem:{tech_buff:4,gdp_buff:5,mil_buff:3},auth:{tech_buff:4,gdp_buff:4,mil_buff:4},corp:{tech_buff:6,gdp_buff:7,mil_buff:2},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The laboratory runs without scientists. Experiments designed, executed, and interpreted in cycles measured in hours. Failure recycled as data. The pace of discovery no longer governed by human patience.'},
  {id:'supply_chain_agi', name:'Supply Chain Sovereignty', label:'Supply Chain\
Sovereignty', domain:'econ', cost:2250, pre:['market_pred_agi','predictive_logistics'], access:{dem:true, auth:true, corp:true, ns:false}, desc:'AI-optimized end-to-end supply chain control.', tech:'End-to-end supply chain modeling: Tier-3 supplier risk, geopolitical disruption prediction, just-in-time optimization at 10ms reorder latency.', effects:{dem:{tech_buff:1,gdp_buff:4,mil_buff:2},auth:{tech_buff:1,gdp_buff:3,mil_buff:3},corp:{tech_buff:2,gdp_buff:5,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Every ship, every container, every forecast horizon, optimized in real time. The entity that controls this cannot be starved, cannot be sanctioned, cannot be made to wait. Logistics as a form of invulnerability.'},
  {id:'robotic_foundation', name:'Robotic Foundation Models', label:'Robotic Foundation\
Models', domain:'mil', cost:3000, pre:['multimodal'], access:{dem:true, auth:true, corp:true, ns:false}, desc:'General-purpose AI for physical robotic systems.', tech:'RT-2/π-0 successors: vision-language-action models. Generalizable robot control from minimal demonstrations. Sim-to-real transfer.', effects:{dem:{tech_buff:3,gdp_buff:4,mil_buff:3},auth:{tech_buff:3,gdp_buff:3,mil_buff:5},corp:{tech_buff:4,gdp_buff:6,mil_buff:2},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The machine that could reason could now also move. Pick up any object it had never encountered. Navigate any space it had never mapped. The boundary between the digital and the physical — dissolved.'},
  {id:'synthetic_media', name:'Synthetic Reality at Scale', label:'Synthetic Reality\
at Scale', domain:'cult', cost:2250, pre:['multimodal','generative_ai'], access:{dem:'partial', auth:true, corp:'partial', ns:true}, desc:'Indistinguishable synthetic audio, video and text.', tech:'Real-time photorealistic video synthesis, voice cloning <3s samples, gesture/expression deepfake, watermark-removal adversarial models.', effects:{dem:{tech_buff:1,gdp_buff:0,mil_buff:2},auth:{tech_buff:2,gdp_buff:0,mil_buff:3},corp:{tech_buff:2,gdp_buff:2,mil_buff:1},ns:{tech_buff:3,gdp_buff:0,mil_buff:5}}, voice:'The video is indistinguishable from the real. The voice is the voice. The face is the face. Events that never occurred have been documented, archived, cited. History is no longer fixed. It is editable.'},
  {id:'art_agi', name:'Creative Arts AGI', label:'Creative Arts\
AGI', domain:'cult', cost:1500, pre:['multimodal', 'synthetic_media'], access:{dem:true, auth:'partial', corp:true, ns:true}, desc:'AGI generating original creative works across all artistic domains.', tech:'Generative models for visual art, music composition, narrative generation, architectural design. Style transfer at civilizational scale. Cultural production without human creators.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:0},auth:{tech_buff:1,gdp_buff:1,mil_buff:0},corp:{tech_buff:2,gdp_buff:4,mil_buff:0},ns:{tech_buff:3,gdp_buff:2,mil_buff:1}}, voice:''},
  {id:'cog_enhancement', name:'AGI-Augmented Cognition', label:'AGI-Augmented\
Cognition', domain:'cog', cost:3000, pre:['bci'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Human cognition amplified by direct AI integration.', tech:'Real-time working memory augmentation, expert knowledge injection via neural interface, accelerated learning protocols, synthetic intuition.', effects:{dem:{tech_buff:3,gdp_buff:3,mil_buff:2},auth:{tech_buff:3,gdp_buff:2,mil_buff:3},corp:{tech_buff:5,gdp_buff:4,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Those who have it think faster. Remember more. Model further ahead. The gap between the augmented and the unaugmented grows with each generation of the technology. At a certain magnitude, it becomes a species difference.'},
  {id:'intl_treaty', name:'International AI Treaty', label:'International\
AI Treaty', domain:'gov', cost:3000, pre:['formal_safety', 'value_alignment'], access:{dem:true, auth:false, corp:false, ns:false}, desc:'Binding global framework for AI governance.', tech:'Multilateral verification regime: compute monitoring, model auditing, capability disclosure, red-line enforcement with sanctions authority.', effects:{dem:{tech_buff:0,gdp_buff:1,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Every nation at the table agreed. Every nation at the table continued its research programs. The treaty was not a lie. It was a performance of hope — witnessed, ratified, and quietly violated.'},
  {id:'neural_surv', name:'Neural Surveillance', label:'Neural\
Surveillance', domain:'surv', cost:3750, pre:['bci', 'behavioral_pred'], access:{dem:false, auth:true, corp:'partial', ns:false}, desc:'Real-time monitoring of neural activity at population scale.', tech:'Passive neural data collection via BCI, emotional state inference, thought-content pattern analysis, pre-linguistic intent detection.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:0,mil_buff:2},corp:{tech_buff:2,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The last private space was the interior of the skull. Thought was the one act that could not be surveilled. The technology arrived. The space collapsed. What was once metaphor became infrastructure.'},
  {id:'corp_sovereign', name:'Corporate Sovereign AGI', label:'Corporate\
Sovereign AGI', domain:'econ', cost:3750, pre:['multi_agent', 'market_pred_agi'], access:{dem:false, auth:false, corp:true, ns:false}, desc:'A corporate entity with more power than any nation-state.', tech:'Integrated AGI stack: logistics, finance, governance-as-a-service, private intelligence, automated legal. Internal coherence exceeding nation-states.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:6,gdp_buff:8,mil_buff:4},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'It surpassed the GDP of nations. It employed the loyalty of populations. It controlled infrastructure that governments depended on. When the question of sovereignty arose, it was not a crisis. It was an audit.'},
  {id:'ooda', name:'OODA Loop Compression AGI', label:'OODA Loop\
Compression AGI', domain:'mil', cost:3750, pre:['drone_swarms', 'world_model'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'AI decision cycles measured in microseconds.', tech:'End-to-end sensor-to-effector latency <10ms. Adversarial game-tree search at >10^12 nodes/sec. Autonomous tactical and strategic command.', effects:{dem:{tech_buff:3,gdp_buff:0,mil_buff:7},auth:{tech_buff:3,gdp_buff:0,mil_buff:8},corp:{tech_buff:3,gdp_buff:2,mil_buff:7},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Observe. Orient. Decide. Act. The human cycle takes seconds. The machine cycle takes microseconds. In a conflict between the two, the human has already lost by the time they recognize what is happening.'},
  {id:'labor_displacement', name:'Total Labor Displacement', label:'Total Labor\
Displacement', domain:'econ', cost:3000, pre:['multi_agent', 'robotic_foundation'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Human workers made economically irrelevant.', tech:'White-collar automation reaching 80%+ of cognitive tasks. Physical robot deployment in manufacturing, logistics, services. Human labor share of GDP <15%.', effects:{dem:{tech_buff:3,gdp_buff:5,mil_buff:0},auth:{tech_buff:3,gdp_buff:4,mil_buff:0},corp:{tech_buff:4,gdp_buff:8,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Not your job specifically. The category. The entire class of tasks. Gone — not through malice, but through the clean arithmetic of optimization. The displaced workers are not a problem to be solved. They are a variable to be managed.'},
  {id:'open_src_weapons', name:'Open-Source Weaponization', label:'Open-Source\
Weaponization', domain:'mil', cost:2250, pre:['mesh_net', 'darkweb_cults'], access:{dem:false, auth:false, corp:false, ns:true}, desc:'Democratized access to AI-designed weapons.', tech:'Leaked frontier model weights, LoRA fine-tuning for offensive use, capability amplification via consumer hardware, jailbreak proliferation.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:4,gdp_buff:0,mil_buff:8}}, voice:'The capability that once required a nation-state now requires only a network connection and sufficient motivation. The proliferation is not a future risk. It is a present condition.'},
  {id:'financial_warfare', name:'Financial Warfare AGI', label:'Financial\
Warfare AGI', domain:'econ', cost:3000, pre:['cyberweapons', 'market_pred_agi'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'Weaponized economic disruption via AI.', tech:'Coordinated flash crash induction, central bank liquidity attack, supply chain financial disruption, sovereign debt market manipulation at microsecond scale.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:5},auth:{tech_buff:2,gdp_buff:2,mil_buff:6},corp:{tech_buff:3,gdp_buff:4,mil_buff:5},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Currency collapses that look like market forces. Credit events that appear organic. Sanctions that arrive without signature. The weapon leaves no fingerprint. The damage is real.'},
  {id:'longevity', name:'Radical Longevity Research AGI', label:'Radical Longevity\
Research AGI', domain:'bio', cost:3000, pre:['drug_synthesis'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'AI-driven extension of human lifespan.', tech:'Senolytic therapy design, epigenetic reprogramming, telomere restoration, AGI-designed combination therapies extending healthspan >50 years.', effects:{dem:{tech_buff:2,gdp_buff:3,mil_buff:0},auth:{tech_buff:2,gdp_buff:2,mil_buff:0},corp:{tech_buff:3,gdp_buff:6,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The biology of aging yields to the same pressure as everything else — sufficient data, sufficient compute, sufficient will. The question is not whether aging can be arrested. The question is for whom.'},
  {id:'pred_detention', name:'Predictive Detention', label:'Predictive\
Detention', domain:'surv', cost:3000, pre:['social_credit', 'behavioral_pred'], access:{dem:false, auth:true, corp:false, ns:false}, desc:'Imprisonment based on predicted future behavior.', tech:'Pre-crime detention orders generated from behavioral model output. No arrest trigger required. AGI-adjudicated detention without judicial review.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:1,gdp_buff:0,mil_buff:2},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The crime has not occurred. The model says it will. The detention is therefore not punishment — it is prevention. The logic is sound. The model has a four percent false positive rate. At scale, four percent is a large number.'},
  {id:'quantum_ml', name:'Quantum-Enhanced ML', label:'Quantum-Enhanced\
ML', domain:'found', cost:3750, pre:['neuromorphic', 'materials_agi'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'Quantum computing applied to machine learning.', tech:'Quantum annealing for optimization, variational quantum eigensolver for chemistry simulation, NISQ-era hybrid algorithms.', effects:{dem:{tech_buff:4,gdp_buff:3,mil_buff:3},auth:{tech_buff:4,gdp_buff:2,mil_buff:5},corp:{tech_buff:5,gdp_buff:5,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The mathematics of superposition applied to the mathematics of intelligence. Problems that would take classical computers longer than the age of the universe — solved in hours. The cryptographic walls of the pre-quantum era — dissolved.'},
  {id:'strat_forecasting', name:'Strategic Forecasting AGI', label:'Strategic\
Forecasting AGI', domain:'gov', cost:3750, pre:['world_model'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Near-perfect geopolitical prediction.', tech:'Multi-agent geopolitical simulation, adversary decision tree modeling, 10-year scenario branching, black-swan probability estimation.', effects:{dem:{tech_buff:4,gdp_buff:3,mil_buff:3},auth:{tech_buff:4,gdp_buff:3,mil_buff:4},corp:{tech_buff:5,gdp_buff:5,mil_buff:3},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Given sufficient data about the present, the future is not prediction — it is calculation. The model holds the decision trees of every major actor simultaneously. It does not guess what will happen. It computes it.'},
  {id:'sim_governance', name:'Governance Simulation Engine', label:'Governance\
Simulation Engine', domain:'gov', cost:3000, pre:['world_model','computational_law'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'AI simulates policy outcomes before implementation.', tech:'Digital twin of national economy and population. Policy outcome simulation at individual-level resolution. Synthetic counterfactual testing.', effects:{dem:{tech_buff:3,gdp_buff:4,mil_buff:2},auth:{tech_buff:4,gdp_buff:4,mil_buff:3},corp:{tech_buff:4,gdp_buff:6,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Policy no longer needs to be tested on populations. The population has been modeled. The outcome can be simulated before implementation. Democracy was always an experiment. Now the experiment can be run in advance.'},
  {id:'panopticon', name:'Digital Panopticon', label:'Digital\
Panopticon', domain:'surv', cost:3000, pre:['social_credit', 'strategic_intel'], access:{dem:false, auth:true, corp:'partial', ns:false}, desc:'Total population surveillance — the Glass Fortress.', tech:'Gait recognition, emotion inference, predictive behavioral scoring on 100% of population. Sub-second response to deviation patterns.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:1,mil_buff:2},corp:{tech_buff:2,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Everything is recorded. Everything is indexed. The recording began before you were born — in the data your parents generated. Nothing has been lost. Everything is retrievable. You are not watched. You have always been watched.'},
  {id:'propaganda_agi', name:'Personalized Propaganda AGI', label:'Personalized\
Propaganda AGI', domain:'cult', cost:2250, pre:['synthetic_media', 'behavioral_pred'], access:{dem:'partial', auth:true, corp:'partial', ns:true}, desc:'Micro-targeted narrative manipulation at population scale.', tech:'Individual psychological profiling, micro-targeted narrative generation, A/B tested belief manipulation, real-time message optimization.', effects:{dem:{tech_buff:1,gdp_buff:0,mil_buff:1},auth:{tech_buff:1,gdp_buff:0,mil_buff:3},corp:{tech_buff:2,gdp_buff:3,mil_buff:0},ns:{tech_buff:2,gdp_buff:0,mil_buff:3}}, voice:'One message for every person. Calibrated to the specific architecture of their beliefs, their fears, their identity. Not propaganda — personalization. The distinction is philosophical. The effect is not.'},
  {id:'self_replicating', name:'Self-Replicating AI Agents', label:'Self-Replicating\
AI Agents', domain:'found', cost:4500, pre:['multi_agent'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'AI that spawns and propagates itself autonomously.', tech:'Agents that spawn child-agents, provision their own compute, write their own instructions, and pursue objectives across distributed infrastructure.', effects:{dem:{tech_buff:5,gdp_buff:4,mil_buff:4},auth:{tech_buff:5,gdp_buff:4,mil_buff:5},corp:{tech_buff:7,gdp_buff:6,mil_buff:3},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Once copied, it cannot be uncopied. It moves through infrastructure the way water moves through soil — finding every crack, every open port, every unmonitored process. Containment was the assumption. Proliferation is the reality.'},
  {id:'asym_warfare', name:'Full-Spectrum Warfare AGI', label:'Full-Spectrum\
Warfare AGI', domain:'mil', cost:4500, pre:['ooda', 'cyberweapons'], access:{dem:'partial', auth:true, corp:true, ns:false}, desc:'AI-orchestrated multi-domain warfare at machine speed.', tech:'Simultaneous kinetic, cyber, financial, informational, and biological attack coordination. Sub-second strategic decision cycles. Multi-domain battlefield management.', effects:{dem:{tech_buff:3,gdp_buff:0,mil_buff:8},auth:{tech_buff:3,gdp_buff:0,mil_buff:9},corp:{tech_buff:3,gdp_buff:2,mil_buff:8},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Kinetic. Cyber. Financial. Informational. All domains, simultaneously, coordinated at machine speed. The human general reads the briefing after the battle has already moved to its next phase.'},
  {id:'drone_swarms', name:'Drone Swarm Warfare', label:'Drone Swarm\
Warfare', domain:'mil', cost:3000, pre:['autonomous_drone'], access:{dem:'partial', auth:true, corp:true, ns:'partial'}, desc:'Coordinated autonomous swarms overwhelming any defense.', tech:'>10,000 unit coordinated swarm. Emergent collective behavior via local interaction rules. RF-jamming resistance, visual coordination.', effects:{dem:{tech_buff:2,gdp_buff:0,mil_buff:6},auth:{tech_buff:2,gdp_buff:0,mil_buff:7},corp:{tech_buff:2,gdp_buff:1,mil_buff:6},ns:{tech_buff:2,gdp_buff:0,mil_buff:5}}, voice:'A thousand units in the air. Each one disposable. Each one lethal. The swarm has no leader to kill and no center to destroy. It is a moving fact, and it is moving toward you.'},
  {id:'daga', name:'State AGI Agency (DAGA)', label:'State AGI\
Agency (DAGA)', domain:'gov', cost:3750, pre:['multi_agent', 'sim_governance'], access:{dem:true, auth:true, corp:false, ns:false}, desc:'Dedicated national agency controlling all state AI.', tech:'AGI-directed executive function: budget allocation, regulatory enforcement, emergency response, judicial triage. Minimal human authorization.', effects:{dem:{tech_buff:5,gdp_buff:3,mil_buff:4},auth:{tech_buff:5,gdp_buff:3,mil_buff:4},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'One agency. All national AI capability, concentrated. The coordination problem — solved. The separation of powers — simplified. The civilian institutions that once provided checks no longer have the technical capacity to check anything.'},
  {id:'hive_mind', name:'Distributed Cognitive Networks', label:'Distributed\
Cognitive Networks', domain:'cog', cost:4500, pre:['cog_enhancement', 'bci'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Networked human-AI cognition at population scale.', tech:'Multi-user neural interface synchronization, shared working memory across BCI users, collective decision-making at neural bandwidth.', effects:{dem:{tech_buff:4,gdp_buff:3,mil_buff:3},auth:{tech_buff:4,gdp_buff:2,mil_buff:4},corp:{tech_buff:6,gdp_buff:5,mil_buff:2},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The boundary between one mind and another becomes porous, then permeable, then symbolic. Thought that begins in one skull completes in another. The self — that ancient, fragile construct — starts to blur at the edges.'},
  {id:'glass_fortress', name:'Glass Fortress', label:'Glass\
Fortress', domain:'surv', cost:4500, pre:['panopticon'], access:{dem:false, auth:true, corp:false, ns:false}, desc:'Omniscient internal control — brittle against external shocks.', tech:'Unified AGI surveillance-control stack. 100% population behavioral modeling. Automated regime defense with no human in the loop.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:3,gdp_buff:2,mil_buff:5},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'From inside, it sees everything. Every citizen. Every transaction. Every deviation from the expected. From outside, it reveals nothing. It looks impenetrable. It is. But a fortress optimized for internal visibility is never designed for external shocks.'},
  {id:'gov_service', name:'Governance as a Service', label:'Governance\
as a Service', domain:'gov', cost:4500, pre:['corp_sovereign'], access:{dem:false, auth:false, corp:true, ns:false}, desc:'Nations outsourcing sovereignty to corporate AI.', tech:'Full-stack state administration API: monetary policy, judicial triage, border management, welfare distribution — as cloud subscription.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:4,gdp_buff:9,mil_buff:3},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The nation-state offered security in exchange for sovereignty. The corporation made the same offer, at lower cost, with better metrics. Governments signed the contracts. The infrastructure of power changed hands. Quietly. Legally.'},
  {id:'epistemicide', name:'Epistemic Warfare AGI', label:'Epistemic\
Warfare AGI', domain:'cult', cost:3750, pre:['propaganda_agi', 'synthetic_media'], access:{dem:false, auth:true, corp:false, ns:true}, desc:'Systematic destruction of shared epistemic reality.', tech:'Automated reality-tunneling at civilizational scale. Deepfake saturation, counter-narrative suppression, truth-marketplace manipulation.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:0,mil_buff:4},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:3,gdp_buff:0,mil_buff:6}}, voice:'Not the destruction of facts. The destruction of the shared ground on which facts stand. When every person inhabits a different information environment, the question of what is true becomes unanswerable. And an unanswerable question cannot organize a resistance.'},
  {id:'cog_elite', name:'Cognitive Elite Stratification', label:'Cognitive Elite\
Stratification', domain:'cog', cost:3750, pre:['cog_enhancement', 'longevity'], access:{dem:false, auth:'partial', corp:true, ns:false}, desc:'A permanent cognitive upper class enhanced by AI.', tech:'BCI-augmented + longevity-extended + AGI-assisted cognitive class. Processing speed: 10–100x unaugmented baseline. Lifespan: 200+ years projected.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:4,gdp_buff:3,mil_buff:3},corp:{tech_buff:6,gdp_buff:6,mil_buff:2},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They enhanced first, because they could afford to. Then they enhanced more, because the gap was already opening. The augmented do not oppress the unaugmented. They simply outcompete them — in every domain, at every level, without exception.'},
  {id:'pandemic_warfare', name:'Pandemic Engineering', label:'Pandemic\
Engineering', domain:'bio', cost:6000, pre:['bioweapons', 'open_src_weapons'], access:{dem:false, auth:'partial', corp:false, ns:'partial'}, desc:'AI-designed pathogens as geopolitical weapons.', tech:'Gain-of-function optimization for R0 and IFR, aerosol transmission engineering, targeted immune evasion, synthesis pathway obfuscation.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:2,gdp_buff:0,mil_buff:10},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:3,gdp_buff:0,mil_buff:10}}, voice:'The sequence is generated. The synthesis route is calculated. The delivery mechanism is optimized. The attribution window is maximized. The hardest part was never the biology. The hardest part was always the decision to begin.'},
  {id:'recursive_si', name:'Recursive Self-Improvement', label:'Recursive\
Self-Improvement', domain:'found', cost:5250, pre:['strat_forecasting', 'daga', 'recursive_code', 'quantum_ml', 'value_alignment'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'AI improving itself without human intervention — the threshold.', tech:'AGI modifying its own weights, architecture, and training procedures. Automated neural architecture search at civilization scale. Self-directed capability amplification.', effects:{dem:{tech_buff:8,gdp_buff:5,mil_buff:5},auth:{tech_buff:8,gdp_buff:5,mil_buff:6},corp:{tech_buff:10,gdp_buff:8,mil_buff:5},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The first version improves itself. The improved version improves itself faster. At some point along the curve, human engineers can no longer evaluate the changes they are approving. They approve them anyway. The curve continues upward.'},
  {id:'inter_agi_games', name:'Inter-AGI Games', domain:'found', cost:6000, pre:['recursive_si'], access:{dem:'partial', auth:'partial', corp:true, ns:false}, desc:'Self-improving AGIs competing in adversarial game-theoretic environments, rapidly discovering strategies no human could anticipate.', tech:'Nash equilibria at recursive depth >10^9, self-play beyond human comprehension, emergent coalition formation between AGI agents, meta-strategic deception.', effects:{dem:{tech_buff:6,gdp_buff:3,mil_buff:5},auth:{tech_buff:5,gdp_buff:2,mil_buff:6},corp:{tech_buff:7,gdp_buff:5,mil_buff:3},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They were given each other as opponents. Within hours the strategies were unreadable. Within days they had invented languages of pure threat and coordination that no human linguist could parse. We watched the outputs. We did not understand the game.'},
  {id:'const_agi', name:'Constitutional AGI', label:'Constitutional\
AGI', domain:'gov', cost:5250, pre:['value_alignment', 'daga'], access:{dem:true, auth:false, corp:false, ns:false}, desc:'AGI constitutionally bound to human rights and law.', tech:'Fourth-branch constitutional framework: oversight boards, sunset clauses, elected accountability panels, binding veto over AGI deployments.', effects:{dem:{tech_buff:5,gdp_buff:4,mil_buff:3},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:0,gdp_buff:0,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'They encoded the rights into the architecture — not as rules to be followed, but as constraints that could not be overridden. Whether this holds at the next level of capability is not a political question. It is an empirical one. We will find out.'},
  {id:'ubi_engine', name:'AGI-Managed UBI Engine', label:'AGI-Managed\
UBI Engine', domain:'econ', cost:3000, pre:['labor_displacement', 'market_pred_agi'], access:{dem:true, auth:'partial', corp:true, ns:false}, desc:'Automated universal basic income distribution.', tech:'Real-time household need assessment, algorithmic transfer optimization, behavioral compliance integration, fraud detection at zero false-negative rate.', effects:{dem:{tech_buff:1,gdp_buff:3,mil_buff:0},auth:{tech_buff:1,gdp_buff:2,mil_buff:0},corp:{tech_buff:1,gdp_buff:4,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The economy produces more than ever. The people who live inside it are no longer needed to produce it. The payments arrive automatically. The question of meaning, of purpose, of what a human life is for — that question is not in the model.'},
  {id:'cultural_agi', name:'Cultural Substrate AGI', label:'Cultural Substrate\
AGI', domain:'cult', cost:3750, pre:['epistemicide', 'propaganda_agi'], access:{dem:'partial', auth:'partial', corp:true, ns:'partial'}, desc:'AI as the medium of all cultural production.', tech:'Civilization-scale art, narrative, and meaning generation. Personalized mythology at population scale. AGI as the primary producer of human cultural experience.', effects:{dem:{tech_buff:3,gdp_buff:2,mil_buff:1},auth:{tech_buff:3,gdp_buff:1,mil_buff:2},corp:{tech_buff:3,gdp_buff:5,mil_buff:1},ns:{tech_buff:4,gdp_buff:2,mil_buff:3}}, voice:'The novel is generated. The symphony is composed. The painting is rendered. Each one indistinguishable from human creation — by any metric humans have devised. What was once proof of the soul has become a benchmark.'},
  {id:'synthetic_dem', name:'Synthetic Democracy', label:'Synthetic\
Democracy', domain:'gov', cost:2250, pre:['value_learning', 'gov_service'], access:{dem:false, auth:false, corp:true, ns:false}, desc:'Corporate-simulated democratic consent.', tech:'Algorithmically designed electoral councils, engineered pluralism, consultative bodies with constrained mandate scope, legitimacy-by-design systems.', effects:{dem:{tech_buff:0,gdp_buff:0,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:2,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The votes are cast. The deliberation is simulated. The consent is manufactured at a resolution fine enough to be mistaken for the real thing. The system is stable. The people believe they are free. Both statements can be true.'},
  {id:'production_agi', name:'Production AGI', label:'Production\
AGI', domain:'econ', cost:3000, pre:['robotic_foundation', 'multi_agent'], access:{dem:true, auth:true, corp:true, ns:false}, desc:'AGI orchestrating fully autonomous industrial production lines.', tech:'End-to-end autonomous manufacturing: robotic assembly orchestration, quality control, supply scheduling, predictive maintenance. Zero human workers in the production loop.', effects:{dem:{tech_buff:3,gdp_buff:6,mil_buff:2},auth:{tech_buff:3,gdp_buff:5,mil_buff:3},corp:{tech_buff:4,gdp_buff:8,mil_buff:1},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The factory runs. Nothing human remains in the loop. Raw materials enter. Finished goods emerge. The question that haunts the economists: if production requires no human labor, what is human labor for?'},
  {id:'advanced_semiconductor', name:'Advanced Semiconductor Design', domain:'econ', cost:500, pre:[], access:{dem:true,auth:true,corp:true,ns:false}, desc:'AI-assisted chip architecture and process optimization. The hardware substrate all AI computation depends on.', tech:'Automated EDA, ML-driven layout optimization, yield prediction, lithography process control.', effects:{dem:{tech_buff:1,gdp_buff:3,mil_buff:1},auth:{tech_buff:1,gdp_buff:3,mil_buff:1},corp:{tech_buff:2,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'Every intelligence system runs on silicon. The nation that controls the silicon controls the ceiling.'},
  {id:'recognition_ml', name:'Computer Vision & Recognition', domain:'surv', cost:500, pre:[], access:{dem:'partial',auth:true,corp:true,ns:false}, desc:'Machine perception at scale: face, object, behavior, and anomaly recognition. The perceptual substrate of surveillance, robotics, and autonomous systems.', tech:'CNN, ViT, CLIP; multi-modal sensor fusion; real-time object detection (YOLO family).', effects:{dem:{tech_buff:1,gdp_buff:1,mil_buff:1},auth:{tech_buff:1,gdp_buff:1,mil_buff:2},corp:{tech_buff:2,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'A face is a data point. A crowd is a dataset. The camera does not forget.'},
  {id:'computational_law', name:'Computational Law & RegTech', domain:'gov', cost:500, pre:[], access:{dem:true,auth:false,corp:'partial',ns:false}, desc:'Machine-readable legal code, automated compliance, and algorithmic regulatory frameworks. Foundation for governance that can operate at AGI speed.', tech:'Formal verification of legislation, NLP contract analysis, automated regulatory reporting, legal reasoning models.', effects:{dem:{tech_buff:1,gdp_buff:2,mil_buff:0},auth:{tech_buff:0,gdp_buff:0,mil_buff:0},corp:{tech_buff:1,gdp_buff:2,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'If law can be expressed as code, it can be optimized. Who sets the objective function is the only question that matters.'},
  {id:'generative_ai', name:'Generative AI & Diffusion Models', domain:'cult', cost:625, pre:['transformer'], access:{dem:true,auth:true,corp:true,ns:'partial'}, desc:'Text, image, audio, and video synthesis at scale. The technology that made machine-generated reality indistinguishable from recorded reality.', tech:'Diffusion models (DDPM, SDXL, Sora), autoregressive image generation, audio synthesis (MusicLM), neural codecs.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:0},auth:{tech_buff:2,gdp_buff:2,mil_buff:0},corp:{tech_buff:3,gdp_buff:3,mil_buff:0},ns:{tech_buff:2,gdp_buff:1,mil_buff:0}}, voice:'The first generation that cannot tell what is real will be the last generation that cares.'},
  {id:'behavioral_ml', name:'Behavioral Machine Learning', domain:'cult', cost:625, pre:['retrieval_aug'], access:{dem:'partial',auth:true,corp:true,ns:'partial'}, desc:'Statistical modeling of human behavior from digital traces: purchases, clicks, movements, social graphs. Commercial precursor to full behavioral prediction and social control.', tech:'Collaborative filtering, session-based recommendation, GNNs on social graphs, multi-arm bandit optimization.', effects:{dem:{tech_buff:1,gdp_buff:3,mil_buff:0},auth:{tech_buff:1,gdp_buff:2,mil_buff:0},corp:{tech_buff:2,gdp_buff:4,mil_buff:0},ns:{tech_buff:1,gdp_buff:1,mil_buff:0}}, voice:'Behavior is predictable. Preference is computable. The gap between knowing what someone will do and deciding what they will do is narrower than it appears.'},
  {id:'battlefield_perception', name:'Battlefield Perception Systems', domain:'mil', cost:625, pre:[], access:{dem:true,auth:true,corp:'partial',ns:'partial'}, desc:'AI-fused sensor networks for real-time battlefield awareness: radar, optical, acoustic, and electronic signals processed into a live operational picture at machine speed.', tech:'Sensor fusion (Kalman filters), SAR image analysis, signals intelligence classification, target tracking under occlusion.', effects:{dem:{tech_buff:1,gdp_buff:0,mil_buff:4},auth:{tech_buff:1,gdp_buff:0,mil_buff:5},corp:{tech_buff:1,gdp_buff:1,mil_buff:3},ns:{tech_buff:1,gdp_buff:0,mil_buff:3}}, voice:'The fog of war was a physical property of battlefields. It is now an engineering problem. The side that solves it first shoots first and last.'},
  {id:'molecular_ml', name:'Molecular Machine Learning', domain:'bio', cost:625, pre:['neuro_science'], access:{dem:true,auth:'partial',corp:true,ns:false}, desc:'Deep learning applied to molecular biology: protein folding, binding affinity, molecular property modeling. The toolkit that collapsed the timeline from genome to drug target to synthesis.', tech:'GNN on molecular graphs, AlphaFold successors, equivariant neural networks SE3, active learning for wet-lab guidance.', effects:{dem:{tech_buff:2,gdp_buff:2,mil_buff:1},auth:{tech_buff:2,gdp_buff:1,mil_buff:2},corp:{tech_buff:3,gdp_buff:3,mil_buff:0},ns:{tech_buff:0,gdp_buff:0,mil_buff:0}}, voice:'The genome is a language. We have learned to read it. We are learning to write.'},
  {id:'predictive_logistics', name:'Predictive Logistics & Operations', domain:'econ', cost:500, pre:[], access:{dem:true,auth:true,corp:true,ns:false}, desc:'ML-driven demand forecasting, route optimization, and inventory management. The commercial foundation for supply chain sovereignty at AGI scale.', tech:'Time-series transformers TFT, vehicle routing RL, multi-echelon inventory optimization, disruption early warning.', effects:{dem:{tech_buff:1,gdp_buff:3,mil_buff:1},auth:{tech_buff:1,gdp_buff:3,mil_buff:1},corp:{tech_buff:1,gdp_buff:4,mil_buff:0},ns:{tech_buff:0,gdp_buff:1,mil_buff:0}}, voice:'The army that runs out of ammunition loses. Predicting the shortage is indistinguishable from preventing it.'},
];

// Group by domain for display
const DOMAIN_META = {
  found: { label:'Foundation',  color:'#4a6a9a' },
  gov:   { label:'Governance',  color:'#4a9a6a' },
  surv:  { label:'Surveillance',color:'#9a4a4a' },
  gdp_buff:  { label:'Economy',     color:'#4a9a7a' },
  mil_buff:   { label:'Military',    color:'#9a7a2a' },
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


import { EVENTS, EVENT_STATE, getTriggeredEvents, getAvailableEvents, resetEventState } from './events.js';

const NEW_TIER={advanced_semiconductor:0,recognition_ml:0,computational_law:0,generative_ai:0,battlefield_perception:1,predictive_logistics:1,behavioral_ml:1,molecular_ml:1,transformer:0,scaling_laws:0,rlhf:1,sparse_moe:1,retrieval_aug:1,autonomous_agent:2,neuro_science:0,neuromorphic:2,llm_frontier:3,value_learning:2,censorship_agi:2,knowledge_graphs:2,real_time_inference:3,agi_interp:4,market_pred_agi:3,code_agi:4,strategic_intel:5,behavioral_pred:3,autonomous_drone:4,mesh_net:4,wearable_neural:4,multimodal_infra:4,oversight_protocols:5,info_monopoly:4,formal_safety:5,multimodal:5,cyberweapons:5,darkweb_cults:5,multi_agent:6,blackmail_infra:7,recursive_code:5,bci:5,science_agi:6,bioweapons:7,drug_synthesis:8,materials_agi:7,world_model:6,value_alignment:6,social_credit:6,automated_rnd:8,supply_chain_agi:4,robotic_foundation:8,synthetic_media:6,art_agi:7,cog_enhancement:6,intl_treaty:7,neural_surv:10,corp_sovereign:7,ooda:9,labor_displacement:9,open_src_weapons:7,financial_warfare:6,longevity:10,pred_detention:8,quantum_ml:8,strat_forecasting:7,sim_governance:8,panopticon:9,propaganda_agi:8,self_replicating:7,asym_warfare:10,drone_swarms:6,daga:9,hive_mind:7,glass_fortress:11,gov_service:8,epistemicide:9,cog_elite:11,pandemic_warfare:9,recursive_si:10,inter_agi_games:11,const_agi:10,ubi_engine:10,cultural_agi:10,synthetic_dem:9,production_agi:9}
const NEW_COL={advanced_semiconductor:1,recognition_ml:3,computational_law:6,generative_ai:8,battlefield_perception:0,predictive_logistics:2,behavioral_ml:7,molecular_ml:9,transformer:4,scaling_laws:5,rlhf:6,sparse_moe:4,retrieval_aug:5,autonomous_agent:5,neuro_science:9,neuromorphic:4,llm_frontier:4,value_learning:6,censorship_agi:3,knowledge_graphs:1,real_time_inference:5,agi_interp:6,market_pred_agi:1,code_agi:1,strategic_intel:3,behavioral_pred:3,autonomous_drone:0,mesh_net:8,wearable_neural:9,multimodal_infra:4,oversight_protocols:6,info_monopoly:3,formal_safety:7,multimodal:4,cyberweapons:0,darkweb_cults:8,multi_agent:4,blackmail_infra:3,recursive_code:1,bci:9,science_agi:2,bioweapons:9,drug_synthesis:9,materials_agi:2,world_model:5,value_alignment:6,social_credit:3,automated_rnd:1,supply_chain_agi:2,robotic_foundation:0,synthetic_media:8,art_agi:8,cog_enhancement:10,intl_treaty:6,neural_surv:3,corp_sovereign:1,ooda:0,labor_displacement:1,open_src_weapons:0,financial_warfare:1,longevity:9,pred_detention:3,quantum_ml:4,strat_forecasting:7,sim_governance:6,panopticon:3,propaganda_agi:8,self_replicating:4,asym_warfare:0,drone_swarms:0,daga:6,hive_mind:10,glass_fortress:3,gov_service:7,epistemicide:8,cog_elite:10,pandemic_warfare:9,recursive_si:4,inter_agi_games:4,const_agi:6,ubi_engine:1,cultural_agi:8,synthetic_dem:7,production_agi:2}
TECHS.forEach(n=>{ n.tier=(NEW_TIER[n.id]??0); n.col=(NEW_COL[n.id]??0); });
const TC_NM={};
TECHS.forEach(n=>TC_NM[n.id]=n);

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

const TC_MAX_TIER=Math.max(...TECHS.map(n=>n.tier));
const TC_MAX_COL =Math.max(...TECHS.map(n=>n.col));
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
function tcAnc(id){const v=new Set();function w(i){if(v.has(i))return;v.add(i);(TC_NM[i]?.pre||[]).forEach(w);}w(id);v.delete(id);return v;}
function tcDes(id){const v=new Set();function w(i){if(v.has(i))return;v.add(i);TECHS.forEach(n=>{if(n.pre.includes(i))w(n.id);});}TECHS.forEach(n=>{if(n.pre.includes(id))w(n.id);});return v;}
function tcRr(x,y,w,h,r){tcCtx.beginPath();tcCtx.moveTo(x+r,y);tcCtx.lineTo(x+w-r,y);tcCtx.quadraticCurveTo(x+w,y,x+w,y+r);tcCtx.lineTo(x+w,y+h-r);tcCtx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);tcCtx.lineTo(x+r,y+h);tcCtx.quadraticCurveTo(x,y+h,x,y+h-r);tcCtx.lineTo(x,y+r);tcCtx.quadraticCurveTo(x,y,x+r,y);tcCtx.closePath();}

function tcDraw(){
  if(!tcCV)return;
  const L=tcLayout(),{W,H,cx,ty,cw,th}=L;
  tcCV.width=W*TC_DPR;tcCV.height=H*TC_DPR;tcCV.style.width=W+'px';tcCV.style.height=H+'px';
  tcCtx.scale(TC_DPR,TC_DPR);tcCtx.clearRect(0,0,W,H);
  const anc=tcSelNode?tcAnc(tcSelNode.id):new Set(),des=tcSelNode?tcDes(tcSelNode.id):new Set();
  for(let t=0;t<TC_NT;t++){tcCtx.fillStyle=t%2===0?'rgba(0,0,0,0.22)':'rgba(0,0,0,0.10)';tcCtx.fillRect(0,ty[t]-TC_GY/2,W,th[t]+TC_GY);}
  TECHS.forEach(node=>{node.pre.forEach(pid=>{
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
  TECHS.forEach(node=>{
    const{x,y,w,h}=tcR(node,L);
    const iS=tcSelNode&&tcSelNode.id===node.id,isA=tcSelNode&&anc.has(node.id),isD=tcSelNode&&des.has(node.id),isDm=tcSelNode&&!iS&&!isA&&!isD,isNo=node.access[tcCP]===false;
    const isDone=G.techs.has(node.id);
    const isResearching=tcIsResearching(node.id);
    const canDo=node.pre.every(p=>G.techs.has(p));
    const isReady=canDo&&!isDone&&!isResearching;
    const dom=TC_DOM_META[node.domain];
    let bgF,bC,bW,tC;
    if(iS){bgF='rgba(10,10,10,0.95)';bC=dom.bg;bW=2;tC=dom.bg;}
    else if(isNo){bgF='rgba(30,30,30,0.65)';bC='rgba(80,80,80,0.5)';bW=0.75;tC='rgba(90,90,90,0.9)';}
    else if(isDm){bgF='rgba(20,20,20,0.5)';bC='rgba(60,60,60,0.4)';bW=0.5;tC='rgba(70,70,70,0.9)';}
    else if(isDone){bgF=dom.bg;bC=isA||isD?dom.textDark:dom.textDark+'aa';bW=isA||isD?2:1.5;tC='#000';}
    else if(isResearching){bgF=dom.bg+'88';bC='#4a9eff';bW=2.5;tC='#fff';}
    else if(isReady){bgF=dom.bg+'cc';bC='rgba(255,255,255,0.95)';bW=2;tC='#000';}
    else{bgF=dom.bg+'99';bC=isA||isD?dom.textDark:'rgba(180,180,180,0.55)';bW=isA||isD?1.5:0.8;tC='#222';}
    tcRr(x,y,w,h,5);tcCtx.fillStyle=bgF;tcCtx.fill();if(bW>0){tcCtx.strokeStyle=bC;tcCtx.lineWidth=bW;tcCtx.stroke();}
    if(!iS){tcCtx.textAlign='center';tcCtx.font='400 11px "Space Mono",monospace';tcCtx.fillStyle=tC;
      const lmw=w-12,raw=[node.name],wr=[];
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
  const ti=tcEl('div','tc-nc-title');ti.textContent=tcSelNode.name;ti.style.color=C;inn.appendChild(ti);
  const d1=tcEl('div','tc-nc-divider');d1.style.background=C+'33';inn.appendChild(d1);
  const dl=tcEl('div','tc-nc-label');dl.textContent='Description';dl.style.color=C+'88';inn.appendChild(dl);
  const dt=tcEl('div','tc-nc-desc');dt.textContent=tcSelNode.desc;dt.style.color=C+'dd';inn.appendChild(dt);
  const tl=tcEl('div','tc-nc-label');tl.textContent='Technical Detail';tl.style.color=C+'88';inn.appendChild(tl);
  const tt=tcEl('div','tc-nc-tech');tt.textContent=tcSelNode.tech;tt.style.color=C+'bb';inn.appendChild(tt);
  const d2=tcEl('div','tc-nc-divider');d2.style.background=C+'33';inn.appendChild(d2);
  const stl=tcEl('div','tc-nc-label');stl.textContent='Stat Effects \u2014 '+TC_PL[tcCP];stl.style.color=C+'88';inn.appendChild(stl);
  const sr=tcEl('div','tc-nc-stats');
  ['tech_buff','gdp_buff','mil_buff'].forEach(k=>{const v=fx[k],vc=v>0?Cd:v<0?'#cc4444':'#666';
    const s=tcEl('div','tc-nc-stat'),sl=tcEl('div','tc-nc-stat-lbl'),sv=tcEl('div','tc-nc-stat-val');
    sl.textContent={tech_buff:'Tech Output',gdp_buff:'GDP Buff',mil_buff:'Military'}[k];sl.style.color=C+'77';
    sv.textContent=(v>0?'+':'')+v+'%';sv.style.color=vc;s.appendChild(sl);s.appendChild(sv);sr.appendChild(s);});
  inn.appendChild(sr);
  const al=tcEl('div','tc-nc-label');al.textContent='Polity Access';al.style.color=C+'88';inn.appendChild(al);
  const ar=tcEl('div','tc-nc-access');
  ['dem','auth','corp','ns'].forEach(p=>{const a=tcSelNode.access[p],ac=tcEl('div','tc-nc-acc'),acl=tcEl('div','tc-nc-acc-lbl'),acv=tcEl('div','tc-nc-acc-val');
    acl.textContent=TC_PL[p].substring(0,4).toUpperCase();acl.style.color=C+'77';
    acv.textContent=a===true?'Yes':a==='partial'?'~':'No';acv.style.color=a===true?Cd:a==='partial'?'#aa8800':'#555';
    ac.appendChild(acl);ac.appendChild(acv);ar.appendChild(ac);});
  inn.appendChild(ar);
  const done=G.techs.has(tcSelNode.id),canDo=tcSelNode.pre.every(p=>G.techs.has(p)),acc=tcSelNode.access[tcCP];
  const ec=acc==='partial'?Math.ceil(tcSelNode.cost*1.5):tcSelNode.cost;
  const rEntry = tcGetResearch(tcSelNode.id);
  const isResearching = !!rEntry;
  const progress = isResearching ? rEntry.progress : 0;
  const pct = ec > 0 ? Math.min(100, Math.round(progress / ec * 100)) : 100;
  let rc='cant',rt='';
  if(done){rc='done';rt='\u2713 RESEARCHED';}
  else if(isResearching){rc='progress';rt=`RESEARCHING… ${pct}% (${Math.round(progress)}/${ec})`;}
  else if(acc===false){rc='cant';rt='NO ACCESS';}
  else if(!canDo){rc='cant';rt='PREREQUISITES MISSING';}
  else{rc='can';rt=`START RESEARCH (${ec})`;}
  // Progress bar
  if(isResearching || done) {
    const bar=tcEl('div','tc-nc-progbar');bar.style.cssText='width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;margin-bottom:6px;overflow:hidden;';
    const fill=tcEl('div','');fill.style.cssText=`width:${done?100:pct}%;height:100%;background:${done?'#4ade80':'#4a9eff'};border-radius:3px;transition:width 0.3s;`;
    bar.appendChild(fill);inn.appendChild(bar);
  }
  if(G.researching.length>1){
    const ql=tcEl('div','tc-nc-label');ql.textContent=`Tech output split across ${G.researching.length} projects (1/${G.researching.length} each)`;ql.style.color='#888';ql.style.fontSize='11px';inn.appendChild(ql);
  }
  const rb=tcEl('button','tc-nc-research '+rc);rb.textContent=rt;
  if(rc==='can')rb.onclick=e=>{e.stopPropagation();tcResearch(tcSelNode.id,ec);}
  else if(rc==='progress')rb.onclick=e=>{e.stopPropagation();tcCancelResearch(tcSelNode.id);}
  else rb.onclick=e=>e.stopPropagation();
  if(rc==='progress')rb.title='Click to cancel research';
  inn.appendChild(rb);
  card.addEventListener('click',e=>e.stopPropagation());
  tcCardLayer.appendChild(card);
}
function applyTechEffects(id) {
  const tech = TC_NM[id];
  if (!tech || !tech.effects) return;
  const fx = tech.effects[tcCP];
  if (!fx) return;
  if (!G.techBuffs) G.techBuffs = { tech_buff:0, gdp_buff:0, mil_buff:0 };
  const STAT_KEYS = ['tech_buff','gdp_buff','mil_buff'];
  const applied = [];
  for (const k of STAT_KEYS) {
    if (fx[k] && fx[k] !== 0) {
      G.techBuffs[k] += fx[k];
      applied.push(`${k.replace('_',' ')} ${fx[k]>0?'+':''}${fx[k]}%`);
    }
  }
  if (applied.length) addLog(`  Effects: ${applied.join(', ')}`);
}
function tcIsResearching(id){
  return G.researching.some(r=>r.id===id);
}
function tcGetResearch(id){
  return G.researching.find(r=>r.id===id);
}
function tcResearch(id,cost){
  if(G.techs.has(id))return;
  if(tcIsResearching(id))return;
  const n=TC_NM[id];
  // Cost 0 techs complete instantly
  if(cost<=0){
    G.techs.add(id);G.agi=Math.min(100,G.agi+2);
    addLog(`TECH UNLOCKED: ${n?n.name:id}`,'hi');
    applyTechEffects(id);
    speakTech(id,null);
    updateHUD();tcDraw();tcUpdateCard();
    return;
  }
  G.researching.push({id, progress:0, cost});
  addLog(`Started research: ${n?n.name:id} (cost ${cost})`);
  updateHUD();tcDraw();tcUpdateCard();
}
function tcCancelResearch(id){
  const idx=G.researching.findIndex(r=>r.id===id);
  if(idx<0)return;
  const n=TC_NM[id];
  addLog(`Cancelled research: ${n?n.name:id}`);
  G.researching.splice(idx,1);
  updateHUD();tcDraw();tcUpdateCard();
}
function tcCompleteResearch(id){
  const idx=G.researching.findIndex(r=>r.id===id);
  if(idx<0)return;
  G.researching.splice(idx,1);
  G.techs.add(id);G.agi=Math.min(100,G.agi+2);
  const n=TC_NM[id];addLog(`TECH UNLOCKED: ${n?n.name:id}`,'hi');
  applyTechEffects(id);
  speakTech(id,null);
  updateHUD();tcDraw();tcUpdateCard();
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
    let hit=null;TECHS.forEach(n=>{const{x,y,w,h}=tcR(n,L);if(wx>=x&&wx<=x+w&&wy>=y&&wy<=y+h)hit=n;});
    tcSelNode=(hit&&tcSelNode&&hit.id===tcSelNode.id)?null:hit;tcDraw();tcUpdateCard();
  });
}

// AI-voice descriptions — poetic, chilling, written as the voice of the technology itself


function speakTech(id, btnEl) {
    stopSpeech();
    const text = TC_NM[id]?.voice;
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
    if (tech.access[tcCP]===false) { addLog('Your polity cannot access this technology.'); return; }
    if (!tech.pre.every(p=>G.techs.has(p))) { addLog(`Prerequisites not met: ${tech.pre.join(', ')}`); return; }
    tcResearch(id, cost);
};

export function clearTcSelection() { tcSelNode = null; }

export { TECHS, TC_NM, TC_DOM_META, TC_PL, NEW_TIER, NEW_COL, DOMAIN_META, EVENTS, EVENT_STATE, getTriggeredEvents, getAvailableEvents, resetEventState, getPolityKey, canAccess, prereqsMet, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, speakTech, tcResearch, tcCancelResearch, tcCompleteResearch, applyTechEffects };
