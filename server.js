if (process.env.NODE_ENV !== 'production') {
     require('dotenv').config()
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const mysql = require('mysql');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');


const {  Client, Connection } = require('pg')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'taskdb',
  password: 'root',
  port: 5432,
})
client.connect()


app.get('/createpoststable', (req, res) => {
    let sql = 'CREATE TABLE posts(id int AUTO_INCREMENT, titale VARCHAR(255), description VARCHAR(255), PRIMARY KEY(id))';
    db.query(sql, (err, result) => {
        if(err) {
            console.log(err);
       }
        console.log(result);
        res.send('posts table created');
    });
});

// Insert post 1
app.get('/addpost1', (req, res) => {
    let post= {titale: 'Post one', description: 'This is 1st post'};
    let sql = 'INSERT INTO posts SET ?';
    let query = db.query(sql, post, (err, result) => {
        if(err) {
            console.log(err);
        }
        console.log(result);
        res.send('Post created');
    })
})

const initializePassport = require('./passport-config')
const { Server } = require('http');
const { name } = require('ejs');

async function getUserWithEmail(email){
    var user = await client.query("SELECT * FROM users WHERE email=$1", [email]);
    console.log('user= ' + user)
    JSON.stringify(user)
    var parseuser = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        password: user.rows[0].password
    }
    console.log(parseuser[1])
    return parseuser;
}

async function getUserWithId(id){
    var user = await client.query("SELECT * FROM users WHERE id=$1", [id]);
    JSON.stringify(user)
    var parseuser = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        password: user.rows[0].password
    }

    return parseuser;
}

initializePassport(
    passport,
    getUserWithEmail,
    getUserWithId
)

// initializePassport(
//     passport,
//     email => users.find(user => user.email == email),
//     id => users.find(user => user.id == id)
// )

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name})
})

app.get('/login', checNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.get('/register',checNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.get('/checkpost', (req, res) => {
    res.render('checkpost.ejs')
})

app.get('/postnew', (req, res) => {
    res.render('postnew.ejs')
})

app.get('/modify', (req, res) => {
    res.render('modify.ejs')
})

app.post('/login', checNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/register', checNotAuthenticated, async (req, res) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 8)
    users = {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    }
    client.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [req.body.name, req.body.email, hashedPassword])
    .then((result) => {
        res.redirect('/login');
    })
    .catch((error) => {
        console.log('Error: ' + error)
    })
})

app.post('/postnew', (req, res) => {
    res.redirect('/postnew')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
}) 

function checNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
       return res.redirect('/')
    }
    next()
}

app.listen(3000) 