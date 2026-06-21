const fs=require('fs');
const map=JSON.parse(fs.readFileSync('public/assets/maps/farm-v2.tmj'));
const objs=map.layers.filter(l=>l.type==='objectgroup').flatMap(l=>l.objects);
const fishingSpots = objs.filter(o=>o.name && (o.name.includes('laut') || o.name.includes('sungai') || o.name.includes('danau')));
console.log('Fishing spots found:', fishingSpots.map(o=>o.name));
