/**
 * Name: Wuihee Yap
 * Date: May 16, 2024
 * Section: CSE 154 AF
 *
 * app.js is contains the main backend logic and endpoints. It is in charge of retrieving data
 * from the Odds API, processing it and calculating arbitrage opportunities. It then provides
 * endpoitns which the frontend can use to access the arbitrage data and save it. It also handles
 * The user giving their API keys.
 */

"use strict";

const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;

const {getSports, getUpcomingOdds} = require("./odds");
const {getBestOdds, getArbitrageOpportunities} = require("./arbitrage");

const PORT = process.env.PORT || 8000;
const SERVER_ERROR = 500;
const CLIENT_ERROR = 400;
const API_KEY_FILE = "api_key.txt";
const ARB_DATA_FILE = "arb_data.json";
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(multer().none());

// Checks if API key exists.
app.get("/hasKey", async (req, res) => {
  res.type("text");
  try {
    let apiKey = await fs.readFile(API_KEY_FILE);
    apiKey = apiKey.toString().trim();
    if (apiKey === "") {
      res.status(SERVER_ERROR).send("API key does not exist.");
    }
    res.send("API key exists");
  } catch (err) {
    res.status(SERVER_ERROR).send("API key does not exist.");
  }
});

// Retrieves arbitrage opportunities given a stake.
app.get("/arbitrage/get/:stake", async (req, res) => {
  try {
    let apiKey = await fs.readFile(API_KEY_FILE);
    apiKey = apiKey.toString();
    let stake = parseFloat(req.params.stake);
    let upcomingOdds = await getUpcomingOdds(apiKey);
    let bestOdds = getBestOdds(upcomingOdds);
    let opportunities = getArbitrageOpportunities(stake, bestOdds);
    res.json(opportunities);
  } catch (err) {
    res
      .type("text")
      .status(SERVER_ERROR)
      .send("Request to get odds failed.");
  }
});

// Validates API key.
app.post("/validate/:key", async (req, res) => {
  let apiKey = req.params.key;
  res.type("text");
  try {
    await getSports(apiKey);
    await fs.writeFile(API_KEY_FILE, apiKey);
    res.send("Successfully validated API key.");
  } catch (err) {
    res.status(CLIENT_ERROR).send("Invalid API key.");
  }
});

// Save arbitrage opportunities to a JSON file.
app.post("/arbitrage/save", async (req, res) => {
  res.type("text");
  try {
    let data = req.body;
    data = JSON.stringify(data);
    await fs.writeFile(ARB_DATA_FILE, data);
    res.send("Successfully saved current data.");
  } catch (err) {
    res.status(SERVER_ERROR).send("Request to save odds failed.");
  }
});

app.listen(PORT);
