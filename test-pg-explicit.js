// Test pg driver with explicit parameters (not connection string)
const { Client } = require('pg');

console.log('Testing pg driver with explicit parameters...');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'babylon',
  password: 'babylon_dev_password',
  database: 'babylon',
  ssl: false,
});

client.connect()
  .then(() => {
    console.log('✅ Connected!');
    return client.query('SELECT current_user, current_database()');
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
    client.end();
    process.exit(1);
  });
