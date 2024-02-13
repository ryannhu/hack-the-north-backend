import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Open a database connection to hackers.db
const database = await open({
  filename: "hackers.db",
  driver: sqlite3.Database,
});

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

    const formattedRows = rows.map((row) => {
      let skills = [];
      if (row.skills) {
        // Attempt to parse the skills JSON string
        skills = JSON.parse(row.skills);
        // Filter out any elements that are null or have null skill values
        skills = skills.filter(skill => skill && skill.skill !== null);
      }
      return {
        ...row,
        skills,
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
    const updatedUser = await database.get(
      "SELECT * FROM person WHERE person_id = ?",
      id,
    );
    const updatedSkills = await database.all(
      "SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?",
      id,
    );
    updatedUser.skills = updatedSkills;

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/skills", async (req, res) => {
  try {
    let { min_frequency, max_frequency } = req.query;
    const minFrequency = min_frequency ? parseInt(min_frequency) : undefined;
    const maxFrequency = max_frequency ? parseInt(max_frequency) : undefined;

    let query = `SELECT s.skill_id, s.skill, COUNT(ps.skill_id) AS frequency FROM Skill s
    LEFT JOIN PersonSkill ps ON ps.skill_id = s.skill_id
    GROUP BY s.skill_id`;

    const params = [];
    const havingConditions = [];
    if (minFrequency) {
      havingConditions.push(`frequency >= ?`);
      params.push(minFrequency);
    }
    if (maxFrequency) {
      havingConditions.push(`frequency <= ?`);
      params.push(maxFrequency);
    }

    if (havingConditions.length > 0) {
      query += " HAVING " + havingConditions.join(" AND ");
    }

    const rows = await database.all(query, ...params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

app.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await database.run("BEGIN");

    // Update basic user info
    const updateKeys = Object.keys(updates).filter((key) => key !== "skills");
    if (updateKeys.length > 0) {
      const query = `UPDATE person SET ${updateKeys.map((key) => `${key} = ?`).join(", ")} WHERE person_id = ?`;
      const values = [...updateKeys.map((key) => updates[key]), id];
      await database.run(query, values);
    }

    // Update skills
    if (updates.skills && updates.skills.length > 0) {
      for (const skill of updates.skills) {
        let skillRow = await database.get(
          "SELECT skill_id FROM Skill WHERE skill = ?",
          skill.skill,
        );

        let skillId;
        if (skillRow) {
          skillId = skillRow.skill_id;
        } else {
          const result = await database.run(
            "INSERT INTO Skill (skill) VALUES (?)",
            skill.skill,
          );
          skillId = result.lastID;
        }

        let personSkillRow = await database.get(
          "SELECT * FROM PersonSkill WHERE person_id = ? AND skill_id = ?",
          id,
          skillId,
        );
        if (personSkillRow) {
          await database.run(
            "UPDATE PersonSkill SET rating = ? WHERE person_id = ? AND skill_id = ?",
            skill.rating,
            id,
            skillId,
          );
        } else {
          await database.run(
            "INSERT INTO PersonSkill (person_id, skill_id, rating) VALUES (?, ?, ?)",
            id,
            skillId,
            skill.rating,
          );
        }
      }
    }

    await database.run("COMMIT");

    // Fetch and return updated user data
    const updatedUser = await database.get(
      "SELECT * FROM person WHERE person_id = ?",
      id,
    );
    const updatedSkills = await database.all(
      "SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?",
      id,
    );
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
