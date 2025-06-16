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
var default_n_cards = 16;
var default_cols = 4;
var default_rounds = [
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 },
  { loss_cards: 1, gain_amount: 10, loss_amount: 250 }
];
var state = {
  total_score: 0,
  round_data: null,
  rounds_completed: 0
};
function resetState() {
  state = {
    total_score: 0,
    round_data: null,
    rounds_completed: 0
  };
}
function setupRound(jsPsych, cfg, round_num, cols, n_cards) {
  const lossPositions = [];
  while (lossPositions.length < cfg.loss_cards) {
    const pos = Math.floor(Math.random() * n_cards);
    if (!lossPositions.includes(pos))
      lossPositions.push(pos);
  }
  state.round_data = {
    score: 0,
    cards: 0,
    ended: false,
    start_time: Date.now(),
    selections: []
  };
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.addEventListener("click", function() {
      if (!state.round_data || state.round_data.ended || !this.classList.contains("card-back"))
        return;
      state.round_data.cards++;
      state.round_data.selections.push({ card: i, time: Date.now() - state.round_data.start_time });
      if (lossPositions.includes(i)) {
        this.className = "card card-loss";
        this.textContent = `-${cfg.loss_amount}`;
        state.round_data.score -= cfg.loss_amount;
        state.round_data.ended = true;
        const messageEl = document.getElementById("message");
        if (messageEl) {
          messageEl.innerHTML = '<b style="color:#EF4444">Loss card! Round ended.</b>';
        }
        setTimeout(() => endRound(jsPsych, cfg, round_num, false), 2e3);
      } else {
        this.className = "card card-gain";
        this.textContent = `+${cfg.gain_amount}`;
        state.round_data.score += cfg.gain_amount;
        const scoreEl = document.getElementById("round-score");
        if (scoreEl) {
          scoreEl.textContent = state.round_data.score.toString();
        }
        if (state.round_data.cards === n_cards - cfg.loss_cards) {
          state.round_data.ended = true;
          const messageEl = document.getElementById("message");
          if (messageEl) {
            messageEl.innerHTML = '<b style="color:#22C55E">All gain cards found!</b>';
          }
          setTimeout(() => endRound(jsPsych, cfg, round_num, true), 2e3);
        }
      }
    });
  });
  const stopBtn = document.getElementById("stop-btn");
  if (stopBtn) {
    stopBtn.addEventListener("click", function() {
      if (state.round_data && !state.round_data.ended) {
        state.round_data.ended = true;
        const messageEl = document.getElementById("message");
        if (messageEl) {
          messageEl.innerHTML = '<b style="color:#1E3A8A">Round stopped!</b>';
        }
        setTimeout(() => endRound(jsPsych, cfg, round_num, true), 1500);
      }
    });
  }
}
function endRound(jsPsych, cfg, round_num, voluntary) {
  if (!state.round_data)
    return;
  state.total_score += state.round_data.score;
  state.rounds_completed++;
  const currentTrial = jsPsych.getCurrentTrial();
  if (currentTrial) {
    currentTrial.data = __spreadProps(__spreadValues({
      task: "round_complete",
      round: round_num
    }, cfg), {
      cards_selected: state.round_data.cards,
      round_score: state.round_data.score,
      total_score: state.total_score,
      voluntary_stop: voluntary,
      selections: state.round_data.selections,
      rt: Date.now() - state.round_data.start_time
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
    show_clickable_nav: true,
    allow_backward: false
  };
  return instructions;
}
function createRoundInfo(round_num, totalRounds, round_config) {
  const round_info = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
      return `<div class="round-info">
                <h2>Round ${round_num} of ${totalRounds}</h2>
                <p>Loss cards: <b style="color:#EF4444">${round_config.loss_cards}</b></p>
                <p>Loss penalty: <b style="color:#EF4444">-${round_config.loss_amount}</b></p>
                <p>Gain per card: <b style="color:#22C55E">+${round_config.gain_amount}</b></p>
                <p>Total score: <span class="score-display">${state.total_score}</span></p>
            </div>`;
    },
    choices: ["Start"]
  };
  return round_info;
}
function createCardGame(jsPsych, round_num, round_config, n_cards, cols) {
  const cardGame = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const cards = Array.from(
        { length: n_cards },
        (_, i) => `<div class="card card-back" id="card-${i}">?</div>`
      ).join("");
      return `<style>.card-grid { grid-template-columns: repeat(${cols}, 1fr) !important; }</style>
                <div class="game-info">
                    <h3>Round ${round_num}</h3>
                    <p>Score: <span id="round-score">0</span> | Total: ${state.total_score}</p>
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
      setupRound(jsPsych, round_config, round_num, cols, n_cards);
    }
  };
  return cardGame;
}
function createResults(jsPsych) {
  const results = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      const data = jsPsych.data.get().filter({ task: "round_complete" });
      const avg_cards = data.count() > 0 ? data.select("cards_selected").mean() : 0;
      let final_score = 0;
      if (data.count() > 0) {
        const scores = data.select("total_score").values;
        final_score = scores[scores.length - 1];
      }
      return `<div class="round-info">
                <h2>Task Complete!</h2>
                <p>Final Score: <span class="score-display">${final_score}</span></p>
                <p>Average cards selected: ${avg_cards.toFixed(1)}</p>
            </div>`;
    },
    choices: ["Continue"]
  };
  return results;
}
function createTimeline(jsPsych, {
  n_cards = default_n_cards,
  cols = default_cols,
  rounds = default_rounds,
  show_instructions = true,
  show_results = true
} = {}) {
  resetState();
  const timeline = [];
  if (show_instructions) {
    timeline.push(createInstructions());
  }
  rounds.forEach((round_config, idx) => {
    const round_num = idx + 1;
    timeline.push(createRoundInfo(round_num, rounds.length, round_config));
    timeline.push(createCardGame(jsPsych, round_num, round_config, n_cards, cols));
  });
  if (show_results) {
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