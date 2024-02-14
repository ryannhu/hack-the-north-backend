import json
import sqlite3
import sys

# json_file should be the first argument passed to the script from the command line
hacker_json_file = sys.argv[1]
hardware_json_file = sys.argv[2]
conn = sqlite3.connect('hackers.db')

c = conn.cursor()

with open(hacker_json_file) as f:
    data = json.load(f)

# JSON structure is the following
    # [
    #     {
    #         name: "John Doe",
    #         company: "Google",
    #         email: "john@gmail.com",
    #         phone: "123-456-7890",
    #         skills: [
    #             {"skill": "Python", "level": 5},
    #             {"skill": "Java", "level": 3}
    #         ]
    #     },
    #     ...
    # ]

for person in data:
    c.execute('INSERT INTO Person (name, company, email, phone) VALUES (?, ?, ?, ?)', 
              (person['name'], person['company'], person['email'], person['phone']))
    person_id = c.lastrowid

    for skill in person['skills']:
        # check if skill already exists
        c.execute('SELECT skill_id FROM Skill WHERE skill = ?', (skill['skill'],))
        skill_id = c.fetchone()

        # if skill does not exist, insert it
        if skill_id is None:
            c.execute('INSERT INTO Skill (skill) VALUES (?)', (skill['skill'],))
            skill_id = c.lastrowid
        # if skill does exist, get the id
        else:
            skill_id = skill_id[0]
        
        # insert the person's skill rating
        c.execute('INSERT INTO PersonSkill (person_id, skill_id, rating) VALUES (?, ?, ?)',
                       (person_id, skill_id, skill['rating']))
        

# insert mock hardware data
with open(hardware_json_file) as f:
    data = json.load(f)  

for hardware in data:
    c.execute('INSERT INTO Hardware (hardware_name, quantity_available) VALUES (?, ?)',
              (hardware["hardware_name"], hardware["quantity_available"]))


conn.commit()

conn.close()



        