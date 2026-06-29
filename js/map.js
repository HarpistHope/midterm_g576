// map.js manages map layer loading and configurations 
export function initMap(viewContainerId, apiKey) {
    return new Promise((resolve, reject) => {
        require([           // I start by calling all the esri layers I use for this app
            "esri/config", 
            "esri/Map", 
            "esri/views/MapView", 
            "esri/layers/TileLayer", 
            "esri/layers/FeatureLayer",
            "esri/widgets/Legend",
            "esri/widgets/Expand",
            "esri/widgets/Zoom",
            "esri/widgets/Editor"
        ], (esriConfig, Map, MapView, TileLayer, FeatureLayer, Legend, Expand, Zoom, Editor) => {
            
            // I wrap the script in a try/catch statement to help monitor for/catch errors
            try {

                // defined in main.js
                esriConfig.apiKey = apiKey; 

                // Attribution: Esri, Garmin, GIS User Community (I preferred the look of the Nova basemap over the dark canvas basemap from my abstract)
                const map = new Map({
                    basemap: "arcgis-nova"
                });

                // Construct the map view
                const view = new MapView({
                    container: viewContainerId,
                    map: map,
                    center: [-86.40, 45.00], // over Lake Michigan 
                    zoom: 5,

                    // I added constraints to improve rendering/load time by restricting the map from panning/zooming to global scales
                    constraints: {
                        minZoom: 5, 
                        maxZoom: 11,
                        geometry: {   
                            type: "extent", // Extent bounding box centered around Michigan
                            xmin: -90.5,
                            ymin: 41.5,
                            xmax: -82.0,
                            ymax: 49.0
                        }
                    },

                    // define popup default behavior and position
                    popup: {
                        dockEnabled: true,
                        dockOptions: {
                            buttonEnabled: false, 
                            breakpoint: false,    
                            position: "bottom-center" 
                        }
                    },

                    // Manually remove the default widgets (except for attributions)  so I can manually add the zoom widget in a specific index position
                    ui: {
                        components: ["attribution"]
                    }

                }); // end of const view setup

                // Shipwreck popup template
                const shipwreckPopup = {
                    title: "Shipwreck: {Vessel}",
                    expressionInfos: [{

                        // I added a difficulty safety advisory to highlight the most critical info users should see
                        name: "difficulty-warning",
                        title: "Safety Advisory",

                        // I discovered I can add emojis to the popups! 
                        expression: ` 
                            if ($feature.ScubaDifficulty == 'Advanced') {
                                return '⚠️ ADVANCED DIVE: Proper training and equipment required.';
                            } else if ($feature.ScubaDifficulty == 'Technical') {
                                return '🚫 TECHNICAL DIVE: Deep water.';
                            } else {
                                return '✅ Dive Difficulty: ' + $feature.ScubaDifficulty;
                            }
                        `
                    }],

                    //  building the popup - first the warning, then a table with the basic attribute info, then a section that pulls from the description attribute
                    content: [{
                        type: "text",
                        text: `
                            <div class="popup-advisory">
                                {expression/difficulty-warning}
                            </div>
                            <table class="esri-widget__table popup-table">
                                <tr><th>Vessel Type:</th><td>{VesselType}</td></tr>
                                <tr><th>Year Built:</th><td>{Built}</td></tr>
                                <tr><th>Year Lost:</th><td>{LostYR}</td></tr>
                                <tr><th>Depth:</th><td>{Depth}</td></tr>
                                <tr><th>Cargo:</th><td>{Cargo}</td></tr>
                                <tr><th>Paddler Accessible:</th><td>{SnorkelKayakAssessible}</td></tr>
                            </table>
                            <p class="popup-description">{Description}</p>
                        `
                    }]
                };

                // Underwater Preserves popup
                const preservesPopup = {
                    title: "{BP_Name}",
                    // this is much simpler than the shipwreck popup - just a general statement about underwater preserves, the acreage, and a link to a webpage with more details. 
                    content: `
                        <div class="popup-preserve-content">
                            <p>The <b>{BP_Name}</b> protects historic shipwrecks and unique maritime archaeological sites across the Great Lakes.</p>
                            <table class="esri-widget__table popup-table">
                                <tr>
                                    <th>Protected Area:</th>
                                    <td>{Acres} Acres</td>
                                </tr>
                            </table>
                            <a href="{HT_Link}" target="_blank" class="esri-button esri-button--secondary">Explore More &rarr;</a>
                        </div>
                    `
                };

                // Dive Sites Popup - pretty straight forward, shows the info collected in the Survey123 form
                const sitesPopup = {
                    title: "Crowdsourced Dive Site",
                    content: `
                        <div class="popup-crowdsourced-content">
                            <table class="esri-widget__table popup-table layout-fixed">
                                <tr>
                                    <th>Difficulty:</th>
                                    <td class="text-bold">{scuba_difficulty}</td>
                                </tr>
                                <tr>
                                    <th>Date Logged:</th>
                                    <td>{date_of_entry}</td>
                                </tr>
                            </table>
                            <h4 class="popup-section-title">Current Conditions</h4>
                            <p class="popup-text-optional">{current_conditions_optional}</p>
                            <h4 class="popup-section-title">Site Description</h4>
                            <p class="popup-text-main">{site_description_optional}</p>
                        </div>
                    `
                };

                // Dive Events Popup - also straightforward, similar to above
                const eventsPopup = {
                    title: "Crowdsourced Dive Event",
                    content: `
                        <div class="popup-crowdsourced-content">
                            <table class="esri-widget__table popup-table layout-fixed">
                                <tr>
                                    <th>Event Date:</th>
                                    <td class="text-bold text-alert">{event_date}</td>
                                </tr>
                                <tr>
                                    <th>Meetup Time:</th>
                                    <td>{meetup_time}</td>
                                </tr>
                                <tr>
                                    <th>Target Difficulty:</th>
                                    <td>{scuba_difficulty}</td>
                                </tr>
                                <tr>
                                    <th>Expected Max Depth:</th>
                                    <td>{expected_max_depth_in_feet} ft</td>
                                </tr>
                                <tr>
                                    <th>Est. Duration:</th>
                                    <td>{expected_duration_optional} hours</td>
                                </tr>
                            </table>
                            <h4 class="popup-section-title">Additional Details</h4>
                            <p class="popup-text-main">{additional_details_optional}</p>
                            <div class="popup-attribution">Organized by: {Creator}</div>
                        </div>
                    `
                };

                // Custom renderers configurations
                // I customized the preserves layer color to orange so the user can see the layer more clearly (it was initially the same blue as the bathymetry layer)
                const preservesRenderer = {
                    type: "simple",
                    symbol: {
                        type: "simple-fill", 
                        color: [255, 110, 0, 0.20], 
                        outline: { color: [255, 85, 0, 0.85], width: 1.5 }
                    }
                };

              // customize sites renderer/icon (original scuba icon attribution: Scuba by Yosua Bungaran from Noun Project (CC BY 3.0) -- edited on Canva by Hope McBride)
                const sitesRenderer = {
                    type: "simple",
                    symbol: { type: "picture-marker", url: "images/noun-scuba-canva.png", width: "24px", height: "24px" }
                };

                // customize events renderer/icon (events icon attribution: Calendar by BEARicons from Noun Project (CC BY 3.0) --- edited by Hope McBride on Canva)
                const eventsRenderer = {
                    type: "simple",
                    symbol: { type: "picture-marker", url: "images/noun-calendar-canva.png", width: "24px", height: "24px" }
                }; 

                // Initialize/load the tile/feature layers
                const bathymetryLayer = new TileLayer({
                    url: "https://tiles.arcgis.com/tiles/As5CFN3ThbQpy8Ph/arcgis/rest/services/Bathymetry_of_the_Great_Lakes/MapServer",
                    resampling: true, // added so the layer would still render (if pixilated) when zoomed in
                    maxScale: 0 // I added this to force the layer to continue resampling without a scale limit (otherwise the layer would snap away too early/when the map was too zoomed out)
                });
                map.add(bathymetryLayer); 

                // Load underwater preserves feature layer
                const preservesLayer = new FeatureLayer({
                    url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/Great_Lakes_Underwater_Preserves/FeatureServer",
                    id: "preserves-layer", // assigning an ID to preserves layer and point feature layers to use in the zoom/center click event listener (see main.js)
                    renderer: preservesRenderer, 
                    popupTemplate: preservesPopup  
                });
                    map.add(preservesLayer);

                // Load Shipwreck Feature Layer
                const shipwreckLayer = new FeatureLayer({
                    url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/MUPC_Shipwreck_Locations_2020_view/FeatureServer",
                    id: "shipwrecks-layer",
                    popupTemplate: shipwreckPopup
                    });
                map.add(shipwreckLayer);

                // Create/load dive sites feature layer from feature service (dive site survey results)
                const sitesLayer = new FeatureLayer({ 
                    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/survey123_545711b0719d4502811e6c2c705bf508_results/FeatureServer",
                    id: "sites-layer",
                    renderer: sitesRenderer,
                    popupTemplate: sitesPopup
                });
                map.add(sitesLayer);

                // Create/load dive events feature layer from feature service (events survey results)
                const eventsLayer = new FeatureLayer({ 
                    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/survey123_930afbf904a4467f970813922117a325_results/FeatureServer",
                    id: "events-layer",
                    renderer: eventsRenderer,
                    popupTemplate: eventsPopup
                });
                map.add(eventsLayer);

                 // One main feature of my app is the unified control panel that allows users to toggle feature layers and filter by certain attributes
                // I first tried to use a layers list but that widget does not have Filter by Attribute capabilities so I had to custom make a new panel
                 // As the design became fairly technical, I utilized the AI assistant to help explain and implement the full panel design

                //Create a styled container for the unified control panel
                const controlPanelContainer = document.createElement("div");
                controlPanelContainer.classList.add("control-panel-container");

                // Define the custom HTML structure (toggles + multiple select dropdowns)
                controlPanelContainer.innerHTML = `
                    <h3 class="panel-main-title">Map Controls</h3>
                    <div class="panel-section-group">
                        <span class="panel-section-title">Toggle Layers</span>
                        <label><input type="checkbox" id="toggleBathymetry" checked> Great Lakes Bathymetry</label>
                        <label><input type="checkbox" id="togglePreserves" checked> Underwater Preserves</label>
                        <label><input type="checkbox" id="toggleShipwrecks" checked> Historic Shipwrecks</label>
                        <label><input type="checkbox" id="toggleSites" checked> User Dive Sites</label>
                        <label><input type="checkbox" id="toggleEvents" checked> Planned Events</label>
                    </div>
                    <div class="panel-section-group dynamic-filters">
                        <span class="panel-section-title">Filter Features</span>
                        <div class="filter-input-wrapper">
                            <label for="panelPreserveFilter">Filter by Underwater Preserve:</label>
                            <select id="panelPreserveFilter">
                                <option value="all">Show All Preserves</option>
                            </select>
                        </div>
                        <div class="filter-input-wrapper">
                            <label for="panelDifficultyFilter">Filter Shipwrecks by Scuba Skill Level:</label>
                            <select id="panelDifficultyFilter">
                                <option value="all">Show All Wrecks</option>
                                <option value="Beginner">Beginner Sites</option>
                                <option value="Intermediate">Intermediate Sites</option>
                                <option value="Advanced">Advanced Sites</option>
                                <option value="Technical">Technical Sites</option>
                            </select>
                        </div>
                        <div class="filter-input-wrapper">
                            <label for="panelEventDepthFilter">Filter Events by Planned Depth:</label>
                            <select id="panelEventDepthFilter">
                                <option value="all">Show All Depths</option>
                                <option value="open">Open Water (&ge; 60 ft)</option>
                                <option value="advanced">Advanced Open/Deep (61 - 130 ft)</option>
                                <option value="technical">Technical (&gt; 130 ft)</option>
                            </select>
                        </div>
                    </div>
                `;

                // Define the control panel (this will be called in main.js and default wrapped inside an Expand widget on mobile devices)
                const controlPanelExpand = new Expand({
                    view: view,
                    content: controlPanelContainer,
                    expandIcon: "sliders", // I like the look of this icon, it lets the user know the widget can expand out into something more
                    expandTooltip: "Open Map Controls",
                    mode: "floating",
                    id: "controlPanelExpand", // assigned ID for screen responsive managment 
                    group: "widgets", // I grouped all the expand widgets together so only one can be open at a time
                    index: 1
                });
                view.ui.add(controlPanelExpand, "top-left");

                // add the zoom widget (removed above so I can manually specify the index position)
                const zoomWidget = new Zoom({
                    view: view,
                    index: 2
                });
                    view.ui.add(zoomWidget, "top-left");

                // Add the legend
                const legendWidget = new Legend({
                    view: view,
                    layerInfos: [ // I'm using layerInfos here to title and order the legend layers to match the control panel 
                        { layer: eventsLayer, title: "Crowdsourced Dive Events" },
                        { layer: sitesLayer, title: "Crowdsourced Dive Sites" },
                        { layer: shipwreckLayer, title: "MUPC Historic Shipwreck Locations" },
                        { layer: preservesLayer, title: "Great Lakes Underwater Preserves" },
                        { layer: bathymetryLayer, title: "Great Lakes Bathymetry Depths (m)" }
                    ]
                });

                // Wrap legend inside expand widget
                const legendExpand = new Expand({
                    view: view,
                    content: legendWidget,
                    expandIcon: "legend", 
                    expandTooltip: "Show Map Legend", // added a tooltip to help prompt desktop users
                    mode: "floating",
                    group: "widgets", //Group all the expand widgets together so only one can be open at a time
                    index: 3
                });
                view.ui.add(legendExpand, "top-left");

                // add edit widget so users can edit their events/sites entries
                const editorWidget = new Editor({
                    view: view,
                    // using layerInfos to specify dive sites and events as the only layers users can edit (largely unnecessary since the other layers used in this app are unlikely to ever allow public editing but I figure better safe than sorry)
                    layerInfos: [
                        { layer: sitesLayer },
                        { layer: eventsLayer }
                    ]
                });

                // Wrap the edit features in expand
                const editorExpand = new Expand({
                    view: view,
                    content: editorWidget,
                    expandIcon: "pencil", 
                    expandTooltip: "Edit Crowdsourced Data",
                    group: "widgets",
                    mode: "floating",
                    id: "editorExpand" // added so I can position/style with css
                });

                // Create the control panel with event listeners so users can toggle on and off all the layers
                view.when(() => {
                    //Layer Visibility Listeners
                    controlPanelContainer.querySelector("#toggleBathymetry").addEventListener("change", (e) => {
                        bathymetryLayer.visible = e.target.checked;
                    });
                    
                    controlPanelContainer.querySelector("#togglePreserves").addEventListener("change", (e) => {
                        preservesLayer.visible = e.target.checked;
                    });
                    
                    controlPanelContainer.querySelector("#toggleShipwrecks").addEventListener("change", (e) => {
                        shipwreckLayer.visible = e.target.checked;
                    });

                    controlPanelContainer.querySelector("#toggleSites").addEventListener("change", (e) => {
                        sitesLayer.visible = e.target.checked;
                    });

                    controlPanelContainer.querySelector("#toggleEvents").addEventListener("change", (e) => {
                        eventsLayer.visible = e.target.checked;
                    });

                    // Create a filter selection dropdown for the underwater preserves
                    const preserveSelect = controlPanelContainer.querySelector("#panelPreserveFilter");
                    
                    const query = preservesLayer.createQuery();
                    query.outFields = ["BP_Name"];
                    query.returnGeometry = false;
                    
                    preservesLayer.queryFeatures(query).then((results) => {
                        // Extract, sort, and clean up names to prevent duplicate values (Gemini helped with the specifics of this)
                        const names = results.features
                            .map(f => f.attributes.BP_Name)
                            .filter((value, index, self) => value && self.indexOf(value) === index)
                            .sort();
                            
                        names.forEach(name => {
                            const option = document.createElement("option");
                            option.value = name;
                            option.textContent = name;
                            preserveSelect.appendChild(option);
                        });
                    });

                    // SQL-based definition expression filter to isolate feature rendering on the map view
                    preserveSelect.addEventListener("change", (e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === "all") {
                            preservesLayer.definitionExpression = null;
                        } else {
                            // Escape single quotes if any preserve name happens to contain them
                            const escapedValue = selectedValue.replace(/'/g, "''");
                            preservesLayer.definitionExpression = `BP_Name = '${escapedValue}'`;
                        }
                    });

                    // Attribute Filter for Shipwreck Difficulty 
                    controlPanelContainer.querySelector("#panelDifficultyFilter").addEventListener("change", (e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === "all") {
                            shipwreckLayer.definitionExpression = null;
                        } else {
                            shipwreckLayer.definitionExpression = `ScubaDifficulty = '${selectedValue}'`;
                        }
                    });

                    // Attribute Filter for Event Max Planned Depth
                    controlPanelContainer.querySelector("#panelEventDepthFilter").addEventListener("change", (e) => {
                        const selectedValue = e.target.value;
                        
                        if (selectedValue === "all") {
                            eventsLayer.definitionExpression = null;
                        } else if (selectedValue === "open") {
                            // Standard Open Water beginner limits
                            eventsLayer.definitionExpression = "expected_max_depth_in_feet <= 60";
                        } else if (selectedValue === "advanced") {
                            // Deep recreational sports limits
                            eventsLayer.definitionExpression = "expected_max_depth_in_feet > 60 AND expected_max_depth_in_feet <= 130";
                        } else if (selectedValue === "technical") {
                            // Technical / deep trimix range limits
                            eventsLayer.definitionExpression = "expected_max_depth_in_feet > 130";
                        }
                    });

                    // adding edit widget and Add/Log New... buttons to same container so they are all positioned properly in the top right corner of the screen
                    // first, grab existing HTML container element from index.html
                    const actionControls = document.getElementById("actionBar");
                    
                    // then add/position in the top-right
                    if (actionControls) view.ui.add(actionControls, "top-right");
                    
                    // Finally, add  editor widget right after the buttons 
                    view.ui.add(editorExpand, "top-right");
                });
                
                // Runtime error tracking 
                bathymetryLayer.load().catch(err => console.error("Runtime Error: Bathymetry layer failed", err));
                preservesLayer.load().catch(err => console.error("Runtime Error: Preserves layer failed", err));
                shipwreckLayer.load().catch(err => console.error("Runtime Error: Shipwrecks layer failed", err));
                sitesLayer.load().catch(err => console.error("Runtime Error: Dive Sites layer failed", err));
                eventsLayer.load().catch(err => console.error("Runtime Error: Dive Events layer failed", err));

                resolve(view);
            } catch (error) { 
                reject(error);
            }
        });
    });
}