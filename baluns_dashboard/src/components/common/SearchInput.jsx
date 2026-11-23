import { Search } from "lucide-react";
import "./SearchInput.css";

export default function SearchInput({ value, onChange, placeholder = "Search" }) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}