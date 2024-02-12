import express from "express";
import sqlite3 from "sqlite3";

const port = process.env.PORT || 3000;

const app = express();

// Create a database if none exists
const database = new sqlite3.Database("hackers.db");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/users", (req, res) => {
  database.all(`SELECT p.person_id, p.name, p.company, p.email, p.phone,
              json_group_array(json_object('skill', s.skill, 'rating', ps.rating)) as skills
              FROM person p
              LEFT JOIN PersonSkill ps ON ps.person_id = p.person_id
              LEFT JOIN Skill s ON ps.skill_id = s.skill_id
              GROUP BY p.person_id`, (err, rows) => {
  if(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } else {
    rows.forEach(row => {
      row.skills = JSON.parse(row.skills);
    }
    );
    res.json(rows);
  }
});
});


app.listen(port, () => {
  console.log(`Example REST Express app listening at http://localhost:${port}`);
});
