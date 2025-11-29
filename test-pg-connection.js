// Simple test to verify PostgreSQL connection
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL || 'postgresql://babylon:babylon_dev_password@localhost:5433/babylon';
console.log('Testing connection with:', dbUrl.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(dbUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

sql`SELECT version(), current_user, current_database()`
  .then((result) => {
    console.log('✅ Connection successful!');
    console.log('Result:', result[0]);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    if (error.message.includes('password')) {
      console.error('\n💡 Password authentication failed. The password in the database may not match.');
      console.error('Try: docker exec babylon-postgres psql -U postgres -c "ALTER USER babylon WITH PASSWORD \'babylon_dev_password\';"');
    }
    process.exit(1);
  })
  .finally(() => {
    sql.end();
  });
