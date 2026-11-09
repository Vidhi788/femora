import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// A plain CSS pin, so no image files are needed (Leaflet's default pin images break with Vite).
const pinIcon = L.divIcon({
  className: "doc-pin",
  html: "<span></span>",
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
});

/** Popup built with textContent, never HTML strings, because names come from OpenStreetMap volunteers. */
function popupContent(h) {
  const box = document.createElement("div");
  box.className = "doc-pop";

  const name = document.createElement("strong");
  name.textContent = h.name;
  box.appendChild(name);

  const line = document.createElement("span");
  line.textContent = [h.type, h.distanceKm != null ? `${h.distanceKm} km away` : null].filter(Boolean).join(" · ");
  box.appendChild(line);

  return box;
}

/**
 * Leaflet map with OpenStreetMap tiles.
 * results: hospitals with latitude and longitude. center: where the search is from.
 * focus: { id, n } opens that hospital's pin (n changes on every click so the same pin can be re-focused).
 */
function HospitalMap({ results, center, focus }) {
  const holder = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef({});

  // Create the map once.
  useEffect(() => {
    const map = L.map(holder.current, { scrollWheelZoom: false }).setView([20.59, 78.96], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw the pins whenever the results change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current = {};
    const points = [];

    if (center) {
      L.circleMarker([center.lat, center.lng], {
        radius: 8,
        color: "#33202f",
        weight: 3,
        fillColor: "#eaa48e",
        fillOpacity: 1,
      })
        .bindTooltip("Your search")
        .addTo(layer);
      points.push([center.lat, center.lng]);
    }

    results.forEach((h) => {
      if (h.latitude == null || h.longitude == null) return;
      const marker = L.marker([h.latitude, h.longitude], { icon: pinIcon, title: h.name })
        .bindPopup(popupContent(h))
        .addTo(layer);
      markersRef.current[h.id] = marker;
      points.push([h.latitude, h.longitude]);
    });

    if (points.length > 1) map.fitBounds(points, { padding: [32, 32], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [results, center]);

  // Open one pin when its card's "Show on map" button is clicked.
  useEffect(() => {
    if (!focus) return;
    const map = mapRef.current;
    const marker = markersRef.current[focus.id];
    if (!map || !marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 });
    marker.openPopup();
  }, [focus]);

  return <div id="doc-map" ref={holder} className="doc-map" role="region" aria-label="Map of nearby hospitals" />;
}

export default HospitalMap;