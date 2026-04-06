const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");

exports.createQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { title, description, priority } = req.body;

    if (!title || !description || !priority || !id) {
      return res.status(400).json({
        success: false,
        message: "all input fields required",
      });
    }

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no such logged in user found in the db",
      });
    }

    //creating the query here
    const newQuery = await queryModel.create({
      user: id,
      title: title,
      description: description,
      priority: priority,
    });

    return res.status(200).json({
      success: true,
      message: "query created successfully",
      query: newQuery,
      userEmail: user.email,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "internal server error in create query controller",
      error: err.message,
    });
  }
};
