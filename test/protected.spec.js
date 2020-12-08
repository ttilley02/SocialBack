const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Secured Endpoints", function () {
   let db;

   const { testUsers, testposts, testReviews } = helpers.makepostsFixtures();

   before("make knex instance", () => {
      db = knex({
         client: "pg",
         connection: process.env.TEST_DATABASE_URL,
      });
      app.set("db", db);
   });

   after("disconnect from db", () => db.destroy());

   before("cleanup", () => helpers.cleanTables(db));

   afterEach("cleanup", () => helpers.cleanTables(db));

   describe(`Protected endpoints`, () => {
      beforeEach("insert articles", () =>
         helpers.seedpostsTables(db, testUsers, testposts, testReviews)
      );

      const protectedEndpoints = [
         {
            name: "GET /api/posts/:post_id",
            path: "/api/posts/1",
         },
         {
            name: "GET /api/posts/:post_id/reviews",
            path: "/api/posts/1/reviews",
         },
      ];

      protectedEndpoints.forEach((endpoint) => {
         describe(endpoint.name, () => {
            it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
               return supertest(app)
                  .get(endpoint.path)
                  .expect(401, { error: `Missing bearer token` });
            });
            it(`responds 401 'Unauthorized request' when no credentials in token`, () => {
               const validUser = testUsers[0];
               const invalidSecret = "bad-secret";

               return supertest(app)
                  .get(endpoint.path)
                  .set(
                     "Authorization",
                     helpers.makeAuthHeader(validUser, invalidSecret)
                  )
                  .expect(401, { error: `Unauthorized request` });
            });
            it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
               const invalidUser = { user_name: "user-not-existy", id: 1 };
               return supertest(app)
                  .get(endpoint.path)
                  .set("Authorization", helpers.makeAuthHeader(invalidUser))
                  .expect(401, { error: `Unauthorized request` });
            });
         });
      });
   });
});
