# Hack the North 2021 Backend Boilerplate

This boilerplate contains boilerplate for a REST Express app on Node. The current directory is mounted as a volume under `/src/app` so
that you do not have to rebuild the image every time (along with `node_modules`). Building and running the image will start the Express server on port 5000.

Good luck!


# API Endpoint Documentation

### `GET /users`
Fetches a list of all users, including their skills.

**Response:**
- `200 OK`: An array of users with their details and skills.
- `500 Internal Server Error`: If there's a failure fetching users.

### `GET /user/:id`
Fetches details for a specific user by their `person_id`.

**Parameters:**
- `id`: The ID of the user to retrieve.

**Response:**
- `200 OK`: The user's details, including skills.
- `500 Internal Server Error`: If there's a failure fetching the user.

### `GET /skills`
Fetches a list of skills, optionally filtered by their frequency among users.

**Query Parameters:**
- `min_frequency`: (Optional) The minimum frequency to filter skills.
- `max_frequency`: (Optional) The maximum frequency to filter skills.

**Response:**
- `200 OK`: An array of skills with their frequency.
- `500 Internal Server Error`: If there's a failure fetching skills.

### `PUT /user/:id`
Updates details for a specific user, including adding or updating their skills.

**Parameters:**
- `id`: The ID of the user to update.

**Body:**
- JSON object with user details to update and/or an array of skills to add or update.

**Response:**
- `200 OK`: The updated user's details, including skills.
- `500 Internal Server Error`: If there's a failure updating the user.
