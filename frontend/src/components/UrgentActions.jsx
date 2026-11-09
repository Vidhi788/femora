import { MapPin, Phone, Stethoscope } from "lucide-react";
import "../styles/urgent.css";

// Results that say "see a doctor". Level names come from the four checker services.
const DOCTOR_LEVELS = new Set(["HIGHER", "POSSIBLE", "OUT_OF_RANGE", "CLOSE_MATCH", "SEE_DOCTOR", "POSITIVE_TEST"]);

/**
 * Shown inside a checker's result card.
 *  - URGENT: call the ambulance, or find a hospital near me.
 *  - A "see a doctor" result: a button to the Find a doctor page.
 * Femora does not book appointments. Find a doctor shows Call, Book online and Directions.
 */
function UrgentActions({ level, onFindDoctor }) {
  if (level === "URGENT") {
    return (
      <div className="urgent-actions">
        <a className="btn btn-primary urgent-btn" href="tel:108">
          <Phone size={16} aria-hidden="true" /> Call 108 (ambulance)
        </a>
        {onFindDoctor ? (
          <button type="button" className="btn btn-primary btn-shine urgent-btn" onClick={onFindDoctor}>
            <MapPin size={16} aria-hidden="true" /> Find a hospital near me
          </button>
        ) : null}
      </div>
    );
  }

  if (DOCTOR_LEVELS.has(level) && onFindDoctor) {
    return (
      <div className="urgent-actions">
        <button type="button" className="btn btn-ghost urgent-btn" onClick={onFindDoctor}>
          <Stethoscope size={16} aria-hidden="true" /> Find a doctor near me
        </button>
      </div>
    );
  }

  return null;
}

export default UrgentActions;