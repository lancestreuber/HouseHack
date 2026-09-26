#!/bin/bash
Q1='nwr["amenity"~"^(police|fire_station|post_office|library|childcare|kindergarten|community_centre|social_facility|pharmacy|clinic|doctors|dentist|hospital|bank|marketplace|food_bank)$"];nwr["emergency"="ambulance_station"];nwr["shop"~"^(laundry|dry_cleaning|supermarket|grocery|convenience|greengrocer|butcher|deli|variety_store)$"];'
i=0
for lat in "40.19 40.44" "40.44 40.68"; do for lon in "-80.36 -80.02" "-80.02 -79.69"; do
 set -- $lat; s=$1; n=$2; set -- $lon; w=$1; e=$2
 Q="[out:json][timeout:120][bbox:$s,$w,$n,$e];($Q1);out center tags;"
 for try in 1 2 3; do for M in https://overpass-api.de/api/interpreter https://overpass.kumi.systems/api/interpreter https://overpass.private.coffee/api/interpreter; do
   curl -s -m 150 -A "HouseHack/0.1 (hackathon research)" --data-urlencode "data=$Q" $M -o osm_tile_$i.json
   head -c 1 osm_tile_$i.json | grep -q '{' && break 2; sleep 20; done; done
 echo "tile $i $(head -c 60 osm_tile_$i.json | tr '\n' ' ')"; i=$((i+1)); done; done
