/**
 * Name: Wuihee Yap
 * Date: May 16, 2024
 * Section: CSE 154 AF
 *
 * odds.js module contains the code used for fetching data from the Odds API.
 */

"use strict";

const SPORTS = `https://api.the-odds-api.com/v4/sports/?apiKey=`;
const ODDS = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=`;

/**
 * Makes a fetch request to retrieve available sports for betting.
 *
 * @param {string} apiKey - API key used to call the Odds API.
 * @returns {Object} - All available sports.
 */
async function getSports(apiKey) {
  try {
    let response = await fetch(SPORTS + apiKey);
    response = await statusCheck(response);
    return response.json();
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * Makes a fetch request to retrieve sporting odds data from Odds API.
 *
 * @param {string} apiKey - API key used to call the Odds API.
 * @returns {Object} - Sporting odds data from Odds API.
 */
async function getUpcomingOdds(apiKey) {
  try {
    let response = await fetch(ODDS + apiKey);
    response = await statusCheck(response);
    return response.json();
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * Utility method to check if the status of a response was ok.
 * @param {Promise} res Awaits a promise and checks its response.
 * @returns {Promise} The response if it was ok.
 * @throws Error if the response was not ok.
 */
async function statusCheck(res) {
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res;
}

module.exports = {
  getSports,
  getUpcomingOdds
};
