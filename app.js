const bodyParser = require('body-parser');
const express = require('express');
const res = require('express/lib/response');
const port = 4000;
const app = express();
constbodyParser = require('body-parser')
const mongoose = require('mongoose');
const mysql = require('mysql');
const { NULL } = require('mysql/lib/protocol/constants/types');

//count for variables

const tagCount = 3;

// end count


const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "12345678"
});

connection.connect(function(err) {

    if (err) throw err;
    console.log("MySQL Connected")

    connection.query("DROP DATABASE IF EXISTS gdsc", function(err, result) {
        if (err) throw err;
        console.log("Database dropped");
    });
    connection.query("CREATE DATABASE gdsc", function(err, result) {
        if (err) throw err;
        console.log("Database Created");
    });

    connection.query("USE gdsc", function(err, result) {
        if (err) throw err;
        console.log("Database Used");
    });


    connection.query(`CREATE TABLE user(
        id INT NOT NULL,
        username VARCHAR(255) NOT NULL, 
        password VARCHAR(255) NOT NULL,
        PRIMARY KEY(id))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE Created");
    });


    connection.query(`CREATE TABLE note(
        id INT NOT NULL,
        header VARCHAR(255) NOT NULL, 
        tag VARCHAR(255) NOT NULL,
        body VARCHAR(255),
        PRIMARY KEY(id, tag))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE Created");
    });


    connection.query(`CREATE TABLE user_note(
        user_id INT NOT NULL,
        note_id INT NOT NULL,
        PRIMARY KEY(note_id),
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (note_id) REFERENCES note(id))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE Created");
    });

    addDataTouser(1, 'Will', '1');
    addDataTouser(2, 'Amy', '2');
    addDataTouser(3, 'Jack', '3');
    addDataTouser(4, 'Syd', '4');

    addDataToNote(1, 'MY FIRST NOTE', 'first', 'HELLO THERE');
    addDataToNote(1, 'MY FIRST NOTE', 'note', 'HELLO THERE');
    addDataToNote(2, 'Hello', 'hello', 'HELLO THERE');
    addDataToNote(2, 'Hello', 'there', 'HELLO THERE');
    addDataToNote(3, 'MY FIRST NOTE', 'first', 'HELLO THERE');
    addDataToNote(3, 'MY FIRST NOTE', 'note', 'HELLO THERE');
    addDataToNote(3, 'MY FIRST NOTE', 'here', 'HELLO THERE');
    addDataToNote(4, 'PLEASE', 'help', 'Help ME!');
    addDataToNote(4, 'PLEASE', 'me', 'Help ME!');

    addDataToUser_Notes(1, 1);
    addDataToUser_Notes(2, 2);
    addDataToUser_Notes(3, 3);
    addDataToUser_Notes(4, 4);


})

//Creating data for the table

function addDataTouser(id, username, password) {
    connection.query(`INSERT INTO user(id, username, password)
    VALUES (${id}, '${username}', ${password})`, function(err, result) {
        if (err) throw err;
        console.log(`Data to user named: ${id}, ${username}, ${password}`)
    })
}

function addDataToNote(id, header, tag, body) {
    connection.query(`INSERT INTO note(id, header, tag, body)
    VALUES (${id}, '${header}', '${tag}', '${body}')`, function(err, result) {
        if (err) throw err;
        console.log(`Data to note named: ${id}, ${header}, ${tag}, ${body}`)
    })
}

function addDataToUser_Notes(user_id, note_id) {

    connection.query(`INSERT INTO user_note(user_id, note_id)
    VALUES (${user_id}, ${note_id})`, function(err, result) {
        if (err) throw err;
        console.log(`Data to user_note named: ${user_id}, ${note_id}`)
    })
}



//********************Database End************************** */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/login', (req, res) => {
    res.send("Please enter your Username and Password");
})

// app.post('/', (req, res) => {
//     console.log(req.body);
//     var username = req.body.name;
//     var password = req.body.password;
//     console.log(username + " " + password);
//     connection.query(`
//     SELECT u.id
//     FROM user u
//     WHERE u.username = '${username}' and u.password = '${password}'`, (err, result) => {
//         if (err) throw err;
//         console.log(result);
//     });
// })

app.post('/login', (req, res) => {
    var invalidCred = [{ id: -1 }]
    var username = req.query.username; //'Will'
    var password = req.query.password; // '1'
    connection.query(`
        SELECT u.id as id FROM user u WHERE u.username = '${username}'
        and u.id = ${password};
        `, (err, result) => {
        if (err) throw err;
        if (result.length > 0)
            res.send(result);
        // client will take id, move to page where is notes are displayed, and then 
        //request information related to user and his notes 
        else
            res.send(invalidCred);
        // if id = -1 is recieved by client js file, give alert 
        // and redirect to the same login page
    });
})

app.post(`/notes`, (req, res) => { // for fetching notes for a perticular id of user
    var id = parseInt(req.query.id)
    connection.query(`
        SELECT n.id, n.header, n.tag, n.body FROM note n JOIN user_note un WHERE un.user_id = ${id}
        and un.note_id = n.id `, (err, result) => {
        if (err) throw err;
        if (result.length > 0)
            res.send(result);

    })
})

function noteQuery(id) {
    var invalidCred = [{ id: -1 }]
    connection.query(`
    SELECT n.id
    FROM note n
    where n.id = ${id}`, (err, res) => {
        if (err) throw err;
        if (res.length > 0)
            return res;
        else return invalidCred;
    })
}

app.patch('/notes', (req, res) => { // for creating notes or updating notes
    // We are assuming that all the note info. is submitted for either editing the 
    // note or creating a new note note.
    var invalidCred = [{ id: -1 }]
    for (key in req.query) { // for different tags
        var id = key.id;
        var header = key.header;
        var tag = key.tag;
        var body = key.body;
        // Criteria for a valid note:
        if (typeof header != 'undefined' || typeof tag === 'undefined') {
            if (id === noteQuery(id)) { // if the note exists in the database
                connection.query(`
                UPDATE note
                SET header = ${header}, tag = ${tag}, body = ${body}
                WHERE note.id = ${id}`, (err, result) => {
                    if (err) throw err
                    if (result.length === 0)
                        res.status(400)
                    res.send(result)

                })
            } else {
                connection.query(`
                INSERT INTO note(id, header, tag, body)
                VALUES (${id}, ${header}, ${tag}, ${body})`, (err, result) => {
                    if (err) throw err
                    if (result.length === 0)
                        res.status(400)
                    res.send(result);
                })
            }
        } else
            res.send(invalidCred);
    }
})

app.delete('/note', (req, res) => {
    var invalidCred = [{ id: -1 }]

    var id = req.query.id;
    var tag = req.query.tag;
    var count;

    if (typeof tag === 'undefined') {
        connection.query(`
        DELETE n1 FROM note
        WHERE note.id = ${id}`, (err, result) => {
            if (err) throw err
            if (result.length === 0)
                res.status(400)
        })
        connection.query(`
        DELETE FOM user_note
        WHERE note_id = ${id}`, (err, result) => {
            if (err) throw err
            if (result.length === 0)
                res.status(400)
            res.send(result);
        })
    } else {
        connection.query(`DELETE FROM note WHERE note.tag = ${tag} and note.id=${id}`, (err, result) => {
            if (err) throw err;
            if (result.length === 0)
                res.status(400)
        })
        connection.query(`SELECT count(id) FROM note where note.id = ${id}`, (err, result) => {
            if (err) throw err
            if (result.length === 0)
                res.status(400)
            count = result.count(id)
        })

        if (count === 0)
            connection.query(`DELETE FROM user_note un WHERE un.note_id = ${id}`, (err, result) => {
                if (err) throw err
                if (result.length === 0)
                    res.status(400)
            })
    }
})



app.listen(port)

//******************Database**********************************/