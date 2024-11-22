const express = require("express");
const router = express.Router();

// POST: Create a new client
router.post("/api/clients", (req, res) => {
    const { name } = req.body;
    // Save the client to your database and return the created client
    res.status(201).json({ _id: "client_id", name });
  });
  
// GET: Get all clients
router.get("/api/clients", (req, res) => {
  // Fetch all clients from your database
  res.status(200).json([{ _id: "client_id1", name: "Client 1" }]);
});
  
module.exports = router;
