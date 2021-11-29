if (process.env.NODE_ENV !== 'production') {
     require('dotenv').config()
}

//const postsList = document.getElementById('postsList');

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const mysql = require('mysql');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

var today = new Date();

const {  Client, Connection } = require('pg')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'taskdb',
  password: 'root',
  port: 5432,
})
client.connect()

const initializePassport = require('./passport-config')
const { Server } = require('http');
const { name } = require('ejs');

async function getUserWithEmail(email){
    var user = await client.query("SELECT * FROM users WHERE email=$1", [email]);
    JSON.stringify(user)
    var parseuser = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        password: user.rows[0].password
    }
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

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/login', checNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.get('/register',checNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.get('/checkpost', async (req, res) => {
    var post = await client.query("SELECT * FROM posts");
    var asd = JSON.stringify(post)
    for(i = 0; i < post.rows.length; i++) {
        if(post.rows[i].category!=null) {
            var parsedcategory = post.rows[i].category.split(',');
            parsedcategory = parsedcategory.map((item) => {
                item = item.replace('{', '');
                item = item.replace('}', '');
                item = item.replaceAll('"', '');
                return item;
            })
            post.rows[i].category = parsedcategory
        }
    } 
    res.render('checkpost.ejs', { posts: post.rows });

})

app.get('/postnew', checkAuthenticated, (req, res) => {
    res.render('postnew.ejs')
})

app.get('/myposts', checkAuthenticated, (req, res) => {
    var userId = req.user
    userId.then(async function (result) {
        userId = parseInt(result.id)
    var post = await client.query("SELECT * FROM posts WHERE user_id=$1", [userId]);
    for(i = 0; i < post.rows.length; i++) {
        if(post.rows[i].category!=null) {
            var parsedcategory = post.rows[i].category.split(',');
            parsedcategory = parsedcategory.map((item) => {
                item = item.replace('{', '');
                item = item.replace('}', '');
                item = item.replaceAll('"', '');
                return item;
            })
            post.rows[i].category = parsedcategory
        }
    }     
    res.render('myposts.ejs', { posts: post.rows });
    })
})

app.get('/deletepost/:id', checkAuthenticated, (req, res) => {
    console.log(req.params.id)
    client.query('DELETE FROM posts WHERE id=$1', [req.params.id]);
    res.redirect('/myposts');
})

app.post('/makenewpost', checkAuthenticated, (req, res) => {
    console.log(req.user)
    var userId = req.user
    userId.then(function (result) {
        userId = parseInt(result.id)
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        client.query('INSERT INTO posts (title, description, location, price, delivery, date, category, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
        [ req.body.title, req.body.description, req.body.location, req.body.price, req.body.delivery, date, (req.body.category)? req.body.category : "no category", userId])
        .then((result) => {
            res.redirect('/checkpost');
        })
        .catch((error) => {
            console.log('Error: ' + error)
        })
    })
})

app.post('/login', checNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/register', checNotAuthenticated, async (req, res) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 8)
    client.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [req.body.name, req.body.email, hashedPassword])
    .then((result) => {
        res.redirect('/login');
    })
    .catch((error) => {
        console.log('Error: ' + error)
    })
})

app.post('/postnew', (req, res) => {
    if(loggedIn) {
        res.redirect('/postnew')
    } else res.redirect('/login') 
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

app.delete('/logout', (req, res) => {
    loggedIn = false;
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