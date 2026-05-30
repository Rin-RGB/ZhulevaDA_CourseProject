export default function FormField({
    label,
    value,
    name,
    onChange,
    type = "text",
    mode
}) {
    return (
        <div className={`field field-${mode}`}>
            {mode === "read" ? (
                <>
                    <p className="field-label">{label}: <span>{value ?? "-"}</span></p>
                </>
            ) : (
                <>
                    <label htmlFor={name}>
                        {label}
                    </label>

                    <input
                        id={name}
                        type={type}
                        value={value}
                        onChange={(e) =>
                            onChange(name, e.target.value)
                        }
                    />
                </>
            )}
        </div>
    );
}