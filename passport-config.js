const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./user');

async function initialize(passport, getUserById) {
    const authenticationUser = async (username, password, done) => {
        try {
            const user = await User.findOne({ username });

            if (!user) {
                console.log('No user with that username');
                return done(null, false, { message: 'No user with that username' });
            }

            console.log('Stored Hashed Password:', user.password);

            const isPasswordMatch = await bcrypt.compare(password, user.password);

            console.log('Entered Hashed Password:', password);

            console.log('Bcrypt Comparison Result:', isPasswordMatch);


            if (isPasswordMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }            
            
        } catch (e) {
            console.error('Error during authentication:', e);
            return done(e);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticationUser));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        done(null, getUserById(id));
    });
}

module.exports = initialize;
