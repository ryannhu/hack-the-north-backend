
-- SQL script to create three tables: Person, Skill, and PersonSkill
-- and insert data into them.

-- Create the Person table
CREATE TABLE IF NOT EXISTS Person (
    person_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT
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

