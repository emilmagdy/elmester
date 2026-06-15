const {Pool} = require("pg");

// Connect to the cloud database (Neon) using the connection string
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Your Neon connection string
    ssl: {
        rejectUnauthorized: false // Required for secure Neon cloud connections
    },
    // 1. Connection Timeout: Time to wait for a new connection before throwing an error (set to 10 seconds)
    connectionTimeoutMillis: 10000,

    // 2. Idle Timeout: Time a client can sit idle in the pool before being closed (set to 30 seconds)
    idleTimeoutMillis: 30000,

    // 3. Max Clients: Maximum number of clients allowed inside the pool simultaneously
    max: 10
});

module.exports = pool;