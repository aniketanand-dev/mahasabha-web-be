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
    APPLICATIONS_CLOSED: "Scholarship applications are closed for now",
    STATUS_UPDATED: "Scholarship application status updated successfully",
    AADHAAR_ALREADY_EXISTS: "An application already exists for this Aadhaar number",
    REGISTRATION_NO_ALREADY_EXISTS: "An application already exists for this registration number",
    INVALID_MARKS: "Marks obtained cannot be greater than total marks",
    INVALID_MARKS_FORMAT: "Marks must contain only digits and be up to 4 digits",
    REQUIRED_FILES: "All required documents must be uploaded",
    INVALID_BOARD: "Please select a valid board",
    INVALID_STANDARD: "Please select a valid class",
    INVALID_STATUS: "Please select a valid scholarship status",
    REJECTION_COMMENT_REQUIRED: "Rejection comment is required when rejecting an application",
    INVALID_REFERRING_MEMBER_CATEGORY: "Please select a valid membership or contribution category",
    REFERRING_MEMBER_DETAILS_REQUIRED: "Please enter the referring member details"
  },
  ORG_STRUCTURE: {
    CREATED: "Organization structure member created successfully",
    UPDATED: "Organization structure member updated successfully",
    DELETED: "Organization structure member deleted successfully",
    NOT_FOUND: "Organization structure member not found",
    INVALID_PAYLOAD: "Please provide valid organization member data",
    INVALID_LOCATION_HIERARCHY: "Location hierarchy must match the selected organization level",
    PARENT_REQUIRED: "Parent member is required for district and taluk levels",
    INVALID_PARENT: "Selected parent member is not valid for this level",
    PARENT_NOT_FOUND: "Selected parent member not found",
    INVALID_PARENT_LOCATION: "Selected parent member location does not match this member",
    HIERARCHY_CHANGE_BLOCKED: "Cannot change level or location while this member has child members",
    HAS_CHILDREN: "Delete child members first before deleting this member"
  }
});

module.exports = MESSAGES;
