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

Now you need to set the map configuration to link the data to the new polygon files.  The configuration is defined as a JSON formatted string that is pasted into one of the chart variables in the data source chart configuration page.

* In a text editor open [sample_data/custom_regions_config_sales_regions.json](/sample_data/custom_regions_config_sales_regions.json).  Select all and copy to the clipboard
* In Zoomdata open the Sources page and click on the "Custom Regions Test" data source
* Select the last tab, "Charts" and select the tab for "Custom"
* Click on the "Custom Regions" chart and scroll to the bottom of the configuration page
* Paste the clipboard contents into the "Map Configuration" field.  The text box will accept multiple lines, but they won't be formatted very nice
* Click "Save"

Now when you view the chart in Zoomdata it shows a set of notional sales regions when you are zoomed out.  As you zoom in it changes to states.  Also note that you can't zoom out past a certain point, the view stays over the contiguous United States.

Our test data source already has columns to support the new regions, so we don't need to change the data source.'

The JSON text you pasted in to the Map Configuration contains all of the configuration elements to make the map represent a new set of data and some map parameters to set the view.  The `initialExtent`, `bounds`, and `tileLayer` set some parameters for the map to center on the contiguous US and use OpenStreetMap for the background.

The `regionsConfig` array object says our polygons come from the "sales_areas" object, which is defined in the "us_sales_areas.js" library loaded above; the polygons in that file have a "name" property, which is assigned to the "regionField" member.  The data source has the corresponding values in the "sales_regions", so we assign that filed name to the "groupName" member.  Finally we specify a "maxZoomLevel" of 5, after the user zooms in 5 levels this layer will disappear.  Since we did not set a "minZoomLevel" this layer is visible all the way out to the global level.

Similarly, we set a second layer to be shown when the user zooms in to level 6 and lower.  This matches the states polygons to the State field in the data.

# Next Steps

Now you are ready to use your own polygons and data.  Note that your GeoJSON data must be assigned to a javascript variable by adding `var variableName =` at the start of the file. See [the instructions for creating a GeoJSON or TopoJSON file[(./creating_geojson.md).  Upload your file to the libraries set of the custom visualization.

Next, create a new configuration JSON string to connect your map data to the data in Zoomdata.  Use a text editor to create the string, then paste it into the Map Configuration field in the data source configuration.  There are 4 main blocks in the configuration file:

*initialExtent* sets a location for the initial view.  In this case when the user opens the map it will be centered on the contiguous United States.  By modifying the coordinates and zoom level you can have the map initially show any location.  For example:

```
"initialExtent": "{centerPoint: {lat:53.87, lon:15.55}, zoomLevel: 4};
```

Would center on Europe.  Or, if our date is in Australia, we could use:

```
"initialExtent": { "centerPoint": {"lat": -24.0,"lon":134.0 },"zoomLevel": 4}
```

The syntax is described in the setView method of the Leaflet documentation for the [map class](http://leafletjs.com/reference.html#map-class)

*bounds* sets the max extent for the map, which prevents the user from zooming out too far or panning the map outside of the area of interest.  If this parameter is left out then the user will be able to zoom out to a global view (and beyond, which looks a bit strange), and pan to any location on the map.  These variables are used when initializing the Leaflet map, setting the `minZoom` and `maxExtent` options.

*tileLayer* sets your preferred base map service. Any base map service compatible with the Leaflet library can be used.  See the Leaflet [TileLayer documentation](http://leafletjs.com/reference.html#tilelayer) for specifics.  Base maps can be hosted by a provider or from an on-premise server, provided they publish the service using a protocol compatible with Leaflet.  Include any API keys from the map provider as required.

*regionsConfig* is an array of objects containing one or more definitions for a region.  You must define at least one region.
* name of the variable containing the geoJSON
* the zoom levels to display the layer
  * `minZoomLevel` is the lowest resolution level to show this data, where 0 is global.  For example, you wouldn't want postal codes displayed for the entire world, but continental or country borders are appropriate.  Default is 0.
  * `maxZoomLevel` is the highest resolution level to show this layer, where the maximum value is defined by the tile layer you specified previously.  The lowest level is usually neighborhood or local street level.  Defaults to the maximum zoom level supported by the tile server
* name of the  property in the GeoJSON containing the shape name/id
* name of the attribute in Zoomdata for the group corresponding to the data
