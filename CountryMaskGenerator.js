// ============================================
// CountryMaskGenerator - Rasterizes GeoJSON polygons to a DataTexture
// Each country gets a unique ID encoded in RGB
// ============================================

import * as THREE from 'three';

export class CountryMaskGenerator {
    constructor(width = 4096, height = 2048) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.countryMap = new Map(); // ID -> country name
        this.colorToCountry = new Map(); // hex color -> country data
    }

    // Generate a unique color for each country ID
    // We encode the ID in RGB: R = high byte, G = mid byte, B = low byte
    idToColor(id) {
        const r = (id >> 16) & 0xFF;
        const g = (id >> 8) & 0xFF;
        const b = id & 0xFF;
        return { r: r / 255, g: g / 255, b: b / 255, hex: (r << 16) | (g << 8) | b };
    }

    colorToId(r, g, b) {
        return (r << 16) | (g << 8) | b;
    }

    // Convert lon/lat to canvas coordinates
    // lon: -180 to 180 -> 0 to width
    // lat: -90 to 90 -> height to 0 (inverted Y)
    lonLatToCanvas(lon, lat) {
        const x = ((lon + 180) / 360) * this.width;
        const y = ((90 - lat) / 180) * this.height;
        return { x, y };
    }

    // Clear the canvas
    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw a polygon to the canvas
    drawPolygon(coordinates, color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;

        // Handle both Polygon and MultiPolygon inner arrays
        // For a single polygon ring (array of [lon, lat] points)
        if (coordinates.length === 0) return;

        this.ctx.beginPath();

        const first = this.lonLatToCanvas(coordinates[0][0], coordinates[0][1]);
        this.ctx.moveTo(first.x, first.y);

        for (let i = 1; i < coordinates.length; i++) {
            const point = this.lonLatToCanvas(coordinates[i][0], coordinates[i][1]);
            this.ctx.lineTo(point.x, point.y);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    // Process a GeoJSON feature and draw it
    processFeature(feature, id) {
        const geometry = feature.geometry;
        const properties = feature.properties;
        const name = properties.ADMIN || properties.name || properties.NAME || 'Unknown';
        const isoCode = properties['ISO3166-1-Alpha-3'] || properties.ISO_A3 || '';

        const colorData = this.idToColor(id);
        const colorHex = `#${colorData.hex.toString(16).padStart(6, '0')}`;

        this.countryMap.set(id, { name, isoCode, id });
        this.colorToCountry.set(colorData.hex, { name, isoCode, id });

        if (geometry.type === 'Polygon') {
            // Single polygon with possible holes
            // coordinates[0] is outer ring, coordinates[1+] are holes
            const rings = geometry.coordinates;
            this.drawPolygonRing(rings, colorHex);
        } else if (geometry.type === 'MultiPolygon') {
            // Multiple polygons
            for (const polygon of geometry.coordinates) {
                this.drawPolygonRing(polygon, colorHex);
            }
        }

        return { id, name, isoCode };
    }

    // Draw a polygon with holes
    // polygon format: [[outerRing], [hole1], [hole2], ...]
    drawPolygonRing(polygon, colorHex) {
        const outerRing = polygon[0];
        const holes = polygon.slice(1);

        // Draw outer ring
        this.drawRing(outerRing, colorHex, false);

        // Draw holes (in black to erase)
        for (const hole of holes) {
            this.drawRing(hole, '#000000', true);
        }
    }

    // Draw a single ring (polygon outline and fill)
    drawRing(coordinates, color, isHole) {
        if (coordinates.length < 3) return;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const first = this.lonLatToCanvas(coordinates[0][0], coordinates[0][1]);
        this.ctx.moveTo(first.x, first.y);

        for (let i = 1; i < coordinates.length; i++) {
            const point = this.lonLatToCanvas(coordinates[i][0], coordinates[i][1]);
            this.ctx.lineTo(point.x, point.y);
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    // Generate the mask texture from GeoJSON data
    async generateMask(geojsonData) {
        console.log('Generating country mask texture...');
        this.clear();

        const features = geojsonData.features;
        const countries = [];

        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            const countryData = this.processFeature(feature, i + 1); // Start IDs at 1 (0 = no country)
            if (countryData) {
                countries.push(countryData);
            }
        }

        console.log(`Generated mask with ${countries.length} countries`);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        return {
            texture,
            countries,
            canvas: this.canvas,
            getPixelData: () => {
                return this.ctx.getImageData(0, 0, this.width, this.height);
            }
        };
    }

    // Get country ID at a specific UV coordinate
    // UV: (0,0) = bottom-left, (1,1) = top-right
    getCountryIdAtUV(u, v) {
        const x = Math.floor(u * (this.width - 1));
        const y = Math.floor((1 - v) * (this.height - 1)); // Flip Y

        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const id = this.colorToId(pixel[0], pixel[1], pixel[2]);

        return id;
    }

    // Get country info by ID
    getCountryById(id) {
        return this.countryMap.get(id);
    }
}
