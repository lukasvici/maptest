<template>
 <div id="map" class="map_view"></div>
  <pre id="features"></pre>
</template>

<script>
import maplibre from 'maplibre-gl';

export default {
  name: "MapComponent",
  data(){
    return{
      marker: undefined
    }
  },
  mounted: function() {
    const mapStyle = 'http://storage.vtk-portal.ru:8081/maps/osm/style.json';

    const initialState = {
      lng: 11,
      lat: 49,
      zoom: 1
    }

   const map = new maplibre.Map({
     container: "map",
     style: `${mapStyle}`,
     center: [initialState.lng, initialState.lat],
     zoom: initialState.zoom,

    });
   map.on("click", function (e){
     const features = map.queryRenderedFeatures(e.point)
     console.log(features)
   })
   map.on("mousemove", function (e){
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

    // map.on("click", function (e) {
    //   if(this.marker != undefined){
    //     this.marker.remove()
    //   }
    //   this.marker = new maplibre.Marker().setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map);
    // });
    map.on('load', function () {
      map.loadImage(
          'https://maplibre.org/maplibre-gl-js-docs/assets/osgeo-logo.png',
          async function (error, image) {
            if (error) throw error;
            map.addImage('custom-marker', image);
            map.addSource('points',{'type': 'geojson', 'data': 'http://192.168.25.114:5500/geojson.json'});
            map.addLayer({
              'id': 'points',
              'type': 'symbol',
              'source': 'points',
              "workerCount": 2,
              'layout': {
                'icon-image': 'custom-marker',
                'text-field': [
                  'format',
                  ['get', 'name'],
                  { 'min-fraction-digits': 1, 'max-fraction-digits': 1 },
                ],
                'text-font': ['Open Sans Regular'],
                'text-size': 10
              },
            });
          }
      );
    });
    map.on('load', function () {

    })
    map.on("click", "points", function (e){
      alert(e.features[0].properties.name)
    })
    map.on('mouseenter', 'points', function () {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'points', function () {
      map.getCanvas().style.cursor = ''
    })
    // map.on("mousemove", function (){
    //   console.log(map.getLayer("points"))
    // })
  }
}
</script>

<style scoped>

</style>