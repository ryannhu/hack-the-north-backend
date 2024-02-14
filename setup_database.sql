
-- SQL script to create three tables: Person, Skill, and PersonSkill

-- Create the Person table
CREATE TABLE IF NOT EXISTS Person (
    person_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    checkin BOOLEAN DEFAULT 0
);

-- Create the Skill table
CREATE TABLE IF NOT EXISTS Skill (
    skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill TEXT NOT NULL UNIQUE
);

-- Create the PersonSkill table
CREATE TABLE IF NOT EXISTS PersonSkill (
    person_skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id)
);

CREATE TABLE IF NOT EXISTS Hardware (
    hardware_id INTEGER PRIMARY KEY AUTOINCREMENT,
    hardware_name TEXT,
    quantity_available INTEGER CHECK(quantity_available >= 0)
);

CREATE TABLE IF NOT EXISTS HardwareLoan (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    hardware_id INTEGER NOT NULL,
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (hardware_id) REFERENCES Hardware(hardware_id)
);



