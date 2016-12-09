/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
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

  // Given a zoom level set the currently visible layer
  //and associated grouping in Zoomdata query
  //TODO: filtering based on parent layer in view, like we do with states
  function setCurrentLayer() {

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
          }
      });
  }

  function getVisibleLayer() {
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

      //Figure out which variable to use for the rendering
      for(var i=0; i < userVariables.regionsConfig.length; i++) {
          currRegion = userVariables.regionsConfig[i];
          if(feature.properties[currRegion.regionField] !== undefined) {
              id = feature.properties[currRegion.regionField];
              break;
          }
      }

      if (dataLookup && id in dataLookup) {
          fillColor = getMetrics().Color.color(dataLookup[id]);
      }

      //style depends on shape.  For lines we don't have a fill, just border.  Points
      //are circles, so they are treated same as polygons
      switch(feature.geometry.type) {
      case 'LineString':
      case 'MultiLineString':
          var sym = {
              weight: 3,
              opacity: 1,
              color: fillColor,
          };
          break;
      default:
          var sym = {
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7,
              fillColor: fillColor
          };
          break;
      }

      return sym;
  }



  function createCustomRegionLayers(regions, map, style) {
      //Note, we are assuming that all features in a geojson are same type - not
      //mixing points with polygons, etc.
      regions.forEach(function(region) {
console.log('Adding region:', region);
          //handle each shape type appropriately
          switch(window[region.regionData].features[0].geometry.type) {
          case 'Polygon':
          case 'MultiPolygon':
              //if the map data is in TopoJSON we do a little special handling to generate the layer
              //Just doing a simple test to detect if it is a GeoJSON.  TopoJSON doesn't have
              //any easy identifiers.  Hopefully this works for all GeoJSON cases
              var shapes;
              if(window[region.regionData].type !== 'undefined' && window[region.regionData].type === 'FeatureCollection') {
                  shapes = window[region.regionData];
              } else {
                  shapes = omnivore.topojson(window[region.regionData]);
              }
              region.mapLayer = L.geoJson(shapes, {
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
      });
  }

  createCustomRegionLayers(userVariables.regionsConfig, map, style);
  setCurrentLayer();

  map.on('moveend', function(e) {
      //console.log('map moved, ', e);
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
  //here is the problem, setting style initially to wrong type
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
