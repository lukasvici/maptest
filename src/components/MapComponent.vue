<template>
  <div id="map" class="map_view"></div>
  <pre id="features"></pre>
</template>

<script>
import maplibre from 'maplibre-gl';
import alien from "@/assets/marker.png"
var hoveredStateId = null
export default {
  name: "MapComponent",
  data() {
    return {
      marker: undefined
    }
  },
  mounted: function () {
    const mapStyle = 'http://192.168.24.120/style.json';

    const initialState = {
      lng: 44.494814,
      lat: 48.729922,
      zoom: 1
    }

    const map = new maplibre.Map({
      container: "map",
      style: `${mapStyle}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      fadeDuration:0,



    });
    map.showTileBoundaries = true;
    map.on("mousemove", function (e) {
      const features = map.queryRenderedFeatures(e.point)
      const displayProperties = [
        'type',
        'properties',
        'id',
        'layer',
        'source',
        'sourceLayer',
        'state'
      ]
      const displayFeatures = features.map((feat) => {
        const displayFeat = {}
        displayProperties.forEach((prop) => {
          displayFeat[prop] = feat[prop]
        })
        return displayFeat
      })
      document.getElementById('features').innerHTML = JSON.stringify(
          displayFeatures,
          null,
          2
      )
    })
    map.on("load",()=>{

    })

    map.on("load", ()=>{

      map.loadImage(alien,async (error,image)=>{
        if(error) throw error;
        map.addImage("marker",image)

        map.addSource("points",{"type":"geojson", "data":{"type":"FeatureCollection","features":[]}})
        map.addLayer({
          'id': 'points-image',
          "type": 'symbol',
          'source': 'points',
          "minzoom":13,
          'layout': {
            "icon-image":"marker",
            "icon-size":0.1
          },
          'paint': {
          }
        })
        map.addLayer({
          'id': 'points-circle',
          "type": 'circle',
          'source': 'points',
          "minzoom":11,
          "maxzoom":13,
          'paint': {
            'circle-radius': 6,
            'circle-color': '#ffffff', // red color
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000000'
          }
        })
      })
    })
    async function getmarkes() {
      var jsondata = {"type":"FeatureCollection","features":[]}
      var center = map.getCenter()
      var zoom = map.getZoom()
      if (zoom > 11){
        const responce = await fetch("http://192.168.25.107:3000/getmarkers", {method:"POST",headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },body:JSON.stringify({"position":center,"zoom":zoom})})
        console.log("POST")
        const data = await responce.json()
        if(data.markers){
          data.markers.forEach((el)=>{
            jsondata.features.push({"type":"Feature","geometry":{"type":"Point", "coordinates":[el.positions[0].lng,el.positions[0].lat]}})
          })
          map.getSource("points").setData(jsondata)
          data.markers.forEach(function(marker, j) {
            marker.positions = marker.positions.slice(1)
            marker.positions.forEach(async function(pos,i) {
              setTimeout(async function() {
                await animate(jsondata,j,i,data)
              }, i*1000)
            })
          })
        }
        else {
          jsondata.features = []
          map.getSource("points").setData(jsondata)
        }
      }



    }


    async function animate(jsondata,j,i,data) {
      var positions = []
      var n = 15

      var start = jsondata.features[j].geometry.coordinates
      console.log(map.getLayer("points"))
      var end = [data.markers[j].positions[i].lng,data.markers[j].positions[i].lat]
      for (var k = n; k > 0; k--) {
        positions.push({
          lat: start[1] * k / n + end[1] * (n - k) / n,
          lng: start[0] * k / n + end[0] * (n - k) / n
        });
      }
      for (let pos = 0; pos < positions.length; pos++) {
        setTimeout(() => {
          jsondata.features[j].geometry.coordinates = [positions[pos].lng, positions[pos].lat]
          map.getSource("points").setData(jsondata)
        }, pos * 1000/n)
      }
    }
    setInterval(() => {
      getmarkes()
    }, 3000)



    map.on('load', function () {
      map.setPaintProperty("place_label_city", 'text-opacity', [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0,
        0.9
      ])
    })
    map.on("click", "place_label_city", function (e) {
      hoveredStateId = e.features[0].id;
      console.log(hoveredStateId)
      map.setFeatureState(
          {source: 'osm', sourceLayer: "place_label", id: hoveredStateId},
          {hover: true}
      );
    })
  }
}
</script>

<style scoped>

</style>