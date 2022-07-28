<template>
  <div id="map" class="map_view"></div>
  <pre id="features"></pre>
</template>

<script>
import maplibre from 'maplibre-gl';
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import alien from "@/assets/marker.png"
import SplitPolygonMode from "./mapbox-gl-draw-cut-polygon-mode";
import mapboxGlDrawPassingMode from 'mapbox-gl-draw-passing-mode';
import polylabel from "polylabel";
// var hoveredStateId = null
export default {
  name: "MapComponent",
  mounted: function () {
    let HoverFeatureId = null

    //создание map
    const mapStyle = 'http://192.168.24.120/style.json';
    const initialState = {
      lng:   44.516976,
      lat: 48.707065,
      zoom: 20
    }
    const map = new maplibre.Map({
      container: "map",
      style: `${mapStyle}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      fadeDuration:0,
      attributionControl:true

    });
    map.showTileBoundaries = true;


   //создание map draw
    const modes = MapboxDraw.modes
    modes.passing_mode_polygon = mapboxGlDrawPassingMode(
        MapboxDraw.modes.draw_polygon
    )
    //Point замененный на Cut
    modes.draw_point = SplitPolygonMode
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      modes:modes,
      controls:{
        polygon:true,
        trash:true,
        //CutPolygon
        point:true,

      },
      userProperties:true,
    });

    //динамические точки с api
    async function postGetMarkers(center,zoom){
      const responce = await fetch("http://192.168.25.107:3000/getmarkers", {method:"POST",headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body:JSON.stringify({"position":center,"zoom":zoom})})
      return responce.json()
    }
    async function getMarkers() {
      const jsonData = {"type":"FeatureCollection","features":[]}
      const center = map.getCenter()
      const zoom = map.getZoom()
      if (zoom > 11){
        const data = await postGetMarkers(center,zoom)
        if(data.markers){
          data.markers.forEach((el)=>{
            jsonData.features.push({"type":"Feature","geometry":{"type":"Point", "coordinates":[el.positions[0].lng,el.positions[0].lat]}})
          })
          map.getSource("points").setData(jsonData)
          data.markers.forEach(function(marker, j) {
            marker.positions = marker.positions.slice(1)
            marker.positions.forEach(async function(pos,i) {
              setTimeout(async function() {
                await animate(jsonData,j,i,data)
              }, i*1000)
            })
          })
        }
        else {
          jsonData.features = []
          map.getSource("points").setData(jsonData)
        }
      }
    }
    async function animate(jsonData, j, i, data) {
      const positions = []
      const n = 30
      const start = jsonData.features[j].geometry.coordinates

      const end = [data.markers[j].positions[i].lng,data.markers[j].positions[i].lat]
      for (let k = n; k > 0; k--) {
        positions.push({
          lat: start[1] * k / n + end[1] * (n - k) / n,
          lng: start[0] * k / n + end[0] * (n - k) / n
        });
      }
      for (let pos = 0; pos < positions.length; pos++) {
        setTimeout(() => {
          jsonData.features[j].geometry.coordinates = [positions[pos].lng, positions[pos].lat]
          map.getSource("points").setData(jsonData)
        }, pos * 1000/n)
      }
    }
    setInterval(() => {
      getMarkers()
    }, 3000)

    //проверка feature нужен ли ему маркер при нажатии
    function checkFeatures(features){
      const listLayers = ["place_label_city", "building"]
      for(let e in features){
        if(listLayers.includes(features[e].layer.id)){
          return features[e]
        }
      }
      return undefined
    }
    //добавление всех иконок с сервера P.S. название = layer name
    function addMapImages(){
      const listImages = [{"layer_id":"building","href":"building.png"},{"layer_id":"place_label_city","href":"place_label_city.png"}]
      listImages.forEach((el)=>{
        map.loadImage(`http://192.168.25.211:5500/${el.href}`, async (error,image)=>{
          if(error) throw error
          map.addImage(el.layer_id,image)
        })
      })
    }
    //Вычесление точки для маркера
    function averagePosition(geometry){
      const centroid = polylabel(geometry)
      return [centroid[0],centroid[1]]
    }
    //анимация появления маркера
    async function animationCreateMarker(){
      let start = Date.now(); // запомнить время начала

      let timer = setInterval(async function() {
        // сколько времени прошло с начала анимации
        let timePassed = Date.now() - start;

        if (timePassed >= 200) {
          clearInterval(timer);
          return;
        }


        await drawAnimation(timePassed);

      }, 2);
    }
    async function drawAnimation(timePassed) {
      map.setLayoutProperty("onclick-image","icon-size",timePassed / 800)
    }
    //выделение здания при нажатии
    function setHoverEffect(e){
      removeHoverEffect()
      map.queryRenderedFeatures(e.point).forEach((feature)=>{
        if(feature.layer.id === "building"){
          HoverFeatureId = feature.id
          map.setFeatureState({source:"osm",sourceLayer:"building",id:HoverFeatureId}, {hover:true})
        }
      })
    }
    //удаление выделения здания
    function removeHoverEffect(){
      if(HoverFeatureId){
        map.removeFeatureState({source:"osm",sourceLayer:"building",id:HoverFeatureId})
      }
    }

    function setDataMarker(layerId,jsonDataPoint){
      map.setLayoutProperty("onclick-image","icon-image",layerId)
      map.setLayoutProperty("onclick-image","icon-size",0)
      map.getSource('onclick-point').setData(jsonDataPoint)
    }
    //создание маркера
    async function createMarker(e){
      if (draw.getMode() === "simple_select"){
        const jsonDataPoint = {"type":"FeatureCollection","features":[]}
        let feature = checkFeatures(map.queryRenderedFeatures(e.point))

        if (feature){
          const layerId = feature.layer.id
          const markerCoodinates = (feature.geometry.type === "Point"? feature.geometry.coordinates : averagePosition(feature.geometry.coordinates))
          if (markerCoodinates){
            jsonDataPoint.features = [{"type":"Feature","geometry":{"type":"Point", "coordinates":markerCoodinates}}]
            setDataMarker(layerId,jsonDataPoint)
            await animationCreateMarker()
          }
        }else {
          map.getSource('onclick-point').setData(jsonDataPoint)
        }
      }
    }

    map.on('load', function () {
      addMapImages()

      //загрузка картинки для динамических точек
      //TODO: перенести картинку на сервер
      map.loadImage(alien,async (error,image)=>{
        if(error) throw error;
        map.addImage("marker",image)
      })

      //создание истоника, слоев для динамических точек
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

      //создание источника, слоя для маркера
      map.addSource("onclick-point", {"type":"geojson","data":{"type":"FeatureCollection","features":[]}})
      map.addLayer({
        'id': 'onclick-image',
        "type": 'symbol',
        'source': 'onclick-point',
        'layout': {
          "icon-image":"marker",
          "icon-size":0,
          "icon-anchor":"bottom",
        },

        'paint': {
        }
      })

      //добавление кнопок draw
      map.addControl(draw,"top-left")
    })
    //клик
    map.on("click",async function (e) {
      await removeHoverEffect()
      await createMarker(e)

    })

    //клик на здание
    map.on("click","building",async (e)=>{
      if (draw.getMode() === "simple_select"){
        await setHoverEffect(e)
      }

    })

    //debug
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
  }
}
</script>