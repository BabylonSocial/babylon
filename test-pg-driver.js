// Test the pg driver (what drizzle-kit uses) with the exact connection string
const { Client } = require('pg');

const connectionString = 'postgresql://babylon:babylon_dev_password@localhost:5433/babylon';
console.log('Testing pg driver with:', connectionString.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: connectionString,
  // Also try with explicit parameters
  // host: 'localhost',
  // port: 5433,
  // user: 'babylon',
  // password: 'babylon_dev_password',
  // database: 'babylon',
});

client.connect()
  .then(() => {
    console.log('✅ Connected!');
    return client.query('SELECT current_user, current_database(), version()');
  })
  .then((result) => {
    console.log('✅ Query successful!');
    console.log('Result:', result.rows[0]);
    client.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Full error:', error);
    client.end();
    process.exit(1);
  });
