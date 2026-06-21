const fs = require('fs');
const path = require('path');

const mapPath = path.resolve('public/assets/maps/farm-v2.tmj');
console.log('Reading map:', mapPath);

if (!fs.existsSync(mapPath)) {
    console.error('Error: Map file not found at', mapPath);
    process.exit(1);
}

const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

let modified = false;

if (mapData.tilesets) {
    mapData.tilesets = mapData.tilesets.map(tileset => {
        if (tileset.source) {
            console.log('Found external tileset source:', tileset.source);
            // Resolve path relative to the map folder
            const tilesetPath = path.resolve(path.dirname(mapPath), tileset.source);
            console.log('Resolving tileset path to:', tilesetPath);
            
            if (fs.existsSync(tilesetPath)) {
                const tilesetData = JSON.parse(fs.readFileSync(tilesetPath, 'utf8'));
                console.log(`Embedding tileset "${tilesetData.name}" into map...`);
                
                // Merge tilesetData properties into current tileset entry, keeping firstgid
                const merged = {
                    firstgid: tileset.firstgid,
                    ...tilesetData
                };
                
                modified = true;
                return merged;
            } else {
                console.error('Error: Tileset file does not exist at:', tilesetPath);
            }
        }
        return tileset;
    });
}

if (modified) {
    fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2), 'utf8');
    console.log('Successfully embedded external tilesets and saved the map!');
} else {
    console.log('No external tilesets to embed (tilesets are already embedded).');
}
