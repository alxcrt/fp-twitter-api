const postgres = require("postgres");

let sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL, {
  ssl: "allow",
});

async function clear() {
  try {
    const clearResult = await sql`
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `;
    console.log(`Cleared ${clearResult.length} tables`);
    return clearResult;
  } catch (err) {
    console.error("Error clearing tables:", err);
    throw err;
  }
}

async function setup() {
  try {
    const migrateResult = await sql`
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        content VARCHAR(255),
        author_id INTEGER,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );
    `;

    console.log(`Successfully created ${migrateResult.length} tables`);
    return migrateResult;
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  }
}

async function seed() {
  try {
    const seedResult = await sql`
      INSERT INTO users (name)
      VALUES ('Alice'),
        ('Bob'),
        ('Charlie'),
        ('David');

      INSERT INTO posts (content, author_id)
      VALUES ('Hello, world!', 1),
        ('This is a post', 1),
        ('Another post', 2),
        ('Yet another post', 3),
        ('The last post', 4);
    `;

    console.log("Successfully seeded database");
    return seedResult;
  } catch (err) {
    console.error("Error seeding database:", err);
    throw err;
  }
}

async function main() {
  await clear(client);
  await setup(client);
  await seed(client);
}

main().catch((err) => {
  console.error(
    "An error occurred while attempting to setup the database:",
    err
  );
});
