const validation = {
  login: {
    required: "Please enter your account.",
    minLength: "Account must contain at least {{count}} characters.",
  },

  fullName: {
    required: "Please enter your full name.",
    minLength: "Full name must contain at least {{count}} characters.",
  },

  phone: {
    required: "Please enter your phone number.",
    invalid: "Invalid phone number.",
  },

  email: {
    invalid: "Invalid email address.",
  },

  password: {
    required: "Please enter your password.",
    minLength: "Password must contain at least {{count}} characters.",
  },

  confirmPassword: {
    required: "Please confirm your password.",
    mismatch: "Passwords do not match.",
  },
};

export default validation;
