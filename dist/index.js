import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychInstructions from '@jspsych/plugin-instructions';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var DEFAULT_NUM_CARDS = 16;
var DEFAULT_GRID_COLS = 4;
var DEFAULT_ROUNDS = [
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 },
  { lossCards: 1, gainAmount: 10, lossAmount: 250 }
];
var state = {
  totalScore: 0,
  roundData: null,
  roundsCompleted: 0
};
function resetState() {
  state = {
    totalScore: 0,
    roundData: null,
    roundsCompleted: 0
  };
}
function setupRound(jsPsych, cfg, roundNum, gridCols, numCards) {
  const lossPositions = [];
  while (lossPositions.length < cfg.lossCards) {
    const pos = Math.floor(Math.random() * numCards);
    if (!lossPositions.includes(pos))
      lossPositions.push(pos);
  }
  state.roundData = {
    score: 0,
    cards: 0,
    ended: false,
    startTime: Date.now(),
    selections: []
  };
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.addEventListener("click", function() {
      if (!state.roundData || state.roundData.ended || !this.classList.contains("card-back"))
        return;
      state.roundData.cards++;
      state.roundData.selections.push({ card: i, time: Date.now() - state.roundData.startTime });
      if (lossPositions.includes(i)) {
        this.className = "card card-loss";
        this.textContent = `-${cfg.lossAmount}`;
        state.roundData.score -= cfg.lossAmount;
        state.roundData.ended = true;
        const messageEl = document.getElementById("message");
        if (messageEl) {
          messageEl.innerHTML = '<b style="color:#EF4444">Loss card! Round ended.</b>';
        }
        setTimeout(() => endRound(jsPsych, cfg, roundNum, false), 2e3);
      } else {
        this.className = "card card-gain";
        this.textContent = `+${cfg.gainAmount}`;
        state.roundData.score += cfg.gainAmount;
        const scoreEl = document.getElementById("round-score");
        if (scoreEl) {
          scoreEl.textContent = state.roundData.score.toString();
        }
        if (state.roundData.cards === numCards - cfg.lossCards) {
          state.roundData.ended = true;
          const messageEl = document.getElementById("message");
          if (messageEl) {
            messageEl.innerHTML = '<b style="color:#22C55E">All gain cards found!</b>';
          }
          setTimeout(() => endRound(jsPsych, cfg, roundNum, true), 2e3);
        }
      }
    });
  });
  const stopBtn = document.getElementById("stop-btn");
  if (stopBtn) {
    stopBtn.addEventListener("click", function() {
      if (state.roundData && !state.roundData.ended) {
        state.roundData.ended = true;
        const messageEl = document.getElementById("message");
        if (messageEl) {
          messageEl.innerHTML = '<b style="color:#1E3A8A">Round stopped!</b>';
        }
        setTimeout(() => endRound(jsPsych, cfg, roundNum, true), 1500);
      }
    });
  }
}
function endRound(jsPsych, cfg, roundNum, voluntary) {
  if (!state.roundData)
    return;
  state.totalScore += state.roundData.score;
  state.roundsCompleted++;
  const currentTrial = jsPsych.getCurrentTrial();
  if (currentTrial) {
    currentTrial.data = __spreadProps(__spreadValues({
      task: "round_complete",
      round: roundNum
    }, cfg), {
      cards_selected: state.roundData.cards,
      round_score: state.roundData.score,
      total_score: state.totalScore,
      voluntary_stop: voluntary,
      selections: state.roundData.selections,
      rt: Date.now() - state.roundData.startTime
    });
  }
  jsPsych.finishTrial();
}
function createInstructions() {
  const instructions = {
    type: jsPsychInstructions,
    pages: [
      `<h1>Columbia Card Task</h1>
            <p>Select cards to earn points. Most cards give you points, but some lose points and end the round.</p>
            <p>You can stop anytime to keep your points, or keep selecting for more.</p>`,
      `<h2>Strategy</h2>
            <p>Before each round, you'll see:</p>
            <ul><li>Number of loss cards</li><li>Points per gain card</li><li>Loss penalty</li></ul>
            <p>Use this info to decide your risk!</p>`
    ],
    show_clickable_nav: true
  };
  return instructions;
}
function createRoundInfo(roundNum, totalRounds, roundConfig) {
  const roundInfo = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
      return `<div class="round-info">
                <h2>Round ${roundNum} of ${totalRounds}</h2>
                <p>Loss cards: <b style="color:#EF4444">${roundConfig.lossCards}</b></p>
                <p>Loss penalty: <b style="color:#EF4444">-${roundConfig.lossAmount}</b></p>
                <p>Gain per card: <b style="color:#22C55E">+${roundConfig.gainAmount}</b></p>
                <p>Total score: <span class="score-display">${state.totalScore}</span></p>
            </div>`;
    },
    choices: ["Start"]
  };
  return roundInfo;
}
function createCardGame(jsPsych, roundNum, roundConfig, numCards, gridCols) {
  const cardGame = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const cards = Array.from(
        { length: numCards },
        (_, i) => `<div class="card card-back" id="card-${i}">?</div>`
      ).join("");
      return `<style>.card-grid { grid-template-columns: repeat(${gridCols}, 1fr) !important; }</style>
                <div class="game-info">
                    <h3>Round ${roundNum}</h3>
                    <p>Score: <span id="round-score">0</span> | Total: ${state.totalScore}</p>
                </div>
                <div class="card-grid">
                    ${cards}
                </div>
                <div class="button-container">
                    <button class="stop-button" id="stop-btn">Stop and Keep Points</button>
                </div>
                <div id="message"></div>`;
    },
    choices: "NO_KEYS",
    on_load: function() {
      setupRound(jsPsych, roundConfig, roundNum, gridCols, numCards);
    }
  };
  return cardGame;
}
function createResults(jsPsych) {
  const results = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      const data = jsPsych.data.get().filter({ task: "round_complete" });
      const avgCards = data.count() > 0 ? data.select("cards_selected").mean() : 0;
      let finalScore = 0;
      if (data.count() > 0) {
        const scores = data.select("total_score").values;
        finalScore = scores[scores.length - 1];
      }
      return `<div class="round-info">
                <h2>Task Complete!</h2>
                <p>Final Score: <span class="score-display">${finalScore}</span></p>
                <p>Average cards selected: ${avgCards.toFixed(1)}</p>
            </div>`;
    },
    choices: ["Continue"]
  };
  return results;
}
function createTimeline(jsPsych, {
  numCards = DEFAULT_NUM_CARDS,
  gridCols = DEFAULT_GRID_COLS,
  rounds = DEFAULT_ROUNDS,
  showInstructions = true,
  showResults = true
} = {}) {
  resetState();
  const timeline = [];
  if (showInstructions) {
    timeline.push(createInstructions());
  }
  rounds.forEach((roundConfig, idx) => {
    const roundNum = idx + 1;
    timeline.push(createRoundInfo(roundNum, rounds.length, roundConfig));
    timeline.push(createCardGame(jsPsych, roundNum, roundConfig, numCards, gridCols));
  });
  if (showResults) {
    timeline.push(createResults(jsPsych));
  }
  return timeline;
}
var timelineComponents = {
  createInstructions,
  createRoundInfo,
  createCardGame,
  createResults
};
var utils = {
  resetState,
  setupRound,
  endRound
};

export { createTimeline, timelineComponents, utils };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map