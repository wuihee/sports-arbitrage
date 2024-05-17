/**
 * Name: Wuihee Yap
 * Date: May 16, 2024
 * Section: CSE 154 AF
 *
 * index.js contains the main frontend code which handles retrieving and saving arbitrage data
 * from the backend. Users can interact with this functionality through buttons on the webpage.
 * Additionally, the code helps to dynamically display arbitrage data and status messages to
 * the user.
 */

"use strict";

(function() {
  let arbData = [];

  window.addEventListener("load", init);

  /**
   * Initialize button callbacks once the DOM loads.
   */
  async function init() {
    document.getElementById("api-btn").addEventListener("click", validateAPIKey);
    document.getElementById("arb-btn").addEventListener("click", getOdds);
    document.getElementById("save-btn").addEventListener("click", saveData);

    try {
      let response = await fetch("/hasKey");
      await statusCheck(response);
      enableButtons();
    } catch (err) {
      displayMessage("warning", "Please enter an API key.");
    }
  }

  /**
   * Make a request to /validate to validate the user's API key.
   */
  async function validateAPIKey() {
    try {
      let apiKey = getAPIKey();
      let response = await fetch(`/validate/${apiKey}`, {
        method: "POST"
      });
      await statusCheck(response);
      displayMessage("success", "Successfully validated API key!");
      enableButtons();
    } catch (err) {
      displayMessage("error", "Invalid API key.");
    }
  }

  /**
   * Make a request to /arbitrage/get to get odds and arbitrage opportunities.
   */
  async function getOdds() {
    try {
      let stake = getStake();
      let response = await fetch(`/arbitrage/get/${stake}`);
      response = await statusCheck(response);
      arbData = await response.json();

      document.getElementById("display").innerHTML = "";
      arbData.forEach(displayGame);

      if (stake === 0) {
        displayMessage("warning", "Stake is $0 so no profits will be made.");
      } else {
        displayMessage("success", `Retrieved ${arbData.length} potential arbitrage opportunities.`);
      }
    } catch (err) {
      displayMessage("error", "An error was encountered when retrieving arbitrage opportunities.");
    }
  }

  /**
   * Make a request to /arbitrage/save to save the current arbitrage data.
   */
  async function saveData() {
    try {
      if (arbData.length === 0) {
        displayMessage("error", "No data to save.");
      } else {
        let response = await fetch("/arbitrage/save", {
          method: "POST",
          body: JSON.stringify(arbData),
          headers: {
            "Content-Type": "application/json"
          }
        });
        response = await statusCheck(response);
        let text = await response.text();
        displayMessage("success", text);
      }
    } catch (err) {
      displayMessage("error", "An error was encountered when saving data.");
    }
  }

  /**
   * Utility method to check if the status of a response was ok.
   *
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

  /**
   * Enable arbitrage buttons once API key is ready.
   */
  function enableButtons() {
    document.getElementById("arb-btn").disabled = false;
    document.getElementById("save-btn").disabled = false;
  }

  /**
   * Displays a message for the user to see on the webpage.
   *
   * @param {string} type - The type of message. Either "success" "warning" or "error".
   * @param {string} text - The text of the message to display.
   */
  function displayMessage(type, text) {
    let messageContainer = document.getElementById("message-container");
    messageContainer.innerHTML = "";

    let message = document.createElement("div");
    message.classList.add("message", type);
    messageContainer.appendChild(message);

    let icon = document.createElement("img");
    icon.src = `imgs/${type}-icon.png`;
    icon.alt = `${type} icon`;
    message.appendChild(icon);

    let messageText = document.createElement("span");
    messageText.textContent = text;
    message.appendChild(messageText);

    let closeButton = document.createElement("span");
    closeButton.classList.add("close");
    closeButton.textContent = "✖";
    closeButton.onclick = () => messageContainer.removeChild(message);
    message.appendChild(closeButton);
  }

  /**
   * Displays a game card on the webpage which displays the details of a sporting event and
   * potential arbitrage opportunities.
   *
   * @param {Object} game - Object containing arbitrage data for a given game.
   */
  function displayGame(game) {
    let display = document.getElementById("display");

    let card = document.createElement("div");
    card.classList.add("card");
    display.appendChild(card);
    createElement("h2", "sport", game.sport, card);
    createElement("p", "date", formatDate(game.date), card);

    let teamsContainer = createTeamsContainer(game);
    card.appendChild(teamsContainer);

    let oddsContainer = document.createElement("div");
    oddsContainer.classList.add("odds");
    card.appendChild(oddsContainer);
    oddsContainer.appendChild(
      createOddsBlock("Best Home Odds", game.home.odds, game.home.bookmaker, game.home.stake)
    );
    oddsContainer.appendChild(
      createOddsBlock("Best Away Odds", game.away.odds, game.away.bookmaker, game.away.stake)
    );

    let arbitrageContainer = createArbitrageContainer(game);
    card.appendChild(arbitrageContainer);
  }

  /**
   * Helper method to create a team container in the game card.
   *
   * @param {Object} game - Object containing arbitrage data for a given game.
   * @returns {Object} - teamContainer element containing team information.
   */
  function createTeamsContainer(game) {
    let teamsContainer = document.createElement("div");
    teamsContainer.classList.add("teams");
    createElement("p", "home", game.home.team, teamsContainer);
    createElement("p", "vs", "vs", teamsContainer);
    createElement("p", "away", game.away.team, teamsContainer);
    return teamsContainer;
  }

  /**
   * Helper method to initialize an odds-block in the game card.
   *
   * @param {string} headerText - The header text of the display.
   * @param {string} value - The value of the odds.
   * @param {string} bookmaker - The bookmaker for the current odds.
   * @param {string} stake - The stake to bet.
   * @returns {HTMLDivElement} - The oddBlock element containing odds information.
   */
  function createOddsBlock(headerText, value, bookmaker, stake) {
    let oddsBlock = document.createElement("div");
    oddsBlock.classList.add("odds-block");
    createElement("p", "odds-label", headerText, oddsBlock);
    createElement("p", "odds-value", value, oddsBlock);
    createElement("p", "bookmaker", bookmaker, oddsBlock);
    createElement("p", "stake", `$${stake.toFixed(2)}`, oddsBlock);
    return oddsBlock;
  }

  /**
   * Helper method to create an arbitrage container for the game card which stores arbitrage
   * information on the current game.
   *
   * @param {Object} game - Inforamtion about the current game.
   * @returns {HTMLDivElement} - The arbitrageContainer element containing arbitrage information.
   */
  function createArbitrageContainer(game) {
    let arbitrageContainer = document.createElement("div");
    arbitrageContainer.classList.add("arbitrage");
    if (game.arbitrage) {
      createElement("p", "arbitrage-found", "Arbitrage Found!", arbitrageContainer);
      createElement("p", "profit", `Profit: $${game.profit.toFixed(2)}`, arbitrageContainer);
    } else {
      createElement("p", "no-arbitrage-found", "No Arbitrage Found.", arbitrageContainer);
    }
    return arbitrageContainer;
  }

  /**
   * Helper method to create an element with a class, text content, and parent.
   *
   * @param {string} elementType - Type of element to create in the DOM.
   * @param {string} className - Class name of the element.
   * @param {string} textContent - Text content of the element.
   * @param {string} parent - Parent of the element.
   */
  function createElement(elementType, className, textContent, parent) {
    let element = document.createElement(elementType);
    element.classList.add(className);
    element.textContent = textContent;
    parent.appendChild(element);
  }

  /**
   * Retrieves the user's API key from the textbox.
   *
   * @returns {string} - The API key entered by the user.
   */
  function getAPIKey() {
    return document.getElementById("api-input").value;
  }

  /**
   * Retrieves the user's stake from an input box.
   *
   * @returns {float} - The stake which the user entered.
   */
  function getStake() {
    let stake = parseFloat(document.getElementById("stake-input").value);
    return isNaN(stake) ? 0.0 : stake;
  }

  /**
   * Formats a given ISO date string to display on the game card.
   *
   * @param {string} date - The date in ISO format.
   * @returns {string} - A more readable date string.
   */
  function formatDate(date) {
    date = date.replace("T", " ");
    date = date.replace("Z", " ");
    return date;
  }
})();
