"use strict";

const token = new URLSearchParams(window.location.search).get("token");
const button = document.getElementById("share");
const status = document.getElementById("status");

button.addEventListener("click", () => {
  if (!token || !/^[a-f0-9]{48}$/.test(token)) {
    status.textContent = "Invalid sharing link.";
    return;
  }

  if (!navigator.geolocation) {
    status.textContent = "GPS not supported by this browser.";
    return;
  }

  button.disabled = true;
  status.textContent = "Requesting your GPS permission...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const response = await fetch(
          "/api/share/" + encodeURIComponent(token),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          }
        );

        if (!response.ok) {
          throw new Error("Sharing failed");
        }

        status.textContent = "Location shared successfully!";
      } catch (error) {
        status.textContent = "Unable to share location. Please try again.";
        button.disabled = false;
      }
    },
    (error) => {
      status.textContent = "Permission denied or GPS unavailable.";
      button.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
  );
});
