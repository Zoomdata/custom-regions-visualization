# Custom Regions Visualization Installation and Configuration

## Requirements
You need:

* A server runningZoomdata 2.5.x or 2.6.x
* An account in Zoomdata with membership in the Administrators group, 
so you can access data source configuration and chart Studio
* Download or clone this repository to your local workstation
* The Zoomdata Custom Chart Command Line Interface installed on your workstation. 
See https://www.npmjs.com/package/zoomdata-chart-cli for instructions.
* To customize the visualization you need one or more GeoJSON or TopoJSON files with your spatial data.  Each shape must have a property containing some name or other identifier
 
**Note, the visualization supports GeoJSON with polygons (regions), points, and lines, and TopoJSON with polygons.  All features in a single file must have the same geometry type (don't mix points and polygons, etc)**

* A data source that has an attribute containing the same names as the property in the GeoJSON; the data source should already be configured in Zoomdata
* Enough understanding of Javascript to be able to edit the code using Chart Studio in Zoomdata; some knowledge of how to debug Javascript in the browser console

## Installation

In order to install the custom chart you need to create a .zip file containing all of the artifacts.  Using your operating system's file explorer or a tool such as WinZip bundle all of the files and subfolders in the `custom_regions` folder of this repo into a single zip file.  The zip file should contain:
* version
* visualization.json
* components/CustomRegionsMap.js
* components/style.css
* libs/geojson-utils.js
* libs/leaflet-omnivore.min.js
* libs/leaflet_0.7.2.js
* libs/lodash.min.js
* libs/test_region_level1.js
* libs/test_region_level2.js
* libs/test_region_level3.js
* libs/topojson.js

**The version configured in this repository is 2.6.x.  To import the visualization into 2.5.x edit the `version` file with the value matching the version of your Zoomdata installation, then create the .zip file.**


Once the file is created use the CLI to add the chart to your Zoomdata server.  Open a command prompt and
change to the directory containing the zip file created above.  Enter the following command:

`zd-chart add -a <http[s]://<serveraddress>:<port>/<zoomdata> -u <username>:<password> "<chart name>" <filename.zip>`

Substitute the appropriate values in each of the fields above.  For example, an actual command might be:

`zd-chart add -a https://zdserver.zoomdata.com:443/zoomdata -u developer:Password "Custom Regions" ./custom_regions.zip`

### Configure the Data Source
The custom visualization in this repository is configured with a set of test polygons at 3 zoom levels.  The associated data file is in the /sample_data folder of this project.  To get the chart to work out of the box, first add this data set to Zoomdata.

* Open the data source configuration page
* Click on the "Flat File" icon in the "Add a New Data Source" section
* For "Source Name" enter "Custom Regions Sample Data" and click "Next"
* Click the "Add File" button and brows to "test_data.csv" in this repository.  The page will display the fields and first few rows from the file
* For the columns "Region Name 1" and "Region Name 2" change the type from "integer" to "attribute"
* Click "Next", then "Next" again on the field configuration page
* On the Charts configuration page click the "Custom" tab on the left panel and select the custom visualization added previously
* In the chart configuration set the default fields.  In particular, configure the color palette/range you want to use (other values will be overridden in later configuration)
* Finally, for the magic step, open the [sample_data/custom_regions_config_hierarchy-regions.json](sample_data/custom_regions_config_hierarchy-regions.json) file in a text editor, select all text, and copy it to the clipboard.  In Zoomdata paste the text into the "Map Configuration" box.  It is a single line text box, but accepts multi-line data. We'll talk details of this file later.
* Click 'Finish'

### View the Chart

### Customize the Custom Regions Custom Visualization!

The polygons used in this example are useless for actual work - they don't relate to any real-world data, but do provide a good example of how the visualization works and helps you verify that the installation is correct.

The next step shows you how to customize the map to use a different set of polygons.  Continue with [those instructions](./customizing_the_map.md)


# Advanced Configurations
Once you have the map working with a data source and the appropriate polygons there are other ways you can use the visualization.

## Multiple Custom Region Visualizations

You can have multiple custom regions charts, each with a different set of regions or data source configurations.  If you have data sets that are using the same set of GeoJSON/TopoJSON regions then you can set the Map Configuration variable in the data source chart configuration.

If you have different regions then you have a couple of options:
* Add the map data as additional libraries to the same custom visualization.  The risk here is that, if the files are large, it could slow down the loading and rendering of the map
* Create a new custom visualization with those specific map files.  Repeat the installation/import and customization process to tailor a new chart to a different set of parameters.  

## Different Data Sources
One custom_regions chart that is loaded can be used against multiple data sources in Zoomdata, provided those data sources have the same field configuration for the region ID.  For example, one table contains sales_value while a different table tracks site_visits; both tables have a field named 'sales_region' with the same set of region names.  Both of these sources can have the newly added visualization associated with them.

## Different Regions

Repeat the import process to create a new custom visualization and perform the full customization for the map.  You will need to import the new GeoJSON files.

## Other versions of Zoomdata

This chart _should_ be compatible with Zoomdata version 2.2.x.  However, the custom visualization import process checks version numbers and does not allow the chart to be imported.  It is possible to create the custom visualization manually by following [these instructions](./manual_vis_creation.md).
