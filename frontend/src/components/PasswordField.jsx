import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

function PasswordField({
  id = "password",
  name = "password",
  value,
  onChange,
  label = "Password",
  placeholder = "Enter your password",
  autoComplete = "current-password",
  footer = null,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>

      <div className="input-wrap">
        <LockKeyhole className="field-icon" size={18} aria-hidden="true" />

        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className="eye-button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {footer}
    </div>
  );
}

export default PasswordField;
