export const PASSWORD_RULES = [
    { id: "length", label: "9 to 128 characters", test: (p) => p.length >= 9 && p.length <= 128 },
    { id: "upper", label: "At least one uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { id: "special", label: "At least one special character (! @ # $ % ...)", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  ];
  
  export const passwordIsValid = (password) => PASSWORD_RULES.every((rule) => rule.test(password));