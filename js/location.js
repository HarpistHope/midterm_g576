// location.js: exports function to add locate widget to the map
export function setupLocationServices(view) {
    require(["esri/widgets/Locate"], (Locate) => {
        
        // create location widget with a timeout limit to catch exhessive loading time
        const locateBtn = new Locate({
            view: view,
            geolocationOptions: {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        });

        // I wasn't quite sure how to structure the error handling at first; the AI assistant walked me through the following function:
        locateBtn.on("locate-error", (event) => {
            // log an error to the console as necessary
            console.error("Locate Widget Error:", event.error);
            
            // Only alerts if there is a substantive message, avoiding duplicate or empty browser prompts
            if (event.error) {
                alert("Unable to find your location. Please check your desktop, phone, or boat's GPS settings.");
            }
        });

        // Add to the 'top-left' widget stack
        view.ui.add(locateBtn, {
            position: "top-left"
        });
    });
}