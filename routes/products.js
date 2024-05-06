const express = require("express");
const fileUploader = require("../middlewares/file_upload.js");
const isAuth = require("../middlewares/is_auth.js");

const productsController = require("../controllers/products.js");

const router = express.Router();

router.get("/all-products", productsController.getProducts);
router.get("/all-products/:category", productsController.getProductsByCategory);
router.post(
  "/add-product",
  isAuth,
  fileUploader.array("images"),
  productsController.createProduct
);

router.get("/product-by-id/:productId", productsController.getProduct);

router.put(
  "/edit-product/:productId",
  isAuth,
  fileUploader.array("images"),
  productsController.updateProduct
);

// router.delete("/delete-product/:productId", isAuth, feedsController.deletePost);

module.exports = router;
