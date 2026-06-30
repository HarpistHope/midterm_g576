// main.js: import functions from other js files (map.js and location.js)
import { initMap } from './map.js';
import { setupLocationServices } from './location.js';

// Define API key (set up in previous labs)
const API_KEY = "AAPTaZ2rQpZ3e_kAjLMbAoRHR0g.._fqqp4bDNHHZdzTSsp9AO-QkJHtKqpaj-7Xv25F1YGAftgihPfF0YtKx3TlgjV1fIfgz5d5KD1tO1WludBUUE8UK14qZyasG6wdcyVgej-0RvTJlT6Cqr8NSnHJs2CR-QKtZ6cx1a-DlDQQytvHfcbHYyH2--XMqzLkkWez9t3HIMhqczJVoVTeXmERX-Sc_6OCF9zTuUnAuesDvugrzl5GUAN3LGTz2Zteo1pZkcrVPu2RRO94cFDhn8pvWIVGFeUSd7-icAT1_FDhHahp4";

// Initialize the spatial interface
initMap("viewDiv", API_KEY)
    .then((view) => { // wrapped in a then/catch to monitor for errors
        console.log("Map View initialized successfully.");
            
        // this makes sure popups are not collapsed as default when clicked
        view.popup.collapseEnabled = false; 


        // Setup Search+expand widgets and responsive utilities
        require([
            "esri/widgets/Search", 
            "esri/widgets/Expand",
            "esri/core/reactiveUtils" 
        ], (Search, Expand, reactiveUtils) => {

            // create search widget with popups disabled
            const searchWidget = new Search({ 
                view: view,
                popupEnabled: false
            });

            // create expand widget for search bar (only triggered on mobile screens)
            const searchExpand = new Expand({
                view: view,
                content: searchWidget,
                expandIcon: "search",
                mode: "floating",
                id: "searchExpand",
                group: "widgets", 
                index: 0
            });

            // I use reactiveUtils to keep the search bar and control panel open on desktop screens but collapse into expand widgets on mobile screens 
            // my AI assistant (mostly Gemini) helped me build the specific function structure (i.e., using () => structures, etc.)
            reactiveUtils.watch(
                () => view.widthBreakpoint,
                (breakpoint) => {
                    const isMobile = breakpoint === "xsmall" || breakpoint === "small";
                    const controlPanelExpand = view.ui.find("controlPanelExpand");

                    if (isMobile) {
                        // if the screen is mobile-sized, add the search widget collapsed within the expand widgets
                        view.ui.remove(searchWidget);
                        view.ui.add(searchExpand, { 
                            position: "top-left",
                            index: 0  
                        });
                        
                        // keep search and control panel collapsed/not expanded
                        searchExpand.expanded = false;
                        if (controlPanelExpand) controlPanelExpand.expanded = false;

                        // Also disable popup docking to let popups float over features
                        view.popup.dockOptions = {
                            buttonEnabled: false,
                            breakpoint: false
                        };
                    } else {
                        // if not a mobile screen, add the search widget NOT within an expand widget
                        view.ui.remove(searchExpand);
                        view.ui.add(searchWidget, { 
                            position: "top-left",
                            index: 0 
                        });

                        // keep control panel expanded
                        if (controlPanelExpand) {
                            controlPanelExpand.expanded = true;
                        }

                        // Force popups postion to the bottom center of the screen, keep undocked/uncollapsed
                        view.popup.dockOptions = {
                            buttonEnabled: false, // Hide the manual dock toggle button
                            breakpoint: false,    // Disables automatic docking
                            position: "bottom-center"
                        };
                    }
                },
                { initial: true } // runs as soon as the map loads so the if/else evaluation can take place
            );

            // Kickoff geolocation layer integration
            setupLocationServices(view);
            
            // This segment was adapted (with AI's help) from ArcGIS Maps SDK hitTest sample logic to prioritize point selections over polygons (i.e., shipwrecks, events, sites over preserves)
            // Priority click handler for overlapping features
            view.on("click", (event) => {
                event.stopPropagation(); // Stop default event bubbling

                view.hitTest(event).then((response) => {
                    const graphics = response.results.filter(res => res.type === "graphic");

                    if (graphics.length === 0) return;

                    // Layer priority hierarchy string mapping
                    const layerOrder = ["events-layer", "sites-layer", "shipwrecks-layer", "preserves-layer"];
                    
                    // Match the first graphic in the hitTest array that corresponds to the layer priority hierarchy ranking
                    const selectedResult = graphics.find(res => layerOrder.includes(res.graphic.layer?.id));

                    if (!selectedResult) return;
                    const targetGraphic = selectedResult.graphic;

                    // trigger the popup for the winner
                    view.popup.open({
                        features: [targetGraphic],
                        location: event.mapPoint
                    });

                    // add smooth zoom transitions
                    if (targetGraphic.geometry.type === "point") {
                        view.goTo({
                            target: targetGraphic.geometry,
                            zoom: 12
                        }, {
                            duration: 800,
                            easing: "ease-in-out"
                        });
                    } else if (targetGraphic.geometry.type === "polygon") {
                        view.goTo(
                            { target: targetGraphic.geometry }, 
                            {
                                duration: 1000, 
                                easing: "ease-in-out"
                            }
                        );
                    }
                });
            });
        });
    })

    // log initialization errors to the console
    .catch((err) => {
        console.error("Critical Failure: App bootstrapping aborted.", err);
    });