/**
 * arbitrage.js module handles the logic for finding arbitrage opportunities in the data returned
 * from the Odds API.
 */

"use strict";

/**
 * Processes the raw data from Odds API and retrieves the best odds.
 *
 * @param {Object} upcomingOdds - Upcoming odds data retrieved from Odds API.
 * @returns {Object} - Contains best odds for each game.
 */
function getBestOdds(upcomingOdds) {
  let processedOdds = [];
  for (let game of upcomingOdds) {
    let {
      sport_title: sportsTitle,
      commence_time: commenceTime,
      home_team: homeTeam,
      away_team: awayTeam,
      bookmakers
    } = game;
    let data = {
      sport: sportsTitle,
      date: commenceTime,
      home: homeTeam,
      away: awayTeam,
      ...filterOdds(bookmakers, homeTeam, awayTeam)
    };
    processedOdds.push(data);
  }
  return processedOdds;
}

/**
 * Helper method to filter highest odds from all bookmakers.
 *
 * @param {Object} bookmakers - Bookmakers data from Odds API.
 * @param {string} homeTeam - Name of home team.
 * @param {string} awayTeam - Name of away team.
 * @returns {Object} - Data containing highest bookmaker odds.
 */
function filterOdds(bookmakers, homeTeam, awayTeam) {
  let data = {
    bestHomeOdds: {odds: 0, bookmaker: ""},
    bestAwayOdds: {odds: 0, bookmaker: ""}
  };
  for (let bookmaker of bookmakers) {
    let {title, markets} = bookmaker;
    for (let market of markets) {
      for (let outcome of market.outcomes) {
        if (outcome.name === homeTeam && outcome.price > data.bestHomeOdds.odds) {
          data.bestHomeOdds = {odds: outcome.price, bookmaker: title};
        }
        if (outcome.name === awayTeam && outcome.price > data.bestAwayOdds.odds) {
          data.bestAwayOdds = {odds: outcome.price, bookmaker: title};
        }
      }
    }
  }
  return data;
}

/**
 * Returns a list of arbitrage opportunities which include the details for each sporting event.
 * Each item includes the potential profit, the sport, date, details on the home and away teams
 * and whether or not an arbitrage exists.
 *
 * @param {number} stake - The user's stake.
 * @param {Object} bestOdds - Data of the best odds for each available game.
 * @returns {Array} - Returns an array of arbitrage opportunities.
 */
function getArbitrageOpportunities(stake, bestOdds) {
  let opportunities = [];
  for (let game of bestOdds) {
    let {sport, date, home, away, bestHomeOdds, bestAwayOdds} = game;
    let {homeStake, awayStake, profit, arbitrage} = getStakesAndProfit(
      stake,
      bestHomeOdds.odds,
      bestAwayOdds.odds
    );
    opportunities.push({
      arbitrage: arbitrage,
      profit: profit,
      sport: sport,
      date: date,
      home: {
        team: home,
        odds: bestHomeOdds.odds,
        bookmaker: bestHomeOdds.bookmaker,
        stake: homeStake
      },
      away: {
        team: away,
        odds: bestAwayOdds.odds,
        bookmaker: bestAwayOdds.bookmaker,
        stake: awayStake
      }
    });
  }
  return opportunities;
}

/**
 * Helper function to calculate the stakes and profits given a set of odds and the user's stake.
 *
 * @param {number} stake - The user's stake.
 * @param {number} bestHomeOdds - The highest home odds.
 * @param {number} bestAwayOdds - The highest away odds.
 * @returns {Object} - Data containing stakes and profts for the given game.
 */
function getStakesAndProfit(stake, bestHomeOdds, bestAwayOdds) {
  let arbPercentage = getArbPercentage(bestHomeOdds, bestAwayOdds);
  if (arbPercentage >= 1) {
    return {homeStake: 0, awayStake: 0, profit: 0, arbitrage: false};
  }
  let homeStake = (stake / bestHomeOdds) * (1 / arbPercentage);
  let awayStake = (stake / bestAwayOdds) * (1 / arbPercentage);
  let profit = stake * (1 / arbPercentage - 1);
  return {
    homeStake: homeStake,
    awayStake: awayStake,
    profit: profit,
    arbitrage: true
  };
}

/**
 * Convert a standard decmial odds into implied odds.
 *
 * @param {number} decimalOdds - Decmial odds in a sports betting event.
 * @returns {number} - The implied odds.
 */
function convertToImplied(decimalOdds) {
  return 1 / decimalOdds;
}

/**
 * Calculate the arbitrage percentage used to determine if an arbitrage exists.
 *
 * @param {number} bestHomeOdds - The best home decimal odds.
 * @param {number} bestAwayOdds - The best away decimal odds.
 * @returns {number} - The arbitrage percentage in decimal form.
 */
function getArbPercentage(bestHomeOdds, bestAwayOdds) {
  return convertToImplied(bestHomeOdds) + convertToImplied(bestAwayOdds);
}

module.exports = {
  getBestOdds,
  getArbitrageOpportunities
};
