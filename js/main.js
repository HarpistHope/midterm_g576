 // import functions from other js files (map.js and location.js)
import { initMap } from './map.js';
import { setupLocationServices } from './location.js';

// Define API key (set up in previous labs)
const API_KEY = "AAPTaZ2rQpZ3e_kAjLMbAoRHR0g.._fqqp4bDNHHZdzTSsp9AO-QkJHtKqpaj-7Xv25F1YGAftgihPfF0YtKx3TlgjV1fIfgz5d5KD1tO1WludBUUE8UK14qZyasG6wdcyVgej-0RvTJlT6Cqr8NSnHJs2CR-QKtZ6cx1a-DlDQQytvHfcbHYyH2--XMqzLkkWez9t3HIMhqczJVoVTeXmERX-Sc_6OCF9zTuUnAuesDvugrzl5GUAN3LGTz2Zteo1pZkcrVPu2RRO94cFDhn8pvWIVGFeUSd7-icAT1_FDhHahp4";

// Initialize the spatial interface safely
initMap("viewDiv", API_KEY)
    .then((view) => {
        console.log("Map View initialized successfully.");
        
        // Setup Search widget inside Main logic or extend here
        require([
            "esri/widgets/Search", 
            "esri/widgets/Expand"], 
            (Search, Expand) => {

            const searchWidget = new Search({ 
                view: view 
            });

            const searchExpand = new Expand({
                view: view,
                content: searchWidget,
                expandIcon: "search",
                group: "widgets", // add to the widgets group
            });

            view.ui.add(searchExpand, { 
                position: "top-left",
                index: 0 }); // under the control panel
        });

        // Kickoff Geolocation layer integration
        setupLocationServices(view);
    })
    .catch((err) => {
        console.error("Critical Failure: App bootstrapping aborted.", err);
    });