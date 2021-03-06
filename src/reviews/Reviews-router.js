const express = require("express");
const path = require("path");
const ReviewsService = require("./Reviews-service");
const { requireAuth } = require("../middleware/Jwt-auth");

const reviewsRouter = express.Router();
const jsonBodyParser = express.json();


//lets users sumbit a review
reviewsRouter
  .route("/")
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { post_id, text, rating } = req.body;
    const newReview = { post_id, text, rating };

    for (const [key, value] of Object.entries(newReview))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });

    newReview.user_id = req.user.id;

    ReviewsService.insertReview(req.app.get("db"), newReview)
      .then((review) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${review.id}`))
          .json(ReviewsService.serializeReview(review));
      })
      .catch(next);
  });

module.exports = reviewsRouter;
