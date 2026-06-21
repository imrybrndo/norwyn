const fs=require('fs');
const map=JSON.parse(fs.readFileSync('public/assets/maps/farm-v2.tmj'));
map.layers.filter(l=>l.type==='tilelayer').forEach(l=>{
    const data=l.data;
    for(let i=0;i<data.length;i++){
        if(data[i] > 0) {
            // Chest tile GID in Sunnyside is around 1968, but could be different depending on the tileset firstgid
            // Let's just print tiles > 0 in a 3x3 radius around 14, 15
            const x = i % l.width;
            const y = Math.floor(i / l.width);
            if(Math.abs(x - 14) <= 2 && Math.abs(y - 15) <= 2) {
                console.log(`Layer ${l.name} - Tile ${data[i]} at (${x}, ${y})`);
            }
        }
    }
});
