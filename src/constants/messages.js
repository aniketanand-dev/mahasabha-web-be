const MESSAGES = Object.freeze({
  COMMON: {
    SUCCESS: "Success",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_SERVER_ERROR: "Internal server error",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized request"
  },
  AUTH: {
    SIGNUP_SUCCESS: "Admin signup successful",
    LOGIN_SUCCESS: "Admin login successful",
    FORGOT_PASSWORD_SUCCESS: "If an account exists, a password reset link has been generated",
    RESET_PASSWORD_SUCCESS: "Password reset successful",
    INVALID_CREDENTIALS: "Invalid username or password",
    ADMIN_EXISTS: "Admin already exists",
    ADMIN_NOT_FOUND: "Admin not found",
    INVALID_OR_EXPIRED_RESET_TOKEN: "Invalid or expired reset token",
    TOKEN_REQUIRED: "Reset token is required"
  },
  DEFAULT_ADMIN: {
    CREATED: "Default admin created",
    EXISTS: "Default admin already exists"
  },
  SCHOLARSHIPS: {
    APPLICATION_SUBMITTED: "Scholarship application submitted successfully",
    AADHAAR_ALREADY_EXISTS: "An application already exists for this Aadhaar number",
    REGISTRATION_NO_ALREADY_EXISTS: "An application already exists for this registration number",
    INVALID_MARKS: "Marks obtained cannot be greater than total marks",
    INVALID_MARKS_FORMAT: "Marks must contain only digits and be up to 4 digits",
    REQUIRED_FILES: "All required documents must be uploaded",
    INVALID_AADHAAR_SHARE_CODE: "Please enter a valid Aadhaar share code",
    INVALID_BOARD: "Please select a valid board",
    INVALID_STANDARD: "Please select a valid class",
    INVALID_STATE: "Only Karnataka applications are accepted",
    INVALID_REFERRING_MEMBER_CATEGORY: "Please select a valid membership or contribution category",
    REFERRING_MEMBER_DETAILS_REQUIRED: "Please enter the referring member details",
    INVALID_AADHAAR_FILE_FORMAT: "Upload the UIDAI Aadhaar offline ZIP or extracted XML file",
    AADHAAR_PARSE_FAILED: "Unable to read the Aadhaar offline file. Please verify the share code and try again"
  }
});

module.exports = MESSAGES;
