const express = require("express");
const router = express.Router();

// POST: Create a new user
router.post("/api/users", (req, res) => {
    const { name } = req.body;
    // Save the user to your database and return the created user
    res.status(201).json({ _id: "user_id", name });
  });
  
  // GET: Get all users
router.get("/api/users", (req, res) => {
  // Fetch all users from your database
  res.status(200).json([{ _id: "user_id1", name: "User 1" }]);
});

module.exports = router;