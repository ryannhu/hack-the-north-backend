import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Create a database if none exists
const database = await open({
  filename: 'hackers.db',
  driver: sqlite3.Database
})



app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/users", async (req, res) => {
  try {
  const rows = await database.all(
    `SELECT p.person_id, p.name, p.company, p.email, p.phone,
              json_group_array(json_object('skill', s.skill, 'rating', ps.rating)) as skills
              FROM person p
              LEFT JOIN PersonSkill ps ON ps.person_id = p.person_id
              LEFT JOIN Skill s ON ps.skill_id = s.skill_id
              GROUP BY p.person_id`,
  );

  const formattedRows = rows.map(row => {
    return {
      ...row,
      skills: row.skills ? JSON.parse(row.skills) : [],
    };
  });
  
  res.json(formattedRows);
} catch (error) {
  console.error(error);
  res.status(500).json({ error: "Failed to fetch users" });
}
});


app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await database.get("SELECT * FROM person WHERE person_id = ?", id);
    const updatedSkills = await database.all("SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?", id);
    updatedUser.skills = updatedSkills;

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


  

app.put('/user/:id', async (req, res) => {

  
  const { id } = req.params;
  const updates = req.body;

  try {
    await database.run("BEGIN");

    // Update basic user info
    const updateKeys = Object.keys(updates).filter(key => key !== "skills");
    if (updateKeys.length > 0) {
      const query = `UPDATE person SET ${updateKeys.map(key => `${key} = ?`).join(", ")} WHERE person_id = ?`;
      const values = [...updateKeys.map(key => updates[key]), id];
      await database.run(query, values);
    }

    // Update skills
    if (updates.skills && updates.skills.length > 0) {
      for (const skill of updates.skills) {
        let skillRow = await database.get("SELECT skill_id FROM Skill WHERE skill = ?", skill.skill);

        let skillId;
        if (skillRow) {
          skillId = skillRow.skill_id;
        } else {
          const result = await database.run("INSERT INTO Skill (skill) VALUES (?)", skill.skill);
          skillId = result.lastID;
        }

        let personSkillRow = await database.get("SELECT * FROM PersonSkill WHERE person_id = ? AND skill_id = ?", id, skillId);
        if (personSkillRow) {
          await database.run("UPDATE PersonSkill SET rating = ? WHERE person_id = ? AND skill_id = ?", skill.rating, id, skillId);
        } else {
          await database.run("INSERT INTO PersonSkill (person_id, skill_id, rating) VALUES (?, ?, ?)", id, skillId, skill.rating);
        }
      }
    }

    await database.run("COMMIT");

    // Fetch and return updated user data
    const updatedUser = await database.get("SELECT * FROM person WHERE person_id = ?", id);
    const updatedSkills = await database.all("SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?", id);
    updatedUser.skills = updatedSkills;

    res.json(updatedUser);
  } catch (error) {
    await database.run("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to update user" });
  }
});



app.listen(port, () => {
  console.log(`Example REST Express app listening at http://localhost:${port}`);
});
