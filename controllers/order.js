const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

exports.createOrder = async (req, res, next) => {
  const userId = req.userId;
  try {
    if (req.status !== "user") {
      const error = new Error("Access denied.");
      error.statusCode = 403;
      throw error;
    }
    const {
      houseNumber,
      streetName,
      city,
      district,
      zone,
      contactNumber,
      paymentMethod,
      orderItems,
      totalPrice,
      totalItems,
    } = req.body;

    let products = [];
    orderItems.map((item) => {
      products.push({
        productId: item.productItem.id,
        quantity: item.count,
        price: item.price,
      });
    });
    const newOrder = new Order({
      userId,
      houseNumber,
      streetName,
      city,
      district,
      zone,
      contactNumber,
      paymentMethod,
      orderItems: products,
      totalPrice,
      totalItems,
      paid: false,
    });

    const order = await newOrder.save();
    await Promise.all(
      order.orderItems.map(async (orderItem) => {
        const product = await Product.findById(orderItem.productId);
        const user = await User.findById(userId);

        if (!user) {
          const error = new Error("Failed to fetch user.");
          error.statusCode = 404;
          throw error;
        } else if (!product) {
          const error = new Error("Failed to fetch order product.");
          error.statusCode = 404;
          throw error;
        } else {
          if (product.quantityAvailable < orderItem.quantity) {
            if (product.quantityAvailable === 0) {
              const newError = new Error(
                `[ ${product.name} ]  has been sold out.`
              );
              newError.statusCode = 404;
              throw newError;
            }
            const error = new Error(
              `Only ${product.quantityAvailable} [ ${product.name} ] are left.`
            );
            error.statusCode = 404;
            throw error;
          }
          product.quantityAvailable =
            product.quantityAvailable - orderItem.quantity;
          const theProduct = await product.save();
          console.log(theProduct._id);
          user.orderedItems.push({ productId: theProduct._id });
          await user.save();
        }
      })
    );

    res.status(201).json({
      message: "Order created successfully.",
      order: order,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchUserOrders = async (req, res, next) => {
  console.log("fetchUserOrders");
  const currentPage = req.query.page || 1;
  const perPage = 6;
  const { filterBy, date } = req.query;
  console.log(date);

  try {
    let sortOptions = {};
    let filterOptions = {};

    const sortOrder = filterBy || "asc";

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    switch (sortOrder) {
      case "asc":
        sortOptions.createdAt = 1;
        break;
      case "dsc":
        sortOptions.createdAt = -1;
        break;
      default:
        break;
    }
    console.log("date here");
    console.log(new Date(date));
    console.log("date here");

    if (date) {
      // const parsedDate = new Date(date);
      // const theDate = parsedDate.toISOString();
      // filterOptions.createdAt = {
      //   $gte: new Date(parsedDate).setHours(0, 0, 0, 0),
      //   $lt: new Date(parsedDate).setHours(23, 59, 59, 999),
      // };
    }

    const userId = req.userId;
    console.log(userId);
    console.log(filterOptions);

    let totalItems = await Order.find({
      userId: userId,
      ...filterOptions,
    }).countDocuments();

    const orders = await Order.find({
      userId: userId,
      ...filterOptions,
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    console.log(orders);

    if (!orders || orders.length === 0) {
      const error = new Error("No orders found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Orders fetched successfully.",
      orders: orders,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchOrderHistory = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 6;
  const { filterBy, date } = req.query;

  try {
    let sortOptions = {};
    let filterOptions = {};

    const sortOrder = filterBy || "asc";

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    switch (sortOrder) {
      case "asc":
        sortOptions.createdAt = 1;
        break;
      case "dsc":
        sortOptions.createdAt = -1;
        break;
      default:
        break;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filterOptions.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const userId = req.userId;

    let totalItems = await Order.find({
      // ...filterOptions,
    }).countDocuments();

    const orders = await Order.find({
      // ...filterOptions
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!orders || orders.length === 0) {
      const error = new Error("No orders found.");
      error.statusCode = 404;
      throw error;
    }

    let orderUserDetails = [];

    await Promise.all(
      orders.map(async (order) => {
        const userId = order.userId;
        console.log(order);

        const user = await User.findById(userId);
        if (!user) {
          const error = new Error("Failed to fetch User.");
          error.statusCode = 404;
          throw error;
        }
        orderUserDetails.push({
          order: order,
          user: user,
        });
      })
    );

    res.status(200).json({
      message: "Orders fetched successfully.",
      orders: orderUserDetails,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error("Order fetch failed.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(order.userId);

    if (!user) {
      const error = new Error("Failed to fetch User.");
      error.statusCode = 404;
      throw error;
    }

    let orderItems = [];

    await Promise.all(
      order.orderItems.map(async (orderItem) => {
        const product = await Product.findById(orderItem.productId);
        if (!product) {
          const error = new Error("Failed to fetch order product.");
          error.statusCode = 404;
          throw error;
        } else {
          orderItems.push({
            ...orderItem.toObject(),
            product: product.toObject(),
            user: user,
          });
        }
      })
    );

    res.status(200).json({
      message: "Order fetched successfully.",
      order: order,
      user: user,
      orderItems: orderItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.makePayment = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("No order found.");
      error.statusCode = 404;
      throw error;
    }
    order.paid = true;
    const updatedOrder = await order.save();
    res.status(200).json({
      message: "Payment made successfully.",
      order: updatedOrder,
    });

    res.status();
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
