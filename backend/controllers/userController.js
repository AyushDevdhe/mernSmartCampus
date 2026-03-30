exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password, prn } = req.body;

    if (!firstName || !lastName || !email || !password || !prn) {
      return res.status().json({
        success: false,
        message: "all input fields required",
      });
    }
  } catch (err) {}
};
