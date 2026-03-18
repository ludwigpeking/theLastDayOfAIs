"""
Generate a spherically-correct normal map from a height map.
Usage:  python gen_normal.py [strength]   (default strength = 8)
Output: mapping/NormalMap_generated.png
"""

import sys
import math
import numpy as np
from PIL import Image

STRENGTH = float(sys.argv[1]) if len(sys.argv) > 1 else 8.0
IN_PATH  = 'mapping/height_Map.png'
OUT_PATH = 'mapping/NormalMap_generated.png'

print(f'Loading {IN_PATH} …')
h_img = Image.open(IN_PATH).convert('L')
W, H  = h_img.size
print(f'  {W}×{H}  strength={STRENGTH}')

heights = np.array(h_img, dtype=np.float32) / 255.0

# Sea mask — white = sea, black = land (resize to match height map)
SEA_PATH = 'mapping/seaMask.png'
print(f'Loading {SEA_PATH} …')
sea_img  = Image.open(SEA_PATH).convert('L').resize((W, H), Image.LANCZOS)
sea_mask = np.array(sea_img, dtype=np.float32) / 255.0   # 1.0 = sea, 0.0 = land

# Central differences
# U (longitude) wraps
hL = np.roll(heights,  1, axis=1)
hR = np.roll(heights, -1, axis=1)
# V (latitude) clamps at poles
hU = np.concatenate([heights[:1, :], heights[:-1, :]], axis=0)
hD = np.concatenate([heights[1:, :], heights[-1:, :]], axis=0)

dU = (hR - hL) * 0.5
dV = (hD - hU) * 0.5

# Spherical correction: longitude steps shrink by cos(lat) near poles
rows   = np.arange(H)
lats   = (0.5 - (rows + 0.5) / H) * math.pi
cosLat = np.maximum(np.cos(lats), 0.01)[:, np.newaxis]

# Land normals — derived from height map
nx_land = -dU / cosLat * STRENGTH
ny_land = -dV           * STRENGTH
nz_land = np.ones_like(nx_land)
len_land = np.sqrt(nx_land**2 + ny_land**2 + nz_land**2)
nx_land /= len_land;  ny_land /= len_land;  nz_land /= len_land

# Sea normals — flat (straight out from sphere = tangent-space 0,0,1)
nx_sea = np.zeros_like(nx_land)
ny_sea = np.zeros_like(ny_land)
nz_sea = np.ones_like(nz_land)

# Blend: sea_mask=1 → sea normal, sea_mask=0 → land normal
nx = nx_land * (1 - sea_mask) + nx_sea * sea_mask
ny = ny_land * (1 - sea_mask) + ny_sea * sea_mask
nz = nz_land * (1 - sea_mask) + nz_sea * sea_mask

# Re-normalize the blended result
length = np.sqrt(nx**2 + ny**2 + nz**2)
nx /= length;  ny /= length;  nz /= length

r = np.clip(nx * 0.5 + 0.5, 0, 1)
g = np.clip(ny * 0.5 + 0.5, 0, 1)
b = np.clip(nz * 0.5 + 0.5, 0, 1)

out = (np.stack([r, g, b], axis=2) * 255).astype(np.uint8)
Image.fromarray(out, 'RGB').save(OUT_PATH)
print(f'Saved {OUT_PATH}')
