const Joi = require("joi");

const beautyProductValidationSchema = Joi.object({
  name: Joi.string().min(5).required().messages({
    "string.empty": "Product name is required.",
    "any.required": "Product name is a mandatory field.",
    "string.min": "Product name must be at least 5 characteres long.",
  }),
  brand: Joi.string().required().messages({
    "string.empty": "Brand is required.",
    "any.required": "Brand is a mandatory field.",
  }),
  category: Joi.string().required().messages({
    "string.empty": "Category is required.",
    "any.required": "Category is a mandatory field.",
  }),
  description: Joi.string().min(20).required().messages({
    "string.empty": "Description is required.",
    "any.required": "Description is a mandatory field.",
    "string.min": "Description must be at least 20 characters long.",
  }),
  price: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Price is a mandatory field.",
  }),
  quantityAvailable: Joi.number().required().messages({
    "number.base": "Quantity must be a number.",
    "any.required": "Quantity is a mandatory field.",
  }),
  rating: Joi.number().default(0).messages({
    "number.base": "Rating must be a number.",
  }),
  images: Joi.array().items(Joi.string()).default([]).messages({
    "array.base": "Images must be an array of strings.",
    "string.base": "Each image must be a string.",
  }),
  skinType: Joi.string().required().messages({
    "string.empty": "Skin type is required.",
    "any.required": "Skin type is a mandatory field.",
  }),
});

module.exports = beautyProductValidationSchema;
