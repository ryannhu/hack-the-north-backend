# Hack the North Backend Challenge
This app is deployed at https://hackthenorth-hx4mcvamaq-uk.a.run.app on Google Cloud Run

# Database Initialization and Data Import Documentation

This documentation covers the setup and initialization of the `hackers.db` SQLite database, the structure of the SQL schema, and the process of importing data from JSON files using a Bash script and a Python script.

## Bash Script (`setup.sh`)

The Bash script is responsible for checking if the database file exists, creating the database schema from an SQL file, and importing data from JSON files using a Python script.

### Steps

1. **Check for Existing Database File:** The script first checks if `hackers.db` exists to prevent overwriting.
2. **Create Database Schema:** If the database does not exist, it executes an SQL script (`setup_database.sql`) to create the schema.
3. **Import Data:** Uses `import.py` to import data from JSON files into the newly created database.

### File Variables

- `DATABASE_FILE="hackers.db"`: The SQLite database file.
- `SCHEMA_FILE="setup_database.sql"`: SQL script for creating the database schema.
- `IMPORT_FILE="HTN_2023_BE_Challenge_Data.json"`: JSON file containing user data.
- `HARDWARE_FILE="Hardware_Data.json"`: JSON file containing hardware data.
- `EVENT_FILE="Event_Data.json"`: JSON file containing event data.

## SQL Schema (`setup_database.sql`)

Defines the structure for five tables: `Person`, `Skill`, `PersonSkill`, `Hardware`, `HardwareLoan`, `Events`, and `EventScan`.

### Tables

- **Person:** Stores user information with fields like `name`, `company`, `email`, `phone`, and `checkin` status.
- **Skill:** Unique skills with `skill_id` and `skill` name.
- **PersonSkill:** Relationship between persons and skills, including a `rating`.
- **Hardware:** Information about hardware items, including available quantity.
- **HardwareLoan:** Tracks hardware loans to users, with checkout and return timestamps.
- **Events:** Stores event details, including `event_name`, `event_type`, `start_time`, and `end_time`.
- **EventScan:** Logs user scans at events to track attendance.

### Constraints and Keys

- Primary keys are auto-incremented (`*_id` columns).
- Foreign keys establish relationships between tables.
- `UNIQUE` and `CHECK` constraints ensure data integrity.

## Python Import Script (`import.py`)

The Python script reads JSON files and inserts the data into the corresponding tables in the SQLite database.

### JSON File Structure

- **User Data (`HTN_2023_BE_Challenge_Data.json`):** Contains users' names, companies, emails, phones, and skills.
- **Hardware Data (`Hardware_Data.json`):** Includes hardware names and quantities.
- **Event Data (`Event_Data.json`):** Details of events, including names, types, and times.

### Import Process

1. **Insert Users:** For each user in the user data file, insert their information into the `Person` table and their skills into the `Skill` and `PersonSkill` tables.
2. **Insert Hardware:** Add entries from the hardware data file to the `Hardware` table.
3. **Insert Events:** Populate the `Events` table with information from the event data file.

### Database Connection

- Utilizes `sqlite3` to connect to and interact with `hackers.db`.
- Commits transactions after inserting data and closes the connection at the end.

## Usage

- Run the Bash script to set up the database and import data:
  ```bash
  ./setup.sh

# API Endpoint Documentation

## General Endpoints

### 1. Welcome Endpoint

- **Endpoint:** `GET /`
- **Description:** Returns a simple welcome message.
- **Response:** 
  - **Status Code:** 200 OK
  - **Body:** `"Hello World!"`

## User Management

### 2. List Users

- **Endpoint:** `GET /users`
- **Description:** Fetches a list of users along with their aggregated skills.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Array of user objects, each including fields like `person_id`, `name`, `company`, `email`, `phone`, and an array of `skills` (with `skill` and `rating`).
  - **Response Example** 
  ```json
  {
    "person_id": 1,
    "name": "John Doe",
    "company": "Tech Inc.",
    "email": "johndoe@example.com",
    "phone": "1234567890",
    "skills": [
      {
        "skill": "JavaScript",
        "rating": 5
      },
      {
        "skill": "Python",
        "rating": 4
      }
    ]
  }
    ```

### 3. User Detail

- **Endpoint:** `GET /user/:id`
- **Description:** Retrieves detailed information for a specific user by their ID, including their skills.
- **URL Parameters:** `id` (required) - The ID of the user.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** A user object including all user fields plus an array of skills with `skill` and `rating`.

### 4. Update User

- **Endpoint:** `PUT /user/:id`
- **Description:** Updates user information and their associated skills for a given ID.
- **URL Parameters:** `id` (required) - The ID of the user to update.
- **Request Body:** JSON object with fields to update, including an optional `skills` array.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Updated user object, including the updated list of skills.

## Skill Management

### 5. List Skills

- **Endpoint:** `GET /skills`
- **Description:** Returns a list of skills, with optional filtering by minimum and maximum frequency.
- **Query Parameters:**
  - `min_frequency` (optional): Minimum frequency of the skill across users.
  - `max_frequency` (optional): Maximum frequency of the skill across users.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Array of skill objects, each including `skill_id`, `skill`, and `frequency`.

## Check-in Management

### 6. Check-in Status

- **Endpoint:** `GET /checked-in/:id`
- **Description:** Checks if a user with a specific ID has checked in.
- **URL Parameters:** `id` (required) - The ID of the user.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Object with `checkin` boolean indicating the user's check-in status.

### 7. Update Check-in Status

- **Endpoint:** `PUT /check-in/:id`
- **Description:** Updates the check-in status of a user with a given ID to checked in.
- **URL Parameters:** `id` (required) - The ID of the user.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Object with `checkin` boolean set to true.

## Hardware Management

### 8. Checkout Hardware

- **Endpoint:** `POST /hardware/checkout`
- **Description:** Processes hardware checkout, updating inventory and logging the transaction.
- **Request Body:** JSON object with `user_id` and `hardware_id`.
- **Response:**
  - **Status Code:** 200 OK / 400 Bad Request / 500 Internal Server Error
  - **Body:** Success message or error details.

### 9. Return Hardware

- **Endpoint:** `POST /hardware/return`
- **Description:** Processes the return of checked-out hardware, updating inventory and marking the hardware loan as returned.
- **Request Body:** JSON object with `loan_id`.
- **Response:**
  - **Status Code:** 200 OK / 400 Bad Request / 500 Internal Server Error
  - **Body:** Success message or error details.

### 10. List Hardware

- **Endpoint:** `GET /hardware`
- **Description:** Lists all hardware items along with their availability.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Array of hardware items, including details and quantity available.

## Event Management

### 11. Record Event Attendance

- **Endpoint:** `POST /scan`
- **Description:** Records a user's attendance at an event.
- **Request Body:** JSON object with `user_id` and `event_id`.
- **Response:**
  - **Status Code:** 200 OK / 400 Bad Request / 409 Conflict / 500 Internal Server Error
  - **Body:** Success message or error details.

### 12. List User's Attended Events

- **Endpoint:** `GET /user/events/:id`
- **Description:** Lists all events a user has attended, based on scans.
- **URL Parameters:** `id` (required) - The ID of the user.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Array of event objects, including event details and scan time.

### 13. List All Events

- **Endpoint:** `GET /events`
- **Description:** Lists all available events.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** Array of event objects with event details.

## Comprehensive User Information

### 14. User Information

- **Endpoint:** `GET /user/info/:id`
- **Description:** Provides comprehensive information about a user, including hardware loans and events attended.
- **URL Parameters:** `id` (required) - The ID of the user.
- **Response:**
  - **Status Code:** 200 OK
  - **Body:** User object including hardware loans and events scanned.
  - **Example Response:**
    ```json
    {
        "person_id": 1,
        "name": "Breanna Dillon",
        "company": "Jackson Ltd",
        "email": "lorettabrown@example.net",
        "phone": "+1-924-116-7963",
        "checkin": 0,
        "skills": [
            {
                "skill": "Swift",
                "rating": 4
            },
            {
                "skill": "OpenCV",
                "rating": 1
            }
        ],
        "hardware_loans": [
            {
                "loan_id": 1,
                "person_id": 1,
                "hardware_id": 5,
                "checkout_time": "2024-02-16 15:56:27",
                "return_time": "2024-02-16 15:59:26",
                "returned": 1
            },
            {
                "loan_id": 2,
                "person_id": 1,
                "hardware_id": 5,
                "checkout_time": "2024-02-16 15:56:52",
                "return_time": null,
                "returned": 0
            },
            {
                "loan_id": 3,
                "person_id": 1,
                "hardware_id": 2,
                "checkout_time": "2024-02-16 15:56:55",
                "return_time": null,
                "returned": 0
            },
            {
                "loan_id": 4,
                "person_id": 1,
                "hardware_id": 3,
                "checkout_time": "2024-02-16 15:57:03",
                "return_time": "2024-02-16 15:59:31",
                "returned": 1
            }
        ],
        "events_scanned": [
            {
                "event_id": 4,
                "event_name": "Blockchain Basics",
                "start_time": "2024-02-14 14:54:32",
                "end_time": "2024-02-14 15:54:32",
                "scan_time": "2024-02-16 15:00:00"
            },
            {
                "event_id": 2,
                "event_name": "Intro to Machine Learning",
                "start_time": "2024-02-13 19:54:39",
                "end_time": "2024-02-13 21:54:39",
                "scan_time": "2024-02-16 15:03:41"
            },
            {
                "event_id": 10,
                "event_name": "Lunch Break",
                "start_time": "2024-02-15 15:43:57",
                "end_time": "2024-02-15 16:49:57",
                "scan_time": "2024-02-16 15:05:13"
            },
            {
                "event_id": 1,
                "event_name": "Deep Learning for Computer Vision",
                "start_time": "2024-02-14 04:03:53",
                "end_time": "2024-02-14 07:03:53",
                "scan_time": "2024-02-16 15:06:34"
            },
            {
                "event_id": 5,
                "event_name": "DevOps with Docker and Kubernetes",
                "start_time": "2024-02-15 18:27:25",
                "end_time": "2024-02-15 21:27:25",
                "scan_time": "2024-02-16 15:06:36"
            }
        ]
    }
    ```