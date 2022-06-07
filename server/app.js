const bodyParser = require('body-parser');
const express = require('express');
const { attachment } = require('express/lib/response');
const { update } = require('lodash');
const port = 4000;
const app = express();
const mysql = require('mysql');
const { NULL } = require('mysql/lib/protocol/constants/types');

//count for letiables

const tagCount = 3;

// end count


const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "12345678"
});

//********************Database**************************************************************************************** */
//********************Database**************************************************************************************** */
//********************Database**************************************************************************************** */

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

    connection.query(`SET FOREIGN_KEY_CHECKS=0`, (err, result) => {
        if (err) throw err;
        console.log("Foreign Constraint Removed");
    })

    connection.query(`CREATE TABLE user(
        id INT NOT NULL,
        username VARCHAR(255) NOT NULL, 
        password VARCHAR(255) NOT NULL,
        PRIMARY KEY(id))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE user Created");
    });

    connection.query(`CREATE TABLE user_note(
        user_id INT NOT NULL,
        note_id INT NOT NULL,
        PRIMARY KEY(note_id),
        FOREIGN KEY (user_id) REFERENCES user(id))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE user_note Created");
    });


    connection.query(`CREATE TABLE note(
        id INT NOT NULL,
        header VARCHAR(255) NOT NULL, 
        tag VARCHAR(255) NOT NULL,
        body VARCHAR(255),
        PRIMARY KEY (id, tag),
        FOREIGN KEY (id) REFERENCES user_note(note_id))`, function(err, result) {
        if (err) throw err;
        console.log("TABLE note Created");
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



//********************Database End****************************************************************************** */
//********************Database End****************************************************************************** */
//********************Database End****************************************************************************** */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/login', (req, res) => {
    res.send("Please enter your Username and Password");
})

app.post('/login', (req, res) => {
    let invalidCred = [{ id: -1 }]
    console.log("Login Patch request accessed");
    let username = req.query.username; //'Will'
    let password = req.query.password; // '1'
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


app.post(`/notes`, (req, res) => {
    let id = parseInt(req.query.id)
    console.log("Notes Post request accessed");
    connection.query(`
        SELECT n.id, n.header, n.tag, n.body FROM note n JOIN user_note un WHERE un.user_id = ${id}
        and un.note_id = n.id `, (err, result) => {
        if (err) throw err;
        if (result.length > 0)
            res.send(result);

    })
})


app.patch('/notes/update', (req, res) => {

    let invalidCred = [{ id: -1 }]
    console.log("Notes Patch request accessed");
    let Data = req.body
    for (i = 0; i < Data.length; i++) {
        let id = Data[i].id;
        let header = `${Data[i].header}`;
        let tag = `${Data[i].tag}`;
        let body = `${Data[i].body}`;
        // Criteria for a valid note

        if (typeof id !== 'undefined') {
            if (typeof header !== 'undefined' || typeof tag !== 'undefined') {

                connection.query(`
                UPDATE note
                SET header = '${header}', body = '${body}'
                WHERE note.id = ${id} and note.tag = '${tag}';
                `, (err, result) => {
                    if (err) throw err
                    if (result.length === 0) //Put condition for incorrect id or tag
                        return;
                })

            }
        }
        res.send("Update process completed");
    }
})

app.patch('/notes/create', (req, res) => {
    // for creating notes or updating notes
    // We are assuming that all the note info. is submitted for either editing the 
    // note or creating a new note note.
    let invalidCred = [{ id: -1 }]
    console.log("Notes Create request accessed");
    let Data = req.body
    var user_id_final;
    var id_final;
    for (i = 0; i < Data.length; i++) {
        let user_id = Data[i].user_id;
        let id = Data[i].id;
        let header = `${Data[i].header}`;
        let tag = `${Data[i].tag}`;
        let body = `${Data[i].body}`;
        user_id_final = user_id;
        id_final = id;
        // Criteria for a valid note

        if (typeof id !== 'undefined')
            if (typeof header !== 'undefined' || typeof tag !== 'undefined') {
                connection.query(`
                INSERT INTO note(id, header, tag, body)
                VALUES(${id}, '${header}', '${tag}', '${body}');
                `, (err, result) => {
                    if (err) throw err
                    if (result.length === 0)
                        return;
                })
            }
    }


    connection.query(`
    INSERT INTO user_note(user_id, note_id)
    VALUES(${user_id_final}, ${id_final});`, (err, result) => {
        if (err) throw err;
        if (result.length === 0)
            return;
    })

    res.send("Create Request Successfully Completed");
    return
})


app.delete('/notes', (req, res) => {
    let invalidCred = [{ id: -1 }]
    console.log("Notes delete request accessed");
    let note_id = parseInt(req.query.id);
    let tag = req.query.tag;
    let count;
    console.log(typeof note_id + " " + typeof tag);
    if (typeof tag === 'undefined' || tag === '') {
        console.log("Tag is undefined");
        connection.query(`
                    DELETE n FROM note n
                    WHERE n.id = ${note_id}
                    `, (err, result) => {
            if (err) throw err
            if (result.length === 0)
                return;
        })
        connection.query(`DELETE un FROM user_note un WHERE un.note_id = ${note_id}`, (err, result) => {
            if (err) throw err
            console.log(result); //HERE------------------
        })
        res.send("Successful from NOT DEFINED");
        return;
    } else { // Working to empty note table, but not user_note
        console.log("Tag is defined");
        console.log(note_id + " " + tag);
        connection.query(`
                DELETE n FROM note n WHERE n.tag = '${tag}'
                and n.id = ${note_id}
                `, (err, result) => {
            if (err) throw err;
            if (result.length === 0)
                return;
        })
        res.send("Successful from DEFINED");
        return;
    }
    res.send("Failed");

})



app.listen(port)