// map.js manages map layer loading and configurations
export function initMap(viewContainerId, apiKey) {
    return new Promise((resolve, reject) => {
        require([
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
            
            // I wrap the script in a try/catch statement to help catch errors
            try {
                // apiKey is defined in main.js
                esriConfig.apiKey = apiKey;

                const map = new Map({
                    basemap: "arcgis-nova"
                });

                // construct the map view
                const view = new MapView({
                    container: viewContainerId,
                    map: map,
                    center: [-84.75, 44.45], // Michigan
                    zoom: 5,
                    
                    // I added constraints to improve rendering/load time by restricting the map from panning/zooming to global scales
                    constraints: {
                        minZoom: 5, 
                        maxZoom: 11,
                        geometry: {   // Extent bounding box centered around Michigan
                            type: "extent",
                            xmin: -90.5,
                            ymin: 41.5,
                            xmax: -82.0,
                            ymax: 49.0
                        }
                    },

                    // Dock the popups when the screen size is below 600px (ie, mobile screens)
                    popup: {
                        dockEnabled: true,
                        dockOptions: {
                            buttonEnabled: false, // Prevents users from accidentally "undocking" it onto a tiny screen
                            breakpoint: false,    // Forces docking behavior at ALL screen sizes, or use { width: 600 }
                            position: "bottom-center" 
                        }
                    },

                    // Manually remove the default widgets (except for attributions)  so I can manually add the zoom widget in a specific index position
                    ui: {
                        components: ["attribution"]
                    }

                });

                // To allow users to edit the crowdsourced layers (not just add new entries), define standard custom popup actions for crowdsourced layers
                const editAction = {
                    title: "Edit Submission",
                    id: "edit-survey-record",
                    className: "esri-icon-edit"
                };

                // Shipwreck popup
                const shipwreckPopup = {
                    title: "Shipwreck: {Vessel}",
                    
                    // Use arcade expressions to change the popup content depending on the scuba difficulty
                    // added fun emojis to make the warning information pop
                    expressionInfos: [{
                        name: "difficulty-warning",
                        title: "Safety Advisory",
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
                    
                    content: [
                        {
                            type: "text",
                            text: `
                                <div style="font-weight: bold; color: #b30000; margin-bottom: 8px;">
                                    {expression/difficulty-warning}
                                </div>
                                <table class="esri-widget__table" style="width:100%; border-collapse:collapse;">
                                    <tr><th style="text-align:left; padding:4px;">Vessel Type:</th><td style="padding:4px;">{VesselType}</td></tr>
                                    <tr><th style="text-align:left; padding:4px;">Year Built:</th><td style="padding:4px;">{Built}</td></tr>
                                    <tr><th style="text-align:left; padding:4px;">Year Lost:</th><td style="padding:4px;">{LostYR}</td></tr>
                                    <tr><th style="text-align:left; padding:4px;">Depth:</th><td style="padding:4px;">{Depth}</td></tr>
                                    <tr><th style="text-align:left; padding:4px;">Cargo:</th><td style="padding:4px;">{Cargo}</td></tr>
                                    <tr><th style="text-align:left; padding:4px;">Paddler Accessible:</th><td style="padding:4px;">{SnorkelKayakAssessible}</td></tr>
                                </table>
                                <p style="margin-top:10px; font-size:13px; line-height:1.4;">{Description}</p>
                            `
                        }
                    ]
                };

                // Underwater Preserves Popup
                const preservesPopup = {
                    title: "{BP_Name}",
                    content: `
                        <div style="font-family: sans-serif; line-height: 1.5;">
                            <p>The <b>{BP_Name}</b> protects historic shipwrecks and unique maritime archaeological sites across the Great Lakes.</p>
                            <table class="esri-widget__table" style="width:100%; border-collapse:collapse; margin-bottom:12px;">
                                <tr>
                                    <th style="text-align:left; padding:4px; background-color:#f4f4f4;">Protected Area:</th>
                                    <td style="padding:4px;">{Acres} Acres</td>
                                </tr>
                            </table>
                            <a href="{HT_Link}" target="_blank" class="esri-button esri-button--secondary">
                                Explore More &rarr;
                            </a>
                        </div>
                    `
                };

                // Dive Sites Popup 
                const sitesPopup = {
                    title: "Crowdsourced Dive Site",
                    content: `
                        <div style="font-family: sans-serif; line-height: 1.5;">
                            <table class="esri-widget__table" style="width:100%; border-collapse:collapse; margin-bottom:8px;">
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4; width:40%;">Difficulty:</th>
                                    <td style="padding:6px; font-weight:bold;">{scuba_difficulty}</td>
                                </tr>
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4;">Date Logged:</th>
                                    <td style="padding:6px;">{date_of_entry}</td>
                                </tr>
                            </table>
                            
                            <h4 style="margin: 12px 0 4px 0; color: #0070c0;">Current Conditions</h4>
                            <p style="margin: 0 0 12px 0; font-size: 13px; font-style: italic; color: #555;">
                                {current_conditions_optional}
                            </p>
                            
                            <h4 style="margin: 0 0 4px 0; color: #0070c0;">Site Description</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                                {site_description_optional}
                            </p>
                        </div>
                    `
                };

                // Dive Events popup
                const eventsPopup = {
                    title: "Crowdsourced Dive Event",
                    content: `
                        <div style="font-family: sans-serif; line-height: 1.5;">
                            <table class="esri-widget__table" style="width:100%; border-collapse:collapse; margin-bottom:8px;">
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4; width:45%;">Event Date:</th>
                                    <td style="padding:6px; font-weight:bold; color: #b30000;">{event_date}</td>
                                </tr>
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4;">Meetup Time:</th>
                                    <td style="padding:6px;">{meetup_time}</td>
                                </tr>
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4;">Target Difficulty:</th>
                                    <td style="padding:6px;">{scuba_difficulty}</td>
                                </tr>
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4;">Expected Max Depth:</th>
                                    <td style="padding:6px;">{expected_max_depth_in_feet} ft</td>
                                </tr>
                                <tr>
                                    <th style="text-align:left; padding:6px; background-color:#f4f4f4;">Est. Duration:</th>
                                    <td style="padding:6px;">{expected_duration_optional} hours</td>
                                </tr>
                            </table>
                            
                            <h4 style="margin: 12px 0 4px 0; color: #0070c0;">Additional Details</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                                {additional_details_optional}
                            </p>
                            
                            <div style="font-size: 11px; color: #888; margin-top: 12px; text-align: right;">
                                Organized by: {Creator}
                            </div>
                        </div>
                    `
                };

                //Customized renders/icons
                // First customize the preserves layer so the user can see the layer more clearly (it was initially the same blue as the bathymetry layer)
                const preservesRenderer = {
                    type: "simple", // Symbolize all features in the layer the same way
                    symbol: {
                        type: "simple-fill", 
                        color: [255, 110, 0, 0.20], 
                        outline: {
                            color: [255, 85, 0, 0.85], 
                            width: 1.5
                        }
                    }
                };

                // customize sites renderer/icon (scuba icon attribution: Scuba by Yosua Bungaran from Noun Project (CC BY 3.0))
                const sitesRenderer = {
                    type: "simple",
                    symbol: {
                        type: "picture-marker",
                        // You can use a local path (e.g., "images/snorkel.png") or an image URL:
                        url: "images/noun-scuba-canva.png", 
                        width: "24px",
                        height: "24px"
                    }
                };

                // customize events renderer/icon (events icon attribution: Calendar by BEARicons from Noun Project (CC BY 3.0))
                const eventsRenderer = {
                    type: "simple",
                    symbol: {
                        type: "picture-marker",
                        url: "images/noun-calendar-canva.png", 
                        width: "24px",
                        height: "24px"
                    }
                };

                // Load the tile/feature layers
                // Load Bathymetry Tile Layer -- is there a way to make it still show up but less pixelated at high zoom levels? 
                const bathymetryLayer = new TileLayer({
                    url: "https://tiles.arcgis.com/tiles/As5CFN3ThbQpy8Ph/arcgis/rest/services/Bathymetry_of_the_Great_Lakes/MapServer",
                    resampling: true, // added so the layer would still render (if slightly pixilated) when zoomed in
                    maxScale: 70000 // I added this to force it to continue resampling up to a scale of 70000 (otherwise the layer would snap away too early/at too low a zoom)
                });
                map.add(bathymetryLayer); // I'm adding the index so my layers stack exactly how I want: bathmetry on the bottom, then preserves, then the point features

                // Load underwater preserves feature layer
                const preservesLayer = new FeatureLayer({
                    url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/Great_Lakes_Underwater_Preserves/FeatureServer",
                    id: "preserves-layer", // assigning an ID to preserves layer and point feature layers to use in the zoom/center click event listener (see main.js)
                    outFields: ["BP_Name", "Acres", "HT_Link"],
                    renderer: preservesRenderer, 
                    popupTemplate: preservesPopup  
                });
                map.add(preservesLayer);

                // Load Shipwreck Feature Layer
                const shipwreckLayer = new FeatureLayer({
                    url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/MUPC_Shipwreck_Locations_2020_view/FeatureServer",
                    id: "shipwrecks-layer",
                    outFields: [
                        "Vessel", "VesselType", "Built", "LostYR", "Depth", 
                        "Cargo", "SnorkelKayakAssessible", "ScubaDifficulty", "Description"
                    ],
                    popupTemplate: shipwreckPopup
                });
                map.add(shipwreckLayer);

                // Create/load dive sites feature layer from feature service (survey results)
                const sitesLayer = new FeatureLayer({ 
                    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/survey123_545711b0719d4502811e6c2c705bf508_results/FeatureServer",
                    id: "sites-layer",
                    renderer: sitesRenderer,
                    outFields: ["scuba_difficulty", "date_of_entry", "current_conditions_optional", "site_description_optional"],
                    editingEnabled: true, // allows users to update features as well
                    popupTemplate: sitesPopup
                });
                map.add(sitesLayer);

                // Create/load dive events feature layer from feature service (survey results)
                const eventsLayer = new FeatureLayer({ 
                    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/survey123_930afbf904a4467f970813922117a325_results/FeatureServer",
                    id: "events-layer",
                    renderer: eventsRenderer,
                    outFields: ["event_date", "meetup_time", "scuba_difficulty", "expected_max_depth_in_feet", "expected_duration_optional", "additional_details_optional", "Creator"],
                    editingEnabled: true, // allows users to update features
                    popupTemplate: eventsPopup
                });
                map.add(eventsLayer);

                // Setup dynamic link structure handler for to let users edit the survey entries
                view.popup.on("trigger-action", (event) => {
                    if (event.action.id === "edit-survey-record") {
                        const targetFeature = view.popup.selectedFeature;
                        const objectId = targetFeature.attributes.objectid || targetFeature.attributes.OBJECTID;
                        let surveyFormId = "";

                        if (targetFeature.layer === sitesLayer) {
                            surveyFormId = "545711b0719d4502811e6c2c705bf508";
                        } else if (targetFeature.layer === eventsLayer) {
                            surveyFormId = "930afbf904a4467f970813922117a325";
                        }

                        if (surveyFormId && objectId) {
                            const editUrl = `https://survey123.arcgis.com/share/${surveyFormId}?mode=edit&objectId=${objectId}`;
                            window.open(editUrl, "_blank");
                        }
                    }
                });

                // One main feature of my app is the unified control panel that allows users to toggle feature layers and filter by certain attributes
                // I first tried to use a layers list but that widget does not have Filter by Attribute capabilities so I had to custom make a new panel
                // As the design became fairly technical, I utilized the AI assistant to help explain and implement the full panel design

                // //Create a styled container for the unified control panel
                // const controlPanelContainer = document.createElement("div");
                // controlPanelContainer.style.padding = "14px";
                // controlPanelContainer.style.backgroundColor = "#ffffff";
                // controlPanelContainer.style.fontFamily = "sans-serif";
                // controlPanelContainer.style.fontSize = "14px";
                // controlPanelContainer.style.borderRadius = "4px";
                // controlPanelContainer.style.width = "260px";
                // controlPanelContainer.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";


                const controlPanelContainer = document.createElement("div");
                    controlPanelContainer.style.padding = "16px";
                    controlPanelContainer.style.backgroundColor = "white"; // Deep ocean ice / AliceBlue blend
                    controlPanelContainer.style.border = "2px solid #005b96"; 
                    controlPanelContainer.style.borderRadius = "8px";
                    controlPanelContainer.style.width = "260px";
                    controlPanelContainer.style.boxShadow = "0 4px 10px rgba(0, 91, 150, 0.25)"; // Soft blue-tinted drop shadow


                // Define the custom HTML structure (Toggles + Multiple Select Dropdowns)
                controlPanelContainer.innerHTML = `
                    <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px;">
                        Map Controls
                    </h3>
                    
                    <div style="margin-bottom: 14px;">
                        <span style="font-weight: bold; display: block; margin-bottom: 6px; color: #555;">Toggle Layers</span>
                        
                        <label style="display: flex; align-items: center; margin-bottom: 5px; cursor: pointer;">
                            <input type="checkbox" id="toggleBathymetry" checked style="margin-right: 8px;"> Great Lakes Bathymetry
                        </label>
                        
                        <label style="display: flex; align-items: center; margin-bottom: 5px; cursor: pointer;">
                            <input type="checkbox" id="togglePreserves" checked style="margin-right: 8px;"> Underwater Preserves
                        </label>
                        
                        <label style="display: flex; align-items: center; margin-bottom: 5px; cursor: pointer;">
                            <input type="checkbox" id="toggleShipwrecks" checked style="margin-right: 8px;"> Historic Shipwrecks
                        </label>

                        <label style="display: flex; align-items: center; margin-bottom: 5px; cursor: pointer;">
                            <input type="checkbox" id="toggleSites" checked style="margin-right: 8px;"> User Dive Sites
                        </label>

                        <label style="display: flex; align-items: center; margin-bottom: 5px; cursor: pointer;">
                            <input type="checkbox" id="toggleEvents" checked style="margin-right: 8px;"> Planned Events
                        </label>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 10px;">
                        <span style="font-weight: bold; display: block; margin-bottom: 8px; color: #555;">Filter Features</span>
                        
                        <div style="margin-bottom: 10px;">
                            <label for="panelPreserveFilter" style="font-size: 12px; color: #666; display: block; margin-bottom: 3px;">
                                Filter by Underwater Preserve:
                            </label>
                            <select id="panelPreserveFilter" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
                                <option value="all">Show All Preserves</option>
                                </select>
                        </div>

                        <div style="margin-bottom: 10px;">
                            <label for="panelDifficultyFilter" style="font-size: 12px; color: #666; display: block; margin-bottom: 3px;">
                                Filter Shipwrecks by Scuba Skill Level:
                            </label>
                            <select id="panelDifficultyFilter" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
                                <option value="all">Show All Wrecks</option>
                                <option value="Beginner">Beginner Sites</option>
                                <option value="Intermediate">Intermediate Sites</option>
                                <option value="Advanced">Advanced Sites</option>
                                <option value="Technical">Technical Sites</option>
                            </select>
                        </div>

                        <div>
                            <label for="panelEventDepthFilter" style="font-size: 12px; color: #666; display: block; margin-bottom: 3px;">
                                Filter Events by Planned Depth:
                            </label>
                            <select id="panelEventDepthFilter" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
                                <option value="all">Show All Depths</option>
                                <option value="open">Open Water (&ge; 60 ft)</option>
                                <option value="advanced">Advanced Open/Deep (61 - 130 ft)</option>
                                <option value="technical">Technical (&gt; 130 ft)</option>
                            </select>
                        </div>
                    </div>
                `;

                // Called in main.js to wrap the panel inside an Expand widget on a mobile device screen
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

                    // Dynamic Filter Population for Underwater Preserves
                    const preserveSelect = controlPanelContainer.querySelector("#panelPreserveFilter");
                    
                    preservesLayer.when(() => {
                        const query = preservesLayer.createQuery();
                        query.outFields = ["BP_Name"];
                        query.returnGeometry = false;
                        
                        preservesLayer.queryFeatures(query).then((results) => {
                            // Extract, sort, and clean up names to prevent duplicates
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
                    });

                    // Attribute Filter for Underwater Preserve Selection
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
                });
                
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
                    group: "widgets", //  // Group all the expand widgets together so only one can be open at a time
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
                    id: "editorExpand" // added so I can position/style with css
                });
                view.ui.add(editorExpand, "top-right");

                // adding edit widget and Add/Log New... buttons to same container so they are all positioned properly in the top right corner of the screen
                view.when(() => {
                    // 1. Grab your existing HTML container element from index.html
                    const actionControls = document.getElementById("actionBar");
                    
                    // 2. Add your custom HTML elements to the top-right UI slot first
                    view.ui.add(actionControls, "top-right");
                    
                    // 3. Add your editor widget right after it in the same slot
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