const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const Client = require("../models/Clients"); 

// POST: Create a new client
router.post("/", async (req, res) => {
  const {
    tenantId,
    userId,
    firstName,
    lastName,
    streetAddress,
    birthday,
    gender,
    city,
    state,
    email,
    phone,
  } = req.body;

  console.log("Request to create client:", {
    tenantId,
    userId,
    firstName,
    lastName,
    streetAddress,
    birthday,
    gender,
    city,
    state,
    email,
    phone,
  });

  // Check if all required fields are provided
  if (!userId || !firstName || !lastName || !email || !phone) {
    console.error("Validation error: Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create the new client
    const newClient = new Client({
      tenantId,
      userId,
      firstName,
      lastName,
      streetAddress,
      birthday,
      gender,
      city,
      state,
      email,
      phone,
    });

    await newClient.save();
    console.log("Client created successfully:", newClient);
    res.status(201).json(newClient);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT: Deactivate a client
router.put("/:clientId/deactivate", async (req, res) => {
  const { clientId } = req.params;
  try {
    const updateData = { isActive: false, deactivatedAt: new Date() };
    console.log("Update Data:", updateData); // Log the update data

    const client = await Client.findOneAndUpdate(
      { clientId },
      updateData,
      { new: true }
    );

    if (!client) {
      console.log(`Client with ID ${clientId} not found`); // Log if client not found
      return res.status(404).json({ error: "Client not found" });
    }

    console.log("Deactivated Client:", client); // Log the deactivated client
    res.status(200).json(client);
  } catch (error) {
    console.error("Error deactivating client:", error);
    res.status(400).json({ error: "Failed to deactivate client" });
  }
});

// GET: Get all clients for a specific tenant
router.get("/", async (req, res) => {
  const { tenantId, userId } = req.query;

  if (!tenantId || !userId) {
    console.error("Validation error: Tenant ID and User ID are required");
    return res.status(400).json({ error: "Tenant ID and User ID are required" });
  }

  try {
    // Filter clients by tenantId and isActive field
    const clients = await Client.find({ tenantId, userId, isActive: true });
    console.log("Active clients fetched successfully:", clients);
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
