# Mahasabha Backend API Documentation

This document covers the backend APIs implemented in `mahasabha-backend`.

## Overview

- App health endpoint: `/health`
- Versioned API base: `/api/v1`
- Media API base: `/api`
- Static uploaded files: `/uploads/...`

## Common Response Format

Successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Validation error",
  "details": null
}
```

## Common Status Codes

- `200` success
- `201` created
- `204` no content
- `400` validation or bad request
- `401` unauthorized or invalid token
- `403` forbidden
- `404` not found
- `409` conflict
- `422` validation details for some auth password rules
- `429` rate limit exceeded
- `500` internal server error

## Authentication

Admin-protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

The access token is returned by `POST /api/v1/auth/login`.

## Rate Limiting

Rate limiting is enabled for:

- all `/api/v1` routes
- auth routes
- upload routes

The limits come from environment variables, so the exact thresholds depend on deployment config.

## Health

### `GET /health`

Checks whether the server is running.

Response:

```json
{
  "status": "ok"
}
```

## Auth

Base path: `/api/v1/auth`

### `POST /signup`

Creates an admin user.

Request body:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "StrongPass123"
}
```

Rules:

- all fields are required
- `password` must be at least 8 characters
- `username` and `email` are normalized to lowercase
- username and email must be unique

Response `201`:

```json
{
  "success": true,
  "message": "Admin signup successful",
  "data": {
    "id": "6848...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2026-06-11T10:00:00.000Z"
  }
}
```

### `POST /login`

Logs in an admin and returns a JWT access token.

Request body:

```json
{
  "username": "admin",
  "password": "StrongPass123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "admin": {
      "id": "6848...",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### `POST /forgot-password`

Generates a reset token and sends a reset email if the account exists.

Request body:

```json
{
  "email": "admin@example.com"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "If an account exists, a password reset link has been generated",
  "data": null
}
```

### `POST /reset-password`

Resets the admin password using the email reset token.

Request body:

```json
{
  "token": "<reset-token>",
  "password": "NewStrongPass123"
}
```

Rules:

- `token` is required
- `password` must be at least 8 characters

Response `200`:

```json
{
  "success": true,
  "message": "Password reset successful",
  "data": null
}
```

## Analytics

Base path: `/api/v1/analytics`

### `POST /visit`

Tracks a page visit.

Request body:

```json
{
  "visitorId": "browser-or-device-id",
  "path": "/home",
  "referrer": "https://google.com"
}
```

Rules:

- `visitorId` is required
- `path` defaults to `/`
- server also stores IP and user agent

Response `200`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "isNewVisitor": true
  }
}
```

### `GET /summary`

Public analytics summary.

Response `200`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "totalVisits": 120,
    "uniqueVisitors": 75,
    "lastVisitedAt": "2026-06-11T10:00:00.000Z"
  }
}
```

### `GET /stats`

Admin-only analytics summary. Response shape is the same as `/summary`.

Auth required: `Bearer` token

## Scholarships

Base path: `/api/v1/scholarships`

### `GET /summary`

Returns total scholarship applications.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "totalApplications": 42
  }
}
```

### `GET /portal-settings`

Returns scholarship portal settings and open/closed state.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "displayYear": "2025-26",
    "applicationDeadline": "2026-06-30T23:59",
    "closedTitle": "Scholarship Applications Closed",
    "closedMessage": "The scholarship application period has ended. Please check back for the next cycle.",
    "isOpen": true
  }
}
```

### `GET /registration-status`

Checks whether a registration number is available in an academic year.

Query params:

- `academicYearId` required
- `registrationNo` required

Example:

```text
/api/v1/scholarships/registration-status?academicYearId=6848...&registrationNo=REG-001
```

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "academicYearId": "6848...",
    "academicYear": "AY-2025-2026",
    "registrationNo": "REG-001",
    "available": true,
    "message": "Registration number is available"
  }
}
```

### `GET /academic-years`

Returns academic year options.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "_id": "6848...",
        "label": "AY-2025-2026",
        "startYear": 2025
      }
    ]
  }
}
```

### `POST /academic-years`

Creates the next or previous academic year.

Auth required: `Bearer` token

Request body:

```json
{
  "direction": "next"
}
```

Supported values:

- `next`
- `previous`

Response `201`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "item": {
      "_id": "6848...",
      "label": "AY-2026-2027",
      "startYear": 2026
    }
  }
}
```

### `GET /applications`

Returns scholarship applications for admin use.

Auth required: `Bearer` token

Query params:

- `page` optional, default `1`
- `limit` optional, default `10`, max `100`
- `all=true` optional, returns all records without pagination slicing
- `academicYearId` optional
- `status` optional: `pending`, `accepted`, `rejected`
- `search` optional, matches application number, registration number, Aadhaar, names, mobile, email, parents
- `state` optional
- `district` optional
- `taluk` optional
- `submittedFrom` optional, format `YYYY-MM-DD`
- `submittedTo` optional, format `YYYY-MM-DD`

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "_id": "6848...",
        "applicationNumber": "PP-2025-2026-12345678",
        "serialNumber": 12,
        "registrationNo": "REG-001",
        "firstName": "Anita",
        "middleName": "",
        "lastName": "Patil",
        "gender": "Female",
        "fatherName": "Ramesh",
        "motherName": "Suma",
        "academicYear": "AY-2025-2026",
        "board": "state",
        "standard": "12th",
        "marksObtained": 550,
        "totalMarks": 600,
        "percentage": 91.67,
        "status": "pending",
        "mobile": "9876543210",
        "emailId": "anita@example.com",
        "aadhaarNumber": "123412341234",
        "village": "Village",
        "taluk": "Taluk",
        "district": "District",
        "state": "Karnataka",
        "pinCode": "560001",
        "accountHolderName": "Anita Patil",
        "bankName": "SBI",
        "bankBranchName": "Main Branch",
        "accountNumber": "123456789012",
        "ifscCode": "SBIN0001234",
        "heardFromMember": false,
        "referringMemberCategory": "",
        "referringMemberName": "",
        "referringMemberRegistrationNo": "",
        "profilePhotoUrl": "/uploads/scholarships/...",
        "casteCertificateUrl": "/uploads/scholarships/...",
        "marksCardUrl": "/uploads/scholarships/...",
        "aadhaarCardUrl": "/uploads/scholarships/...",
        "aadhaarOfflineFileUrl": "",
        "rejectionComment": "",
        "submittedAt": "2026-06-11T10:00:00.000Z",
        "createdAt": "2026-06-11T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5
    }
  }
}
```

### `GET /applications/export-zip`

Exports uploaded scholarship files as a zip archive.

Auth required: `Bearer` token

Query params:

- `academicYearId` optional

Response:

- `200 OK`
- `Content-Type: application/zip`
- downloadable zip file

### `POST /applications`

Submits a scholarship application.

Content type:

```http
multipart/form-data
```

Text form fields:

- `academicYearId` required
- `registrationNo` required
- `firstName` required
- `middleName` optional
- `lastName` required
- `gender` required: `Male`, `Female`, `Other`
- `fatherName` required
- `motherName` required
- `mobile` required, 10 digits
- `emailId` required, valid email
- `village` required
- `taluk` required
- `district` required
- `state` required
- `pinCode` required, 6 digits
- `accountHolderName` required
- `bankName` required
- `bankBranchName` required
- `accountNumber` required, 9 to 18 digits
- `ifscCode` required, valid IFSC pattern
- `aadhaarNumber` required, 12 digits
- `board` required: `state`, `ICSE`, `CBSE`, `Other`
- `otherBoard` required if `board=Other`
- `standard` required: `10th`, `12th`
- `marksObtained` required, integer up to 4 digits
- `totalMarks` required, integer up to 4 digits
- `percentage` required, `0` to `100`
- `heardFromMember` required boolean
- `referringMemberCategory` required only when `heardFromMember=true`
- `referringMemberName` required only when `heardFromMember=true`
- `referringMemberRegistrationNo` required only when `heardFromMember=true`
- `termsAccepted` required boolean, must be true
- `declarationAccepted` required boolean, must be true

Upload fields:

- `profilePhoto` required
- `casteCertificate` required
- `marksCard` required
- `aadhaarCard` required

Upload rules:

- only image files are accepted
- allowed mime types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- each required scholarship file must be `<= 1 MB`

Response `201`:

```json
{
  "success": true,
  "message": "Scholarship application submitted successfully",
  "data": {
    "id": "6848...",
    "applicationNumber": "PP-2025-2026-12345678",
    "serialNumber": 12,
    "totalApplications": 12,
    "submittedAt": "2026-06-11T10:00:00.000Z",
    "status": "pending"
  }
}
```

### `PATCH /applications/:id/status`

Updates application review status.

Auth required: `Bearer` token

Request body:

```json
{
  "status": "accepted",
  "rejectionComment": ""
}
```

Rules:

- `status` must be `pending`, `accepted`, or `rejected`
- `rejectionComment` is required when `status` is `rejected`

Response:

Returns the updated scholarship application document.

## Site Content

Base path: `/api/v1/site-content`

This API stores singleton content blocks. The payload is always wrapped in a `value` field.

### `GET /`

Returns one or more content blocks.

Query params:

- `keys` optional comma-separated list

If `keys` is omitted, the API returns all allowed singleton content blocks.

Example:

```text
/api/v1/site-content?keys=adm_hero_content,adm_footer_content
```

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": {
      "adm_hero_content": {
        "logoUrl": "/uploads/hero/logo.png",
        "englishTitle": "Akhila Bharata Veerashiva Mahasabha",
        "scrollLabel": "SCROLL",
        "stats": [
          { "id": 1, "value": "120+", "label": "YEARS" }
        ]
      }
    }
  }
}
```

### `PUT /:key`

Upserts one content block.

Auth required: `Bearer` token

Request body:

```json
{
  "value": {}
}
```

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "value": {},
    "updatedAt": "2026-06-11T10:00:00.000Z"
  }
}
```

Allowed content keys:

- `adm_text_overrides`: object map of translation key to string
- `adm_hero_content`: `{ logoUrl, englishTitle, scrollLabel, stats[] }`
- `adm_president_note_content`: `{ photoUrl }`
- `adm_bhavan_content`: `{ imageUrls[], address, phone, email }`
- `adm_navbar_content`: `{ logoUrl, nameKn, nameEn, byeLawUrl, magazineUrl }`
- `adm_daily_vachana`: `{ enabled, title, quote, author, reflection, updatedAt }`
- `adm_scholarship_settings`: `{ displayYear, applicationDeadline, closedTitle, closedMessage }`
- `adm_footer_content`: `{ logoSymbol, orgNameKn, orgNameEn, facebookUrl, twitterUrl, youtubeUrl, instagramUrl, address, phone, email }`
- `adm_cm_leaders`: array of `{ id, img, name, state, party }`
- `adm_past_presidents`: array of `{ id, img, name, tenure }`
- `adm_events`: array of `{ id, category, img, date, title, description, badgeClass, link }`
- `adm_directory_entries`: array of `{ id, name, state, district, address, contact, type }`
- `adm_org_nodes`: legacy singleton organization content block
- `adm_founders`: array of `{ id, img, name, title, bio }`
- `adm_tickers`: array of `{ id, text, link }`
- `adm_hostels`: legacy singleton hostel content block

Note:

- `adm_org_nodes` exists in site content, but active organization flow data is managed by `/api/v1/organization-structure`
- hostel CRUD is handled by `/api/v1/hostels`

## Hostels

Base path: `/api/v1/hostels`

### `GET /`

Returns all hostels.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "hostels": [
      {
        "id": 1718100000000,
        "name": "Basava Hostel",
        "location": "Bengaluru",
        "contact": "+91 9876543210",
        "description": "Student hostel",
        "capacity": "120",
        "img": "/uploads/hostels/..."
      }
    ]
  }
}
```

### `POST /`

Creates a hostel.

Auth required: `Bearer` token

Request body:

```json
{
  "name": "Basava Hostel",
  "location": "Bengaluru",
  "contact": "+91 9876543210",
  "description": "Student hostel",
  "capacity": "120",
  "img": "/uploads/hostels/hostel.jpg"
}
```

Rules:

- `name` is required
- `img` is required

Response `201`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "hostel": {
      "id": 1718100000000,
      "name": "Basava Hostel",
      "location": "Bengaluru",
      "contact": "+91 9876543210",
      "description": "Student hostel",
      "capacity": "120",
      "img": "/uploads/hostels/hostel.jpg"
    }
  }
}
```

### `PATCH /:id`

Updates a hostel by numeric `id`.

Auth required: `Bearer` token

Request body:

```json
{
  "name": "Updated Hostel Name",
  "img": "/uploads/hostels/new-image.jpg"
}
```

All fields are optional, but provided fields are trimmed and saved.

### `DELETE /:id`

Deletes a hostel and removes its managed image file.

Auth required: `Bearer` token

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## Organization Structure

Base path: `/api/v1/organization-structure`

This API stores organization members as flat documents and returns them as a tree using `parentNodeId`.

Allowed levels:

- `state`
- `district`
- `city`
- `corporation`
- `assembly`
- `taluk`

### `GET /`

Returns the organization tree.

Query params:

- `includeInactive=true|false` optional, default `false`
- `state` optional
- `district` optional
- `taluk` optional

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "tree": [
      {
        "id": "6848...",
        "name": "Dr. X",
        "designation": "President",
        "contact": "9876543210",
        "description": "National President",
        "image": {
          "url": "/uploads/founders/...",
          "alt": "President"
        },
        "level": "state",
        "location": {
          "state": "Karnataka",
          "district": "",
          "taluk": ""
        },
        "sidebarLabel": "president-office",
        "displayOrder": 0,
        "isActive": true,
        "parentNodeId": null,
        "createdAt": "2026-06-11T10:00:00.000Z",
        "updatedAt": "2026-06-11T10:00:00.000Z",
        "children": []
      }
    ]
  }
}
```

### `GET /sidebar`

Returns a simplified tree for sidebar navigation.

Query params:

- `state` optional
- `district` optional
- `taluk` optional

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "6848...",
        "label": "president-office",
        "level": "state",
        "location": {
          "state": "Karnataka",
          "district": "",
          "taluk": ""
        },
        "children": []
      }
    ]
  }
}
```

### `POST /`

Creates an organization member.

Auth required: `Bearer` token

Request body:

```json
{
  "name": "Dr. X",
  "designation": "President",
  "contact": "9876543210",
  "description": "National President",
  "image": {
    "url": "/uploads/founders/person.jpg",
    "alt": "Dr. X"
  },
  "level": "state",
  "location": {
    "state": "Karnataka",
    "district": "",
    "taluk": ""
  },
  "sidebarLabel": "president-office",
  "displayOrder": 0,
  "isActive": true,
  "parentNodeId": null
}
```

Validation rules:

- `name`, `designation`, `level`, and `location.state` are required
- non-`state` levels require a valid `parentNodeId`
- parent/child level and location combinations are strictly validated
- `displayOrder` must be numeric
- `state` level cannot have district or taluk
- `district` requires district and no taluk
- `taluk` requires district and taluk
- `city`, `corporation`, and `assembly` use empty district/taluk in this model

Response `201`:

```json
{
  "success": true,
  "message": "Organization structure member created successfully",
  "data": {
    "node": {
      "id": "6848...",
      "name": "Dr. X",
      "designation": "President",
      "contact": "9876543210",
      "description": "National President",
      "image": {
        "url": "/uploads/founders/person.jpg",
        "alt": "Dr. X"
      },
      "level": "state",
      "location": {
        "state": "Karnataka",
        "district": "",
        "taluk": ""
      },
      "sidebarLabel": "president-office",
      "displayOrder": 0,
      "isActive": true,
      "parentNodeId": null,
      "createdAt": "2026-06-11T10:00:00.000Z",
      "updatedAt": "2026-06-11T10:00:00.000Z"
    }
  }
}
```

### `PATCH /:id`

Updates an organization member by MongoDB ObjectId.

Auth required: `Bearer` token

Rules:

- same validation as create
- circular parent relationships are blocked
- level/location cannot change when the node still has children

### `DELETE /:id`

Deletes an organization member by MongoDB ObjectId.

Auth required: `Bearer` token

Rules:

- node must exist
- node cannot be deleted while it has children

Response:

```json
{
  "success": true,
  "message": "Organization structure member deleted successfully",
  "data": {}
}
```

## Media Uploads and Gallery

Base path: `/api`

These routes are mounted outside `/api/v1`.

Auth note:

- these media endpoints do not currently require admin authentication in the backend

### `POST /api/uploads/:folder`

Uploads one file and returns a managed `/uploads/...` path.

Content type:

```http
multipart/form-data
```

File field:

- `image`

Allowed folders:

- `gallery`
- `documents`
- `magazines`
- `placeholders`
- `navbar`
- `hero`
- `president`
- `bhavan`
- `leaders`
- `past-presidents`
- `events`
- `founders`
- `hostels`
- `scholarships`

Rules:

- for `documents` and `magazines`, only PDF is allowed
- for all other folders, only image files are allowed
- max upload size is `10 MB`

Response `201`:

```json
{
  "src": "/uploads/hero/1718100000000-logo.png"
}
```

### `DELETE /api/uploads`

Deletes a managed file by path.

Request body:

```json
{
  "path": "/uploads/hero/1718100000000-logo.png"
}
```

Response:

- `204 No Content`

### `GET /api/gallery`

Returns gallery items.

Response:

```json
[
  {
    "id": 1718100000000,
    "src": "/uploads/gallery/1718100000000-image.jpg",
    "mediaType": "image",
    "caption": "Annual Event"
  }
]
```

### `POST /api/gallery`

Creates a gallery item.

Content type:

```http
multipart/form-data
```

Fields:

- `media` required
- `caption` optional

Rules:

- images and videos are allowed
- max upload size is `10 MB`

Response `201`:

```json
{
  "id": 1718100000000,
  "src": "/uploads/gallery/1718100000000-image.jpg",
  "mediaType": "image",
  "caption": "Annual Event"
}
```

### `PATCH /api/gallery/:id`

Updates gallery caption and optionally replaces the media file.

Content type:

```http
multipart/form-data
```

Fields:

- `media` optional
- `caption` optional

Rules:

- if a new file is uploaded, the old managed file is deleted
- returns `404` if the gallery item does not exist

### `DELETE /api/gallery/:id`

Deletes a gallery item and its managed file.

Response:

- `204 No Content`

## Static Uploaded Files

### `GET /uploads/<folder>/<filename>`

Serves uploaded media files statically.

Examples:

- `/uploads/hero/1718100000000-logo.png`
- `/uploads/documents/1718100000000-bylaw.pdf`

## Example cURL

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Mahasabha@123"}'
```

### Upload hero image

```bash
curl -X POST http://localhost:5000/api/uploads/hero \
  -F "image=@/path/to/logo.png"
```

### Create hostel

```bash
curl -X POST http://localhost:5000/api/v1/hostels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Basava Hostel",
    "location":"Bengaluru",
    "contact":"+91 9876543210",
    "description":"Student hostel",
    "capacity":"120",
    "img":"/uploads/hostels/hostel.jpg"
  }'
```
