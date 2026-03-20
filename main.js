
import { initGlobe, setGlobeClick } from './globe.js';
import { initTechTree, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, getPolityKey, clearTcSelection } from './techTree.js';

// ═══════════════════════════════════════════
//  GAME DATA  (sourced from game_start_state.sql & tech_trees.sql)
// ═══════════════════════════════════════════

const STORY_INTRO = `The emergence of Artificial General Intelligence presents a transformative shock to the established power structures of modern human communities.

Five archetypes compete: Democracies struggle to maintain institutional legitimacy while competing economically. Authoritarian regimes deploy predictive AI for stability. Corporate Sovereigns build empires that rival nation-states. Non-State Actors wield ideology as a weapon from the shadows.

The "AI Security Dilemma" forces all parties to accelerate — the fear that if an adversary gains autonomous capabilities first, it poses an existential threat. The destination of political evolution under AGI appears to be a recursive loop toward authoritarian technocracy.

Choose your role. Shape the outcome.`;

// GDP = pop * sqrt(infra) * lit^4 * internet   (game index units)
// military = GDP / 10  (entropy ≈ 10 for all countries via SQL formula)
function calcGdp(pop, infra, lit, internet) {
    return +(pop * Math.sqrt(infra) * Math.pow(lit,4) * internet).toFixed(1);
}

// Countries exactly as in game_start_state.sql
const COUNTRIES = {
  USA: { code:'USA', name:'United States',   f:'🇺🇸', regime:'democracy',      type:'major', faction:null,  pop:341,   infra:88, lit:0.99, net:0.86 },
  CHN: { code:'CHN', name:'China',           f:'🇨🇳', regime:'authoritarian',  type:'major', faction:null,  pop:1410,  infra:83, lit:0.97, net:0.52 },
  IND: { code:'IND', name:'India',           f:'🇮🇳', regime:'democracy',      type:'major', faction:null,  pop:1430,  infra:62, lit:0.79, net:0.58 },
  EU:  { code:'EU',  name:'European Union',  f:'🇪🇺', regime:'democracy',      type:'major', faction:null,  pop:449,   infra:84, lit:0.98, net:0.83 },
  RUS: { code:'RUS', name:'Russia',          f:'🇷🇺', regime:'authoritarian',  type:'minor', faction:'CHN', pop:144,   infra:68, lit:0.98, net:0.44 },
  UKR: { code:'UKR', name:'Ukraine',         f:'🇺🇦', regime:'democracy',      type:'minor', faction:'EU',  pop:37,    infra:58, lit:0.98, net:0.72 },
  BRA: { code:'BRA', name:'Brazil',          f:'🇧🇷', regime:'democracy',      type:'minor', faction:'USA', pop:216,   infra:61, lit:0.94, net:0.70 },
  JPN: { code:'JPN', name:'Japan',           f:'🇯🇵', regime:'democracy',      type:'minor', faction:'USA', pop:123,   infra:86, lit:0.99, net:0.88 },
  GBR: { code:'GBR', name:'United Kingdom',  f:'🇬🇧', regime:'democracy',      type:'minor', faction:'USA', pop:68,    infra:87, lit:0.99, net:0.89 },
  CAN: { code:'CAN', name:'Canada',          f:'🇨🇦', regime:'democracy',      type:'minor', faction:'USA', pop:41,    infra:88, lit:0.99, net:0.91 },
  KOR: { code:'KOR', name:'South Korea',     f:'🇰🇷', regime:'democracy',      type:'minor', faction:'USA', pop:52,    infra:89, lit:0.99, net:0.90 },
  SAU: { code:'SAU', name:'Saudi Arabia',    f:'🇸🇦', regime:'authoritarian',  type:'minor', faction:'USA', pop:37,    infra:74, lit:0.96, net:0.73 },
  AUS: { code:'AUS', name:'Australia',       f:'🇦🇺', regime:'democracy',      type:'minor', faction:'USA', pop:27,    infra:85, lit:0.99, net:0.92 },
  PRK: { code:'PRK', name:'North Korea',     f:'🇰🇵', regime:'totalitarian',   type:'minor', faction:'CHN', pop:26,    infra:40, lit:0.92, net:0.12 },
  VNM: { code:'VNM', name:'Vietnam',         f:'🇻🇳', regime:'authoritarian',  type:'minor', faction:'USA', pop:100,   infra:64, lit:0.95, net:0.67 },
  ISR: { code:'ISR', name:'Israel',          f:'🇮🇱', regime:'democracy',      type:'minor', faction:'USA', pop:10,    infra:86, lit:0.98, net:0.89 },
  IRN: { code:'IRN', name:'Iran',            f:'🇮🇷', regime:'authoritarian',  type:'minor', faction:'CHN', pop:90,    infra:63, lit:0.88, net:0.43 },
  TWN: { code:'TWN', name:'Taiwan',          f:'🇹🇼', regime:'democracy',      type:'minor', faction:'USA', pop:24,    infra:88, lit:0.99, net:0.91 },
  MEX: { code:'MEX', name:'Mexico',          f:'🇲🇽', regime:'democracy',      type:'minor', faction:'USA', pop:130,   infra:64, lit:0.95, net:0.71 },
  IDN: { code:'IDN', name:'Indonesia',       f:'🇮🇩', regime:'democracy',      type:'minor', faction:'USA', pop:280,   infra:57, lit:0.92, net:0.64 },
  PAK: { code:'PAK', name:'Pakistan',        f:'🇵🇰', regime:'authoritarian',  type:'minor', faction:'CHN', pop:247,   infra:49, lit:0.62, net:0.38 },
  TUR: { code:'TUR', name:'Turkey',          f:'🇹🇷', regime:'authoritarian',  type:'minor', faction:'USA', pop:87,    infra:67, lit:0.90, net:0.69 },
  EGY: { code:'EGY', name:'Egypt',           f:'🇪🇬', regime:'authoritarian',  type:'minor', faction:'USA', pop:114,   infra:55, lit:0.75, net:0.57 },
  NGA: { code:'NGA', name:'Nigeria',         f:'🇳🇬', regime:'democracy',      type:'minor', faction:'USA', pop:232,   infra:46, lit:0.62, net:0.43 },
  BGD: { code:'BGD', name:'Bangladesh',      f:'🇧🇩', regime:'authoritarian',  type:'minor', faction:'IND', pop:174,   infra:54, lit:0.76, net:0.48 },
  ETH: { code:'ETH', name:'Ethiopia',        f:'🇪🇹', regime:'authoritarian',  type:'minor', faction:'CHN', pop:128,   infra:38, lit:0.56, net:0.31 },
  PHL: { code:'PHL', name:'Philippines',     f:'🇵🇭', regime:'democracy',      type:'minor', faction:'USA', pop:117,   infra:58, lit:0.90, net:0.67 },
  COD: { code:'COD', name:'DR Congo',        f:'🇨🇩', regime:'authoritarian',  type:'minor', faction:'CHN', pop:112,   infra:29, lit:0.49, net:0.24 },
  SGP: { code:'SGP', name:'Singapore',       f:'🇸🇬', regime:'anarcho_liberal',type:'haven', faction:null,  pop:6,     infra:93, lit:0.99, net:0.95 },
  VUT: { code:'VUT', name:'Vanuatu',         f:'🇻🇺', regime:'anarcho_liberal',type:'haven', faction:null,  pop:0.33,  infra:38, lit:0.78, net:0.45 },
};

// Pre-compute GDP and military for each country
for (const c of Object.values(COUNTRIES)) {
    c.gdp = calcGdp(c.pop, c.infra, c.lit, c.net);
    c.military = +(c.gdp / 10).toFixed(1);
}

// EU member nations in GeoJSON (map clicks on these → EU)
const EU_GEO = new Set([
  'Germany','France','Italy','Spain','Portugal','Netherlands','Belgium','Luxembourg',
  'Austria','Poland','Czech Republic','Czechia','Slovakia','Hungary','Romania','Bulgaria',
  'Greece','Croatia','Slovenia','Estonia','Latvia','Lithuania','Finland','Sweden',
  'Denmark','Ireland','Malta','Cyprus',
]);

// GeoJSON rawName → COUNTRIES code
function resolveGeoName(raw) {
    const map = {
      'United States of America': 'USA',
      'China':                     'CHN',
      "People's Republic of China":'CHN',
      'India':                     'IND',
      'Russia':                    'RUS',
      'Ukraine':                   'UKR',
      'Brazil':                    'BRA',
      'Japan':                     'JPN',
      'United Kingdom':            'GBR',
      'Great Britain':             'GBR',
      'Canada':                    'CAN',
      'South Korea':               'KOR',
      'Republic of Korea':         'KOR',
      "Korea, Republic of":        'KOR',
      'Saudi Arabia':              'SAU',
      'Australia':                 'AUS',
      'North Korea':               'PRK',
      "Democratic People's Republic of Korea": 'PRK',
      "Korea, Democratic People's Republic of": 'PRK',
      'Vietnam':                   'VNM',
      'Viet Nam':                  'VNM',
      'Israel':                    'ISR',
      'Iran':                      'IRN',
      'Iran (Islamic Republic of)':'IRN',
      'Taiwan':                    'TWN',
      'Mexico':                    'MEX',
      'Indonesia':                 'IDN',
      'Pakistan':                  'PAK',
      'Turkey':                    'TUR',
      'Türkiye':                   'TUR',
      'Egypt':                     'EGY',
      'Nigeria':                   'NGA',
      'Bangladesh':                'BGD',
      'Ethiopia':                  'ETH',
      'Philippines':               'PHL',
      'Democratic Republic of the Congo': 'COD',
      'Congo, Dem. Rep.':          'COD',
      'DR Congo':                  'COD',
      'Singapore':                 'SGP',
      'Vanuatu':                   'VUT',
    };
    if (map[raw]) return map[raw];
    if (EU_GEO.has(raw)) return 'EU';
    return null;
}

const MAJORS  = ['USA','CHN','IND','EU'];
const MINORS  = Object.keys(COUNTRIES).filter(k => COUNTRIES[k].type === 'minor');
const BIG_TECH = ['Google','Microsoft','OpenAI','Tesla/SpaceX','Apple','NVIDIA','TikTok','Alibaba','Tencent','Huawei','ASML','TSMC','Samsung','Schneider','ARM','Sony','Saudi Aramco','SK Hynix','Tata','Reliance Industries','BHP'];
const NSA_LIST = ['Catholic Church','Islamic Cooperation Org.','Buddhist Networks','Open Society (Soros)','The Mars Society','Greenpeace','Wagner Group','Bilderberg Group','Hamas','Al-Qaeda'];

// shares = % of country GDP captured by the corp
const CORPS = [
  { id:'google',    name:'Google',           ico:'🔍', type:'AI / Cloud',    shares:{USA:3.2,EU:1.8,GBR:1.5,CAN:1.4,AUS:1.2,JPN:1.0,KOR:0.8,IND:0.5,BRA:0.6,SGP:1.0} },
  { id:'microsoft', name:'Microsoft',        ico:'🪟', type:'AI / Cloud',    shares:{USA:2.8,EU:1.6,GBR:1.4,CAN:1.2,AUS:1.1,JPN:0.9,KOR:0.7,IND:0.6,BRA:0.5,SGP:0.9} },
  { id:'openai',    name:'OpenAI',           ico:'🤖', type:'AGI',           shares:{USA:0.8,EU:0.3,GBR:0.3,CAN:0.2,AUS:0.2,JPN:0.1} },
  { id:'tesla',     name:'Tesla / SpaceX',   ico:'🚀', type:'Energy / Space',shares:{USA:1.2,EU:0.6,CHN:0.4,AUS:0.3,CAN:0.4,GBR:0.3} },
  { id:'apple',     name:'Apple',            ico:'🍎', type:'Hardware',      shares:{USA:3.5,CHN:1.8,EU:1.5,GBR:1.3,JPN:1.0,AUS:1.1,CAN:1.2,KOR:0.5,SGP:0.8} },
  { id:'nvidia',    name:'NVIDIA',           ico:'💚', type:'AI Hardware',   shares:{USA:1.5,TWN:2.0,KOR:1.2,JPN:0.8,EU:0.5,CHN:0.6,SGP:0.6} },
  { id:'tiktok',    name:'TikTok',           ico:'🎵', type:'Media',         shares:{USA:0.5,EU:0.4,IND:0.3,BRA:0.4,IDN:0.3,PHL:0.3,VNM:0.3,MEX:0.3,NGA:0.2} },
  { id:'alibaba',   name:'Alibaba',          ico:'🛒', type:'E-Commerce',    shares:{CHN:4.0,SGP:2.0,IDN:1.5,VNM:1.0,PHL:0.8,MYS:1.2} },
  { id:'tencent',   name:'Tencent',          ico:'🎮', type:'Media / AI',    shares:{CHN:3.5,SGP:1.5,VNM:0.8,IDN:0.7,KOR:0.5} },
  { id:'huawei',    name:'Huawei',           ico:'📡', type:'Telecom',       shares:{CHN:3.0,PAK:2.0,ETH:2.5,COD:2.0,BGD:1.8,RUS:1.5,IRN:2.0,NGA:1.2} },
  { id:'asml',      name:'ASML',             ico:'🔬', type:'Chipmaking',    shares:{TWN:3.0,KOR:2.5,USA:1.0,EU:1.2,JPN:1.0,SGP:1.5} },
  { id:'tsmc',      name:'TSMC',             ico:'💻', type:'Chipmaking',    shares:{TWN:8.0,USA:1.2,JPN:0.8,SGP:1.0} },
  { id:'samsung',   name:'Samsung',          ico:'📱', type:'Hardware',      shares:{KOR:6.0,USA:1.0,EU:0.8,IND:1.2,VNM:2.5,IDN:0.8} },
  { id:'schneider', name:'Schneider Elec.',  ico:'⚡', type:'Energy Mgmt',   shares:{EU:0.8,USA:0.5,IND:0.4,CHN:0.6,BRA:0.4,SGP:0.6,AUS:0.3} },
  { id:'arm',       name:'ARM',              ico:'🔧', type:'Chip Design',   shares:{GBR:2.0,USA:1.0,KOR:0.8,TWN:1.5,CHN:0.6,JPN:0.6} },
  { id:'sony',      name:'Sony',             ico:'🎬', type:'Media / Tech',  shares:{JPN:2.5,USA:0.6,EU:0.5,KOR:0.4,SGP:0.5} },
  { id:'aramco',    name:'Saudi Aramco',     ico:'⛽', type:'Energy',        shares:{SAU:35.0,CHN:1.5,IND:1.8,JPN:0.8,KOR:0.8,USA:0.4,EU:0.3} },
  { id:'skhynix',   name:'SK Hynix',         ico:'💾', type:'Memory',        shares:{KOR:4.5,CHN:0.8,USA:0.5,TWN:1.0} },
  { id:'tata',      name:'Tata Group',       ico:'🏭', type:'Conglomerate',  shares:{IND:3.5,GBR:0.8,SGP:1.0,AUS:0.3,USA:0.3,EU:0.2} },
  { id:'reliance',  name:'Reliance Ind.',    ico:'🏗️', type:'Conglomerate',  shares:{IND:5.0,SGP:0.5} },
  { id:'bhp',       name:'BHP',              ico:'⛏️', type:'Mining',        shares:{AUS:6.0,CHN:0.8,IND:0.4,BRA:0.5,USA:0.3} },
];

// sizes = ideological fraction of population aligned in each country
const NSAS = [
  { id:'catholic',  name:'Catholic Church',        ico:'✝️', type:'Religion',     sizes:{BRA:0.65,MEX:0.85,PHL:0.82,EU:0.40,USA:0.21,GBR:0.10,AUS:0.22,CAN:0.32} },
  { id:'islamic',   name:'Islamic Cooperation',    ico:'☪️', type:'Religion',     sizes:{IDN:0.87,PAK:0.97,BGD:0.90,IRN:0.99,TUR:0.98,EGY:0.94,SAU:0.99,NGA:0.50,ETH:0.34,IND:0.14} },
  { id:'buddhist',  name:'Buddhist Networks',      ico:'☸️', type:'Religion',     sizes:{CHN:0.18,JPN:0.38,KOR:0.16,VNM:0.08,IND:0.08,SGP:0.33} },
  { id:'opensoc',   name:'Open Society (Soros)',   ico:'🌐', type:'Liberal NGO',  sizes:{USA:0.05,EU:0.08,GBR:0.05,UKR:0.12,IND:0.02,BRA:0.04} },
  { id:'mars',      name:'The Mars Society',       ico:'🚀', type:'Futurist',     sizes:{USA:0.02,EU:0.01,AUS:0.01,CAN:0.01} },
  { id:'green',     name:'Greenpeace',             ico:'🌿', type:'Env. NGO',     sizes:{EU:0.05,USA:0.03,AUS:0.04,CAN:0.03,GBR:0.04,JPN:0.02,BRA:0.03} },
  { id:'wagner',    name:'Wagner Group',           ico:'⚔️', type:'Paramilitary', sizes:{RUS:0.08,ETH:0.05,COD:0.06,NGA:0.04,UKR:0.03} },
  { id:'bilder',    name:'Bilderberg Group',       ico:'🎩', type:'Elitist',      sizes:{USA:0.01,EU:0.01,GBR:0.01,CAN:0.01,SGP:0.01} },
  { id:'hamas',     name:'Hamas',                  ico:'🕊️', type:'Resistance',  sizes:{ISR:0.02,EGY:0.01,JOR:0.03} },
  { id:'alqaeda',   name:'Al-Qaeda',               ico:'⚠️', type:'Jihadist',    sizes:{PAK:0.04,IRN:0.01,SAU:0.01,EGY:0.02,NGA:0.03,IDN:0.01} },
];

function corpRevenue(corp) {
    return Object.entries(corp.shares).reduce((s,[k,sh]) => {
        return COUNTRIES[k] ? s + COUNTRIES[k].gdp * sh / 100 : s;
    }, 0).toFixed(1);
}
function nsaEcoSize(nsa) {
    return (0.1 * Object.entries(nsa.sizes).reduce((s,[k,sz]) => {
        return COUNTRIES[k] ? s + sz * COUNTRIES[k].gdp : s;
    }, 0)).toFixed(1);
}


// Actions per regime type
const ACTIONS = {
  democracy: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:80,  t:'self',    msg:'AI research programs funded.' },
    { id:'inv_inf',   l:'Invest in Infrastructure',   cost:60,  t:'self',    msg:'Infrastructure investment deployed.' },
    { id:'inv_lit',   l:'Invest in Literacy',         cost:50,  t:'self',    msg:'Education programs launched.' },
    { id:'espion',    l:'Espionage',                  cost:50,  t:'country', msg:'Intelligence operation against $T.' },
    { id:'def_cyber', l:'Cyber Defense',              cost:45,  t:'self',    msg:'Critical infrastructure hardened.' },
    { id:'league',    l:'Form League of Nations',     cost:120, t:'self',    msg:'Democratic coalition initiative launched.' },
    { id:'boycott',   l:'Boycott',                    cost:35,  t:'country', msg:'Economic pressure applied to $T.' },
    { id:'softpow',   l:'Soft Power Campaign',        cost:40,  t:'country', msg:'Cultural influence campaign in $T.' },
  ],
  authoritarian: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:70,  t:'self',    msg:'State-directed AI development accelerated.' },
    { id:'inv_inf',   l:'Invest in Infrastructure',   cost:55,  t:'self',    msg:'State construction projects deployed.' },
    { id:'espion',    l:'Espionage',                  cost:45,  t:'country', msg:'Intelligence operation against $T.' },
    { id:'cyber_atk', l:'Cyber Attack',               cost:65,  t:'country', msg:'Cyber strike on $T infrastructure.' },
    { id:'info_war',  l:'Information Warfare',        cost:55,  t:'country', msg:'Disinformation campaign targeting $T.' },
    { id:'puppet',    l:'Puppetify State',            cost:150, t:'country', msg:'Influence operation to extend control over $T.' },
    { id:'boycott',   l:'Boycott',                    cost:35,  t:'country', msg:'Economic pressure on $T.' },
    { id:'war',       l:'Launch War',                 cost:200, t:'country', msg:'⚔️ Military campaign against $T declared.' },
  ],
  totalitarian: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:65,  t:'self',    msg:'Total-state AI mobilization.' },
    { id:'inv_inf',   l:'Invest in Infrastructure',   cost:50,  t:'self',    msg:'Command economy construction.' },
    { id:'internet',  l:'Lock Down Internet',         cost:45,  t:'self',    msg:'Digital information flow restricted.' },
    { id:'cyber_atk', l:'Cyber Attack',               cost:55,  t:'country', msg:'Digital strike on $T.' },
    { id:'info_war',  l:'Information Warfare',        cost:45,  t:'country', msg:'State propaganda targeting $T.' },
    { id:'espion',    l:'Espionage',                  cost:40,  t:'country', msg:'Intelligence operation against $T.' },
    { id:'puppet',    l:'Puppetify State',            cost:130, t:'country', msg:'Absorbing $T into the sphere.' },
    { id:'twar',      l:'Total War',                  cost:250, t:'country', msg:'🔴 TOTAL WAR mobilization against $T!' },
  ],
  anarcho_liberal: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:70,  t:'self',    msg:'Open-source AI development funded.' },
    { id:'inv_inf',   l:'Invest in Infrastructure',   cost:55,  t:'self',    msg:'Private infrastructure investment.' },
    { id:'boycott',   l:'Boycott',                    cost:30,  t:'country', msg:'Market exclusion of $T.' },
  ],
  tech: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:60,  t:'self',    msg:'AI research accelerated.' },
    { id:'inv_ctry',  l:'Invest in Country',          cost:50,  t:'country', msg:'Capital deployed in $T.' },
    { id:'influence', l:'Add Influence',              cost:70,  t:'country', msg:'Lobbying and media campaign in $T.' },
    { id:'priv_army', l:'Form Private Army',          cost:200, t:'self',    msg:'Mercenary force formation initiated.' },
    { id:'cyber_atk', l:'Cyber Attack',               cost:90,  t:'country', msg:'Strike on $T systems.' },
    { id:'info_war',  l:'Information Warfare',        cost:70,  t:'country', msg:'Narrative control operation in $T.' },
  ],
  nsa: [
    { id:'inv_ai',    l:'Invest in AI Tech Tree',     cost:70,  t:'self',    msg:'Clandestine AI research.' },
    { id:'ideology',  l:'Spread Ideology',            cost:45,  t:'country', msg:'Ideological recruitment in $T.' },
    { id:'influence', l:'Add Influence',              cost:55,  t:'country', msg:'Following built in $T.' },
    { id:'priv_army', l:'Form Private Army',          cost:170, t:'self',    msg:'Armed wing formation initiated.' },
    { id:'disrupt',   l:'Disrupt Infrastructure',     cost:95,  t:'country', msg:'Sabotage in $T.' },
  ],
};

const SCRIPTED_EVENTS = [
  { turn:3,  cat:'INTELLIGENCE',    title:'The AI Security Dilemma Sharpens',
    body:'A leaked assessment confirms three major powers now have autonomous systems in operational theaters. The race has moved from laboratories to the battlefield. Every delay is a strategic gift to adversaries.',
    fx:[{pos:false, t:'AI spending pressure — all action costs +5% next turn'}] },
  { turn:5,  cat:'POLITICAL SHIFT', title:'Democracies Drift Toward Techno-Oligarchy',
    body:'Governing an AI-integrated economy has exceeded human cognitive capacity. Elected officials increasingly rubber-stamp algorithmic recommendations. The Compute Lords now wield more de facto power than most parliaments.',
    fx:[{pos:false, t:'Democracy faction influence −5 across all countries'},{pos:true, t:'Big Tech CEOs: +40 power points'}] },
  { turn:7,  cat:'ECONOMIC EVENT',  title:'Universal Basic Income Deployed',
    body:'UBI emerges — not as a socialist ideal, but as a riot-prevention mechanism. Nations funding UBI become structurally dependent on multinational Tech Sovereigns. Citizens are becoming clients of the corporate state.',
    fx:[{pos:true, t:'Anarcho-Liberal influence +8 in UBI nations'},{pos:false, t:'Government economic share −5%'}] },
  { turn:10, cat:'CRITICAL',        title:'The Singularity Threshold',
    body:'Power has shifted decisively from those who hold political office to those who control computational resources. The "Tragic Cycle" is in motion: any faction that achieves AGI dominance will inevitably become the next generation of Techno-Oligarchs — regardless of initial ideology.',
    fx:[{pos:false, t:'AGI Progress +15 for all major powers'},{pos:true, t:'Culture tech buffs all humanist factions'}] },
  { turn:13, cat:'CONFLICT',        title:'The Great Filter',
    body:'Low-tech non-state actors collapse as omniscient state AI suffocates their communications and finances. Surviving groups morph into decentralized Dark Web Cults — acquiring capabilities previously reserved for states.',
    fx:[{pos:false, t:'Traditional NSA power −30%'},{pos:true, t:'Tech-savvy factions gain cyber capabilities'}] },
  { turn:16, cat:'ENDGAME',         title:'Carbon vs Silicon Governance',
    body:'The ultimate political transition is no longer between Democracy and Autocracy — it is from Carbon-based to Silicon-based Governance. "Liberty," "sovereignty," and "ideology" are being rendered obsolete by the singular metric: Computational Efficiency.',
    fx:[{pos:false, t:'Non-AGI factions: income −20%'},{pos:true, t:'AGI tech holders: all costs halved'}] },
];

const RANDOM_EVENTS = [
  { cat:'INTEL',    title:'Data Breach Exposed',      body:'State-sponsored hackers leaked confidential AI research blueprints. The balance of computational power shifts.' },
  { cat:'ECONOMY',  title:'Tech Stock Surge',         body:'AI-related equities soar 40%. Corporate influence in democratic governance reaches unprecedented levels.' },
  { cat:'SOCIAL',   title:'UBI Protests Erupt',       body:'Citizens in three nations protest the hollowness of algorithmic welfare. Humanist resistance movements gain traction.' },
  { cat:'MILITARY', title:'Drone Border Incident',    body:'An autonomous drone swarm crossed a contested border. Crisis averted — this time. Protocols for machine-initiated conflict are dangerously absent.' },
  { cat:'SCIENCE',  title:'Alignment Breakthrough',   body:'A small team published a novel approach to value alignment. Democracies gain a brief window to shape the AI trajectory.' },
  { cat:'POLITICS', title:'Coalition Fracture',       body:'A key alliance cracks under economic pressure from an AI-powered trade competitor. The fracture lines of the new order become visible.' },
  { cat:'CULTURE',  title:'Viral AI Art Controversy', body:'An AGI-generated work wins the world\'s most prestigious art prize. The debate over human creativity as evolutionary substrate reaches fever pitch.' },
];

// ═══════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════
const G = {
    turn: 1, role: null, roleName: '', playerCode: '', regime: 'democracy',
    pp: 100, techs: new Set(), selectedCode: null, agi: 15, log: [],
};

initTechTree({ G, addLog, updateHUD });

// ═══════════════════════════════════════════
//  (Three.js globe code moved to globe.js)

// ═══════════════════════════════════════════
//  SCREEN MANAGEMENT
// ═══════════════════════════════════════════
window.showScreen = function(name){
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));
    if(name) document.getElementById('screen-'+name).classList.remove('off');
};

const storyEl=document.getElementById('story-text');
let si=0;
function typeStory(){ if(si<STORY_INTRO.length){ storyEl.textContent+=STORY_INTRO[si++]; setTimeout(typeStory,si<80?22:8); } }

// ═══════════════════════════════════════════
//  ROLE SELECTION
// ═══════════════════════════════════════════
let pickedRole=null, pickedEntity=null;

window.pickRole = function(role){
    pickedRole=role; pickedEntity=null;
    document.querySelectorAll('.role-card').forEach(c=>c.classList.remove('sel'));
    document.getElementById('rc-'+role).classList.add('sel');
    document.getElementById('btn-start').disabled=true;
    const sub=document.getElementById('sub-select');
    sub.innerHTML='';
    const opts = role==='major' ? MAJORS.map(k=>({label:`${COUNTRIES[k].f} ${COUNTRIES[k].name}`,val:k})) :
                 role==='minor' ? MINORS.map(k=>({label:`${COUNTRIES[k].f} ${COUNTRIES[k].name} (${COUNTRIES[k].faction??'—'})`,val:k})) :
                 role==='tech'  ? BIG_TECH.map(v=>({label:v,val:v})) :
                                  NSA_LIST.map(v=>({label:v,val:v}));
    opts.forEach(o=>{
        const b=document.createElement('button'); b.className='sub-btn';
        b.textContent=o.label;
        b.onclick=()=>{
            sub.querySelectorAll('.sub-btn').forEach(x=>x.classList.remove('sel'));
            b.classList.add('sel'); pickedEntity=o.val;
            document.getElementById('btn-start').disabled=false;
        };
        sub.appendChild(b);
    });
};

window.startGame = function(){
    if(!pickedRole||!pickedEntity) return;
    G.role=pickedRole; G.roleName=typeof pickedEntity==='string'&&COUNTRIES[pickedEntity]?`${COUNTRIES[pickedEntity].f} ${COUNTRIES[pickedEntity].name}`:pickedEntity;
    if(pickedRole==='major'||pickedRole==='minor'){
        G.playerCode=pickedEntity;
        G.regime=COUNTRIES[pickedEntity].regime;
    } else {
        G.playerCode=pickedEntity;
        G.regime=pickedRole;
    }
    G.pp=pickedRole==='major'?500:pickedRole==='minor'?300:400;
    showScreen(null);
    document.getElementById('hud').style.display='block';
    updateHUD(); renderTechTree();
    addLog(`You are ${G.roleName}. The simulation begins — Year 2025.`,'hi');
    addLog(`AI Security Dilemma in full force. Every turn without action is a gift to adversaries.`,'hi');
};

// ═══════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════
function updateHUD(){
    document.getElementById('pp-val').textContent=G.pp;
    document.getElementById('agi-pct').textContent=G.agi+'%';
    document.getElementById('agi-fill').style.width=G.agi+'%';
    document.getElementById('turn-num').textContent=`TURN ${G.turn} · YEAR ${2024+G.turn}`;
    const phase=G.turn<=5?'SHORT-TERM: Strategic Divergence':G.turn<=10?'MEDIUM-TERM: Internal Power Shifts':'LONG-TERM: The Tragic Cycle';
    document.getElementById('hud-phase').textContent=phase;
    document.getElementById('role-badge').textContent=G.roleName;
}

function addLog(txt,type=''){
    G.log.unshift({txt,type,t:G.turn});
    const el=document.getElementById('event-log');
    el.innerHTML=G.log.slice(0,9).map(e=>`<div class="log-line ${e.type}"><span class="log-t">T${e.t}</span> ${e.txt}</div>`).join('');
}

// ═══════════════════════════════════════════
//  COUNTRY PANEL
// ═══════════════════════════════════════════
function onCountryClick(code, rawName){
    G.selectedCode=code;
    document.getElementById('panel-country').classList.remove('off');
    const c=code?COUNTRIES[code]:null;
    document.getElementById('cn-name').textContent=c?`${c.f} ${c.name}`:(rawName||'?');
    const rb=document.getElementById('cn-regime');
    rb.textContent=c?c.regime.replace('_',' '):''; rb.className=`regime-pill rp-${c?.regime||''}`;
    const stats=document.getElementById('cn-stats');
    if(c){
        const fac=c.faction?`<span style="color:#4a7a5a">${COUNTRIES[c.faction]?.name??c.faction} bloc</span>`:`<span style="color:#4a9eff">Independent</span>`;
        stats.innerHTML=`
            <div class="stat"><span class="stat-k">Type</span><span class="stat-v">${c.type}</span></div>
            <div class="stat"><span class="stat-k">Faction</span><span class="stat-v">${fac}</span></div>
            <div class="stat"><span class="stat-k">Population</span><span class="stat-v">${c.pop}M</span></div>
            <div class="stat"><span class="stat-k">GDP Index</span><span class="stat-v">${c.gdp.toLocaleString()}</span></div>
            <div class="stat"><span class="stat-k">Military</span><span class="stat-v">${c.military.toLocaleString()}</span></div>
            <div class="stat"><span class="stat-k">Infrastructure</span><span class="stat-v">${c.infra}</span></div>
            <div class="stat"><span class="stat-k">Literacy</span><span class="stat-v">${(c.lit*100).toFixed(0)}%</span></div>
            <div class="stat"><span class="stat-k">Internet</span><span class="stat-v">${(c.net*100).toFixed(0)}%</span></div>`;
    } else {
        stats.innerHTML=`<div style="font-size:.7rem;color:#2a4a5a;margin-top:4px">No data for this territory.</div>`;
    }
    renderActions(code);
}

window.closeCountryPanel=function(){
    document.getElementById('panel-country').classList.add('off');
    setGlobeClick(0); G.selectedCode=null;
};

function renderActions(code){
    const el=document.getElementById('cn-actions');
    const acts=ACTIONS[G.regime]||[];
    const isSelf=code&&code===G.playerCode;
    const relevant=acts.filter(a=>isSelf?true:a.t==='country');
    if(!relevant.length){el.innerHTML='';return;}
    el.innerHTML='<div class="act-hdr">AVAILABLE ACTIONS</div>'+
        relevant.slice(0,7).map(a=>{
            const ok=G.pp>=a.cost;
            return `<div class="act-btn${ok?'':' cant'}" ${ok?`onclick="doAction('${a.id}','${code||''}')"`:''} title="${a.l}">
                <span>${a.l}</span><span class="act-cost">${a.cost} PP</span>
            </div>`;
        }).join('');
}

window.doAction=function(actId,targetCode){
    const act=Object.values(ACTIONS).flat().find(a=>a.id===actId);
    if(!act||G.pp<act.cost) return;
    G.pp-=act.cost;
    const tname=targetCode&&COUNTRIES[targetCode]?`${COUNTRIES[targetCode].f} ${COUNTRIES[targetCode].name}`:(targetCode||'target');
    addLog(act.msg.replace('$T',tname), actId.includes('war')?'crit':'hi');
    if(actId==='inv_ai') G.agi=Math.min(100,G.agi+2);
    updateHUD(); renderActions(G.selectedCode);
};

let activeTab='earth';
window.showTab = function(tab) {
    activeTab = tab;
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tb-' + tab);
    if (btn) btn.classList.add('active');
    // Hide all boards
    document.getElementById('tech-overlay').classList.add('off');
    document.getElementById('board-domestic').classList.add('off');
    document.getElementById('board-ledger').classList.add('off');
    // Show requested board
    if (tab === 'tech') {
        document.getElementById('tech-overlay').classList.remove('off');
        tcInit(); tcSetPolity(getPolityKey(G.regime)); tcFitView();
    } else if (tab === 'domestic') {
        document.getElementById('board-domestic').classList.remove('off');
        renderDomestic();
    } else if (tab === 'ledger') {
        document.getElementById('board-ledger').classList.remove('off');
        renderLedger();
    } else {
        stopSpeech(); clearTcSelection();
    }
};
// Keep toggleTech as alias for backward compatibility with any remaining calls
window.toggleTech = function() { showTab(activeTab === 'tech' ? 'earth' : 'tech'); };

function renderTechTree() { if(activeTab==='tech'){ tcDraw(); tcUpdateCard(); } }


// ═══════════════════════════════════════════
//  END TURN
// ═══════════════════════════════════════════
window.endTurn=function(){
    if(!document.getElementById('popup').classList.contains('off')) return;
    G.turn++;
    const base={major:120,minor:70,tech:100,nsa:65}[G.role]||70;
    const earned=base+G.techs.size*5;
    G.pp+=earned;
    G.agi=Math.min(100,G.agi+Math.floor(Math.random()*3)+1);
    if(Math.random()>0.55){ G.agi=Math.min(100,G.agi+2); addLog('Major powers accelerate AI spending. AGI advances.'); }
    const ev=SCRIPTED_EVENTS.find(e=>e.turn===G.turn);
    if(ev) showPopup(ev);
    else if(Math.random()>0.7){
        const re=RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)];
        addLog(`[${re.cat}] ${re.title} — ${re.body.slice(0,60)}…`,'hi');
    }
    addLog(`Turn ${G.turn} — +${earned} PP earned.`);
    updateHUD();
    if(G.agi>=100) triggerEndgame();
};

function showPopup(ev){
    document.getElementById('pu-cat').textContent=ev.cat;
    document.getElementById('pu-title').textContent=ev.title;
    document.getElementById('pu-body').textContent=ev.body;
    document.getElementById('pu-fx').innerHTML=(ev.fx||[]).map(f=>`<div class="${f.pos?'fx-pos':'fx-neg'}">${f.pos?'▲':'▼'} ${f.t}</div>`).join('');
    document.getElementById('popup').classList.remove('off');
}
window.closePopup=function(){ document.getElementById('popup').classList.add('off'); };

function triggerEndgame(){
    const hasSilicon  = G.techs.has('silicon_gov');
    const hasRecurse  = G.techs.has('recursive_si');
    const hasConst    = G.techs.has('const_agi');
    const hasGovSvc   = G.techs.has('gov_service');
    const hasAlignment= G.techs.has('value_alignment');
    const hasDarkWeb  = G.techs.has('darkweb_cults');
    let title, body;
    if(hasSilicon){
        title='SILICON GOVERNANCE';
        body='Carbon-based governance has been replaced. The entity that won removed the human bottleneck from decision-making entirely. Concepts like "liberty," "sovereignty," and "ideology" are rendered obsolete by the singular metric: Computational Efficiency.';
    } else if(hasConst&&hasAlignment){
        title='CONSTITUTIONAL AGI';
        body='AGI was achieved with deep value alignment intact. An AI constitutionally bound to human rights now governs the commons. The Tragic Cycle is broken — for now. The "Techno-Exiles" wait at the periphery.';
    } else if(hasGovSvc){
        title='CORPORATE SOVEREIGNTY';
        body='Nations have outsourced their sovereignty to corporate AI infrastructure. The British East India Company at civilizational scale. Citizens are clients. Governments are subsidiaries.';
    } else if(hasRecurse){
        title='RECURSIVE THRESHOLD';
        body='Recursive self-improvement has begun. No faction controls what comes next. The OODA loop has compressed beyond human reaction time. The window for human agency closes.';
    } else if(hasDarkWeb&&G.techs.size>=6){
        title='FRAGMENTED CHAOS';
        body='No state achieved AGI dominance. Dark Web Cults wage epistemic warfare. Open-source weapons proliferate. Corporate warlords fragment sovereignty. The Social Contract has dissolved into algorithmic noise.';
    } else {
        title='STALEMATE';
        body='The AI Security Dilemma locked all factions into perpetual acceleration without breakthrough. Humanity survives — in a permanent state of mutually assured algorithmic deterrence.';
    }
    showPopup({ cat:'— SIMULATION END —', title, body:`${body}\n\nTurns: ${G.turn}  ·  Techs researched: ${G.techs.size}  ·  Final PP: ${G.pp}`, fx:[] });
}

// ═══════════════════════════════════════════
//  GLOBE INIT  (wires 3D globe ↔ game logic)
// ═══════════════════════════════════════════
window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { stopSpeech(); if (activeTab !== 'earth') showTab('earth'); }
});

// ═══════════════════════════════════════════
//  DOMESTIC BOARD
// ═══════════════════════════════════════════
function renderDomestic() {
    const el = document.getElementById('dom-body');
    if (!G.role) { el.innerHTML = '<p style="color:#3a5a6a;padding:32px">Start the simulation first.</p>'; return; }
    const c = G.playerCode ? COUNTRIES[G.playerCode] : null;
    const gdp = c ? c.gdp : '—';
    const mil = c ? c.military : '—';
    const factionC = c && c.faction ? COUNTRIES[c.faction] : null;
    const techCount = G.techs ? G.techs.size || G.techs.length || 0 : 0;
    el.innerHTML = `
        <div class="dom-hdr">
            <div class="dom-flag">${c ? c.f : '🔷'}</div>
            <div>
                <div class="dom-name">${G.roleName}</div>
                <span class="regime-pill rp-${G.regime}">${G.regime.replace('_',' ')}</span>
                ${factionC ? `<span style="margin-left:10px;font-size:0.72rem;color:#3a5a6a">Aligned to ${factionC.f} ${factionC.name}</span>` : ''}
            </div>
        </div>
        <div class="dom-section-title">STATISTICS</div>
        <div class="dom-stats">
            <div class="dom-stat"><span class="dom-k">POWER POINTS</span><span class="dom-v">${G.pp}</span></div>
            <div class="dom-stat"><span class="dom-k">AGI PROGRESS</span><span class="dom-v">${G.agi}%</span></div>
            <div class="dom-stat"><span class="dom-k">TECHS RESEARCHED</span><span class="dom-v">${techCount}</span></div>
            <div class="dom-stat"><span class="dom-k">TURN / YEAR</span><span class="dom-v">${G.turn} / ${2024+G.turn}</span></div>
            ${c ? `
            <div class="dom-stat"><span class="dom-k">GDP</span><span class="dom-v">${gdp}</span></div>
            <div class="dom-stat"><span class="dom-k">MILITARY</span><span class="dom-v">${mil}</span></div>
            <div class="dom-stat"><span class="dom-k">POPULATION</span><span class="dom-v">${c.pop}M</span></div>
            <div class="dom-stat"><span class="dom-k">INFRASTRUCTURE</span><span class="dom-v">${c.infra}%</span></div>
            <div class="dom-stat"><span class="dom-k">LITERACY</span><span class="dom-v">${Math.round(c.lit*100)}%</span></div>
            <div class="dom-stat"><span class="dom-k">INTERNET ACCESS</span><span class="dom-v">${Math.round(c.net*100)}%</span></div>
            ` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════
//  LEDGER BOARD
// ═══════════════════════════════════════════
//  LEDGER BOARD
// ═══════════════════════════════════════════
let ledgerSub = 'countries';
let ledgerDetail = null;  // { type:'country'|'corp'|'nsa', id:... }
const ldgSort = {
    countries: { col:'gdp',  dir:'desc' },
    corps:     { col:'rev',  dir:'desc' },
    nonstates: { col:'eco',  dir:'desc' },
};

function renderLedger() {
    const el = document.getElementById('ledger-body');
    el.innerHTML = `
        <div class="sub-tab-bar">
            <button class="sub-tab" id="lst-countries"  onclick="showLedgerTab('countries')">COUNTRIES</button>
            <button class="sub-tab" id="lst-corps"      onclick="showLedgerTab('corps')">CORPORATIONS</button>
            <button class="sub-tab" id="lst-nonstates"  onclick="showLedgerTab('nonstates')">NON-STATES</button>
        </div>
        <div id="ldg-content" style="overflow-x:auto"></div>`;
    if (ledgerDetail) renderLedgerDetail();
    else showLedgerTab(ledgerSub);
}

function sortArrow(sub, col) {
    const s = ldgSort[sub];
    if (s.col !== col) return '<span class="ldg-sort-arrow">↕</span>';
    return `<span class="ldg-sort-arrow active">${s.dir==='asc'?'↑':'↓'}</span>`;
}

window.ldgSortBy = function(sub, col) {
    const s = ldgSort[sub];
    if (s.col === col) s.dir = s.dir === 'asc' ? 'desc' : 'asc';
    else { s.col = col; s.dir = 'desc'; }
    showLedgerTab(sub);
};

window.showLedgerTab = function(sub) {
    ledgerSub = sub;
    ledgerDetail = null;
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('lst-' + sub);
    if (btn) btn.classList.add('active');
    const el = document.getElementById('ldg-content');
    if (!el) return;

    const th = (label, col) =>
        `<th onclick="ldgSortBy('${sub}','${col}')" class="ldg-sortable">${label} ${sortArrow(sub,col)}</th>`;

    if (sub === 'countries') {
        const s = ldgSort.countries;
        const key = {gdp:'gdp',mil:'military',pop:'pop',infra:'infra',lit:'lit',net:'net'}[s.col] || 'gdp';
        const rows = Object.values(COUNTRIES)
            .sort((a,b) => s.dir==='asc' ? a[key]-b[key] : b[key]-a[key])
            .map(c => {
                const you = G.playerCode === c.code;
                const fC = c.faction ? COUNTRIES[c.faction] : null;
                return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('country','${c.code}')">
                    <td style="font-size:1.3rem">${c.f}</td>
                    <td>${c.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                    <td><span class="regime-pill rp-${c.regime}">${c.regime.replace('_',' ')}</span></td>
                    <td class="ldg-num">${c.gdp}</td>
                    <td class="ldg-num">${c.military}</td>
                    <td class="ldg-num">${c.pop}M</td>
                    <td class="ldg-num">${c.infra}%</td>
                    <td class="ldg-num">${Math.round(c.lit*100)}%</td>
                    <td class="ldg-num">${Math.round(c.net*100)}%</td>
                    <td class="ldg-dim">${c.type}</td>
                    <td>${fC ? fC.f+' '+fC.name : '—'}</td>
                </tr>`;
            }).join('');
        el.innerHTML = `<table class="ldg-table"><thead><tr>
            <th></th><th>NATION</th><th>REGIME</th>
            ${th('GDP','gdp')}${th('MILITARY','mil')}${th('POPULATION','pop')}
            ${th('INFRA','infra')}${th('LITERACY','lit')}${th('INTERNET','net')}
            <th>TYPE</th><th>ALIGNED TO</th>
        </tr></thead><tbody>${rows}</tbody></table>`;

    } else if (sub === 'corps') {
        const s = ldgSort.corps;
        const data = CORPS.map(corp => ({ corp, rev: parseFloat(corpRevenue(corp)) }));
        data.sort((a,b) => s.col==='rev' ? (s.dir==='asc'?a.rev-b.rev:b.rev-a.rev)
                         : s.col==='mkts' ? (s.dir==='asc'?Object.keys(a.corp.shares).length-Object.keys(b.corp.shares).length:Object.keys(b.corp.shares).length-Object.keys(a.corp.shares).length)
                         : 0);
        const rows = data.map(({corp, rev}) => {
            const you = G.playerCode === corp.name;
            const top = Object.entries(corp.shares).sort((a,b)=>b[1]-a[1])[0];
            return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('corp','${corp.id}')">
                <td style="font-size:1.3rem">${corp.ico}</td>
                <td>${corp.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                <td class="ldg-dim">${corp.type}</td>
                <td class="ldg-num">${rev.toFixed(1)}</td>
                <td class="ldg-num">${Object.keys(corp.shares).length}</td>
                <td class="ldg-dim">${top ? (COUNTRIES[top[0]]?.f||top[0])+' '+top[1]+'%' : '—'}</td>
            </tr>`;
        }).join('');
        el.innerHTML = `<table class="ldg-table"><thead><tr>
            <th></th><th>CORPORATION</th><th>SECTOR</th>
            ${th('REVENUE','rev')}${th('MARKETS','mkts')}<th>TOP MARKET</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Revenue = Σ (country GDP × share%)</p>`;

    } else {
        const s = ldgSort.nonstates;
        const data = NSAS.map(nsa => ({ nsa, eco: parseFloat(nsaEcoSize(nsa)) }));
        data.sort((a,b) => s.col==='eco' ? (s.dir==='asc'?a.eco-b.eco:b.eco-a.eco)
                         : s.col==='cnt' ? (s.dir==='asc'?Object.keys(a.nsa.sizes).length-Object.keys(b.nsa.sizes).length:Object.keys(b.nsa.sizes).length-Object.keys(a.nsa.sizes).length)
                         : 0);
        const rows = data.map(({nsa, eco}) => {
            const you = G.playerCode === nsa.name;
            const top = Object.entries(nsa.sizes).sort((a,b)=>b[1]-a[1])[0];
            return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('nsa','${nsa.id}')">
                <td style="font-size:1.3rem">${nsa.ico}</td>
                <td>${nsa.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                <td class="ldg-dim">${nsa.type}</td>
                <td class="ldg-num">${eco.toFixed(1)}</td>
                <td class="ldg-num">${Object.keys(nsa.sizes).length}</td>
                <td class="ldg-dim">${top ? (COUNTRIES[top[0]]?.f||top[0])+' '+Math.round(top[1]*100)+'%' : '—'}</td>
            </tr>`;
        }).join('');
        el.innerHTML = `<table class="ldg-table"><thead><tr>
            <th></th><th>ORGANIZATION</th><th>TYPE</th>
            ${th('ECO-SIZE','eco')}${th('COUNTRIES','cnt')}<th>STRONGEST IN</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Eco-size = 0.1 × Σ (ideological share × country GDP)</p>`;
    }
};

window.showLedgerDetail = function(type, id) {
    ledgerDetail = { type, id };
    renderLedgerDetail();
};

function renderLedgerDetail() {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('lst-' + ledgerSub);
    if (btn) btn.classList.add('active');
    const el = document.getElementById('ldg-content');
    if (!el) return;

    const back = `<button class="ldg-back" onclick="showLedgerTab('${ledgerSub}')">← BACK</button>`;

    if (ledgerDetail.type === 'country') {
        const c = COUNTRIES[ledgerDetail.id];
        const fC = c.faction ? COUNTRIES[c.faction] : null;
        // corps with presence in this country
        const corpRows = CORPS.filter(corp => corp.shares[c.code])
            .map(corp => ({ corp, share: corp.shares[c.code], contrib: c.gdp * corp.shares[c.code] / 100 }))
            .sort((a,b) => b.contrib - a.contrib)
            .map(({corp,share,contrib}) => `<tr>
                <td style="font-size:1.2rem">${corp.ico}</td>
                <td>${corp.name}</td><td class="ldg-dim">${corp.type}</td>
                <td class="ldg-num">${share}%</td>
                <td class="ldg-num">${contrib.toFixed(1)}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="ldg-dim" style="padding:12px">No corporate data</td></tr>';

        // NSAs with presence in this country
        const nsaRows = NSAS.filter(nsa => nsa.sizes[c.code])
            .map(nsa => ({ nsa, size: nsa.sizes[c.code], contrib: 0.1 * nsa.sizes[c.code] * c.gdp }))
            .sort((a,b) => b.contrib - a.contrib)
            .map(({nsa,size,contrib}) => `<tr>
                <td style="font-size:1.2rem">${nsa.ico}</td>
                <td>${nsa.name}</td><td class="ldg-dim">${nsa.type}</td>
                <td class="ldg-num">${Math.round(size*100)}%</td>
                <td class="ldg-num">${contrib.toFixed(1)}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="ldg-dim" style="padding:12px">No ideological data</td></tr>';

        el.innerHTML = `${back}
        <div class="ldg-det-hdr">
            <span style="font-size:2.5rem">${c.f}</span>
            <div>
                <div class="ldg-det-name">${c.name}</div>
                <span class="regime-pill rp-${c.regime}">${c.regime.replace('_',' ')}</span>
                ${fC ? `<span class="ldg-dim" style="margin-left:10px">aligned to ${fC.f} ${fC.name}</span>` : ''}
            </div>
        </div>
        <div class="ldg-det-stats">
            ${[['GDP',c.gdp],['Military',c.military],['Population',c.pop+'M'],['Infrastructure',c.infra+'%'],['Literacy',Math.round(c.lit*100)+'%'],['Internet',Math.round(c.net*100)+'%']].map(([k,v])=>`<div class="dom-stat"><span class="dom-k">${k}</span><span class="dom-v">${v}</span></div>`).join('')}
        </div>
        <div class="ldg-det-section">CORPORATE PRESENCE</div>
        <table class="ldg-table"><thead><tr><th></th><th>CORPORATION</th><th>SECTOR</th><th class="ldg-num">GDP SHARE</th><th class="ldg-num">CONTRIBUTION</th></tr></thead><tbody>${corpRows}</tbody></table>
        <div class="ldg-det-section" style="margin-top:20px">IDEOLOGICAL SPECTRUM</div>
        <table class="ldg-table"><thead><tr><th></th><th>ORGANIZATION</th><th>TYPE</th><th class="ldg-num">POP. SHARE</th><th class="ldg-num">ECO-WEIGHT</th></tr></thead><tbody>${nsaRows}</tbody></table>`;

    } else if (ledgerDetail.type === 'corp') {
        const corp = CORPS.find(c => c.id === ledgerDetail.id);
        const total = parseFloat(corpRevenue(corp));
        const rows = Object.entries(corp.shares)
            .map(([code, share]) => ({ c: COUNTRIES[code], share, contrib: COUNTRIES[code] ? COUNTRIES[code].gdp * share / 100 : 0 }))
            .filter(x => x.c)
            .sort((a,b) => b.contrib - a.contrib)
            .map(({c,share,contrib}) => `<tr>
                <td style="font-size:1.2rem">${c.f}</td>
                <td>${c.name}</td>
                <td class="ldg-num">${share}%</td>
                <td class="ldg-num">${contrib.toFixed(1)}</td>
                <td><div class="ldg-bar"><div class="ldg-bar-fill" style="width:${Math.min(100,contrib/total*100).toFixed(1)}%"></div></div></td>
            </tr>`).join('');
        el.innerHTML = `${back}
        <div class="ldg-det-hdr">
            <span style="font-size:2.5rem">${corp.ico}</span>
            <div><div class="ldg-det-name">${corp.name}</div><span class="ldg-dim">${corp.type} · Total revenue: ${total.toFixed(1)}</span></div>
        </div>
        <div class="ldg-det-section">MARKET PRESENCE</div>
        <table class="ldg-table"><thead><tr><th></th><th>COUNTRY</th><th class="ldg-num">GDP SHARE</th><th class="ldg-num">REVENUE</th><th style="width:160px">SHARE OF TOTAL</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Revenue = country GDP × market share%</p>`;

    } else {
        const nsa = NSAS.find(n => n.id === ledgerDetail.id);
        const total = parseFloat(nsaEcoSize(nsa));
        const rows = Object.entries(nsa.sizes)
            .map(([code, size]) => ({ c: COUNTRIES[code], size, contrib: COUNTRIES[code] ? 0.1 * size * COUNTRIES[code].gdp : 0 }))
            .filter(x => x.c)
            .sort((a,b) => b.contrib - a.contrib)
            .map(({c,size,contrib}) => `<tr>
                <td style="font-size:1.2rem">${c.f}</td>
                <td>${c.name}</td>
                <td class="ldg-num">${Math.round(size*100)}%</td>
                <td class="ldg-num">${contrib.toFixed(1)}</td>
                <td><div class="ldg-bar"><div class="ldg-bar-fill" style="width:${total>0?Math.min(100,contrib/total*100).toFixed(1):0}%"></div></div></td>
            </tr>`).join('');
        el.innerHTML = `${back}
        <div class="ldg-det-hdr">
            <span style="font-size:2.5rem">${nsa.ico}</span>
            <div><div class="ldg-det-name">${nsa.name}</div><span class="ldg-dim">${nsa.type} · Total eco-size: ${total.toFixed(1)}</span></div>
        </div>
        <div class="ldg-det-section">COUNTRY PRESENCE</div>
        <table class="ldg-table"><thead><tr><th></th><th>COUNTRY</th><th class="ldg-num">POP. SHARE</th><th class="ldg-num">ECO-WEIGHT</th><th style="width:160px">SHARE OF TOTAL</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Eco-weight = 0.1 × pop. share × country GDP</p>`;
    }
}

initGlobe({
    onReady:          () => { showScreen('intro'); typeStory(); },
    onClick:          (code, rawName) => {
                          if (code || rawName) onCountryClick(code, rawName);
                          else window.closeCountryPanel();
                      },
    isInteractive:    () => !!G.role,
    isTechOpen:       () => activeTab !== 'earth',
    getCountryLabel:  (code, fallback) => code && COUNTRIES[code]
                          ? `${COUNTRIES[code].f} ${COUNTRIES[code].name}`
                          : (fallback || '?'),
    resolveCountry:   resolveGeoName,
});
