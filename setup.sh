#!/bin/bash

DATABASE_FILE="hackers.db"
SCHEMA_FILE="setup_database.sql"
IMPORT_FILE="HTN_2023_BE_Challenge_Data.json"
HARDWARE_FILE="Hardware_Data.json"
EVENT_FILE="Event_Data.json"

if [ -f "$DATABASE_FILE" ]; then
    echo "The database file $DATABASE_FILE already exists."
else
    echo "Creating database schema and inserting data..."
    # Run the SQL script to set up the schema and insert data
    sqlite3 $DATABASE_FILE < $SCHEMA_FILE
    python3 import.py $IMPORT_FILE $HARDWARE_FILE $EVENT_FILE
    echo "Database setup complete."
fi