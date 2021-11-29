# In this documentation rest API i explained and told how it works.

## Render routes

## When get '/login' action is called. Check happens if user already logged in. If user already logged in he wont be able to proceed on login. If user didn't log in he will see the login page.

app.get('/login', checNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})
<br><br>
## get '/register' actions renders register UI if user didn't log in already

app.get('/register',checNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})
<br><br>
## get '/postnew' action will render postnew UI if user has already logged in
app.get('/postnew', checkAuthenticated, (req, res) => {
   res.render('postnew.ejs')
})
<br><br>
## Login route functionality

## When post '/login' action is called happens check if user already logged in. Also passport authentication is made. Success authentication will direct user to index page. Failure authentication will direct user back to login.
app.post('/login', checNotAuthenticated, passport.authenticate('local', {
    
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

## Register functionality

## When post '/register' action is called user's password will be hashed. Values that user passes into UI fields will be handled to database. If there is no problems on registeration user will be redirected into login page.

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
<br><br>
## Checkpost functionality

## When get '/checkpost' action is called there will be database handling for all posts. All posts values are passed into UI and checkpost UI page is rendered for the user.
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
<br><br>

## My posts functionality 

## When get '/myposts' is called database handling is done with user_id. User_id is passed into database query and all the posts with user's id is passed into UI.

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
<br><br>
## When get '/modifymypost/:id' is called database query makes handling that selects all posts with certain id. those parametar are returned into UI.
app.get('/modifymypost/:id', checkAuthenticated, (req, res) => {
    
    console.log(req.params.id)
    var post = client.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
    console.log(post.rows[0].title)
    req.render('/modifypost.ejs', {post: post.rows[0]})
})
<br><br>
## When delete '/deletepost/:id' action is called, database query is executed and it deletes post with certain id.
app.delete('/deletepost/:id', checkAuthenticated, (req, res) => {
    console.log(req.params.id)
    client.query('DELETE FROM posts WHERE id=$1', [req.params.id]);
    res.redirect('/myposts');
})
<br><br>
## When post '/makenewpost' action is called, UI values are passed into server and database query is handled which adds new post into database. After the post is handled user will be redirected into post feed page.

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
<br><br>
##When action delete '/logout' is called, user will be logged out.
app.delete('/logout', (req, res) => {
    
    loggedIn = false;
    req.logOut()
    res.redirect('/login')
}) 
<br><br>
