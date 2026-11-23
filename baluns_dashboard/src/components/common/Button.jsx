import "./Button.css";

// variant: "primary" | "outline" | "secondary"    size: "md" | "sm"
export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  type = "button",
  ...rest
}) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}