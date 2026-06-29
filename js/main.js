// // import functions from other js files (map.js and location.js)
// import { initMap } from './map.js';
// import { setupLocationServices } from './location.js';

// // Define API key (set up in previous labs)
// const API_KEY = "AAPTaZ2rQpZ3e_kAjLMbAoRHR0g.._fqqp4bDNHHZdzTSsp9AO-QkJHtKqpaj-7Xv25F1YGAftgihPfF0YtKx3TlgjV1fIfgz5d5KD1tO1WludBUUE8UK14qZyasG6wdcyVgej-0RvTJlT6Cqr8NSnHJs2CR-QKtZ6cx1a-DlDQQytvHfcbHYyH2--XMqzLkkWez9t3HIMhqczJVoVTeXmERX-Sc_6OCF9zTuUnAuesDvugrzl5GUAN3LGTz2Zteo1pZkcrVPu2RRO94cFDhn8pvWIVGFeUSd7-icAT1_FDhHahp4";

// // Initialize the spatial interface with .catch error failsafes
// initMap("viewDiv", API_KEY)
//     .then((view) => {
//         console.log("Map View initialized successfully.");
            
//         // makes sure popups are not docked/collapsed as default when clicked - in fact, i've just removed the docking option entirely
//         view.popup.dockOptions = {
//             buttonEnabled: false,
//             breakpoint: false
//         };
//         view.popup.collapseEnabled = false; 

//         // Setup Search+expand widgets and responsive utilities
//         require([
//             "esri/widgets/Search", 
//             "esri/widgets/Expand",
//             "esri/core/reactiveUtils" 
//         ], (Search, Expand, reactiveUtils) => {

//             // create search widget with popups disabled
//             const searchWidget = new Search({ 
//                 view: view,
//                 popupEnabled: false, // Prevents any popup from interrupting the view on selection
//                         });

//             // create expand widget for search bar (only triggered on mobile screens)
//             const searchExpand = new Expand({
//                 view: view,
//                 content: searchWidget,
//                 expandIcon: "search",
//                 mode: "floating",
//                 id: "searchExpand",
//                 group: "widgets", 
//             });

//             // I use reactiveUtils to keep the search bar and control panel open on desktop screens but collapse into expand widgets on mobile screens 
//             reactiveUtils.when(
//                 () => view.updating === false,
//                 () => {
//                     const controlPanelExpand = view.ui.find("controlPanelExpand");
//                     const controlPanelContent = controlPanelExpand ? controlPanelExpand.content : null;
//                     const isMobileInitial = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";

//                     if (isMobileInitial) {
//                         view.ui.add(searchExpand, { 
//                             position: "top-left",
//                             index: 2  
//                         });
                        
//                         if (searchExpand) searchExpand.expanded = false;
//                         if (controlPanelExpand) controlPanelExpand.expanded = false;
//                     } else {
//                         if (controlPanelExpand) view.ui.remove(controlPanelExpand);

//                         if (controlPanelContent) {
//                             view.ui.add(controlPanelContent, { 
//                                 position: "top-left", 
//                                 index: 0 
//                             });
//                         }

//                         view.ui.add(searchWidget, { 
//                             position: "top-left",
//                             index: 1 
//                         });
//                     }
//                 },
//                 { initial: true, once: true } 
//             );

//             reactiveUtils.watch(
//                 () => view.widthBreakpoint,
//                 (breakpoint) => {
//                     const isMobile = breakpoint === "xsmall" || breakpoint === "small";
                    
//                     if (isMobile) {
//                         if (searchExpand) searchExpand.expanded = false;
//                         const controlPanelExpand = view.ui.find("controlPanelExpand");
//                         if (controlPanelExpand) controlPanelExpand.expanded = false;
//                     } else {
//                         if (searchExpand) searchExpand.expanded = true;
//                         const controlPanelExpand = view.ui.find("controlPanelExpand");
//                         if (controlPanelExpand) controlPanelExpand.expanded = true;
//                     }
//                 },
//                 { initial: true } 
//             );

//             // Kickoff geolocation layer integration
//             setupLocationServices(view);
           
//             // Here I add a click listener to zoom/center a user-selected feature
//             // After some troubleshooting, I also added a statement to prioritize point feature clicks over polygon clicks (everytime I clicked on a shipwreck, the underlying preserve would highlight instead!)
//            view.on("click", (event) => {
//                 event.stopPropagation(); // Stop default event bubbling

//                 view.hitTest(event).then((response) => {
//                     // Extract just the valid graphic results from the hitTest
//                     const graphics = response.results.filter(res => res.type === "graphic");

//                     // Cascade choice using simple, clean layer ID strings!
//                     const selectedResult = 
//                         graphics.find(res => res.graphic.layer?.id === "events-layer") ||
//                         graphics.find(res => res.graphic.layer?.id === "sites-layer") ||
//                         graphics.find(res => res.graphic.layer?.id === "shipwrecks-layer") ||
//                         graphics.find(res => res.graphic.layer?.id === "preserves-layer");

//                     // If they clicked empty water, do nothing
//                     if (!selectedResult) return;

//                     const targetGraphic = selectedResult.graphic;

//                     // Programmatically trigger the popup for the winner
//                     view.openPopup({
//                         features: [targetGraphic],
//                         location: event.mapPoint
//                     });

//                     if (targetGraphic.geometry.type === "point") {
//                         // Tight zoom for wrecks, sites, and events
//                         view.goTo({
//                             target: targetGraphic.geometry,
//                             zoom: 12
//                         }, {
//                             duration: 800,
//                             easing: "ease-in-out"
//                         });
//                     } else if (targetGraphic.geometry.type === "polygon") {
//                         // Frame the entire preserve boundary smoothly on the screen
//                         view.goTo(
//                             { target: targetGraphic.geometry }, 
//                             {
//                                 duration: 1000, // Slightly longer duration for a grander polygon framing effect
//                                 easing: "ease-in-out"
//                             }
//                         );
//                     }
//                 });
//             });
//         });
//     })
//     .catch((err) => {
//         console.error("Critical Failure: App bootstrapping aborted.", err);
//     });

// import functions from other js files (map.js and location.js)
import { initMap } from './map.js';
import { setupLocationServices } from './location.js';

// Define API key (set up in previous labs)
const API_KEY = "AAPTaZ2rQpZ3e_kAjLMbAoRHR0g.._fqqp4bDNHHZdzTSsp9AO-QkJHtKqpaj-7Xv25F1YGAftgihPfF0YtKx3TlgjV1fIfgz5d5KD1tO1WludBUUE8UK14qZyasG6wdcyVgej-0RvTJlT6Cqr8NSnHJs2CR-QKtZ6cx1a-DlDQQytvHfcbHYyH2--XMqzLkkWez9t3HIMhqczJVoVTeXmERX-Sc_6OCF9zTuUnAuesDvugrzl5GUAN3LGTz2Zteo1pZkcrVPu2RRO94cFDhn8pvWIVGFeUSd7-icAT1_FDhHahp4";

// Initialize the spatial interface with .catch error failsafes
initMap("viewDiv", API_KEY)
    .then((view) => {
        console.log("Map View initialized successfully.");
            
        // makes sure popups are not docked/collapsed as default when clicked
        view.popup.dockOptions = {
            buttonEnabled: false,
            breakpoint: false
        };
        view.popup.collapseEnabled = false; 

        // Required AMD block for your lab structure
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

            // // Use reactiveUtils to handle responsive layouts cleanly
            // reactiveUtils.watch(
            //     () => view.widthBreakpoint,
            //     (breakpoint) => {
            //         const isMobile = breakpoint === "xsmall" || breakpoint === "small";
            //         const controlPanelExpand = view.ui.find("controlPanelExpand");

            //         if (isMobile) {
            //             // Switch to mobile layout safely
            //             view.ui.remove(searchWidget);
            //             view.ui.add(searchExpand, { 
            //                 position: "top-left",
            //                 index: 0  
            //             });
                        
            //             searchExpand.expanded = false;
            //             if (controlPanelExpand) controlPanelExpand.expanded = false;
            //         } else {
            //             // Switch to desktop layout safely
            //             view.ui.remove(searchExpand);
            //             view.ui.add(searchWidget, { 
            //                 position: "top-left",
            //                 index: 0 
            //             });

            //             if (controlPanelExpand) {
            //                 controlPanelExpand.expanded = true;
            //             }
            //         }
            //     },
            //     { initial: true } 
            // );

            // Use reactiveUtils to handle responsive layouts cleanly
            reactiveUtils.watch(
                () => view.widthBreakpoint,
                (breakpoint) => {
                    const isMobile = breakpoint === "xsmall" || breakpoint === "small";
                    const controlPanelExpand = view.ui.find("controlPanelExpand");

                    if (isMobile) {
                        // 1. Switch to mobile layout safely
                        view.ui.remove(searchWidget);
                        view.ui.add(searchExpand, { 
                            position: "top-left",
                            index: 0  
                        });
                        
                        searchExpand.expanded = false;
                        if (controlPanelExpand) controlPanelExpand.expanded = false;

                        // 2. Mobile Popup Configuration: Disable docking to let it float over features
                        view.popup.dockOptions = {
                            buttonEnabled: false,
                            breakpoint: false
                        };
                    } else {
                        // 1. Switch to desktop layout safely
                        view.ui.remove(searchExpand);
                        view.ui.add(searchWidget, { 
                            position: "top-left",
                            index: 0 
                        });

                        if (controlPanelExpand) {
                            controlPanelExpand.expanded = true;
                        }

                        // 2. Desktop Popup Configuration: Force dock to bottom center
                        view.popup.dockOptions = {
                            buttonEnabled: false, // Hides the manual dock toggle button
                            breakpoint: false,    // Disables automatic SDK responsive docking
                            position: "bottom-center" // Centers it cleanly at the bottom
                        };
                    }
                },
                { initial: true } 
            );

            // Kickoff geolocation layer integration
            setupLocationServices(view);
           
            // Priority click handler for overlapping features
            view.on("click", (event) => {
                event.stopPropagation(); // Stop default event bubbling

                view.hitTest(event).then((response) => {
                    const graphics = response.results.filter(res => res.type === "graphic");

                    if (graphics.length === 0) return;

                    // Layer priority hierarchy string mapping
                    const layerOrder = ["events-layer", "sites-layer", "shipwrecks-layer", "preserves-layer"];
                    let selectedResult = null;

                    for (const id of layerOrder) {
                        selectedResult = graphics.find(res => res.graphic.layer?.id === id);
                        if (selectedResult) break;
                    }

                    if (!selectedResult) return;
                    const targetGraphic = selectedResult.graphic;

                    // Programmatically trigger the popup for the winner
                    view.popup.open({
                        features: [targetGraphic],
                        location: event.mapPoint
                    });

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
    .catch((err) => {
        console.error("Critical Failure: App bootstrapping aborted.", err);
    });