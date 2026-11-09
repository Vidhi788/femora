// Top to bottom, like the figure.
export const CHAKRAS = [
  { key: "CROWN", name: "Crown", color: "#b57bff", y: 26 },
  { key: "THIRD_EYE", name: "Third eye", color: "#6f63ff", y: 84 },
  { key: "THROAT", name: "Throat", color: "#3fa9f5", y: 142 },
  { key: "HEART", name: "Heart", color: "#5be37a", y: 205 },
  { key: "SOLAR_PLEXUS", name: "Solar plexus", color: "#ffd02e", y: 266 },
  { key: "SACRAL", name: "Sacral", color: "#ff8a2b", y: 326 },
  { key: "ROOT", name: "Root", color: "#ff3d8b", y: 388 },
];

// find one chakra by its key, or null
export function chakraOf(key) {
  for (let i = 0; i < CHAKRAS.length; i++) {
    if (CHAKRAS[i].key === key) return CHAKRAS[i];
  }
  return null;
}