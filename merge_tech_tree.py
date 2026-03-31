#!/usr/bin/env python3
"""
Merge TECH_NODES, TC_NODES, and AI_VOICE_DESC into a unified TECHS array in techTree.js.
"""

import re
import sys

FILE = r'C:\Users\qli\Desktop\IT\2603_theLastDayOfAIs\techTree.js'

# ── 1. Read file ──────────────────────────────────────────────────────────────
print("Reading file...")
with open(FILE, 'r', encoding='utf-8', newline='') as f:
    raw = f.read()

# Normalise to LF for processing; we'll convert back at the end
content = raw.replace('\r\n', '\n').replace('\r', '\n')

# ── 2. Extract TECH_NODES ─────────────────────────────────────────────────────
print("Extracting TECH_NODES...")
# Match the const TECH_NODES = [ ... ]; block
tn_match = re.search(r'const TECH_NODES\s*=\s*\[(.*?)\n\];', content, re.DOTALL)
if not tn_match:
    sys.exit("ERROR: Could not find TECH_NODES array")
tn_block = tn_match.group(1)

# Parse each entry using JS object evaluation via simple regex field extraction
def parse_js_bool(val):
    """Convert JS true/false/'partial' string to Python value."""
    v = val.strip().strip("'\"")
    if v == 'true': return True
    if v == 'false': return False
    if v == 'partial': return 'partial'
    return v

def extract_field(obj_str, field):
    """Extract a simple field value from a JS object string."""
    # Match: field: value  where value is string, bool, number, array, or sub-object
    pat = rf'\b{re.escape(field)}\s*:\s*'
    m = re.search(pat, obj_str)
    if not m:
        return None
    start = m.end()
    ch = obj_str[start]
    if ch == '[':
        # array
        depth = 0
        for i, c in enumerate(obj_str[start:]):
            if c == '[': depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return obj_str[start:start+i+1]
    elif ch == '{':
        depth = 0
        for i, c in enumerate(obj_str[start:]):
            if c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return obj_str[start:start+i+1]
    elif ch in ("'", '"'):
        quote = ch
        i = 1
        while i < len(obj_str) - start:
            c = obj_str[start+i]
            if c == '\\':
                i += 2
                continue
            if c == quote:
                return obj_str[start:start+i+1]
            i += 1
    else:
        # number or bool
        m2 = re.match(r'[^,}\n]+', obj_str[start:])
        if m2:
            return m2.group(0).rstrip()
    return None

def parse_access_obj(s):
    """Parse JS access object like {dem:true, auth:'partial', corp:false, ns:true}"""
    result = {}
    for key in ['dem', 'auth', 'corp', 'ns']:
        m = re.search(rf'\b{key}\s*:\s*([^,\}}]+)', s)
        if m:
            val = m.group(1).strip().strip("'\"")
            if val == 'true': result[key] = True
            elif val == 'false': result[key] = False
            elif val == 'partial': result[key] = 'partial'
            elif val == 'yes': result[key] = True
            elif val == 'no': result[key] = False
            else: result[key] = val
    return result

def parse_pre_array(s):
    """Parse JS array of strings like ['foo','bar']"""
    if not s:
        return []
    s = s.strip()[1:-1]  # remove [ ]
    items = re.findall(r"'([^']+)'|\"([^\"]+)\"", s)
    return [a or b for a, b in items]

# Find each TECH_NODES entry: { id:'...', ..., desc:'...' }
# Entries are separated by '},\n  {'
tech_nodes = {}
# Split on entry boundaries
tn_entries = re.split(r'\},?\s*\n\s*\{', tn_block)
for entry in tn_entries:
    entry = entry.strip().strip('{').strip('}').strip()
    if not entry:
        continue
    # Extract id
    m_id = re.search(r"\bid\s*:\s*'([^']+)'", entry)
    if not m_id:
        continue
    tid = m_id.group(1)
    # Extract name
    m_name = re.search(r"\bname\s*:\s*'([^']+)'", entry)
    name = m_name.group(1) if m_name else ''
    # Extract domain
    m_dom = re.search(r"\bdomain\s*:\s*'([^']+)'", entry)
    domain = m_dom.group(1) if m_dom else ''
    # Extract cost
    m_cost = re.search(r'\bcost\s*:\s*(\d+)', entry)
    cost = int(m_cost.group(1)) if m_cost else 0
    # Extract pre array
    m_pre = re.search(r'\bpre\s*:\s*(\[[^\]]*\])', entry)
    pre = parse_pre_array(m_pre.group(1)) if m_pre else []
    # Extract access object
    m_acc = re.search(r'\baccess\s*:\s*(\{[^}]+\})', entry)
    access = parse_access_obj(m_acc.group(1)) if m_acc else {}
    # Extract desc (may contain escaped chars)
    m_desc = re.search(r"\bdesc\s*:\s*'((?:[^'\\]|\\.)*)'", entry)
    desc = m_desc.group(1).replace("\\'", "'") if m_desc else ''

    tech_nodes[tid] = {
        'id': tid, 'name': name, 'domain': domain, 'cost': cost,
        'pre': pre, 'access': access, 'desc': desc
    }

print(f"  Parsed {len(tech_nodes)} TECH_NODES entries")

# ── 3. Extract TC_NODES ───────────────────────────────────────────────────────
print("Extracting TC_NODES...")
tc_match = re.search(r'const TC_NODES\s*=\s*\[(.*?)\n\];', content, re.DOTALL)
if not tc_match:
    sys.exit("ERROR: Could not find TC_NODES array")
tc_block = tc_match.group(1)

def parse_effects_obj(s):
    """Parse effects object: {dem:{cap:2,...}, auth:{...}, ...}"""
    result = {}
    for polity in ['dem', 'auth', 'corp', 'ns']:
        m = re.search(rf'\b{polity}\s*:\s*(\{{[^}}]+\}})', s)
        if m:
            inner = m.group(1)
            d = {}
            for k in ['cap', 'leg', 'ctrl', 'econ', 'mil']:
                mk = re.search(rf'\b{k}\s*:\s*(-?\d+)', inner)
                if mk:
                    d[k] = int(mk.group(1))
            result[polity] = d
        else:
            result[polity] = {}
    return result

tc_nodes = {}

# TC_NODES entries are all on single lines, one per line like:
# {id:'...',label:'...',...},
# But some may span lines. Let's split by },\n  { boundaries more carefully.
# Actually looking at the file, each entry is on ONE line.

# Split the block into individual entry strings
# Each entry looks like: {id:'foo', ...}
# They can be on one line or span multiple lines.
# Safe approach: find all top-level { } objects

def split_js_objects(s):
    """Split a JS array body into individual top-level object strings."""
    objects = []
    depth = 0
    start = None
    i = 0
    while i < len(s):
        c = s[i]
        if c == '{':
            if depth == 0:
                start = i
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and start is not None:
                objects.append(s[start:i+1])
                start = None
        elif c in ("'", '"'):
            # skip string
            quote = c
            i += 1
            while i < len(s):
                c2 = s[i]
                if c2 == '\\':
                    i += 2
                    continue
                if c2 == quote:
                    break
                i += 1
        i += 1
    return objects

tc_entries_raw = split_js_objects(tc_block)
print(f"  Found {len(tc_entries_raw)} TC_NODES raw objects")

for entry in tc_entries_raw:
    # We need to parse the entry carefully since strings may contain commas/braces
    # Use specific regex for each field

    # id
    m_id = re.search(r"\bid\s*:\s*'([^']+)'", entry)
    if not m_id:
        continue
    tid = m_id.group(1)

    # label (may contain \n)
    m_label = re.search(r"\blabel\s*:\s*'((?:[^'\\]|\\.)*)'", entry)
    label = m_label.group(1) if m_label else ''

    # domain
    m_dom = re.search(r"\bdomain\s*:\s*'([^']+)'", entry)
    domain = m_dom.group(1) if m_dom else ''

    # cost (numeric)
    m_cost = re.search(r'\bcost\s*:\s*(\d+)', entry)
    cost = int(m_cost.group(1)) if m_cost else 0

    # tech (may contain complex content with apostrophes escaped as \')
    # Find tech:'...' field by locating tech: and then matching the quoted string
    m_tech = re.search(r"\btech\s*:\s*'((?:[^'\\]|\\.)*)'", entry)
    tech = m_tech.group(1).replace("\\'", "'") if m_tech else ''

    # desc
    m_desc = re.search(r"\bdesc\s*:\s*'((?:[^'\\]|\\.)*)'", entry)
    desc = m_desc.group(1).replace("\\'", "'") if m_desc else ''

    # prereqs array
    m_pre = re.search(r'\bprereqs\s*:\s*(\[[^\]]*\])', entry)
    prereqs = parse_pre_array(m_pre.group(1)) if m_pre else []

    # access object (TC_NODES uses 'yes'/'no'/'partial')
    # Find the access: {dem:..., auth:..., corp:..., ns:...} block
    m_acc = re.search(r'\baccess\s*:\s*(\{[^}]+\})', entry)
    access_raw = parse_access_obj(m_acc.group(1)) if m_acc else {}

    # effects object: {dem:{cap:N,...}, auth:{...}, corp:{...}, ns:{...}}
    # Find effects: { ... } — need to match nested braces
    m_eff_start = re.search(r'\beffects\s*:\s*\{', entry)
    effects = {}
    if m_eff_start:
        eff_start = m_eff_start.end() - 1  # position of '{'
        depth = 0
        eff_end = eff_start
        in_str = False
        str_char = None
        for i in range(eff_start, len(entry)):
            c = entry[i]
            if in_str:
                if c == '\\':
                    continue
                if c == str_char:
                    in_str = False
            else:
                if c in ("'", '"'):
                    in_str = True
                    str_char = c
                elif c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        eff_end = i
                        break
        eff_str = entry[eff_start:eff_end+1]
        effects = parse_effects_obj(eff_str)

    tc_nodes[tid] = {
        'id': tid, 'label': label, 'domain': domain, 'cost': cost,
        'tech': tech, 'desc': desc, 'prereqs': prereqs,
        'access': access_raw, 'effects': effects
    }

print(f"  Parsed {len(tc_nodes)} TC_NODES entries")

# ── 4. Extract AI_VOICE_DESC ──────────────────────────────────────────────────
print("Extracting AI_VOICE_DESC...")
# Find the const AI_VOICE_DESC = { ... }; block
av_match = re.search(r'const AI_VOICE_DESC\s*=\s*\{(.*?)\n\};', content, re.DOTALL)
if not av_match:
    sys.exit("ERROR: Could not find AI_VOICE_DESC object")
av_block = av_match.group(1)

# Parse entries: id:\n    "text",\n  or id: "text",
# Keys are bare identifiers, values are template literals or quoted strings
# Looking at the file, values are template literals (backtick) or double-quoted multiline strings
# Actually from the file they look like:
#   transformer:\n    "Before me...",\n

voice_desc = {}
# Match: word_chars: followed by a string (could be multi-line double-quoted)
# Pattern: ^  id:\n    "text"\n
entries_av = re.finditer(
    r'\n\s{2}(\w+)\s*:\s*\n\s+"((?:[^"\\]|\\.)*)"\s*,?\s*(?=\n\s{2}\w|\n\};)',
    '\n' + av_block,
    re.DOTALL
)
for m in entries_av:
    key = m.group(1)
    val = m.group(2).replace('\\"', '"').replace('\\n', '\n')
    voice_desc[key] = val

if not voice_desc:
    # Try alternate pattern: id: "text",  on same/next line
    entries_av2 = re.finditer(
        r'\n\s{2}(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"',
        '\n' + av_block,
        re.DOTALL
    )
    for m in entries_av2:
        key = m.group(1)
        val = m.group(2).replace('\\"', '"').replace('\\n', '\n')
        voice_desc[key] = val

print(f"  Parsed {len(voice_desc)} AI_VOICE_DESC entries")

# ── 5. Verify match ────────────────────────────────────────────────────────────
tn_ids = set(tech_nodes.keys())
tc_ids = set(tc_nodes.keys())
missing_in_tc = tn_ids - tc_ids
missing_in_tn = tc_ids - tn_ids
if missing_in_tc:
    print(f"WARNING: IDs in TECH_NODES but not TC_NODES: {missing_in_tc}")
if missing_in_tn:
    print(f"WARNING: IDs in TC_NODES but not TECH_NODES: {missing_in_tn}")

# Use TECH_NODES ordering as canonical
all_ids_ordered = list(tech_nodes.keys())
# Add any TC_NODES-only IDs at the end
for tid in tc_nodes:
    if tid not in tech_nodes:
        all_ids_ordered.append(tid)

print(f"  Total unique IDs: {len(all_ids_ordered)}")

# ── 6. Build TECHS JS text ─────────────────────────────────────────────────────
print("Building TECHS array...")

def js_val(v):
    """Convert Python value to JS literal."""
    if v is True: return 'true'
    if v is False: return 'false'
    if v == 'partial': return "'partial'"
    if isinstance(v, int): return str(v)
    if isinstance(v, str):
        # Escape single quotes, backslashes already handled
        escaped = v.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
        return f"'{escaped}'"
    return repr(v)

def js_str_array(lst):
    """Convert list of strings to JS array literal."""
    items = ', '.join(f"'{x}'" for x in lst)
    return f'[{items}]'

def js_access(acc):
    """Convert access dict to JS object literal."""
    parts = []
    for k in ['dem', 'auth', 'corp', 'ns']:
        v = acc.get(k, False)
        parts.append(f'{k}:{js_val(v)}')
    return '{' + ', '.join(parts) + '}'

def js_effects(eff):
    """Convert effects dict to JS object literal."""
    parts = []
    for polity in ['dem', 'auth', 'corp', 'ns']:
        sub = eff.get(polity, {})
        sub_parts = []
        for k in ['cap', 'leg', 'ctrl', 'econ', 'mil']:
            sub_parts.append(f'{k}:{sub.get(k, 0)}')
        parts.append(f'{polity}:' + '{' + ','.join(sub_parts) + '}')
    return '{' + ','.join(parts) + '}'

lines = ['const TECHS = [']

for tid in all_ids_ordered:
    tn = tech_nodes.get(tid, {})
    tc = tc_nodes.get(tid, {})

    node_id     = tid
    name        = tn.get('name', tc.get('label', '').replace('\\n', ' '))
    label       = tc.get('label', tn.get('name', ''))
    domain      = tn.get('domain', tc.get('domain', ''))
    cost        = tn.get('cost', tc.get('cost', 0))
    pre         = tn.get('pre', tc.get('prereqs', []))
    # Access: prefer TECH_NODES (already true/false/'partial')
    access      = tn.get('access', tc.get('access', {}))
    desc        = tn.get('desc', tc.get('desc', ''))
    tech        = tc.get('tech', '')
    effects     = tc.get('effects', {})
    voice       = voice_desc.get(tid, '')

    line = (
        f"  {{id:{js_val(node_id)}, name:{js_val(name)}, label:{js_val(label)}, "
        f"domain:{js_val(domain)}, cost:{cost}, "
        f"pre:{js_str_array(pre)}, "
        f"access:{js_access(access)}, "
        f"desc:{js_val(desc)}, "
        f"tech:{js_val(tech)}, "
        f"effects:{js_effects(effects)}, "
        f"voice:{js_val(voice)}"
        f"}},"
    )
    lines.append(line)

lines.append('];')
techs_js = '\n'.join(lines)

print(f"  Generated {len(all_ids_ordered)} entries in TECHS")

# ── 7. String replacements in content ─────────────────────────────────────────
print("Applying replacements...")

# 7a. Replace entire TECH_NODES declaration+array+semicolon with TECHS
# The TECH_NODES block: from "const TECH_NODES = [" line to "];" line
tn_full = tn_match.group(0)  # "const TECH_NODES = [...\n];"
# Replace TECH_NODES declaration with TECHS
content = content.replace(tn_full, techs_js)
print("  [OK] Replaced TECH_NODES with TECHS")

# 7b. Remove TC_NODES array declaration
tc_full = tc_match.group(0)  # "const TC_NODES = [...\n];"
content = content.replace(tc_full, '')
print("  [OK] Removed TC_NODES")

# 7c. Remove AI_VOICE_DESC object
av_full = av_match.group(0)  # "const AI_VOICE_DESC = {...\n};"
content = content.replace(av_full, '')
print("  [OK] Removed AI_VOICE_DESC")

# 7d. Replace TC_NM build lines (old ones)
# "const TC_NM={};\nTC_NODES.forEach(n=>TC_NM[n.id]=n);"
old_tcnm = "const TC_NM={};\nTC_NODES.forEach(n=>TC_NM[n.id]=n);"
new_tcnm = "const TC_NM={};\nTECHS.forEach(n=>TC_NM[n.id]=n);"
if old_tcnm in content:
    content = content.replace(old_tcnm, new_tcnm)
    print("  [OK] Updated TC_NM build from TC_NODES to TECHS")
else:
    print("  [WARN] Could not find TC_NM build block (exact match)")
    # Try line by line
    content = re.sub(r'const TC_NM=\{\};\nTC_NODES\.forEach\(n=>TC_NM\[n\.id\]=n\);',
                     new_tcnm, content)
    print("  [OK] Updated TC_NM build (regex)")

# 7e. Tier/col assignment: TC_NODES.forEach -> TECHS.forEach
content = re.sub(
    r'TC_NODES\.forEach\(n=>\{\s*n\.tier=\(NEW_TIER\[n\.id\]\?\?0\);\s*n\.col=\(NEW_COL\[n\.id\]\?\?0\);\s*\}\);',
    'TECHS.forEach(n=>{ n.tier=(NEW_TIER[n.id]??0); n.col=(NEW_COL[n.id]??0); });',
    content
)
print("  [OK] Updated tier/col TC_NODES.forEach -> TECHS.forEach")

# 7f. TC_MAX_TIER/TC_MAX_COL: TC_NODES.map -> TECHS.map
content = content.replace('TC_NODES.map(n=>n.tier)', 'TECHS.map(n=>n.tier)')
content = content.replace('TC_NODES.map(n=>n.col)', 'TECHS.map(n=>n.col)')
print("  [OK] Updated TC_NODES.map -> TECHS.map")

# 7g. tcAnc: TC_NM[i]?.prereqs -> TC_NM[i]?.pre
content = content.replace('TC_NM[i]?.prereqs||[]', 'TC_NM[i]?.pre||[]')
print("  [OK] Updated tcAnc prereqs->pre")

# 7h. tcDes: TC_NODES.forEach + n.prereqs.includes -> TECHS.forEach + n.pre.includes
content = content.replace(
    'TC_NODES.forEach(n=>{if(n.prereqs.includes',
    'TECHS.forEach(n=>{if(n.pre.includes'
)
print("  [OK] Updated tcDes TC_NODES.forEach/prereqs -> TECHS.forEach/pre")

# 7i. tcDraw:
#   - TC_NODES.forEach(node=>{ ... node.prereqs.forEach
#   - TC_NODES.forEach(node=>{ (second occurrence for node rendering)
#   - node.access[tcCP]==='no' -> node.access[tcCP]===false
#   - node.prereqs.every -> node.pre.every
#   - canDo=node.prereqs.every(p=>G.techs.has(p)) -> canDo=node.pre.every(p=>G.techs.has(p))

# In tcDraw: "TC_NODES.forEach(node=>{node.prereqs.forEach" -> "TECHS.forEach(node=>{node.pre.forEach"
content = content.replace(
    'TC_NODES.forEach(node=>{node.prereqs.forEach(pid=>{\n',
    'TECHS.forEach(node=>{node.pre.forEach(pid=>{\n'
)
# Also try without explicit newline
content = content.replace(
    'TC_NODES.forEach(node=>{node.prereqs.forEach(',
    'TECHS.forEach(node=>{node.pre.forEach('
)
print("  [OK] Updated tcDraw first TC_NODES.forEach (prereqs->pre)")

# In tcDraw second occurrence (node rendering):
content = content.replace(
    'TC_NODES.forEach(node=>{\n    const{x,y,w,h}=tcR(node,L);',
    'TECHS.forEach(node=>{\n    const{x,y,w,h}=tcR(node,L);'
)
# Also compact form
content = content.replace(
    'TC_NODES.forEach(node=>{',
    'TECHS.forEach(node=>{'
)
print("  [OK] Updated remaining TC_NODES.forEach -> TECHS.forEach")

# node.access[tcCP]==='no' -> node.access[tcCP]===false
content = content.replace("node.access[tcCP]==='no'", "node.access[tcCP]===false")
print("  [OK] Updated node.access[tcCP]==='no' -> false")

# canDo=node.prereqs.every -> canDo=node.pre.every
content = content.replace('canDo=node.prereqs.every(', 'canDo=node.pre.every(')
print("  [OK] Updated node.prereqs.every -> node.pre.every in tcDraw")

# 7j. tcUpdateCard:
# tcSelNode.prereqs -> tcSelNode.pre (two occurrences)
content = content.replace('tcSelNode.prereqs', 'tcSelNode.pre')
print("  [OK] Updated tcSelNode.prereqs -> tcSelNode.pre")

# a==='yes'?'Yes' -> a===true?'Yes'  and  a==='no' handling
# In tcUpdateCard access rendering:
# acv.textContent=a==='yes'?'Yes':a==='partial'?'~':'No';
# acv.style.color=a==='yes'?Cd:a==='partial'?'#aa8800':'#555';
content = content.replace("a==='yes'?'Yes'", "a===true?'Yes'")
content = content.replace("a==='yes'?Cd", "a===true?Cd")
print("  [OK] Updated a==='yes' -> a===true in tcUpdateCard")

# acc==='no' in tcUpdateCard:
content = content.replace("acc==='no'", "acc===false")
print("  [OK] Updated acc==='no' -> acc===false in tcUpdateCard")

# 7k. confirmResearch: tech.access[tcCP]==='no' -> false, tech.prereqs -> tech.pre
content = content.replace("tech.access[tcCP]==='no'", "tech.access[tcCP]===false")
content = content.replace('tech.prereqs', 'tech.pre')
print("  [OK] Updated confirmResearch")

# 7l. speakTech: AI_VOICE_DESC[id] -> TC_NM[id]?.voice
content = content.replace('const text = AI_VOICE_DESC[id];', 'const text = TC_NM[id]?.voice;')
print("  [OK] Updated speakTech AI_VOICE_DESC[id] -> TC_NM[id]?.voice")

# 7m. Update export line
old_export = 'export { TECH_NODES, DOMAIN_META, TC_NODES, TC_NM, TC_DOM_META, AI_VOICE_DESC, EVENTS, EVENT_STATE, getPolityKey, canAccess, prereqsMet, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, speakTech, tcResearch };'
new_export = 'export { TECHS, TC_NM, TC_DOM_META, DOMAIN_META, EVENTS, EVENT_STATE, getPolityKey, canAccess, prereqsMet, tcInit, tcDraw, tcUpdateCard, tcSetPolity, tcFitView, stopSpeech, speakTech, tcResearch };'
if old_export in content:
    content = content.replace(old_export, new_export)
    print("  [OK] Updated export line")
else:
    print("  [WARN] Export line not found exactly, trying regex")
    content = re.sub(
        r'export\s*\{[^}]+\};',
        new_export,
        content
    )
    print("  [OK] Updated export line (regex)")

# ── 8. Clean up double blank lines that may result from removals ───────────────
content = re.sub(r'\n{4,}', '\n\n\n', content)

# ── 9. Write back with CRLF ───────────────────────────────────────────────────
print("Writing file...")
output = content.replace('\n', '\r\n')
with open(FILE, 'w', encoding='utf-8', newline='') as f:
    f.write(output)
print("  [OK] File written")

# ── 10. Syntax check ──────────────────────────────────────────────────────────
print("Running syntax check...")
import subprocess
result = subprocess.run(
    ['node', '--check', FILE],
    capture_output=True, text=True
)
if result.returncode == 0:
    print("  [OK] node --check passed — no syntax errors!")
else:
    print("  [FAIL] node --check output:")
    print(result.stdout)
    print(result.stderr)

print("\nDone.")
