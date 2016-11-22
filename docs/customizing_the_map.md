These instructions guide you through changing the configuration of the custom regions visualization to point to different columns in the data set and a new set of polygons.  We specifically change from using the test polygons to a set of regions and states over the contiguous United States.  

* Return to Chart Studio
* Find the newly imported chart in the list and click the 'Edit' button in the same row
* Chart studio will display
* Click on the 'Manage' drop-down on the toolbar of Chart Studio and select 'Libraries'
* The top section is called "Included Libraries"; the bottom section is "Available Libraries".  Drag "test_region_level1.js", "test_region_level2.js", "test_region_level3.js" from the top section to the bottom, removing them from the active project
* Scroll in the list until you see the '+Add' button, click '+Add'
* In the 'Upload Library' dialog click "Choose file..." and browse to the location where you saved this repository; select the sample_data/us_sales_areas.js, click "Open"
* Change the name to "us_sales_areas.js" and click "Upload"
* Repeat the library upload process for the "gadm_us_states_simplified" file in the sample_data directory
* Back in the 'Manage Libraries' dialog scroll down to the end and find "us_sales_areas.js"; drag the file up to the 'Included Libraries' section at the top.  Repeat for "gadm_us_states_simplified.js"
* Click 'Accept'

Now you need to set the map configuration to link the data to the new polygon files.  The configuration defined in the 'userVariables' object sets the parameters for the map.  The `userVariables` parameters are all at the top of the `CustomRegionsMap.js` file.  The sample code as uploaded centers on the USA, uses OpenStreetMap, and has 3 layers of map data specified.

* In chart studio make sure "CustomRegionsMap.js" is open in the code editor
* Locate the `userVariables.regionsConfig = [{` (around line 36)
* Highlight all of that variable declaration, about 25 lines, and delete
* Paste the following code in the location of the deleted lines
```
userVariables.regionsConfig = [{
  regionData: sales_areas,
  groupName: 'sales_region',
  regionField: 'name',
  maxZoomLevel: 5
},{
  regionData: states,
  groupName: 'State',
  regionField: "STATE_2",
  minZoomLevel: 6
}];
```
This block re-defines the map layers.  Our test data source already has columns to support the new regions, so we don't need to change the data source.  The first array object says our polygons come from the "sales_areas" object, which is defined in the "us_sales_areas.js" library loaded above; the polygons in that file have a "name" property, which is assigned to the "regionField" member.  The data source has the corresponding values in the "sales_regions", so we assign that filed name to the "groupName" member.  Finally we specify a "maxZoomLevel" of 5, after the user zooms in 5 levels this layer will disappear.  Since we did not set a "minZoomLevel" this layer is visible all the way out to the global level.

Similarly, we set a second layer to be shown when the user zooms in to level 6 and lower.  This matches the states polygons to the State field in the data.

# Next Steps

Now you are ready to use your own polygons and data.  Note that your GeoJSON data must be assigned to a javascript variable by adding `var variableName =` at the start of the file. Then upload the file to the libraries set of the custom visualization.

The `regionsConfig` object contains one or more definitions for a region.  You must define at least one region.
* name of the variable containing the geoJSON
* the zoom levels to display the layer
  * `minZoomLevel` is the lowest resolution level to show this data, where 0 is global.  For example, you wouldn't want postal codes displayed for the entire world, but continental or country borders are appropriate.  Default is 0.
  * `maxZoomLevel` is the highest resolution level to show this layer, where the maximum value is defined by the tile layer you specified previously.  The lowest level is usually neighborhood or local street level.  Defaults to the maximum zoom level supported by the tile server
* name of the  property in the GeoJSON containing the shape name/id
* name of the attribute in Zoomdata for the group corresponding to the data

You can customize the `userVariables.initialExtent` values as appropriate for your data; there are a couple of examples commented in the code.  If your dataset is not centered over the U.S. then you should change these values so the map shows a relevant location when it first comes up.  The syntax is described in the setView method of the Leaflet documentation for the [map class](http://leafletjs.com/reference.html#map-class)

You can also set your preferred base map service. Any base map service compatible with the Leaflet library can be used.  See the Leaflet [TileLayer documentation](http://leafletjs.com/reference.html#tilelayer) for specifics.  Base maps can be hosted by a provider or from an on-premise server, provided they publish the service using a protocol compatible with Leaflet.  Include any API keys from the map provider as required.

# User Configuration Object
Here is the userVariables object, as provided in the custom_regions sample:

```
#!javascript
var userVariables = {};
//Set the initial map extent.  This is what part of the world will be shown
//when the user first opens the visualization.  The extent consists of a
//center point lat/lon and a zoom level.  Zoom level is an integer between 0 and X, where
//0 is the whole world and X is the most detailed level as defined by the tile layer selected
//Some examples:
// United States (contiguous):
userVariables.initialExtent = {centerPoint: {lat:37.8, lon:-96}, zoomLevel: 4};
// Europe:
//userVariables.initialExtent = {centerPoint: {lat:53.87, lon:15.55}, zoomLevel: 4};
// Australia:
//userVariables.initialExtent = {centerPoint: {lat: -25.08, lon: 134.26}, zoomLevel: 4};


//Specify the tile layer to show in the background of the map using either the
//provider from leaflet-extras or by setting the parameters yourself

//Using leaflet provider, as described at https://github.com/leaflet-extras/leaflet-providers
userVariables.tileLayer = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');

//Example setting the parameters manually, in this case for OpenStreetMap Mapnik
//userVariables.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//	maxZoom: 19,
//	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//});

//Load and configure the regions to use for data display.  Regions must be in
//GeoJSON format.  Multiple regions can be set to show data at different zoom
//levels with different join fields.  This array must contain at least one element.
userVariables.regionsConfig = [{
    //The geoJSON containing the regions.  You _could_ put the whole geoJSON payload
    //here, but that might make things a bit difficult to read
    regionData: test_region_level1,
    //The chart needs 2 fields to render the data.  First, the field in the data
    //source containing the region name/id
    groupName: 'region_name1',
    //next, the name of the field in the geoJSON containing the same name/id
    regionField: 'name_1',
    //optionally you can set the min/max zoom levels for this layer
    //minZoomLevel not set, so will be shown out to global
    //if zoom levels overlap only the first one hit will be shown
    maxZoomLevel: 4 //won't show when zoomed in past level 10
},{
    regionData: test_region_level2,
    groupName: 'region_name2',
    regionField: 'name_2',
    minZoomLevel: 5,
    maxZoomLevel: 7
},{
    regionData: test_region_level3,
    groupName: 'region_name3',
    regionField: 'name_3',
    minZoomLevel: 8
    //maxZoomLevel not set, so will be shown all the way to most detailed
}];

/*
****************
End User Customization Section
Everything from here down is visualization logic
****************
*/

```
