# API Documentation - Tahuna Preventive App

This document outlines the available API endpoints for the Tahuna Preventive Maintenance application.

## Services

*   **Auth Service**: Handles user authentication via Google OAuth.
*   **Backend Service**: Manages data for service hours, schedules, materials, and realizations.

---

## Auth Service (Port 3002)

### Authentication Flow
1.  **Initiate Login**: Redirect user to `/auth/google`.
2.  **Callback**: Google redirects to `/auth/google/callback` with a code. Service exchanges code for tokens and redirects to frontend with a JWT.

### Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/auth/google` | Initiates Google OAuth flow. |
| `GET` | `/auth/google/callback` | OAuth callback handler. |
| `GET` | `/auth/verify` | Verifies the JWT token from cookie or header. |
| `POST` | `/auth/logout` | Clears the auth cookie. |

---

## Backend Service (Port 3001)

### Base URL: `/api`

### Service Hours
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/service-hours` | Get latest service hours for all units. |

### Preventive Schedule
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/pm/schedule` | Generate PM schedule based on current service hours. |

### Materials
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/materials` | Get material list. Filter by `?unit=X` query param. |

### Realizations (CRUD)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/pm/realizations` | List realizations. Supports pagination/filtering. |
| `GET` | `/pm/realizations/:id` | Get details of a specific realization. |
| `POST` | `/pm/realizations` | Create a new realization. Body: `{ unit, date, type, materials... }` |
| `DELETE` | `/pm/realizations/:id` | Delete a realization. |

---

## Docker Deployment
To run the entire stack:
```bash
docker-compose up -d --build
```
This will start:
*   **Postgres**: Port 5432
*   **Backend**: Port 3001
*   **Auth**: Port 3002
*   **Frontend**: Port 80 (accessible at http://localhost)
