These files are used in the tutorials for using and customizing the Custom Regions visualization.

* test_data.csv has multiple region identifier fields to demonstrate different geojson layers.  
  * _value_ contains a randomly generated number, useful for visualizing as a metric
  * _region_name_1_, _region_name_2_, _region_name_3_ contain an outline-numbered set of values.  These correspond to the test_region_levelX polygons in the geojson libraries set in the out-of-the-box custom visualization
  * _country_ contains a full country name, including 'Australia', 'Bolivia', 'Finland', 'Norway', 'Ukraine', 'United States' for displaying on a world map
  * _Country2_ contains the 2 letter FIPS code for the countries listed above, for use on a world map where the polygons are referenced by these values
  * _State_ is the full state name.  All rows have select 2nd level administrative names (as identified in GADM2) in this field, the state is appropriate for the country defined previously (e.g. 'Queensland', 'Northern Territory' for Australia, 'Texas', 'Virginia' for the U.S., etc)
  * _State2_ is the 2 letter code for U.S. states only
  * _County_: full name of the county, matched to state, for U.S. rows only as defined in GADM2 administrative level 2
  * _Zip_: Zip Code for U.S. rows only, aligns with the appropriate counties (postal codes not set for other countries)
  * _sales_regions_: combined blocks of states in the U.S. with a notional sales area name

This arrangement of data allows for multiple Custom Regions charts to be configured against the same dataset with support for multiple logical zoom levels.

This folder also includes the GeoJSON data corresponding to the above field values.

* _us_sales_areas.js_: blocks of contiguous states with a sales region name, corresponds to the _sales_regions_ field in the test_data file.  Set the layer configuration with

```
{
  regionData: sales_areas,
  groupName: 'sales_regions',
  regionField: 'name'
}
  ```

There is also a configuration to demonstrate how this custom visualization can be used to show point data.  The data set is locations of hydrocarbon exloration and production wells in Afghanistan, dated May 17, 2013 from https://catalog.data.gov/dataset/oil-and-gas-wells-of-afghanistan-wellsafg-shp has been converted to a GeoJSON format file with the required variable declaration, see wellsafg.js.  Load the wellsafg.csv file into Zoomdata.  Create a new custom viz based on this custom regions sample.  Upload the wellsafg.js file as a library in the new visualization.  Activate the new visualization on the wellsafg CSV data source and paste the contents of wellsafg.json as the configuration string for the chart.
