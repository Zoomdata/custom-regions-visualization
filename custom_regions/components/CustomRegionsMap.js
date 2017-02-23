/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 * Custom Regions map chart version 0.0.2
 */
/* global controller */

(function() {

  /*
  Help out the administrator who is configuring the map.  Make sure that all of the right
  variables are present and declared.
  */
  var validateVariables = function(vars) {
    var result = true;
    var message = '';
    return {
      result: result,
      message: message
    };
  }

  // The administrator creating this visualization goes to the chart Configuration
  //associated with the data source and
  try {
    userVariables = JSON.parse(controller.variables['Map Configuration']);
  }
  catch(e) {
    console.error('Unable to parse configuration string.  Make sure the confiuration string contains well formatted JSON');
    console.error(e.message);
    console.error('Configuration string is:', controller.variables['Map Configuration']);
    return;
  }

  validationResult = validateVariables(userVariables);
  if(!validationResult.result) {
    console.error('Error in the map configuration variables');
    console.error(validationResult.message);
    console.error('configuration variable:', userVariables);
  }
console.log('Incoming configuration:', userVariables);
  //Example setting the tile server parameters manually, in this case for OpenStreetMap Mapnik
  //userVariables.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //	maxZoom: 19,
  //	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  //});

  /*
  ****************
  End User Customization Section
  Everything from here down is visualization logic
  ****************
  */

  var dataLookup = {}; //this will contain the results from Zoomdata

  // create a div for the map and add the leaflet map
  var uuid = new Date().getTime();
  var mapId = 'map-' + uuid;

  var div = $(controller.element).append('<div id="' + mapId +
  '" style="width:100%; height:100%" />').find(mapId).first();

  $(div).addClass('map');

  var maxBounds = new L.LatLngBounds(
    new L.LatLng(userVariables.bounds.northEast.lat, userVariables.bounds.northEast.lon),
    new L.LatLng(userVariables.bounds.southWest.lat, userVariables.bounds.southWest.lon)
  );

  if(map !== undefined) {console.log('Map exists ', map);}
  var map = L.map('map-' + uuid, {
      maxBounds: maxBounds,
      minZoom: userVariables.bounds.minZoom
  }).setView(userVariables.initialExtent.centerPoint,
                                         userVariables.initialExtent.zoomLevel);

  var tileLayer = L.tileLayer.provider(userVariables.tileLayer.provider); //TODO: need to handle non-provider supported tile layers
  tileLayer.addTo(map);

  // Used when the view changes (zooming) to detect what region set to use
  function regionInZoomRange(region) {
      var result = false;
      var zoomLevel = map.getZoom();
      var minZoomLevel = region.minZoomLevel || 0;
      var maxZoomLevel = region.maxZoomLevel || 18; //18 is the default max zoom for leaflet TileLayer
      if(zoomLevel >= minZoomLevel && zoomLevel <= maxZoomLevel) {
          result = true;
      }
      return(result);
  }

    function updateRegionFilter(region) {
        var newFilter = [];
        var badGeom = 0;
        region.mapLayer.eachLayer(function(l) {
            var featureBounds = l.getBounds();
            //there seems to be an issue with multipolygons, or some issue with the way we are
            //reducing the data or generating topojson.  The bounds for some features is coming back {}
            try {
                if( map.getBounds().intersects(l.getBounds()) ) {
                    newFilter.push(l.feature.properties[region.regionField]);
                }
            } catch(e) {
                badGeom++;
            }
        });
        if(badGeom > 0) console.error('Found ', badGeom, ' invalid geometries when creating dynamic filter');
        console.log('Created filter with ' , newFilter.length, ' ' , region.regionField);
        region.filter = {
            path: region.groupName,
            value: newFilter,
            operation: 'IN'
        }
      }

    //Assuming that if this function is called there is some change that requires
    //a new filter.  Not checking to see if exact values are the same, just delete
    //any filters related to the map regions and create a new one.  Need to make
    //sure not to disturb any other filters user may have created (although if they
    //filter on a region field then that filter will be trashed.  Don't know any
    //way to avoid that, except not filtering - but that has other issues.  Maybe
    //make a check box and flag that the user can set to enable/disable auto-filtering)
    function setLayerFilter() {
        console.log('setting dynamic filter.  Current query filters:', controller.query.filters.get());
        var currRegion = getVisibleLayer();
        updateRegionFilter(currRegion);
        currFilters = controller.query.filters.get();
        //first, if there is no filter on the query create one
        if( currFilters.length !== 0 ) {
            userVariables.regionsConfig.forEach(function(r) {
                //some filter exists.  Search the list, remove any filters with
                //path that matches a region grouping
                var matchingFilter = currFilters.find(function(f) {
                    var result = false;
                    if(f.path === r.groupName) {
                        result = true;
                        controller.query.filters.removeFilters(f);
                    }
                    return result;
                });
            });
        }
        controller.query.filters.addFilters(currRegion.filter);
    }

  // Given a zoom level set the currently visible layer
  //and associated grouping in Zoomdata query
  function setCurrentLayer() {
console.log('Setting current layer');
    userVariables.regionsConfig.forEach(function(currRegion) {
        if(regionInZoomRange(currRegion)) {
            if(!currRegion.visible) {
                currRegion.visible = true;
                currRegion.mapLayer.addTo(map);
                var currGroup = controller.dataAccessors.region.getGroup();
                currGroup.name = currRegion.groupName;
                currGroup.limit = currRegion.numFeatures,
                controller.dataAccessors.region.setGroup((currRegion.groupName, currGroup));
            }
        } else {
            map.removeLayer(currRegion.mapLayer);
            currRegion.visible = false;
            if(controller.query.filters.length > 0) {
                controller.query.filters.removeFilters(currRegion.filter);
            }
        }
    });
  }

  function getVisibleLayer() {
      //NOTE:  this only works for one visible layer.  If users need to have multiple layers showing simultaneously then we need to return an array or something
      var result = userVariables.regionsConfig.find(function(currRegion) {
          if(currRegion.visible === undefined) {
              return false;
          }
          return currRegion.visible;
      });
      return result;
  }

  function getMetrics()  {
      var dataAccessors = controller.dataAccessors;
      var metrics = {};

      _.forOwn(dataAccessors, function(value, key) {
          if (value.TYPE === value.TYPES.METRIC ||
              value.TYPE === value.TYPES.MULTI_METRIC) {
              metrics[key] = value;
          }
      });

      return metrics;
  }

  function style(feature) {
      var id;
      var fillColor = 'rgb(245,245,245)'; //default to light grey
      var sym = { //default Symbol
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7,
              fillColor: fillColor
          };
var visibleRegion = userVariables.regionsConfig.find(function(currRegion) {
  if(currRegion.visible === undefined) {
      return false;
  }
  return currRegion.visible;
});
if(visibleRegion) {
id = feature.properties[visibleRegion.regionField]

      if (dataLookup && id in dataLookup) {
          fillColor = getMetrics().Color.color(dataLookup[id]);
          console.log('Found ', id, " setting fillColor to ", fillColor);
      }

      //style depends on shape.  For lines we don't have a fill, just border.  Points
      //are circles, so they are treated same as polygons

      switch(feature.geometry.type) {
      case 'LineString':
      case 'MultiLineString':
          sym = {
              weight: 3,
              opacity: 1,
              color: fillColor,
          };
          break;
      default:
        sym = { //default Symbol
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7,
              fillColor: fillColor
          };
      }
}
      return sym;
  }



  function createCustomRegionLayers(regions, map, style) {
      //Note, we are assuming that all features in a geojson are same type - not
      //mixing points with polygons, etc.
      regions.forEach(function(region) {
console.log('creating region:', window[region.regionData]);
            //Handle geojson different from topojson
          switch(window[region.regionData].type) {
              case 'FeatureCollection':
                  console.log('geojson')
                  switch(window[region.regionData].features[0].geometry.type) {
                  case 'Polygon':
                  case 'MultiPolygon':
                      region.mapLayer = L.geoJson(window[region.regionData], {
                          style: style,
                          onEachFeature: onEachFeature
                      });
                      break;
                  case 'Point':
                  case 'MultiPoint':
                      region.mapLayer = L.geoJson(window[region.regionData], {
                          pointToLayer: function(feature, latlng) {
                              return L.circleMarker(latlng, style);
                          },
                          style: style,
                          onEachFeature:onEachFeature
                      });
                      break;
                  case 'LineString':
                  case 'MultiLineString':
                      region.mapLayer = L.geoJson(window[region.regionData], {
                          style: style,
                          onEachFeature: onEachFeature
                      });
                      break;
                  }
                   //we use the number of features in the layer as the limit for the query to ZD
                    region.numFeatures = window[region.regionData].features.length;
                  break;
                case 'Topology':
                    var layer = L.geoJson(null, {
                          style: style,
                          onEachFeature: onEachFeature
                    });
                    region.mapLayer = omnivore.topojson.parse(window[region.regionData], {}, layer);
                    region.numFeatures = region.mapLayer.getLayers().length;
                    break;
        }
 //       region.filter = {};
      });
  }

  createCustomRegionLayers(userVariables.regionsConfig, map, style);
  setCurrentLayer();

  map.on('moveend', function(e) {
      //whenever the map is moved re-calculate the filter
      setLayerFilter();
  });

  map.on('zoomend', function(e) {
      setCurrentLayer();
  });

  function highlightFeature(e) {
      var layer = e.target;
      var feature = e.target.feature;
      layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
      });

      if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
      }

      currRegion = getVisibleLayer();
      featureId = feature.properties[currRegion.regionField];
      if (!(featureId in dataLookup)) {
          return;
      }

      var data = dataLookup[featureId];
      controller.tooltip.show({
          event: e.originalEvent,
          data: function() {
              return data;
          },
          color: function() {
              if (!(featureId in dataLookup)) {
                  return;
              }
              return getMetrics().Color.color(dataLookup[featureId]);
          }
      });
  }

  function resetHighlight(e) {
      getVisibleLayer().mapLayer.resetStyle(e.target);
      controller.tooltip.hide();
  }

  function featureDetails(e) {
      var feature = e.target.feature;

      if (!(currRegion.regionField in dataLookup)) {
          return;
      }

      controller.menu.show({
          event: e.originalEvent,
          data: function() {
              return dataLookup[currRegion.regionField];
          }
      });
  }

  function onEachFeature(feature, layer) {
      layer.on({
          mousemove: highlightFeature,
          mouseout: resetHighlight,
          click: featureDetails
      });
  }

  // Functions specific to the Zoomdata custom visualization
  controller.selection = function(selected) {
      if (selected) {
          map.dragging.enable();
          map.touchZoom.enable();
          map.scrollWheelZoom.enable();
          map.doubleClickZoom.enable();
          map.boxZoom.enable();
      } else {
          map.dragging.disable();
          map.touchZoom.disable();
          map.scrollWheelZoom.disable();
          map.doubleClickZoom.disable();
          map.boxZoom.disable();
      }
  };

  controller.update = function(data, progress) {
      // Called when new data arrives
      dataLookup = {};
      for (var i = 0; i < data.length; i++) {
          var item = data[i];
          dataLookup[item.group] = item;
      }

      userVariables.regionsConfig.forEach(function(region) {
          if(region.mapLayer !== undefined) {
              region.mapLayer.setStyle(style);
          }
      });
  };

  controller.resize = function(width, height, size) {
      // Called when the widget is resized
      map.invalidateSize();
  };

  controller.createAxisLabel({
      picks: 'Color',
      orientation: 'horizontal',
      position: 'bottom',
      popoverTitle: 'Color'
  });
}());
