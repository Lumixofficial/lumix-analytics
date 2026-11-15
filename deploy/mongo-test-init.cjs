// Executed by the official Mongo entrypoint only for a fresh TEST volume.
const testPassword = require("fs").readFileSync("/run/secrets/mongo_app_password", "utf8").trim();
db.getSiblingDB("lumix_visitors_test").createUser({ user: "lumix_visitors_test", pwd: testPassword,
  roles: [{ role: "readWrite", db: "lumix_visitors_test" }] });
