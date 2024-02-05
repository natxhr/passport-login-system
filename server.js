if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const User = require('./user');
const { generateToken } = require('./tokenUtils'); 

const connectDB = require('./db');

connectDB();

const initializePassport = require('./passport-config');
(async () => {
    await initializePassport(
        passport,
        async (username) => await User.findOne({ username }),
        async (id) => await User.findById(id)
    );
})();

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    const token = generateToken(req.user);
    res.cookie('jwt', token, { httpOnly: true });
    res.redirect('/');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword
        });

        console.log('User to be saved:', newUser);

        await newUser.save();
        console.log('User saved successfully.');

        res.redirect('/login');
    } catch (error) {
        console.error('Error during registration:', error);
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }
        res.redirect('/login')
    })
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/login')
    }
    next()
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
