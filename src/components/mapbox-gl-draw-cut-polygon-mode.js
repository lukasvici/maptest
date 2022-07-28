import { geojsonTypes, updateActions, events } from "@mapbox/mapbox-gl-draw/src/constants";
import difference from "@turf/difference";

const SplitPolygonMode = {};
SplitPolygonMode.onSetup = function () {
    let main = this.getSelected()
        .filter((f) => f.type === "Polygon" || f.type === "MultiPolygon")
        .map((f) => f.toGeoJSON());


    return {
        main,
    };
};

SplitPolygonMode.toDisplayFeatures = function (state, geojson, display) {
    display(geojson);
    if(state.main.length > 0){
        this.changeMode("passing_mode_polygon", (cuttingpolygon) => {
            state.main.forEach((feature) => {
                if (
                    feature.geometry.type === geojsonTypes.POLYGON ||
                    feature.geometry.type === geojsonTypes.MULTI_POLYGON
                ) {
                    let afterCut = difference(feature, cuttingpolygon);
                    let newF = this.newFeature(afterCut);
                    newF.id = feature.id;
                    if(newF.features){
                        newF.features.forEach((el)=>{
                            this.select(el.id)
                            this.addFeature(el);
                            this.fireUpdate(el);
                        })
                        this.deleteFeature(newF.id)
                    }
                    else {
                        this.select(newF.id)
                        this.addFeature(newF);
                        this.fireUpdate(newF);
                    }


                }
            });
        })
    }else {
        this.changeMode("passing_mode_polygon")
        this.changeMode("simple_select")
    }


};

SplitPolygonMode.fireUpdate = function(newF) {

    this.map.fire(events.UPDATE, {
        action: updateActions.CHANGE_COORDINATES,
        features: newF.toGeoJSON()
    });

};

export default SplitPolygonMode;