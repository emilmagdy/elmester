const passport = require('passport')
const pool = require('../db.js')
const GoogleStrategy = require('passport-google-oauth20').Strategy

passport.use(new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
try {
    const googleId = profile.id
    const email = profile.emails[0].value.trim().toLowerCase()
    const name = profile.displayName

    // if user exists in our database 
    let userRes = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2 ', [googleId, email])
    let user = userRes.rows[0]
    if (!user) {
        const newUser = await pool.query('INSERT INTO users (name , email , google_id, is_verified) VALUES ($1, $2, $3, $4) RETURNING *',
             [name,email,googleId, true])
        user = newUser.rows[0]
    } else if (!user.google_id) {
        await pool.query('UPDATE users SET google_id= $1, is_verified = $2 WHERE id = $3', [googleId,true, user.id ])
        user.google_id = googleId
        user.is_verified = true
    }
    return done(null, user)
} catch (err) {
    return done(err, null)
}
}))

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;




