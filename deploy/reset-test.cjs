// Hard-coded target and collection list. Never drop a database, users or volumes.
const testAdmin = db.getSiblingDB("admin");
testAdmin.auth("lumix_root", require("fs").readFileSync("/run/secrets/mongo_root_password", "utf8").trim());
const testDb = db.getSiblingDB("lumix_visitors_test");
for (const collection of ["daily_pageviews", "collector_budgets", "daily_visitor_keys", "daily_visitor_secrets", "daily_estimation_health"]) {
  testDb.getCollection(collection).deleteMany({});
}
print("Cleared visitor TEST collections only. Database users and production data are unchanged.");
