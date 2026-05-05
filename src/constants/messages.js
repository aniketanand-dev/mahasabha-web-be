const MESSAGES = Object.freeze({
  COMMON: {
    SUCCESS: "Success",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_SERVER_ERROR: "Internal server error",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized request",
    TOO_MANY_REQUESTS: "Too many requests. Please try again later."
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
    TOKEN_REQUIRED: "Reset token is required",
    TOO_MANY_REQUESTS: "Too many authentication attempts. Please try again later."
  },
  DEFAULT_ADMIN: {
    CREATED: "Default admin created",
    EXISTS: "Default admin already exists"
  },
  SCHOLARSHIPS: {
    APPLICATION_SUBMITTED: "Scholarship application submitted successfully",
    STATUS_UPDATED: "Scholarship application status updated successfully",
    AADHAAR_ALREADY_EXISTS: "An application already exists for this Aadhaar number",
    REGISTRATION_NO_ALREADY_EXISTS: "An application already exists for this registration number",
    INVALID_MARKS: "Marks obtained cannot be greater than total marks",
    INVALID_MARKS_FORMAT: "Marks must contain only digits and be up to 4 digits",
    REQUIRED_FILES: "All required documents must be uploaded",
    INVALID_AADHAAR_SHARE_CODE: "Please enter a valid Aadhaar share code",
    INVALID_BOARD: "Please select a valid board",
    INVALID_STANDARD: "Please select a valid class",
    INVALID_STATE: "Only Karnataka applications are accepted",
    INVALID_STATUS: "Please select a valid scholarship status",
    REJECTION_COMMENT_REQUIRED: "Rejection comment is required when rejecting an application",
    INVALID_REFERRING_MEMBER_CATEGORY: "Please select a valid membership or contribution category",
    REFERRING_MEMBER_DETAILS_REQUIRED: "Please enter the referring member details",
    INVALID_AADHAAR_FILE_FORMAT: "Upload the UIDAI Aadhaar offline ZIP or extracted XML file",
    EMPTY_AADHAAR_FILE: "The Aadhaar offline file is empty. Upload the original ZIP or XML file again.",
    AADHAAR_PARSE_FAILED: "Unable to read the Aadhaar offline file. Please verify the share code and try again"
  }
});

module.exports = MESSAGES;
