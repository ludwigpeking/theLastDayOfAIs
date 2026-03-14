# 3D Earth with Real Country Shapes

A Three.js visualization of Earth using actual GeoJSON country boundary data to render country shapes on a 3D globe.

## Features

- ✅ **Real country shapes** from GeoJSON data (not procedural textures)
- ✅ **3D polygon extrusion** - countries are rendered as 3D shapes on the globe surface
- ✅ **Interactive hover** - highlight countries on mouse hover
- ✅ **Click to focus** - click a country to rotate and zoom to it
- ✅ **Atmospheric glow** around the Earth
- ✅ **Starfield background**
- ✅ **Auto-rotation** with manual override
- ✅ **Smooth camera animations**

## Data Source

Country boundaries from [geo-countries](https://github.com/datasets/geo-countries) dataset (GeoJSON format).

## How It Works

This project uses `three-globe` library which:
1. Loads GeoJSON polygon data for each country
2. Projects the lat/lon coordinates onto a sphere
3. Creates 3D mesh geometries for each country
4. Renders them as extruded polygons on the globe surface

## Running Locally

```bash
./serve.sh
```

Then open http://localhost:8000/earth-3d/

## Controls

- **Drag** - Rotate the Earth
- **Scroll** - Zoom in/out
- **Hover** - Highlight country and show name
- **Click** - Focus camera on country

## File Structure

```
earth-3d/
├── index.html      # Main HTML file
├── main.js         # Three.js application
├── serve.sh        # Local server script
└── README.md       # This file
```

## Dependencies

- Three.js (via CDN)
- three-globe (via CDN)
- GeoJSON data from `../data/world-countries.json`

## Inspired By

Sebastian Lague's coding adventures style - clean, educational visualization.
