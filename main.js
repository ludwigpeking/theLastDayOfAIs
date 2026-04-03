
import { initGlobe, setGlobeClick } from './globe.js';
import { initTechTree, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, getPolityKey, clearTcSelection, tcCompleteResearch, TC_NM } from './techTree.js';

// Load game data from external JSON files
const [_ideoJson, CORPS, _spJson, _eventsJson, _popJson, _initTechsJson] = await Promise.all([
    fetch('./data/ideo.json').then(r => r.json()),
    fetch('./data/economy.json').then(r => r.json()),
    fetch('./data/softpower.json').then(r => r.json()),
    fetch('./data/events.json').then(r => r.json()),
    fetch('./data/population.json').then(r => r.json()),
    fetch('./data/initial_techs.json').then(r => r.json()),
]);
function _deriveSizes(group) {
    return _ideoJson.columns.filter(c => c.group === group).map(c => ({
        id: c.id, name: c.name, ico: c.ico, type: c.type,
        sizes: Object.fromEntries(
            Object.entries(_ideoJson.data)
                .filter(([k, v]) => k !== '_comment' && v[c.col] > 0)
                .map(([k, v]) => [k, v[c.col]])
        ),
    }));
}
const NSAS            = _deriveSizes('nsa');
const POLITY_FACTIONS = _deriveSizes('pol');

// ═══════════════════════════════════════════
//  GAME DATA
// ═══════════════════════════════════════════

const STORY_INTRO = `The emergence of Artificial General Intelligence presents a transformative shock to the established power structures of modern human communities.

Five archetypes compete: Democracies struggle to maintain institutional legitimacy while competing economically. Authoritarian regimes deploy predictive AI for stability. Corporate Sovereigns build empires that rival nation-states. Non-State Actors wield ideology as a weapon from the shadows.

The "AI Security Dilemma" forces all parties to accelerate — the fear that if an adversary gains autonomous capabilities first, it poses an existential threat. The destination of political evolution under AGI appears to be a recursive loop toward authoritarian technocracy.

Choose your role. Shape the outcome.`;

// GDP = pop * sqrt(infra) * lit^4 * internet * (1+techBuff)
// military = GDP / ideologyEntropy * (1+techBuff)
function calcGdp(pop, infra, lit, internet, techBuff = 0) {
    return +(pop * infra * Math.pow(lit, 4) * internet * (1 + techBuff)).toFixed(1);
}

// ═══════════════════════════════════════════
//  SIMULATION CONSTANTS
// ═══════════════════════════════════════════
const SIM = {
    TECH_BUFF_PER_TECH: 0,      // removed — buffs come only from tech effects
    DEFAULT_ENTROPY: 10,         // ideology entropy denominator for military
    BASE_INCOME: { major: 100, minor: 60, tech: 80, nsa: 50 },
    SP_DRIFT_RATE: 0.004,        // regime drift per unit soft power differential per turn
    WAR_NOISE: 0.30,             // ±30% randomness in war outcomes
    REGIME_VALUES: { anarcho_liberal: 0, democracy: 1, authoritarian: 2, totalitarian: 3 },
    REGIME_NAMES: ['anarcho_liberal','democracy','authoritarian','totalitarian'],
    // Ideology buffs: multiplied by entity's share in the country each turn
    // Keys match ideo.json column ids
    IDEOLOGY_BUFFS: {
        totalitarian:  { social_cost: 0.25, mil_cost: -0.50 },
        authoritarian: { social_cost: 0.35, mil_cost: -1.00 },
        democracy:     { social_cost: 0.20, soft_power: 1.50 },
        alib:          { social_cost: -0.10, soft_power: 2.00 },
        catholic:      { social_cost: 0.30, soft_power: 0.50 },
        buddhist:      { social_cost: 0.50, mil_cost: -0.70, soft_power: 2.00 },
        islamic:       { social_cost: 0.20 },
        green:         { gdp_penalty: 5.0, soft_power: 4.00 },
        alqaeda:       { mil_cost: -6.00, surv_cost: 10.00 },
        wagner:        { mil_cost: -6.00 },
        opensoc:       { soft_power: 8.00 },

        mars:          { soft_power: 4.00 },

    },
};

// Countries
const COUNTRIES = {
  USA: { code:'USA', name:'United States',   f:'🇺🇸', regime:'democracy',      type:'major', faction:null,  pop:341,   infra:88, lit:0.99, net:0.95 },
  CHN: { code:'CHN', name:'China',           f:'🇨🇳', regime:'authoritarian',  type:'major', faction:null,  pop:1410,  infra:81, lit:0.97, net:0.25 },
  IND: { code:'IND', name:'India',           f:'🇮🇳', regime:'democracy',      type:'major', faction:null,  pop:1430,  infra:62, lit:0.79, net:0.58 },
  EU:  { code:'EU',  name:'European Union',  f:'🇪🇺', regime:'democracy',      type:'major', faction:null,  pop:449,   infra:83, lit:0.98, net:0.81 },
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

// Pre-compute GDP; military size set to reflect ~2025 reality (scaled budget index)
const INIT_MIL = {
    USA: 850, CHN: 290, IND: 85, EU: 250, RUS: 110, UKR: 35,
    BRA: 22, JPN: 55, GBR: 75, CAN: 27, KOR: 48, SAU: 75,
    AUS: 32, PRK: 40, VNM: 8, ISR: 24, IRN: 18, TWN: 19,
    MEX: 8, IDN: 10, PAK: 12, TUR: 20, EGY: 5, NGA: 3,
    BGD: 4, ETH: 2, PHL: 5, COD: 1, SGP: 12, VUT: 0.1,
};
for (const c of Object.values(COUNTRIES)) {
    c.gdp = calcGdp(c.pop, c.infra, c.lit, c.net);
    c.military = INIT_MIL[c.code] ?? +(c.gdp / 10).toFixed(1);
    c.milSize = c.military;
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
const NSA_LIST = ['Catholic Church','Islamic Cooperation Org.','Buddhist Networks','Open Society (Soros)','The Mars Society','Greenpeace','Wagner Group','Al-Qaeda'];


// Return live stats for a country code, falling back to static COUNTRIES
function liveC(code) {
    const base = COUNTRIES[code];
    if (!base) return null;
    const cs = G.cs[code];
    if (!cs) return base;
    return {
        ...base,
        gdp:      cs.gdp,
        techOutput: cs.techOutput,
        military: cs.military,
        milSize:  cs.milSize,
        infra:    cs.infra,
        lit:      cs.lit,
        net:      cs.net,
        pop:      cs.pop,
        regime:   cs.regime,
        faction:  G.faction[code] ?? base.faction,
    };
}

function liveShares(corp) {
    return G.corpShares[corp.name] || corp.shares;
}
function liveNsaSizes(nsa) {
    return G.nsaSizes[nsa.id] || nsa.sizes;
}
function livePolSizes(fac) {
    return G.polSizes?.[fac.id] || fac.sizes;
}

function corpRevenue(corp) {
    return Object.entries(liveShares(corp)).reduce((s,[k,sh]) => {
        const c = liveC(k);
        return c ? s + c.gdp * sh / 100 : s;
    }, 0).toFixed(1);
}
function nsaEcoSize(nsa) {
    return (0.1 * Object.entries(liveNsaSizes(nsa)).reduce((s,[k,sz]) => {
        const c = liveC(k);
        return c ? s + sz * c.gdp : s;
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

const ALL_EVENTS = _eventsJson;
const SCRIPTED_EVENTS = ALL_EVENTS.filter(e => e.turn !== undefined);
const RANDOM_EVENTS = ALL_EVENTS.filter(e => e.random);
const TECH_EVENTS = ALL_EVENTS.filter(e => !e.turn && !e.random);
const EVENT_STATE = {};
ALL_EVENTS.forEach(e => { EVENT_STATE[e.id] = { fired: false, turn: null }; });

// ═══════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════
const G = {
    turn: 1, role: null, roleName: '', playerCode: '', regime: 'democracy',
    pp: 100, techs: new Set(), selectedCode: null, agi: 15, log: [],
    cs: {}, sp: {}, faction: {},
    income: 0, expenses: 0, boycotts: {}, corpShares: {}, nsaSizes: {},
    actionLog: [], // {turn, actor, actorType, action, effects}
    techBuffs: { tech_buff: 0, gdp_buff: 0, mil_buff: 0 },
    researching: [], // [{id, progress, cost}, ...]
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
    // Load initial techs for player's role
    let initTechs = [];
    if (pickedRole === 'major' || pickedRole === 'minor') {
        initTechs = _initTechsJson.countries[pickedEntity] || [];
    } else if (pickedRole === 'tech') {
        initTechs = _initTechsJson.corps[pickedEntity] || [];
    } else if (pickedRole === 'nsa') {
        initTechs = _initTechsJson.nsas[pickedEntity] || [];
    }
    G.techs = new Set(initTechs);
    // Apply tech buffs from initial techs
    G.techBuffs = { tech_buff: 0, gdp_buff: 0, mil_buff: 0 };
    const polKey = pickedRole === 'tech' ? 'corp' : pickedRole === 'nsa' ? 'ns' : (COUNTRIES[pickedEntity]?.regime === 'authoritarian' || COUNTRIES[pickedEntity]?.regime === 'totalitarian') ? 'auth' : 'dem';
    for (const tid of initTechs) {
        const tech = TC_NM[tid];
        if (!tech?.effects?.[polKey]) continue;
        const fx = tech.effects[polKey];
        for (const k of ['tech_buff','gdp_buff','mil_buff']) {
            if (fx[k]) G.techBuffs[k] += fx[k];
        }
    }
    initCountryState();
    // Pre-compute all country stats (GDP, military, tech output, entropy) at game start
    for (const code of Object.keys(COUNTRIES)) recomputeCountryStats(code);
    calcPlayerIncome(); // populate G.income/G.expenses for domestic tab
    showScreen(null);
    document.getElementById('hud').style.display='block';
    updateHUD(); renderTechTree();
    addLog(`You are ${G.roleName}. The simulation begins — Year 2025.`,'hi');
    if (G.techs.size > 0) addLog(`Starting with ${G.techs.size} researched technologies.`);
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

// Structured action log for the ACTION LOG tab
function logAction(actor, actorType, action, effects) {
    G.actionLog.push({ turn: G.turn, actor, actorType, action, effects: effects || '' });
}

// ═══════════════════════════════════════════
//  COUNTRY PANEL
// ═══════════════════════════════════════════
function onCountryClick(code, rawName){
    G.selectedCode=code;
    document.getElementById('panel-country').classList.remove('off');
    const c=code?COUNTRIES[code]:null;
    const cs = G.cs[code] || c;
    const liveRegime = cs?.regime || c?.regime || '';
    document.getElementById('cn-name').textContent=c?`${c.f} ${c.name}`:(rawName||'?');
    const rb=document.getElementById('cn-regime');
    rb.textContent=liveRegime.replace('_',' '); rb.className=`regime-pill rp-${liveRegime}`;
    const stats=document.getElementById('cn-stats');
    if(c){
        const liveFaction = G.faction[code] ?? c.faction;
        const fac=liveFaction?`<span class="stat-faction">${COUNTRIES[liveFaction]?.f??''} ${COUNTRIES[liveFaction]?.name??liveFaction} bloc</span>`:`<span class="stat-ind">Independent</span>`;
        stats.innerHTML=`
            <div class="stat"><span class="stat-k">Type</span><span class="stat-v">${c.type}</span></div>
            <div class="stat"><span class="stat-k">Faction</span><span class="stat-v">${fac}</span></div>
            <div class="stat"><span class="stat-k">Population</span><span class="stat-v">${cs?.pop??c.pop}M</span></div>
            <div class="stat"><span class="stat-k">GDP</span><span class="stat-v">${(cs?.gdp??c.gdp).toLocaleString()}</span></div>
            <div class="stat"><span class="stat-k">Military</span><span class="stat-v">${(cs?.military??c.military).toLocaleString()}</span></div>
            <div class="stat"><span class="stat-k">Infrastructure</span><span class="stat-v">${cs?.infra??c.infra}</span></div>
            <div class="stat"><span class="stat-k">Literacy</span><span class="stat-v">${((cs?.lit??c.lit)*100).toFixed(0)}%</span></div>
            <div class="stat"><span class="stat-k">Internet</span><span class="stat-v">${((cs?.net??c.net)*100).toFixed(0)}%</span></div>
            <div class="stat"><span class="stat-k">Tech Output</span><span class="stat-v">${cs?.techOutput?.toLocaleString()??'—'}</span></div>`;
    } else {
        stats.innerHTML=`<div class="stat-na">No data for this territory.</div>`;
    }
    renderActions(code);
}

function refreshCountryPanel(code) {
    if (!code || document.getElementById('panel-country').classList.contains('off')) return;
    const c = COUNTRIES[code];
    if (!c) return;
    const cs = G.cs[code] || c;
    const liveRegime = cs?.regime || c.regime;
    const rb = document.getElementById('cn-regime');
    rb.textContent = liveRegime.replace('_',' '); rb.className = `regime-pill rp-${liveRegime}`;
    const liveFaction = G.faction[code] ?? c.faction;
    const fac = liveFaction
        ? `<span class="stat-faction">${COUNTRIES[liveFaction]?.f??''} ${COUNTRIES[liveFaction]?.name??liveFaction} bloc</span>`
        : `<span class="stat-ind">Independent</span>`;
    document.getElementById('cn-stats').innerHTML = `
        <div class="stat"><span class="stat-k">Type</span><span class="stat-v">${c.type}</span></div>
        <div class="stat"><span class="stat-k">Faction</span><span class="stat-v">${fac}</span></div>
        <div class="stat"><span class="stat-k">Population</span><span class="stat-v">${cs?.pop??c.pop}M</span></div>
        <div class="stat"><span class="stat-k">GDP</span><span class="stat-v">${(cs?.gdp??c.gdp).toLocaleString()}</span></div>
        <div class="stat"><span class="stat-k">Military</span><span class="stat-v">${(cs?.military??c.military).toLocaleString()}</span></div>
        <div class="stat"><span class="stat-k">Infrastructure</span><span class="stat-v">${cs?.infra??c.infra}</span></div>
        <div class="stat"><span class="stat-k">Literacy</span><span class="stat-v">${((cs?.lit??c.lit)*100).toFixed(0)}%</span></div>
        <div class="stat"><span class="stat-k">Internet</span><span class="stat-v">${((cs?.net??c.net)*100).toFixed(0)}%</span></div>
        <div class="stat"><span class="stat-k">Tech Output</span><span class="stat-v">${cs?.techOutput?.toLocaleString()??'—'}</span></div>`;
}

window.closeCountryPanel=function(){
    document.getElementById('panel-country').classList.add('off');
    setGlobeClick(0); G.selectedCode=null;
};

function renderActions(code){
    const el=document.getElementById('cn-actions');
    const acts=ACTIONS[G.regime]||[];
    const isSelf=code&&code===G.playerCode;
    const relevant=acts.filter(a=>isSelf ? a.t==='self' : a.t==='country');
    const selfActs=isSelf?[]:acts.filter(a=>a.t==='self');
    if(!relevant.length && !selfActs.length){el.innerHTML='';return;}
    const hdr=isSelf?'YOUR ACTIONS':'ACTIONS AGAINST '+( COUNTRIES[code]?.name||code);
    el.innerHTML=`<div class="act-hdr">${hdr}</div>`+
        relevant.slice(0,8).map(a=>{
            const ok=G.pp>=a.cost;
            return `<div class="act-btn${ok?'':' cant'}" ${ok?`onclick="doAction('${a.id}','${code||''}')"`:''} title="${a.l}">
                <span>${a.l}</span><span class="act-cost">${a.cost} PP</span>
            </div>`;
        }).join('')+
        (!isSelf && selfActs.length ? '<div class="act-hdr act-hdr-self">YOUR ACTIONS</div>'+selfActs.slice(0,5).map(a=>{
            const ok=G.pp>=a.cost;
            return `<div class="act-btn${ok?'':' cant'}" ${ok?`onclick="doAction('${a.id}','${G.playerCode||''}')"`:''} title="${a.l}">
                <span>${a.l}</span><span class="act-cost">${a.cost} PP</span>
            </div>`;
        }).join('') : '');
}

window.doAction=function(actId,targetCode){
    const act=Object.values(ACTIONS).flat().find(a=>a.id===actId);
    if(!act||G.pp<act.cost) return;
    G.pp-=act.cost;
    const tname=targetCode&&COUNTRIES[targetCode]?`${COUNTRIES[targetCode].f} ${COUNTRIES[targetCode].name}`:(targetCode||'target');
    addLog(act.msg.replace('$T',tname), actId.includes('war')?'crit':'hi');
    logAction(G.roleName, 'player', act.l + (targetCode && targetCode !== G.playerCode ? ' → ' + tname : ''), `−${act.cost} PP`);
    applyActionEffect(actId, targetCode);
    updateHUD();
    refreshCountryPanel(G.selectedCode);
    renderActions(G.selectedCode);
    if(activeTab==='domestic') renderDomestic();
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
    document.getElementById('board-actionlog').classList.add('off');
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
    } else if (tab === 'actionlog') {
        document.getElementById('board-actionlog').classList.remove('off');
        renderActionLog();
    } else {
        stopSpeech(); clearTcSelection();
    }
};
// Keep toggleTech as alias for backward compatibility with any remaining calls
window.toggleTech = function() { showTab(activeTab === 'tech' ? 'earth' : 'tech'); };

function renderTechTree() { if(activeTab==='tech'){ tcDraw(); tcUpdateCard(); } }


// ═══════════════════════════════════════════
//  SIMULATION ENGINE
// ═══════════════════════════════════════════

function calcIdeologyMultipliers(code) {
    const r = { gdp_penalty: 0, social_cost: 0, mil_cost: 0, surv_cost: 0, soft_power: 0 };
    for (const nsa of NSAS) {
        const share = (liveNsaSizes(nsa))[code] || 0;
        if (!share) continue;
        const b = SIM.IDEOLOGY_BUFFS[nsa.id];
        if (!b) continue;
        for (const k of Object.keys(b)) r[k] = (r[k] || 0) + b[k] * share;
    }
    for (const fac of POLITY_FACTIONS) {
        const share = livePolSizes(fac)[code] || 0;
        if (!share) continue;
        const b = SIM.IDEOLOGY_BUFFS[fac.id];
        if (!b) continue;
        for (const k of Object.keys(b)) r[k] = (r[k] || 0) + b[k] * share;
    }
    return r;
}

function calcTechBuff() {
    const gdpBuff = (G.techBuffs?.gdp_buff || 0) / 100;
    return Math.min(2.0, gdpBuff);
}

// Shannon entropy of ideology shares in a country (higher = more fragmented)
function calcIdeologyEntropy(code) {
    const shares = [];
    for (const nsa of NSAS) {
        const s = (liveNsaSizes(nsa))[code] || 0;
        if (s > 0) shares.push(s);
    }
    for (const fac of POLITY_FACTIONS) {
        const s = livePolSizes(fac)[code] || 0;
        if (s > 0) shares.push(s);
    }
    const total = shares.reduce((a, b) => a + b, 0);
    const unaffiliated = Math.max(0, 1 - total);
    if (unaffiliated > 0) shares.push(unaffiliated);
    let entropy = 0;
    for (const s of shares) {
        if (s > 0) entropy -= s * Math.log(s);
    }
    return Math.max(1, entropy * SIM.DEFAULT_ENTROPY);
}

// Tech output for a country: sum(sector GDP * sector tech multiplier) * (1 + buff)
function calcCountryTechOutput(code, gdp, techBuff) {
    // Use economy.json sectors: "Government", "Minor Corps & SMEs", and the rest are major corps
    const govCorp = CORPS.find(c => c.type === 'Public Sector');
    const minorCorp = CORPS.find(c => c.type === 'Private Sector');
    const govShare = (govCorp ? (liveShares(govCorp))[code] || 0 : 0) / 100;
    const minorShare = (minorCorp ? (liveShares(minorCorp))[code] || 0 : 0) / 100;
    let majorShare = 0;
    for (const corp of CORPS) {
        if (corp === govCorp || corp === minorCorp) continue;
        majorShare += ((liveShares(corp))[code] || 0) / 100;
    }
    // sector tech efficiency: gov 1%, major corps 10%, minor/SME 3%
    let techOut = gdp * govShare * 0.01
                + gdp * majorShare * 0.1
                + gdp * minorShare * 0.03;
    const techOutputBuff = (code === G.playerCode && G.techBuffs?.tech_buff) ? G.techBuffs.tech_buff / 100 : 0;
    return +(techOut * (1 + techBuff + techOutputBuff)).toFixed(1);
}

// Tech output for a corporation: sum(country GDP * market share) * 0.15 * (1 + buff)
function calcCorpTechOutput(corp) {
    const techBuff = G.role === 'tech' && G.roleName === corp.name ? calcTechBuff() : 0;
    const shares = liveShares(corp);
    let total = 0;
    for (const [code, sh] of Object.entries(shares)) {
        const gdp = G.cs[code]?.gdp ?? COUNTRIES[code]?.gdp ?? 0;
        total += gdp * sh / 100;
    }
    return +(total * 0.15 * (1 + techBuff)).toFixed(1);
}

// Tech output for a non-state actor: sum(country GDP * follower share) * 0.03 * (1 + buff)
function calcNsaTechOutput(nsa) {
    const techBuff = G.role === 'nsa' && G.roleName === nsa.name ? calcTechBuff() : 0;
    const sizes = liveNsaSizes(nsa);
    let total = 0;
    for (const [code, sz] of Object.entries(sizes)) {
        const gdp = G.cs[code]?.gdp ?? COUNTRIES[code]?.gdp ?? 0;
        total += gdp * sz;
    }
    return +(total * 0.03 * (1 + techBuff)).toFixed(1);
}

function getPlayerTechOutput() {
    if (G.role === 'major' || G.role === 'minor') {
        return G.cs[G.playerCode]?.techOutput || 0;
    } else if (G.role === 'tech') {
        const corp = CORPS.find(c => c.name === G.roleName);
        return corp ? calcCorpTechOutput(corp) : 0;
    } else if (G.role === 'nsa') {
        const nsa = NSAS.find(n => n.name === G.roleName);
        return nsa ? calcNsaTechOutput(nsa) : 0;
    }
    return 0;
}

function recomputeCountryStats(code) {
    const cs = G.cs[code];
    if (!cs) return;
    const isPlayer = code === G.playerCode;
    const techBuff = isPlayer ? calcTechBuff() : 0;
    const mults = calcIdeologyMultipliers(code);
    const boycottPenalty = G.boycotts[code] || 0;
    const totalBuff = techBuff - mults.gdp_penalty - boycottPenalty;
    cs.gdp = calcGdp(cs.pop, cs.infra, cs.lit, cs.net, totalBuff);
    cs.ideoEntropy = calcIdeologyEntropy(code);
    cs.techOutput = calcCountryTechOutput(code, cs.gdp, techBuff);
    cs.military = cs.milSize;
}

function initSoftPowerMatrix() {
    const spCountries = _spJson.countries;
    for (const from of Object.keys(COUNTRIES)) {
        G.sp[from] = G.sp[from] || {};
        const fi = spCountries.indexOf(from);
        const row = _spJson.data[from];
        for (const to of Object.keys(COUNTRIES)) {
            if (from === to) continue;
            const ti = spCountries.indexOf(to);
            if (row && ti >= 0) {
                G.sp[from][to] = row[ti];
            } else {
                G.sp[from][to] = 5;
            }
        }
    }
}

function initCountryState() {
    G.cs = {}; G.sp = {}; G.faction = {}; G.boycotts = {}; G.corpShares = {}; G.nsaSizes = {}; G.polSizes = {};
    for (const corp of CORPS) G.corpShares[corp.name] = { ...corp.shares };
    for (const nsa of NSAS) G.nsaSizes[nsa.id] = { ...nsa.sizes };
    for (const fac of POLITY_FACTIONS) G.polSizes[fac.id] = { ...fac.sizes };
    for (const code of Object.keys(COUNTRIES)) {
        const c = COUNTRIES[code];
        G.cs[code] = { pop: c.pop, infra: c.infra, lit: c.lit, net: c.net,
                       regime: c.regime, gdp: c.gdp, military: c.military, milSize: c.milSize };
        G.faction[code]    = c.faction;
    }
    initSoftPowerMatrix();
}

function regimeVal(regime) {
    return SIM.REGIME_VALUES[regime] ?? 1;
}
function regimeName(val) {
    const v = Math.max(0, Math.min(3, Math.round(val)));
    return SIM.REGIME_NAMES[v];
}

function ideologyPushToward(code, targetRegime, strength) {
    const cs = G.cs[code];
    if (!cs) return;
    const cur = regimeVal(cs.regime);
    const tgt = regimeVal(targetRegime);
    const next = cur + (tgt - cur) * strength;
    cs.regime = regimeName(next);
    if (code === G.playerCode) G.regime = cs.regime;
}

function simSoftPowerDrift() {
    const DRIFT_RATE = 0.1;
    for (const to of Object.keys(COUNTRIES)) {
        const cs = G.cs[to];
        if (!cs) continue;
        const netOpenness = cs.net || 0;
        if (netOpenness <= 0) continue;

        // Accumulate drift per ideology from all foreign soft power sources
        const drifts = {}; // id -> drift amount
        for (const from of Object.keys(COUNTRIES)) {
            if (from === to) continue;
            const sp = (G.sp[from]?.[to] || 0) / 100; // convert % to fraction
            if (sp <= 0) continue;

            // Gather source country's ideology shares
            for (const nsa of NSAS) {
                const srcShare = (liveNsaSizes(nsa))[from] || 0;
                if (srcShare > 0) drifts[nsa.id] = (drifts[nsa.id] || 0) + sp * srcShare;
            }
            for (const fac of POLITY_FACTIONS) {
                const srcShare = (livePolSizes(fac))[from] || 0;
                if (srcShare > 0) drifts[fac.id] = (drifts[fac.id] || 0) + sp * srcShare;
            }
        }

        // Apply drift * internet openness * 0.1 to target country's ideology shares
        for (const nsa of NSAS) {
            const d = (drifts[nsa.id] || 0) * netOpenness * DRIFT_RATE;
            if (d > 0.0001) {
                const cur = G.nsaSizes[nsa.id][to] || 0;
                G.nsaSizes[nsa.id][to] = Math.min(0.95, cur + d);
            }
        }
        for (const fac of POLITY_FACTIONS) {
            const d = (drifts[fac.id] || 0) * netOpenness * DRIFT_RATE;
            if (d > 0.0001) {
                const cur = G.polSizes[fac.id][to] || 0;
                G.polSizes[fac.id][to] = Math.min(0.95, cur + d);
            }
        }

        // Normalize: total ideology shares must not exceed 1.0
        let total = 0;
        for (const nsa of NSAS) total += G.nsaSizes[nsa.id][to] || 0;
        for (const fac of POLITY_FACTIONS) total += G.polSizes[fac.id][to] || 0;
        if (total > 1.0) {
            const scale = 1.0 / total;
            for (const nsa of NSAS) if (G.nsaSizes[nsa.id][to]) G.nsaSizes[nsa.id][to] *= scale;
            for (const fac of POLITY_FACTIONS) if (G.polSizes[fac.id][to]) G.polSizes[fac.id][to] *= scale;
        }

        // Update regime based on dominant polity faction
        let maxFac = null, maxShare = 0;
        for (const fac of POLITY_FACTIONS) {
            const s = G.polSizes[fac.id][to] || 0;
            if (s > maxShare) { maxShare = s; maxFac = fac; }
        }
        if (maxFac) {
            const newRegime = maxFac.id === 'alib' ? 'anarcho_liberal' : maxFac.id;
            if (newRegime !== cs.regime) {
                if (to === G.playerCode) {
                    addLog(`Ideology shift: ${G.roleName} drifts toward ${newRegime.replace('_',' ')}.`, 'hi');
                    G.regime = newRegime;
                }
                cs.regime = newRegime;
            }
        }
    }
}

function resolveWar(attacker, defender, isTotal) {
    const atkCs = G.cs[attacker], defCs = G.cs[defender];
    if (!atkCs || !defCs) return;
    const atkMil = atkCs.military * (isTotal ? 1.6 : 1.0);
    const defMil = defCs.military;
    const noise  = 1 + (Math.random() - 0.5) * 2 * SIM.WAR_NOISE;
    const atkWins = atkMil * noise > defMil;
    const af = COUNTRIES[attacker]?.f || attacker, df = COUNTRIES[defender]?.f || defender;
    const an = COUNTRIES[attacker]?.name || attacker, dn = COUNTRIES[defender]?.name || defender;
    if (atkWins) {
        defCs.infra    = Math.max(10, defCs.infra - 10);
        defCs.milSize  = Math.max(1,  +(defCs.milSize * 0.65).toFixed(1));
        defCs.military = defCs.milSize;
        ideologyPushToward(defender, atkCs.regime, 0.25);
        recomputeCountryStats(defender);
        addLog(`⚔️ VICTORY: ${af} ${an} defeated ${df} ${dn}. Infra −10, military crushed.`, 'crit');
        if (isTotal) {
            atkCs.infra = Math.min(99, atkCs.infra + 2);
        }
    } else {
        atkCs.infra    = Math.max(10, atkCs.infra - 6);
        atkCs.milSize  = Math.max(1,  +(atkCs.milSize * 0.75).toFixed(1));
        atkCs.military = atkCs.milSize;
        recomputeCountryStats(attacker);
        addLog(`💀 DEFEAT: ${af} ${an} campaign against ${df} ${dn} failed. Infra −6, military weakened.`, 'crit');
    }
}

function applyActionEffect(actId, targetCode) {
    const pc = G.playerCode;
    const tgt = targetCode || pc;
    const tcs = G.cs[tgt], pcs = G.cs[pc];
    switch (actId) {
        case 'inv_ai':
            G.agi = Math.min(100, G.agi + 2);
            break;
        case 'inv_inf':
            if (pcs) { pcs.infra = Math.min(99, pcs.infra + 3); recomputeCountryStats(pc); }
            break;
        case 'inv_lit':
            if (pcs) { pcs.lit = Math.min(0.99, pcs.lit + 0.02); recomputeCountryStats(pc); }
            break;
        case 'def_cyber':
            // Harden infrastructure — boost infra resilience
            if (pcs) { pcs.infra = Math.min(99, pcs.infra + 1); recomputeCountryStats(pc); }
            break;
        case 'espion':
            // Steal intelligence — reduce target infra
            if (tcs) { tcs.infra = Math.max(10, tcs.infra - 1); recomputeCountryStats(tgt); }
            break;
        case 'cyber_atk':
            // Damage target infrastructure
            if (tcs) {
                tcs.infra = Math.max(10, tcs.infra - 3);
                recomputeCountryStats(tgt);
            }
            break;
        case 'info_war':
            // Weaken target's soft power influence on others
            if (G.sp[tgt]) {
                for (const k of Object.keys(G.sp[tgt])) G.sp[tgt][k] = Math.max(0, G.sp[tgt][k] - 5);
            }
            break;
        case 'softpow':
            if (pc && tgt && pc !== tgt) {
                G.sp[pc] = G.sp[pc] || {};
                G.sp[pc][tgt] = Math.min(100, (G.sp[pc][tgt] || 5) + 6);
            }
            break;
        case 'influence':
            if (G.role === 'tech') {
                const corp = CORPS.find(c => c.name === G.playerCode);
                if (corp && tgt) {
                    G.corpShares[corp.name][tgt] = Math.min(60, (G.corpShares[corp.name][tgt] || 0) + 1);
                }
            } else if (pc && tgt && pc !== tgt) {
                G.sp[pc] = G.sp[pc] || {};
                G.sp[pc][tgt] = Math.min(100, (G.sp[pc][tgt] || 5) + 10);
            }
            break;
        case 'boycott':
            G.boycotts[tgt] = (G.boycotts[tgt] || 0) + 0.05; // 5% GDP hit next tick
            if (tcs) recomputeCountryStats(tgt);
            break;
        case 'puppet':
            if (tgt && COUNTRIES[tgt]?.type === 'minor') {
                G.faction[tgt] = pc;
                addLog(`${COUNTRIES[tgt]?.f} ${COUNTRIES[tgt]?.name} faction shifted toward ${G.roleName}.`, 'hi');
            }
            break;
        case 'internet':
            if (pcs) { pcs.net = Math.max(0.05, pcs.net - 0.10); recomputeCountryStats(pc); }
            break;
        case 'ideology':
            if (pc && tgt && pc !== tgt) {
                G.sp[pc] = G.sp[pc] || {};
                G.sp[pc][tgt] = Math.min(100, (G.sp[pc][tgt] || 5) + 12);
            }
            break;
        case 'disrupt':
            // Sabotage — damage target infrastructure
            if (tcs) {
                tcs.infra = Math.max(10, tcs.infra - 3);
                recomputeCountryStats(tgt);
            }
            break;
        case 'inv_ctry':
            if (tcs) {
                tcs.infra = Math.min(99, tcs.infra + 2);
                recomputeCountryStats(tgt);
            }
            if (G.role === 'tech') {
                const corp = CORPS.find(c => c.name === G.playerCode);
                if (corp && tgt) {
                    G.corpShares[corp.name][tgt] = Math.min(60, (G.corpShares[corp.name][tgt] || 0) + 2);
                }
            }
            break;
        case 'league':
            // Democratic coalition — boost SP to all democracies
            for (const code of Object.keys(COUNTRIES)) {
                if (COUNTRIES[code].regime === 'democracy' || G.cs[code]?.regime === 'democracy') {
                    G.sp[pc] = G.sp[pc] || {};
                    G.sp[pc][code] = Math.min(100, (G.sp[pc][code] || 5) + 5);
                }
            }
            break;
        case 'war': case 'twar':
            if (tgt && tgt !== pc) resolveWar(pc, tgt, actId === 'twar');
            break;
        case 'priv_army':
            // Build private military force
            if (G.cs[pc]) { G.cs[pc].milSize = +(G.cs[pc].milSize * 1.3).toFixed(1); G.cs[pc].military = G.cs[pc].milSize; }
            break;
    }
}

function calcPlayerIncome() {
    const bd = { govIncome: 0, govShare: 0, marketIncome: 0, influenceIncome: 0,
                 milExp: 0, milMaintenance: 0, techBonus: 0,
                 milCostMult: 0, milSize: 0, details: [] };
    if (!G.playerCode) {
        bd.govIncome = SIM.BASE_INCOME[G.role] || 50;
        G.income = bd.govIncome; G.expenses = 0; G.incomeBreakdown = bd;
        return bd.govIncome;
    }
    let income = 0, expenses = 0;
    if (G.role === 'major' || G.role === 'minor') {
        const cs = G.cs[G.playerCode];
        if (cs) {
            const mults = calcIdeologyMultipliers(G.playerCode);
            bd.govShare = Math.max(0, mults.social_cost);
            bd.govIncome = Math.round(cs.gdp * bd.govShare);
            income = cs.gdp * bd.govShare;
            const techBuff = calcTechBuff();
            bd.milSpending = +(cs.gdp / (cs.ideoEntropy || SIM.DEFAULT_ENTROPY) * (1 + techBuff)).toFixed(1);
            bd.ideoEntropy = cs.ideoEntropy || SIM.DEFAULT_ENTROPY;
            bd.milSize = cs.milSize;
            const milBuff = (G.techBuffs?.mil_buff || 0) / 100;
            bd.milMaintenance = Math.round(cs.milSize * 0.14 * Math.max(0.1, 1 - milBuff));
            bd.milExp = Math.round(bd.milSpending);
            expenses = bd.milSpending;
        }
    } else if (G.role === 'tech') {
        const corp = CORPS.find(c => c.name === G.roleName);
        if (corp) {
            const entries = Object.entries(liveShares(corp));
            let marketTotal = 0;
            entries.forEach(([k, sh]) => {
                const gdp = G.cs[k]?.gdp ?? COUNTRIES[k]?.gdp ?? 0;
                const contrib = gdp * sh / 100;
                if (contrib > 0.5) bd.details.push({ label: `${COUNTRIES[k]?.f??k} ${sh}% share`, value: Math.round(contrib) });
                marketTotal += contrib;
            });
            bd.marketIncome = Math.round(marketTotal);
            income = marketTotal;
        }
    } else if (G.role === 'nsa') {
        const nsa = NSAS.find(n => n.name === G.roleName);
        if (nsa) {
            const entries = Object.entries(liveNsaSizes(nsa));
            let infTotal = 0;
            entries.forEach(([k, sz]) => {
                const gdp = G.cs[k]?.gdp ?? COUNTRIES[k]?.gdp ?? 0;
                const contrib = sz * gdp * 0.1;
                if (contrib > 0.5) bd.details.push({ label: `${COUNTRIES[k]?.f??k} ${(sz*100).toFixed(0)}%`, value: Math.round(contrib) });
                infTotal += contrib;
            });
            bd.influenceIncome = Math.round(infTotal);
            income = infTotal;
        }
    }
    G.income   = Math.round(income);
    G.expenses = Math.round(expenses);
    G.incomeBreakdown = bd;
    return Math.max(10, G.income - G.expenses);
}

// ─── NPC AI ─────────────────────────────────────────────────────────────────
// Utility: pick a random element from array
function rndPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// Other country codes (excluding player and self)
function otherCountries(selfCode) {
    return Object.keys(COUNTRIES).filter(k => k !== selfCode && k !== G.playerCode);
}
// Weighted random choice: [{item, weight}]
function weightedPick(choices) {
    const total = choices.reduce((s,c) => s + c.weight, 0);
    if (!total) return choices[0];
    let r = Math.random() * total;
    for (const c of choices) { r -= c.weight; if (r <= 0) return c; }
    return choices[choices.length-1];
}

// --- NPC STATES ---
// Goals by regime:
//   totalitarian: maximize control, military; suppress others; expand puppet states
//   authoritarian: grow GDP/military, expand soft power, occasional war vs weaker
//   democracy: grow GDP/infra/literacy; form coalitions; defensive ops only
//   anarcho_liberal: invest in infra; spread soft power; avoid war
// --- NPC state each turn gets a "budget" of 1-2 actions based on GDP tier
function npcStateAct(code) {
    const cs = G.cs[code];
    if (!cs) return;
    const regime = cs.regime;
    const gdpTier = cs.gdp > 5000 ? 3 : cs.gdp > 1000 ? 2 : 1;
    const actions = Math.min(gdpTier, 2); // 1 or 2 actions per turn
    const others = otherCountries(code);

    for (let i = 0; i < actions; i++) {
        const opts = [];
        const cname = `${COUNTRIES[code]?.f} ${COUNTRIES[code]?.name}`;

        // Universal: invest in infrastructure if low
        if (cs.infra < 70) opts.push({ weight: 4, fn: () => {
            cs.infra = Math.min(99, cs.infra + 2); recomputeCountryStats(code);
            logAction(cname, 'state', 'Invest infrastructure', 'infra +2');
        }});
        // Universal: soft power campaign
        opts.push({ weight: 2, fn: () => {
            const target = rndPick(others);
            G.sp[code] = G.sp[code] || {};
            G.sp[code][target] = Math.min(100, (G.sp[code][target] || 5) + 4);
            logAction(cname, 'state', `Soft power → ${COUNTRIES[target]?.name}`, 'SP +4');
        }});

        if (regime === 'totalitarian') {
            // Lock down internet
            if (cs.net > 0.2) opts.push({ weight: 3, fn: () => {
                cs.net = Math.max(0.1, cs.net - 0.05); recomputeCountryStats(code);
                logAction(cname, 'state', 'Tighten internet', 'net −5%');
            }});
            // Grow military
            opts.push({ weight: 4, fn: () => {
                cs.milSize = +(cs.milSize * 1.05).toFixed(1); cs.military = cs.milSize;
                logAction(cname, 'state', 'Grow military', 'milSize +5%');
            }});
            // Puppet a weak neighbour
            opts.push({ weight: 3, fn: () => {
                const weak = others.filter(k => G.cs[k] && G.cs[k].military < cs.military * 0.5 && COUNTRIES[k].type === 'minor');
                if (weak.length) {
                    const t = rndPick(weak);
                    G.faction[t] = code;
                    G.sp[code] = G.sp[code] || {};
                    G.sp[code][t] = Math.min(100, (G.sp[code]?.[t] || 5) + 15);
                    logAction(cname, 'state', `Puppet → ${COUNTRIES[t]?.name}`, 'faction change, SP +15');
                }
            }});
            // Cyber attack — damages infra
            opts.push({ weight: 2, fn: () => {
                const hostile = others.filter(k => G.cs[k] && (G.cs[k].regime === 'democracy' || G.cs[k].regime === 'anarcho_liberal'));
                if (hostile.length) {
                    const t = rndPick(hostile);
                    G.cs[t].infra = Math.max(10, G.cs[t].infra - 2);
                    recomputeCountryStats(t);
                    logAction(cname, 'state', `Cyber attack → ${COUNTRIES[t]?.name}`, `${COUNTRIES[t]?.name}: infra −2`);
                }
            }});
        }

        if (regime === 'authoritarian') {
            // Grow military
            opts.push({ weight: 3, fn: () => {
                cs.milSize = +(cs.milSize * 1.05).toFixed(1); cs.military = cs.milSize;
                logAction(cname, 'state', 'Grow military', 'milSize +5%');
            }});
            // Info war — reduce target's soft power toward others
            opts.push({ weight: 3, fn: () => {
                const rivals = others.filter(k => G.cs[k]?.regime === 'democracy');
                if (rivals.length) {
                    const t = rndPick(rivals);
                    // Weaken rival's SP influence
                    if (G.sp[t]) {
                        for (const k of Object.keys(G.sp[t])) G.sp[t][k] = Math.max(0, G.sp[t][k] - 3);
                    }
                    logAction(cname, 'state', `Info war → ${COUNTRIES[t]?.name}`, `${COUNTRIES[t]?.name}: SP influence −3`);
                }
            }});
            // Espionage — steal infra/tech advantage
            opts.push({ weight: 2, fn: () => {
                const t = rndPick(others);
                G.cs[t].infra = Math.max(10, G.cs[t].infra - 1);
                recomputeCountryStats(t);
                logAction(cname, 'state', `Espionage → ${COUNTRIES[t]?.name}`, `${COUNTRIES[t]?.name}: infra −1`);
            }});
            // War vs very weak
            if (cs.military > 200) opts.push({ weight: 1, fn: () => {
                const prey = others.filter(k => G.cs[k] && G.cs[k].military < cs.military * 0.3 && COUNTRIES[k].type === 'minor');
                if (prey.length) {
                    const t = rndPick(prey);
                    logAction(cname, 'state', `War → ${COUNTRIES[t]?.name}`, 'armed conflict');
                    resolveWar(code, t, false);
                }
            }});
        }

        if (regime === 'democracy') {
            // Invest in literacy
            if (cs.lit < 0.97) opts.push({ weight: 3, fn: () => {
                cs.lit = Math.min(0.99, cs.lit + 0.01); recomputeCountryStats(code);
                logAction(cname, 'state', 'Invest literacy', 'literacy +1%');
            }});
            // Coalition building — boost SP to democratic allies
            opts.push({ weight: 3, fn: () => {
                const allies = others.filter(k => G.cs[k]?.regime === 'democracy');
                allies.forEach(k => {
                    G.sp[code] = G.sp[code] || {};
                    G.sp[code][k] = Math.min(100, (G.sp[code][k] || 5) + 3);
                });
                logAction(cname, 'state', 'Coalition building', `SP +3 to ${allies.length} allies`);
            }});
            // Invest in internet
            if (cs.net < 0.95) opts.push({ weight: 2, fn: () => {
                cs.net = Math.min(0.99, cs.net + 0.03); recomputeCountryStats(code);
                logAction(cname, 'state', 'Expand internet', 'net +3%');
            }});
        }

        if (regime === 'anarcho_liberal') {
            // Heavy infra + internet investment
            opts.push({ weight: 4, fn: () => {
                cs.infra = Math.min(99, cs.infra + 3);
                cs.net   = Math.min(0.99, cs.net + 0.02);
                recomputeCountryStats(code);
                logAction(cname, 'state', 'Invest infra + internet', 'infra +3, net +2%');
            }});
            // Spread liberal ideology via soft power
            opts.push({ weight: 4, fn: () => {
                others.forEach(k => {
                    G.sp[code] = G.sp[code] || {};
                    G.sp[code][k] = Math.min(100, (G.sp[code][k] || 5) + 2);
                });
                logAction(cname, 'state', 'Spread liberal SP', 'SP +2 to all');
            }});
        }

        if (opts.length) weightedPick(opts).fn();
    }
}

// --- NPC CORPS ---
// Goals: maximize revenue (expand market share in high-GDP countries; invest in infrastructure)
// Aggressive corp (NVIDIA, Google, Meta etc.) expand harder
function npcCorpAct(corp) {
    if (G.playerCode === corp.name) return; // skip player
    const shares = liveShares(corp);
    const rev = parseFloat(corpRevenue(corp));
    // Find highest-GDP countries where share is low — best expansion targets
    const candidates = Object.keys(COUNTRIES)
        .filter(k => liveC(k) && (shares[k] || 0) < 25)
        .sort((a,b) => (liveC(b)?.gdp||0) - (liveC(a)?.gdp||0))
        .slice(0, 5);
    if (!candidates.length) return;

    const opts = [];
    const cLabel = `${corp.ico} ${corp.name}`;
    // Grow market share in top candidate
    opts.push({ weight: 5, fn: () => {
        const t = candidates[0];
        G.corpShares[corp.name][t] = Math.min(40, (G.corpShares[corp.name][t] || 0) + 1);
        logAction(cLabel, 'corp', `Grow share in ${COUNTRIES[t]?.name}`, 'share +1%');
    }});
    // Invest in a random candidate's infra (boosts their GDP → boosts corp revenue)
    opts.push({ weight: 3, fn: () => {
        const t = rndPick(candidates);
        if (G.cs[t]) { G.cs[t].infra = Math.min(99, G.cs[t].infra + 1); recomputeCountryStats(t); }
        G.corpShares[corp.name][t] = Math.min(40, (G.corpShares[corp.name][t] || 0) + 1);
        logAction(cLabel, 'corp', `Invest infra in ${COUNTRIES[t]?.name}`, 'infra +1, share +1%');
    }});
    // Occasionally move into a new market (countries with 0 share)
    const newMarkets = Object.keys(COUNTRIES).filter(k => !(shares[k]) && liveC(k)?.gdp > 100);
    if (newMarkets.length && rev > 50) opts.push({ weight: 2, fn: () => {
        const t = rndPick(newMarkets);
        G.corpShares[corp.name][t] = 1;
        addLog(`[CORP] ${cLabel} enters ${COUNTRIES[t]?.f} ${COUNTRIES[t]?.name} market.`);
        logAction(cLabel, 'corp', `Enter market: ${COUNTRIES[t]?.name}`, 'new market, share 1%');
    }});

    weightedPick(opts).fn();
}

// --- NPC NON-STATE ACTORS ---
// Goals vary by ideology:
//   religious (catholic, islamic): spread influence, grow share in aligned countries
//   anti-AI (greenpeace, buddhist): grow in democracies, oppose tech
//   militant (alqaeda, wagner): grow in authoritarian/unstable, destabilize
//   pro-AI/elite (mars): grow in major powers, boost soft power
//   open society (opensoc): grow in authoritarian countries, boost internet openness
function npcNsaAct(nsa) {
    if (G.playerCode === nsa.name) return;
    const sizes = liveNsaSizes(nsa);

    // Spread to a new country or grow in existing
    const allCodes = Object.keys(COUNTRIES);
    let targets = [];

    const nLabel = `${nsa.ico} ${nsa.name}`;
    if (nsa.id === 'alqaeda' || nsa.id === 'wagner') {
        targets = allCodes.filter(k => G.cs[k]?.regime === 'authoritarian' || G.cs[k]?.regime === 'totalitarian' || (G.cs[k]?.infra||50) < 50);
        const t = targets.length ? rndPick(targets) : rndPick(allCodes);
        G.nsaSizes[nsa.id][t] = Math.min(0.4, (G.nsaSizes[nsa.id][t] || 0) + 0.005);
        if (nsa.id === 'alqaeda' && G.cs[t]) {
            G.cs[t].infra = Math.max(10, G.cs[t].infra - 1);
            recomputeCountryStats(t);
            logAction(nLabel, 'nsa', `Destabilize ${COUNTRIES[t]?.name}`, `share +0.5%, infra −1`);
        } else {
            logAction(nLabel, 'nsa', `Grow in ${COUNTRIES[t]?.name}`, 'share +0.5%');
        }

    } else if (nsa.id === 'opensoc') {
        targets = allCodes.filter(k => G.cs[k]?.regime === 'authoritarian' || G.cs[k]?.regime === 'totalitarian');
        if (targets.length) {
            const t = rndPick(targets);
            G.nsaSizes[nsa.id][t] = Math.min(0.3, (G.nsaSizes[nsa.id][t] || 0) + 0.008);
            // Boost internet openness in target
            if (G.cs[t]) { G.cs[t].net = Math.min(0.99, G.cs[t].net + 0.02); recomputeCountryStats(t); }
            logAction(nLabel, 'nsa', `Grow in ${COUNTRIES[t]?.name}`, 'share +0.8%, net +2%');
        }

    } else if (nsa.id === 'green') {
        targets = allCodes.filter(k => G.cs[k]?.regime === 'democracy' || G.cs[k]?.regime === 'anarcho_liberal');
        if (targets.length) {
            const t = rndPick(targets);
            G.nsaSizes[nsa.id][t] = Math.min(0.25, (G.nsaSizes[nsa.id][t] || 0) + 0.006);
            logAction(nLabel, 'nsa', `Grow in ${COUNTRIES[t]?.name}`, 'share +0.6%');
        }

    } else if (nsa.id === 'mars') {
        targets = allCodes.filter(k => COUNTRIES[k].type === 'major' || (liveC(k)?.gdp||0) > 2000);
        if (targets.length) {
            const t = rndPick(targets);
            G.nsaSizes[nsa.id][t] = Math.min(0.25, (G.nsaSizes[nsa.id][t] || 0) + 0.006);
            logAction(nLabel, 'nsa', `Grow in ${COUNTRIES[t]?.name}`, 'share +0.6%');
        }

    } else {
        const existing = Object.entries(sizes).filter(([,v]) => v > 0.01).map(([k]) => k);
        const seed = existing.length ? rndPick(existing) : rndPick(allCodes);
        const seedFaction = G.faction[seed] || COUNTRIES[seed]?.faction;
        targets = allCodes.filter(k => k !== seed && (G.faction[k] === seedFaction || G.cs[k]?.regime === G.cs[seed]?.regime));
        const t = targets.length ? rndPick(targets) : rndPick(allCodes);
        G.nsaSizes[nsa.id][t] = Math.min(0.3, (G.nsaSizes[nsa.id][t] || 0) + 0.004);
        logAction(nLabel, 'nsa', `Spread to ${COUNTRIES[t]?.name}`, 'share +0.4%');
    }
}

// Master NPC tick — called once per endTurn
function npcTick() {
    // All non-player states act
    for (const code of Object.keys(COUNTRIES)) {
        if (code === G.playerCode) continue;
        if (COUNTRIES[code].type === 'haven') continue; // havens do nothing
        npcStateAct(code);
    }
    // All non-player corps act (skip non-player entities like Government, Minor Corps)
    for (const corp of CORPS) {
        if (corp.type === 'Public Sector' || corp.type === 'Private Sector') continue;
        npcCorpAct(corp);
    }
    // All non-player NSAs act
    for (const nsa of NSAS) {
        npcNsaAct(nsa);
    }
}

function getProjectedPop(code, year) {
    const pts = _popJson.projections[code];
    if (!pts) return null;
    if (year <= pts[0][0]) return pts[0][1];
    if (year >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
        if (year >= pts[i][0] && year <= pts[i + 1][0]) {
            const t = (year - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
            return +(pts[i][1] + t * (pts[i + 1][1] - pts[i][1])).toFixed(1);
        }
    }
    return pts[pts.length - 1][1];
}

function simTick() {
    // Update populations based on demographic projections
    const year = 2024 + G.turn;
    for (const code of Object.keys(COUNTRIES)) {
        const cs = G.cs[code];
        if (!cs) continue;
        const projected = getProjectedPop(code, year);
        if (projected !== null) cs.pop = projected;
    }
    // Decay boycotts (one turn)
    G.boycotts = {};
    // NPC AI actions
    npcTick();
    // Recompute all country stats
    for (const code of Object.keys(COUNTRIES)) recomputeCountryStats(code);
    // Military size growth/shrink based on GDP-supported spending vs maintenance
    for (const code of Object.keys(COUNTRIES)) {
        const cs = G.cs[code];
        if (!cs) continue;
        const isPlayer = code === G.playerCode;
        const techBuff = isPlayer ? calcTechBuff() : 0;
        const milBuff = (isPlayer && G.techBuffs?.mil_buff) ? G.techBuffs.mil_buff / 100 : 0;
        // GDP-supported military spending (mil_buff reduces effective maintenance)
        const milSpending = cs.gdp / cs.ideoEntropy * (1 + techBuff);
        const maintenance = cs.milSize * 0.14 * Math.max(0.1, 1 - milBuff);
        const surplus = milSpending - maintenance;
        if (surplus > 0) {
            cs.milSize = +(cs.milSize + surplus).toFixed(1);
        } else if (surplus < 0) {
            cs.milSize = Math.max(1, +(cs.milSize + surplus / 0.14).toFixed(1));
        }
        cs.military = cs.milSize;
    }
    // Soft power driven ideology drift
    simSoftPowerDrift();
    // Natural infrastructure recovery for war-damaged countries
    for (const code of Object.keys(COUNTRIES)) {
        const cs = G.cs[code];
        if (cs && cs.infra < 30) cs.infra = Math.min(30, cs.infra + 1);
    }
}

// ═══════════════════════════════════════════
//  END TURN
// ═══════════════════════════════════════════
window.endTurn=function(){
    if(!document.getElementById('popup').classList.contains('off')) return;
    // Run simulation tick (stat recompute, SP drift, recovery) — still on current turn
    if(Object.keys(G.cs).length) simTick();
    // Income
    const earned = calcPlayerIncome();
    G.pp += earned;
    // Research progress — split tech output evenly across all active research
    if (G.researching.length > 0) {
        const playerTechOut = getPlayerTechOutput();
        const count = G.researching.length;
        const share = playerTechOut / count;
        if (count > 1) addLog(`Tech output ${Math.round(playerTechOut)} split across ${count} projects (${Math.round(share)} each)`);
        const completed = [];
        for (const r of G.researching) {
            r.progress += share;
            if (r.progress >= r.cost) {
                completed.push(r.id);
            } else {
                const pct = r.cost > 0 ? Math.min(100, Math.round(r.progress / r.cost * 100)) : 0;
                const n = TC_NM[r.id];
                addLog(`Research ${n?.name||r.id}: ${Math.round(r.progress)}/${r.cost} (${pct}%)`);
            }
        }
        for (const id of completed) {
            tcCompleteResearch(id);
        }
    }
    // AGI global advance
    G.agi=Math.min(100,G.agi+Math.floor(Math.random()*3)+1);
    if(Math.random()>0.55){ G.agi=Math.min(100,G.agi+2); addLog('Major powers accelerate AI spending. AGI advances.'); }
    // Advance turn counter after all actions are logged
    G.turn++;
    // Events — scripted (turn-based)
    const sev = SCRIPTED_EVENTS.find(e => e.turn === G.turn);
    if (sev) showPopup(sev);
    // Events — tech-tree triggered (probability-based, requires techs)
    const polKey = G.role === 'tech' ? 'corp' : G.role === 'nsa' ? 'ns' : (G.regime === 'authoritarian' || G.regime === 'totalitarian') ? 'auth' : 'dem';
    for (const tev of TECH_EVENTS) {
        if (!tev.repeatable && EVENT_STATE[tev.id].fired) continue;
        if (!tev.target[polKey]) continue;
        if (tev.requires.length && !tev.requires.every(id => G.techs.has(id))) continue;
        if (Math.random() < tev.base_prob) {
            EVENT_STATE[tev.id].fired = true;
            EVENT_STATE[tev.id].turn = G.turn;
            showPopup(tev);
            break; // one tech event per turn max
        }
    }
    // Events — random narrative
    if (!sev && Math.random() > 0.7) {
        const re = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        addLog(`[${(re.domain || '').toUpperCase()}] ${re.name} — ${re.desc.slice(0, 60)}…`, 'hi');
    }
    const incBreak = G.expenses > 0 ? ` (income ${G.income} − exp ${G.expenses})` : '';
    addLog(`Turn ${G.turn} — +${earned} PP earned${incBreak}.`);
    updateHUD();
    refreshCountryPanel(G.selectedCode);
    if(activeTab==='domestic') renderDomestic();
    if(activeTab==='ledger') renderLedger();
    if(activeTab==='actionlog') renderActionLog();
    if(G.agi>=100) triggerEndgame();
};

function showPopup(ev){
    const cat = ev.cat || ev.domain || ev.type || '';
    const title = ev.title || ev.name || '';
    const body = ev.body || ev.desc || '';
    document.getElementById('pu-cat').textContent = cat.toUpperCase();
    document.getElementById('pu-title').textContent = title;
    document.getElementById('pu-body').textContent = body;
    // Build effects display from fx array or effects object
    let fxHtml = '';
    if (ev.fx) {
        fxHtml = ev.fx.map(f => `<div class="${f.pos?'fx-pos':'fx-neg'}">${f.pos?'▲':'▼'} ${f.t}</div>`).join('');
    } else if (ev.effects) {
        const polKey = G.role === 'tech' ? 'corp' : G.role === 'nsa' ? 'ns' : (G.regime === 'authoritarian' || G.regime === 'totalitarian') ? 'auth' : 'dem';
        const efx = ev.effects[polKey] || {};
        const labels = { mil_buff:'Military', tech_buff:'Tech Output', gdp_buff:'GDP Buff' };
        for (const [k, v] of Object.entries(efx)) {
            if (v && v !== 0) fxHtml += `<div class="${v > 0 ? 'fx-pos' : 'fx-neg'}">${v > 0 ? '▲' : '▼'} ${labels[k] || k} ${v > 0 ? '+' : ''}${v}</div>`;
        }
    }
    document.getElementById('pu-fx').innerHTML = fxHtml;
    // Flavor text
    if (ev.flavor) {
        const polKey = G.role === 'tech' ? 'corp' : G.role === 'nsa' ? 'ns' : (G.regime === 'authoritarian' || G.regime === 'totalitarian') ? 'auth' : 'dem';
        const fl = ev.flavor[polKey];
        if (fl) document.getElementById('pu-body').textContent = body + '\n\n"' + fl + '"';
    }
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
    if (!G.role) { el.innerHTML = '<p class="dom-empty">Start the simulation first.</p>'; return; }
    const c   = G.playerCode ? COUNTRIES[G.playerCode] : null;
    const cs  = G.cs[G.playerCode] || c;
    const liveFaction = G.playerCode ? (G.faction[G.playerCode] ?? c?.faction) : null;
    const factionC = liveFaction ? COUNTRIES[liveFaction] : null;
    const mults = G.playerCode ? calcIdeologyMultipliers(G.playerCode) : {};
    const spTop = G.playerCode ? Object.entries(G.sp[G.playerCode] || {})
        .sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([k,v])=>`${COUNTRIES[k]?.f??k} ${Math.round(v)}`)
        .join(' · ') : '—';

    el.innerHTML = `
        <div class="dom-hdr">
            <div class="dom-flag">${c ? c.f : '🔷'}</div>
            <div>
                <div class="dom-name">${G.roleName}</div>
                <span class="regime-pill rp-${G.regime}">${G.regime.replace('_',' ')}</span>
                ${factionC ? `<span class="dom-faction">Aligned to ${factionC.f} ${factionC.name}</span>` : ''}
            </div>
        </div>
        <div class="dom-section-title">ECONOMY &amp; POWER</div>
        <div class="dom-stats">
            <div class="dom-stat"><span class="dom-k">POWER POINTS</span><span class="dom-v">${G.pp}</span></div>
            <div class="dom-stat"><span class="dom-k">NET PP / TURN</span><span class="dom-v dom-pos">+${Math.max(10, (G.income||0) - (G.expenses||0))}</span></div>
            ${(()=>{
                const tBuff = calcTechBuff();
                const tOutputBuff = (G.techBuffs?.tech_buff||0)/100;
                const govCorp = CORPS.find(c => c.type === 'Public Sector');
                const minorCorp = CORPS.find(c => c.type === 'Private Sector');
                let techOutVal = '—', techOutTip = '';
                if (G.role === 'tech') {
                    const corp = CORPS.find(c => c.name === G.roleName);
                    techOutVal = corp ? calcCorpTechOutput(corp).toLocaleString() : '—';
                    if (corp) {
                        const shares = liveShares(corp);
                        const parts = [];
                        for (const [code,sh] of Object.entries(shares)) { const g=G.cs[code]?.gdp??0; const c=g*sh/100; if(c>0.5) parts.push(`${code}:${g}×${sh}%`); }
                        techOutTip = `Σ(GDP×share) × 15% × (1+${tBuff.toFixed(2)})\n${parts.join(', ')}`;
                    }
                } else if (G.role === 'nsa') {
                    const nsa = NSAS.find(n => n.name === G.roleName);
                    techOutVal = nsa ? calcNsaTechOutput(nsa).toLocaleString() : '—';
                    if (nsa) {
                        const sizes = liveNsaSizes(nsa);
                        const parts = [];
                        for (const [code,sz] of Object.entries(sizes)) { const g=G.cs[code]?.gdp??0; const c=g*sz; if(c>0.5) parts.push(`${code}:${g}×${(sz*100).toFixed(0)}%`); }
                        techOutTip = `Σ(GDP×followers) × 3% × (1+${tBuff.toFixed(2)})\n${parts.join(', ')}`;
                    }
                } else {
                    techOutVal = cs?.techOutput?.toLocaleString() ?? '—';
                    if (G.playerCode) {
                        const pc = G.playerCode;
                        const govSh = (govCorp ? (liveShares(govCorp))[pc]||0 : 0)/100;
                        const minorSh = (minorCorp ? (liveShares(minorCorp))[pc]||0 : 0)/100;
                        let majorSh = 0;
                        for (const corp of CORPS) { if(corp===govCorp||corp===minorCorp) continue; majorSh += ((liveShares(corp))[pc]||0)/100; }
                        const gdp = cs?.gdp||0;
                        const govC = +(gdp*govSh*0.01).toFixed(1);
                        const majC = +(gdp*majorSh*0.1).toFixed(1);
                        const minC = +(gdp*minorSh*0.03).toFixed(1);
                        techOutTip = `GDP(${gdp}) × [gov ${(govSh*100).toFixed(1)}%×1%=${govC} + corp ${(majorSh*100).toFixed(1)}%×10%=${majC} + minor ${(minorSh*100).toFixed(1)}%×3%=${minC}]\n× (1 + techBuff ${tBuff.toFixed(2)} + outputBuff ${tOutputBuff.toFixed(2)})`;
                    }
                }
                let researchTip = '';
                if (G.researching.length > 0) {
                    researchTip = `\nResearching ${G.researching.length} project(s)${G.researching.length>1?' (output split)':''}:\n` + G.researching.map(r=>{const n=TC_NM[r.id]; const pct=r.cost>0?Math.round(r.progress/r.cost*100):100; return `  ${n?.name||r.id}: ${Math.round(r.progress)}/${r.cost} (${pct}%)`;}).join('\n');
                }
                return `<div class="dom-stat" title="${techOutTip}${researchTip}"><span class="dom-k">TECH OUTPUT</span><span class="dom-v">${techOutVal}</span></div>`;
            })()}
            <div class="dom-stat"><span class="dom-k">AGI PROGRESS</span><span class="dom-v">${G.agi}%</span></div>
            <div class="dom-stat"><span class="dom-k">TECHS RESEARCHED</span><span class="dom-v">${G.techs.size}</span></div>
            <div class="dom-stat"><span class="dom-k">TURN / YEAR</span><span class="dom-v">${G.turn} / ${2024+G.turn}</span></div>
        </div>
        ${(()=>{
            const bd = G.incomeBreakdown || {};
            let incomeRows = '';
            if (G.role === 'major' || G.role === 'minor') {
                const govTip = `GDP(${cs?.gdp?.toLocaleString()}) × govShare(${(bd.govShare*100).toFixed(1)}%)\ngovShare comes from ideology social_cost multiplier`;
                incomeRows += `<div class="dom-stat" title="${govTip}"><span class="dom-k">GOV. REVENUE (GDP × ${(bd.govShare*100).toFixed(0)}%)</span><span class="dom-v dom-pos">+${bd.govIncome||0}</span></div>`;
            } else if (G.role === 'tech') {
                const detailTip = bd.details.map(d=>`${d.label}: ${d.value}`).join('\n');
                incomeRows += `<div class="dom-stat" title="Σ(countryGDP × marketShare%)\n${detailTip}"><span class="dom-k">MARKET REVENUE (Σ share × GDP)</span><span class="dom-v dom-pos">+${bd.marketIncome||0}</span></div>`;
            } else if (G.role === 'nsa') {
                const detailTip = bd.details.map(d=>`${d.label}: ${d.value}`).join('\n');
                incomeRows += `<div class="dom-stat" title="Σ(countryGDP × followerShare × 10%)\n${detailTip}"><span class="dom-k">INFLUENCE REVENUE (Σ ideo% × GDP × 10%)</span><span class="dom-v dom-pos">+${bd.influenceIncome||0}</span></div>`;
            }
            if (bd.details && bd.details.length) {
                bd.details.forEach(d => {
                    incomeRows += `<div class="dom-stat"><span class="dom-k">${d.label}</span><span class="dom-v dom-pos">+${d.value}</span></div>`;
                });
            }
            let expRows = '';
            if (bd.milExp) {
                const milBuff = (G.techBuffs?.mil_buff || 0) / 100;
                const milTip = `GDP(${cs?.gdp?.toLocaleString()}) / ideoEntropy(${bd.ideoEntropy?.toFixed(1)}) × (1 + techBuff(${calcTechBuff().toFixed(2)}))\n= ${bd.milSpending}\n\nMaintenance: milSize(${bd.milSize}) × 14% × max(0.1, 1 - mil_buff(${(milBuff*100).toFixed(1)}%))\n= ${bd.milMaintenance}\n\nSurplus (spending - maintenance) determines military growth`;
                expRows += `<div class="dom-stat" title="${milTip}"><span class="dom-k">MIL. SPENDING</span><span class="dom-v dom-neg">−${bd.milExp}</span></div>`;
                if (bd.milSize) {
                    const surplus = bd.milExp - bd.milMaintenance;
                    expRows += `<div class="dom-stat" title="milSize(${bd.milSize}) × 14% × max(0.1, 1 - mil_buff(${(milBuff*100).toFixed(1)}%))"><span class="dom-k">MIL. MAINTENANCE</span><span class="dom-v">${bd.milMaintenance}</span></div>`;
                    expRows += `<div class="dom-stat" title="spending(${bd.milExp}) - maintenance(${bd.milMaintenance}) = ${surplus}\nPositive surplus grows military, negative shrinks it"><span class="dom-k">MIL. SIZE TREND</span><span class="dom-v ${surplus>=0?'dom-pos':'dom-neg'}">${surplus>=0?'▲ Growing (+'+surplus+')':'▼ Shrinking ('+surplus+')'}</span></div>`;
                }
            }
            return `
                <div class="dom-section-title">INCOME BREAKDOWN</div>
                <div class="dom-stats">${incomeRows}</div>
                ${expRows ? `<div class="dom-section-title">EXPENSE BREAKDOWN</div><div class="dom-stats">${expRows}</div>` : ''}
            `;
        })()}
        ${cs ? `
        <div class="dom-section-title">NATIONAL STATS</div>
        <div class="dom-stats">
            ${(()=>{
                let gdpTip = '';
                if (G.playerCode) {
                    const pc = G.playerCode;
                    const tBuff = calcTechBuff();
                    const gdpBuffFromTech = (G.techBuffs?.gdp_buff || 0) / 100;
                    const multsG = calcIdeologyMultipliers(pc);
                    const boycott = G.boycotts[pc] || 0;
                    const totalBuff = tBuff - multsG.gdp_penalty - boycott;
                    const baseGdp = +(cs.pop * cs.infra * Math.pow(cs.lit,4) * cs.net).toFixed(1);
                    gdpTip = `pop(${cs.pop}) × infra(${cs.infra}) × lit(${cs.lit})^4 × net(${cs.net.toFixed(2)}) = base ${baseGdp.toLocaleString()}\n× (1 + totalBuff ${totalBuff>=0?'+':''}${(totalBuff*100).toFixed(1)}%) = ${cs.gdp?.toLocaleString()}\n\nBuff breakdown:`;
                    if (gdpBuffFromTech) gdpTip += `\n  gdp_buff (tech effects): +${(gdpBuffFromTech*100).toFixed(1)}%`;
                    if (multsG.gdp_penalty) gdpTip += `\n  ideology gdp_penalty: -${(multsG.gdp_penalty*100).toFixed(1)}%`;
                    if (boycott) gdpTip += `\n  boycott penalty: -${(boycott*100).toFixed(1)}%`;
                    if (!gdpBuffFromTech && !multsG.gdp_penalty && !boycott) gdpTip += `\n  (none)`;
                }
                return `<div class="dom-stat" title="${gdpTip}"><span class="dom-k">GDP INDEX</span><span class="dom-v">${cs.gdp?.toLocaleString()??'—'}</span></div>`;
            })()}
            <div class="dom-stat"><span class="dom-k">TECH OUTPUT</span><span class="dom-v">${cs.techOutput?.toLocaleString()??'—'}</span></div>
            <div class="dom-stat"><span class="dom-k">MILITARY SIZE</span><span class="dom-v">${cs.milSize?.toLocaleString()??cs.military?.toLocaleString()??'—'}</span></div>
            <div class="dom-stat"><span class="dom-k">POPULATION</span><span class="dom-v">${cs.pop}M</span></div>
            <div class="dom-stat"><span class="dom-k">INFRASTRUCTURE</span><span class="dom-v">${cs.infra}%</span></div>
            <div class="dom-stat"><span class="dom-k">LITERACY</span><span class="dom-v">${Math.round(cs.lit*100)}%</span></div>
            <div class="dom-stat"><span class="dom-k">INTERNET ACCESS</span><span class="dom-v">${Math.round(cs.net*100)}%</span></div>
        </div>
        <div class="dom-section-title">INFLUENCE &amp; IDEOLOGY</div>
        <div class="dom-stats">
            <div class="dom-stat dom-wide"><span class="dom-k">TOP SOFT POWER TARGETS</span><span class="dom-v">${spTop||'—'}</span></div>
            ${mults.social_cost ? `<div class="dom-stat"><span class="dom-k">GOV. SHARE OF ECONOMY</span><span class="dom-v">${(mults.social_cost*100).toFixed(0)}%</span></div>` : ''}
            ${cs.ideoEntropy ? `<div class="dom-stat"><span class="dom-k">IDEOLOGY ENTROPY</span><span class="dom-v">${cs.ideoEntropy.toFixed(1)}</span></div>` : ''}
            ${mults.soft_power  ? `<div class="dom-stat"><span class="dom-k">SOFT POWER BONUS</span><span class="dom-v">+${(mults.soft_power*100).toFixed(0)}%</span></div>` : ''}
        </div>` : ''}
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

function renderActionLog() {
    const el = document.getElementById('actionlog-body');
    if (!G.actionLog.length) {
        el.innerHTML = '<div style="padding:12px;color:#8af;">No actions recorded yet. End a turn to see activity.</div>';
        return;
    }
    // Group by turn (most recent first)
    const turns = {};
    for (const e of G.actionLog) {
        (turns[e.turn] = turns[e.turn] || []).push(e);
    }
    const sortedTurns = Object.keys(turns).map(Number).sort((a, b) => b - a);
    const typeColors = { player: '#4af', state: '#aaa', corp: '#fd5', nsa: '#f87' };
    const typeLabels = { player: 'YOU', state: 'STATE', corp: 'CORP', nsa: 'NSA' };

    let html = '';
    for (const t of sortedTurns) {
        html += `<div style="padding:6px 8px;font-weight:bold;color:#4a9eff;border-bottom:1px solid #1a2a3a;">Turn ${t}</div>`;
        html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<tr style="color:#6a8a9a;border-bottom:1px solid #1a2a3a;"><th style="text-align:left;padding:4px 8px;width:60px;">Type</th><th style="text-align:left;padding:4px 8px;width:180px;">Actor</th><th style="text-align:left;padding:4px 8px;">Action</th><th style="text-align:left;padding:4px 8px;">Effects</th></tr>';
        for (const e of turns[t]) {
            const color = typeColors[e.actorType] || '#aaa';
            const label = typeLabels[e.actorType] || e.actorType;
            html += `<tr style="border-bottom:1px solid #0d1a25;">`;
            html += `<td style="padding:3px 8px;color:${color};font-weight:bold;font-size:11px;">${label}</td>`;
            html += `<td style="padding:3px 8px;color:#cde;">${e.actor}</td>`;
            html += `<td style="padding:3px 8px;">${e.action}</td>`;
            html += `<td style="padding:3px 8px;color:#8a8;">${e.effects}</td>`;
            html += '</tr>';
        }
        html += '</table>';
    }
    el.innerHTML = html;
}

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
    else { s.col = col; s.dir = col === 'name' || col === 'regime' || col === 'type' || col === 'sector' ? 'asc' : 'desc'; }
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
        const strCols = { name:'name', regime:'regime' };
        const numKeys = {gdp:'gdp',tech:'techOutput',mil:'military',pop:'pop',infra:'infra',lit:'lit',net:'net'};
        const rows = Object.keys(COUNTRIES)
            .map(code => liveC(code))
            .sort((a,b) => {
                if (strCols[s.col]) return s.dir==='asc' ? a[strCols[s.col]].localeCompare(b[strCols[s.col]]) : b[strCols[s.col]].localeCompare(a[strCols[s.col]]);
                const key = numKeys[s.col] || 'gdp';
                return s.dir==='asc' ? a[key]-b[key] : b[key]-a[key];
            })
            .map(c => {
                const you = G.playerCode === c.code;
                const fC = c.faction ? COUNTRIES[c.faction] : null;
                return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('country','${c.code}')">
                    <td style="font-size:1.3rem">${c.f}</td>
                    <td>${c.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                    <td><span class="regime-pill rp-${c.regime}">${c.regime.replace('_',' ')}</span></td>
                    <td class="ldg-num">${c.gdp}</td>
                    <td class="ldg-num">${c.techOutput??'—'}</td>
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
            <th></th>${th('NATION','name')}${th('REGIME','regime')}
            ${th('GDP','gdp')}${th('TECH','tech')}${th('MILITARY','mil')}${th('POPULATION','pop')}
            ${th('INFRA','infra')}${th('LITERACY','lit')}${th('INTERNET','net')}
            <th>TYPE</th><th>ALIGNED TO</th>
        </tr></thead><tbody>${rows}</tbody></table>`;

    } else if (sub === 'corps') {
        const s = ldgSort.corps;
        const data = CORPS.map(corp => ({ corp, rev: parseFloat(corpRevenue(corp)), tech: calcCorpTechOutput(corp) }));
        data.sort((a,b) => {
            if (s.col==='name')  return s.dir==='asc' ? a.corp.name.localeCompare(b.corp.name)  : b.corp.name.localeCompare(a.corp.name);
            if (s.col==='sector')return s.dir==='asc' ? a.corp.type.localeCompare(b.corp.type)  : b.corp.type.localeCompare(a.corp.type);
            if (s.col==='mkts')  return s.dir==='asc' ? Object.keys(liveShares(a.corp)).length - Object.keys(liveShares(b.corp)).length : Object.keys(liveShares(b.corp)).length - Object.keys(liveShares(a.corp)).length;
            if (s.col==='tech')  return s.dir==='asc' ? a.tech-b.tech : b.tech-a.tech;
            return s.dir==='asc' ? a.rev-b.rev : b.rev-a.rev;
        });
        const rows = data.map(({corp, rev, tech}) => {
            const you = G.playerCode === corp.name;
            const top = Object.entries(liveShares(corp)).sort((a,b)=>b[1]-a[1])[0];
            return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('corp','${corp.id}')">
                <td style="font-size:1.3rem">${corp.ico}</td>
                <td>${corp.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                <td class="ldg-dim">${corp.type}</td>
                <td class="ldg-num">${rev.toFixed(1)}</td>
                <td class="ldg-num">${tech}</td>
                <td class="ldg-num">${Object.keys(liveShares(corp)).length}</td>
                <td class="ldg-dim">${top ? (COUNTRIES[top[0]]?.f||top[0])+' '+top[1]+'%' : '—'}</td>
            </tr>`;
        }).join('');
        el.innerHTML = `<table class="ldg-table"><thead><tr>
            <th></th>${th('CORPORATION','name')}${th('SECTOR','sector')}
            ${th('REVENUE','rev')}${th('TECH','tech')}${th('MARKETS','mkts')}<th>TOP MARKET</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Revenue = Σ (country GDP × share%) · Tech = Revenue × 0.15 × (1+buff)</p>`;

    } else {
        const s = ldgSort.nonstates;
        const data = NSAS.map(nsa => ({ nsa, eco: parseFloat(nsaEcoSize(nsa)), tech: calcNsaTechOutput(nsa) }));
        data.sort((a,b) => {
            if (s.col==='name') return s.dir==='asc' ? a.nsa.name.localeCompare(b.nsa.name) : b.nsa.name.localeCompare(a.nsa.name);
            if (s.col==='type') return s.dir==='asc' ? a.nsa.type.localeCompare(b.nsa.type) : b.nsa.type.localeCompare(a.nsa.type);
            if (s.col==='cnt')  return s.dir==='asc' ? Object.keys(a.nsa.sizes).length - Object.keys(b.nsa.sizes).length : Object.keys(b.nsa.sizes).length - Object.keys(a.nsa.sizes).length;
            if (s.col==='tech') return s.dir==='asc' ? a.tech-b.tech : b.tech-a.tech;
            return s.dir==='asc' ? a.eco-b.eco : b.eco-a.eco;
        });
        const rows = data.map(({nsa, eco, tech}) => {
            const you = G.playerCode === nsa.name;
            const top = Object.entries(liveNsaSizes(nsa)).sort((a,b)=>b[1]-a[1])[0];
            return `<tr class="${you?'ldg-you':''} ldg-clickable" onclick="showLedgerDetail('nsa','${nsa.id}')">
                <td style="font-size:1.3rem">${nsa.ico}</td>
                <td>${nsa.name}${you?' <span class="ldg-you-tag">▶ YOU</span>':''}</td>
                <td class="ldg-dim">${nsa.type}</td>
                <td class="ldg-num">${eco.toFixed(1)}</td>
                <td class="ldg-num">${tech}</td>
                <td class="ldg-num">${Object.keys(nsa.sizes).length}</td>
                <td class="ldg-dim">${top ? (COUNTRIES[top[0]]?.f||top[0])+' '+Math.round(top[1]*100)+'%' : '—'}</td>
            </tr>`;
        }).join('');
        el.innerHTML = `<table class="ldg-table"><thead><tr>
            <th></th>${th('ORGANIZATION','name')}${th('TYPE','type')}
            ${th('ECO-SIZE','eco')}${th('TECH','tech')}${th('COUNTRIES','cnt')}<th>STRONGEST IN</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <p class="ldg-note">Eco-size = 0.1 × Σ (share × GDP) · Tech = Eco-size × 0.03 × (1+buff)</p>`;
    }
};

window.showLedgerDetail = function(type, id) {
    ledgerDetail = { type, id };
    renderLedgerDetail();
};

// Build action buttons for ledger detail panel, targeting a given country/corp/nsa id
function ldgActionButtons(targetCode) {
    if (!G.role || !G.playerCode) return '';
    const isSelf = targetCode === G.playerCode;
    const acts = ACTIONS[G.regime] || [];
    const relevant = isSelf ? acts.filter(a => a.t === 'self') : acts.filter(a => a.t === 'country');
    const selfActs = isSelf ? [] : acts.filter(a => a.t === 'self');
    if (!relevant.length && !selfActs.length) return '';
    const btn = (a, tgt) => {
        const ok = G.pp >= a.cost;
        return `<button class="ldg-act-btn${ok ? '' : ' cant'}" ${ok ? `onclick="ldgDoAction('${a.id}','${tgt}')"` : ''} title="${a.l}">
            <span class="ldg-act-lbl">${a.l}</span><span class="ldg-act-cost">${a.cost} PP</span>
        </button>`;
    };
    return `<div class="ldg-actions">
        <div class="ldg-act-hdr">${isSelf ? 'YOUR ACTIONS' : 'ACTIONS'}</div>
        <div class="ldg-act-row">
            ${relevant.map(a => btn(a, targetCode)).join('')}
            ${selfActs.map(a => btn(a, G.playerCode)).join('')}
        </div>
    </div>`;
}

window.ldgDoAction = function(actId, targetCode) {
    window.doAction(actId, targetCode);
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
        const c = liveC(ledgerDetail.id);
        const fC = c.faction ? liveC(c.faction) : null;
        const allEcon = CORPS
            .filter(corp => liveShares(corp)[c.code])
            .map(corp => {
                const sh = liveShares(corp)[c.code];
                return { ico: corp.ico, name: corp.name, type: corp.type, share: sh, contrib: c.gdp * sh / 100 };
            })
            .sort((a,b) => b.contrib - a.contrib);
        const econRows = allEcon.map(({ico,name,type,share,contrib}) => `<tr>
            <td style="font-size:1.2rem">${ico}</td>
            <td>${name}</td><td class="ldg-dim">${type}</td>
            <td class="ldg-num">${typeof share === 'number' ? share.toFixed(1) : share}%</td>
            <td class="ldg-num">${contrib.toFixed(1)}</td>
            <td><div class="ldg-bar"><div class="ldg-bar-fill" style="width:${Math.min(100,share)}%"></div></div></td>
        </tr>`).join('');

        const totalNsaShare = NSAS.reduce((s, nsa) => s + (liveNsaSizes(nsa)[c.code] || 0), 0);
        const totalPolShare = POLITY_FACTIONS.reduce((s, f) => s + (livePolSizes(f)[c.code] || 0), 0);
        const unaffiliated = Math.max(0, 1 - totalNsaShare - totalPolShare);
        const mkRow = (ico, name, type, size, gdp, dimmed=false) => `<tr${dimmed?' class="ldg-dim"':''}>
            <td style="font-size:1.2rem">${ico}</td><td>${name}</td><td class="ldg-dim">${type}</td>
            <td class="ldg-num">${Math.round(size*100)}%</td>
            <td class="ldg-num">${(0.1*size*gdp).toFixed(1)}</td>
            <td><div class="ldg-bar"><div class="ldg-bar-fill" style="width:${(size*100).toFixed(1)}%${dimmed?';opacity:0.35':''}"></div></div></td>
        </tr>`;
        const nsaRows = NSAS.map(n=>({n,size:liveNsaSizes(n)[c.code]||0})).sort((a,b)=>b.size-a.size).map(({n,size})=>mkRow(n.ico,n.name,n.type,size,c.gdp)).join('');
        const polRows = POLITY_FACTIONS.map(f=>({f,size:livePolSizes(f)[c.code]||0})).sort((a,b)=>b.size-a.size).map(({f,size})=>mkRow(f.ico,f.name,f.type,size,c.gdp)).join('');
        const sepRow = `<tr><td colspan="6" class="ldg-sep-row">POLITICAL FACTIONS</td></tr>`;
        const nsaRows_full = nsaRows + sepRow + polRows + (unaffiliated>0.005 ? mkRow('👤','Unaffiliated','—',unaffiliated,c.gdp,true) : '');

        el.innerHTML = `${back}
        <div class="ldg-det-layout">
          <div class="ldg-det-main">
            <div class="ldg-det-hdr">
                <span class="ldg-det-flag">${c.f}</span>
                <div>
                    <div class="ldg-det-name">${c.name}</div>
                    <span class="regime-pill rp-${c.regime}">${c.regime.replace('_',' ')}</span>
                    ${fC ? `<span class="ldg-dim" style="margin-left:10px">→ ${fC.f} ${fC.name}</span>` : ''}
                </div>
            </div>
            <div class="ldg-det-stats">
                ${[['GDP',c.gdp],['Tech Output',G.cs[c.code]?.techOutput??'—'],['Military',c.military],['Pop',c.pop+'M'],['Infra',c.infra+'%'],['Literacy',Math.round(c.lit*100)+'%'],['Internet',Math.round(c.net*100)+'%']].map(([k,v])=>`<div class="dom-stat"><span class="dom-k">${k}</span><span class="dom-v">${v}</span></div>`).join('')}
            </div>
            <div class="ldg-det-section">ECONOMIC STRUCTURE</div>
            <table class="ldg-table"><thead><tr><th></th><th>ACTOR</th><th>SECTOR</th><th class="ldg-num">SHARE</th><th class="ldg-num">GDP CONTRIB</th><th>BAR</th></tr></thead><tbody>${econRows}</tbody></table>
            <div class="ldg-det-section" style="margin-top:16px">IDEOLOGICAL SPECTRUM</div>
            <table class="ldg-table"><thead><tr><th></th><th>ORGANIZATION / FACTION</th><th>TYPE</th><th class="ldg-num">POP %</th><th class="ldg-num">ECO-WEIGHT</th><th>BAR</th></tr></thead><tbody>${nsaRows_full}</tbody></table>
          </div>
          <div class="ldg-det-side">${ldgActionButtons(c.code)}</div>
        </div>`;

    } else if (ledgerDetail.type === 'corp') {
        const corp = CORPS.find(c => c.id === ledgerDetail.id);
        const shares = liveShares(corp);
        const total = parseFloat(corpRevenue(corp));
        const rows = Object.entries(shares)
            .map(([code, share]) => { const lc = liveC(code); return { c: lc, share, contrib: lc ? lc.gdp * share / 100 : 0 }; })
            .filter(x => x.c)
            .sort((a,b) => b.contrib - a.contrib)
            .map(({c,share,contrib}) => `<tr>
                <td style="font-size:1.2rem">${c.f}</td>
                <td>${c.name}</td>
                <td class="ldg-num">${typeof share==='number'?share.toFixed(1):share}%</td>
                <td class="ldg-num">${contrib.toFixed(1)}</td>
                <td><div class="ldg-bar"><div class="ldg-bar-fill" style="width:${total>0?Math.min(100,contrib/total*100).toFixed(1):0}%"></div></div></td>
            </tr>`).join('');
        el.innerHTML = `${back}
        <div class="ldg-det-layout">
          <div class="ldg-det-main">
            <div class="ldg-det-hdr">
                <span class="ldg-det-flag">${corp.ico}</span>
                <div><div class="ldg-det-name">${corp.name}</div><span class="ldg-dim">${corp.type} · Revenue: ${total.toFixed(1)}</span></div>
            </div>
            <div class="ldg-det-section">MARKET PRESENCE</div>
            <table class="ldg-table"><thead><tr><th></th><th>COUNTRY</th><th class="ldg-num">MARKET SHARE</th><th class="ldg-num">REVENUE</th><th>BAR</th></tr></thead><tbody>${rows}</tbody></table>
          </div>
          <div class="ldg-det-side">${ldgActionButtons(corp.name)}</div>
        </div>`;

    } else {
        const nsa = NSAS.find(n => n.id === ledgerDetail.id);
        const total = parseFloat(nsaEcoSize(nsa));
        const rows = Object.entries(liveNsaSizes(nsa))
            .map(([code, size]) => { const lc = liveC(code); return { c: lc, size, contrib: lc ? 0.1*size*lc.gdp : 0 }; })
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
        <div class="ldg-det-layout">
          <div class="ldg-det-main">
            <div class="ldg-det-hdr">
                <span class="ldg-det-flag">${nsa.ico}</span>
                <div><div class="ldg-det-name">${nsa.name}</div><span class="ldg-dim">${nsa.type} · Eco-size: ${total.toFixed(1)}</span></div>
            </div>
            <div class="ldg-det-section">COUNTRY PRESENCE</div>
            <table class="ldg-table"><thead><tr><th></th><th>COUNTRY</th><th class="ldg-num">POP SHARE</th><th class="ldg-num">ECO-WEIGHT</th><th>BAR</th></tr></thead><tbody>${rows}</tbody></table>
          </div>
          <div class="ldg-det-side">${ldgActionButtons(nsa.name)}</div>
        </div>`;
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
