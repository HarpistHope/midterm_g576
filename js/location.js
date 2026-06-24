 // Geolocation: handles tracking, widgets, and accuracy monitors
export function setupLocationServices(view) {
    require(["esri/widgets/Locate"], (Locate) => {
        const locateBtn = new Locate({
            view: view,
            geolocationOptions: {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        });

        // Defensive error handling for logical/hardware runtime limitations
        locateBtn.on("locate-error", (event) => {
            console.error("Locate Widget Error:", event.error);
            alert("Unable to find your location. Please check your boat or phone's GPS settings.");
        });

        view.ui.add(locateBtn, {
            position: "top-left",
            index: 4
        });
    });
}