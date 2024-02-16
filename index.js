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
    const user = await database.get(
      "SELECT * FROM person WHERE person_id = ?",
      id,
    );
    const skills = await database.all(
      "SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?",
      id,
    );
    user.skills = skills;

    res.json(user);
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

app.get("/checked-in/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const checkedIn = await database.get(
      "SELECT checkin FROM Person WHERE person_id = ?",
      id,
    );
    // convert to boolean
    checkedIn.checkin = !!checkedIn.checkin;
    res.json(checkedIn);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch check-in status" });
  }
});

app.put("/check-in/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await database.run(
      "UPDATE Person SET checkin = 1 WHERE person_id = ?",
      id,
    );
    res.json({ checkin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update check-in status" });
  }
});

// Sign out hardware
app.post("/hardware/checkout", async (req, res) => {
  const { user_id, hardware_id } = req.body;

  try {
    await database.run("BEGIN")

    // check if there is enough hardware
    const hardware = await database.get(
      "SELECT quantity_available FROM Hardware WHERE hardware_id = ?",
      hardware_id
    );

    if (!hardware || hardware.quantity_available <= 0) {
      await database.run("ROLLBACK")
      return res.status(400).json({ error: "Hardware not avaiable for checkout"})
    }

    // update quantity of hardware
    await database.run(
      "UPDATE Hardware SET quantity_available = quantity_available - 1 WHERE hardware_id = ?",
      hardware_id
    );

    // Log the hardware checkout
    await database.run(
      "INSERT INTO HardwareLoan (person_id, hardware_id, checkout_time) VALUES (?, ?, datetime('now'))",
      [user_id, hardware_id]
  );

    // Commit the transaction
    await database.run("COMMIT");
  
    res.json({ message: "Hardware checked out successfully" });

  } catch (error) {
    console.error(error);
    await database.run("ROLLBACK")
    res.status(500).json({ error: "Failed to checkout hardware"})
  }
});

// Return hardware
app.post("/hardware/return", async (req, res) => {
  const { loan_id } = req.body;
  try {
    await database.run("BEGIN")
    
    // get hardware loan info and hardware id
    const loan = await database.get(
      "SELECT hardware_id, returned FROM HardwareLoan WHERE loan_id = ?",
      loan_id
    );

    if (!loan) {
      await database.run("ROLLBACK")
      return res.status(400).json({ error: "Hardware loan not found"})
    }

    if (loan.returned) {
      await database.run("ROLLBACK")
      return res.status(400).json({ error: "Hardware already returned"})
    }

    // update quantity of hardware
    await database.run(
      "UPDATE Hardware SET quantity_available = quantity_available + 1 WHERE hardware_id = ?",
      loan.hardware_id
    );

    // Log the hardware return
    await database.run(
      "UPDATE HardwareLoan SET return_time = datetime('now'), returned = 1 WHERE loan_id = ?",
      loan_id
    );

    // Commit the transaction
    await database.run("COMMIT");

    res.json({ message: "Hardware returned successfully" });
  } catch (error) {
    console.error(error);
    await database.run("ROLLBACK")
    res.status(500).json({ error: "Failed to return hardware"})
  
  }

});

// List all hardware
app.get("/hardware", async (req, res) => {
  try {
    const hardware = await database.all("SELECT * FROM Hardware");
    console.log(hardware);
    res.json(hardware);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch hardware" });
  }
})

// scan event endpoint
app.post("/scan", async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    // check that the user exists
    const user = await database.get("SELECT * FROM person WHERE person_id = ?", user_id);
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }
    // check that the event exists
    const event = await database.get("SELECT * FROM Events WHERE event_id = ?", event_id);
    if (!event) {
      return res.status(400).json({ error: "Event does not exist" });
    }
    // record the scan
    await database.run("INSERT INTO EventScan (person_id, event_id, scan_time) VALUES (?, ?, datetime('now'))", [user_id, event_id]);
    res.json({ message: "Attendance recorded successfully" });
  } catch (error) {
    if (error && error.code === 'SQLITE_CONSTRAINT') {
      console.error(error);
      res.status(409).json({ error: "A scan record for this event and person already exists." });
  } else {
      console.error(error);
      res.status(500).json({ error: "Failed to record attendance" });
  }
  }
});

// list events scanned for a user
app.get("/user/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // check that the user exists
    const user = await database.get("SELECT * FROM person WHERE person_id = ?", id);
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }
    const events = await database.all(
      "SELECT e.event_id, e.event_name, e.start_time, e.end_time, es.scan_time FROM Events e JOIN EventScan es ON e.event_id = es.event_id WHERE es.person_id = ?",
      id
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// list all avaliable events
app.get("/events", async (req, res) => {
  try {
    const events = await database.all("SELECT * FROM Events");
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});


app.get("/user/info/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const userInfo = await database.get(
      "SELECT * FROM person WHERE person_id = ?",
      id,
    );
    if (!userInfo) {
      return res.status(404).json({ error: "User not found" });
    }
    const skills = await database.all(
      "SELECT s.skill, ps.rating FROM PersonSkill ps JOIN Skill s ON ps.skill_id = s.skill_id WHERE ps.person_id = ?",
      id,
    );
    userInfo.skills = skills;

    // get all hardware loan
    const hardwareLoans = await database.all(
      "SELECT * FROM HardwareLoan WHERE person_id = ?",
      id,
    );
    // get all events scanned
    const eventsScanned = await database.all(
      "SELECT e.event_id, e.event_name, e.start_time, e.end_time, es.scan_time FROM Events e JOIN EventScan es ON e.event_id = es.event_id WHERE es.person_id = ?",
      id
    );
    userInfo.hardware_loans = hardwareLoans;
    userInfo.events_scanned = eventsScanned;
    res.json(userInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

app.listen(port, () => {
  console.log(`Example REST Express app listening at http://localhost:${port}`);
});
