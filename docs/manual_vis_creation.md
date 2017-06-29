If the import custom visualization step is not working, due to version issues or something else, the visualization can be created using Chart Studio.

Download the custom_regions.zip file to your machine, unzip it to a folder

Open custom_regions/components/styles.css in a text editor, select all and copy

In Zoomdata (as a user with administrator access) open chart studio and create a new custom chart based on the 'US States' chart

Highlight all of the code in 'styles.css' and paste the copied code

Select "zoomable-map.js" file.  Highlight all of the contents in zoomable-map.js and delete.

Open the custom_regions/components/CustomRegionsMap.js from the extracted archive using a text editor , select all text and copy

Paste the copied code into the empty zoomable-map.js file in Chart Studio.


Select the "Manage" button and "Libraries" from the menu

The top section is called "Included Libraries"; the bottom section is "Available Libraries".  Drag "us-states.js", "us-counties.js", "us-zipcodes.js" from the top section to the bottom, removing them from the active project

Still in the "Manage Libraries" dialog click the green "Add" button.  

Select "Choose file", browse to where you unzipped the downloaded custom_regions.zip file and find `custom_regions/libs/test_region_level1`, click "Open".  Change the name value to "test_region_level1.js" and click "Upload"
Repeat the process for "test_region_level2.js" and "test_region_level3.js"

In the "Manage Libraries" dialog drag all three of the newly added libraries from the bottom of the list (Scroll down) to the top section.  Click "Accept" when downloaded

Click the "Manage" button, select "Variables"
Rename the 'Group' variable to 'region'
Delete the other variable
Leave the color variable, need that

On the "Query" tab change the name of the "State" variable to "region"

On the "Constants" tab delete the "Tile Provider", "Limit", "County", "Tile Provider API Key", "Zip Code" variables (leaving "Chart Description" and "Chart Name" as the only two items in the Constants tab).  Click "Accept"





Proceed with the [main instructions](./Home.md) to configure.
