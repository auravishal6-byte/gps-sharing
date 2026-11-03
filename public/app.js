const keyInput = document.getElementById("key");
const tokenInput = document.getElementById("token");
const resultBox = document.getElementById("result");
const locationBox = document.getElementById("location");
const statusBox = document.getElementById("status");

document.getElementById("create").addEventListener("click", createLink);
document.getElementById("check").addEventListener("click", checkLocation);

async function createLink() {
  statusBox.textContent = "Creating sharing link...";
  resultBox.replaceChildren();

  try {
    const response = await fetch("/api/create", {
      method: "POST",
      headers: { "x-admin-key": keyInput.value }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    const link = new URL(data.shareLink, location.origin).href;
    const token = new URL(link).searchParams.get("token");
    tokenInput.value = token;

    const a = document.createElement("a");
    a.href = link;
    a.textContent = link;
    a.target = "_blank";
    a.rel = "noopener";

    resultBox.append("Sharing link: ", a);

    const copy = document.createElement("button");
    copy.textContent = "Copy Link";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        statusBox.textContent = "Link copied!";
      } catch {
        statusBox.textContent = "Please copy the link manually.";
      }
    });

    resultBox.appendChild(copy);
    statusBox.textContent = "Sharing link created successfully!";
  } catch (error) {
    statusBox.textContent = "Error: " + error.message;
  }
}

async function checkLocation() {
  statusBox.textContent = "Checking location...";
  locationBox.replaceChildren();

  try {
    const response = await fetch(
      "/api/location/" + encodeURIComponent(tokenInput.value.trim()),
      { headers: { "x-admin-key": keyInput.value } }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Location unavailable");
    }

    if (!data.location) {
      statusBox.textContent = "Location has not been shared yet.";
      return;
    }

    const loc = data.location;
    const p = document.createElement("p");
    p.textContent =
      "Latitude: " + loc.latitude +
      "\nLongitude: " + loc.longitude +
      "\nAccuracy: " + loc.accuracy + " metres";

    const map = document.createElement("a");
    map.href = "https://www.google.com/maps?q=" +
      loc.latitude + "," + loc.longitude;
    map.textContent = "Open in Google Maps";
    map.target = "_blank";
    map.rel = "noopener";

    locationBox.append(p, map);
    statusBox.textContent = "Location received.";
  } catch (error) {
    statusBox.textContent = "Error: " + error.message;
  }
}
