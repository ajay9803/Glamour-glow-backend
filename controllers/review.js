const Review = require("../models/review");
const User = require("../models/user");
const Product = require("../models/product");

exports.postReview = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { productId, rating, feedback } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      const theError = new Error("Failed to fetch product.");
      theError.statusCode = 404;
      throw theError;
    }

    product.rating = ((product.rating + rating) / 2).toFixed(1);
    // product.totalReviews = product.totalReviews + 1;

    const theProduct = await product.save();

    const review = new Review({
      rating: rating,
      feedback: feedback,
      productId: theProduct._id,
      userId: userId,
    });

    const newReview = await review.save();

    res.status(201).json({
      message: "You feedback has been posted.",
      review: newReview,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchReviews = async (req, res, next) => {
  console.log("fetch reviews");
  try {
    const { productId } = req.params;
    console.log(productId);

    let reviews = await Review.find({ productId: productId });

    if (!reviews || reviews.length === 0) {
      const error = new Error("No reviews found.");
      error.statusCode = 404;
      throw error;
    }

    let theReviews = [];

    await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findById(review.userId);

        if (!user) {
          const theError = new Error("Failed to fetch user.");
          theError.statusCode = 404;
          throw theError;
        }
        theReviews.push({
          review: review,
          user: user,
        });
      })
    );

    res
      .status(200)
      .json({ message: "Reviews fetched successfully.", reviews: theReviews });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
