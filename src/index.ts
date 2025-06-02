import { JsPsych } from "jspsych";
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychInstructions from '@jspsych/plugin-instructions';

/* Constants */
const DEFAULT_NUM_CARDS = 16;
const DEFAULT_GRID_COLS = 4;
const DEFAULT_ROUNDS = [
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 },
    { lossCards: 1, gainAmount: 10, lossAmount: 250 }
];

/* Types */
interface RoundConfig {
    lossCards: number;
    gainAmount: number;
    lossAmount: number;
}

interface RoundData {
    score: number;
    cards: number;
    ended: boolean;
    startTime: number;
    selections: Array<{card: number, time: number}>;
}

interface GameState {
    totalScore: number;
    roundData: RoundData | null;
    roundsCompleted: number;
}

/* Internal state */
let state: GameState = {
    totalScore: 0,
    roundData: null,
    roundsCompleted: 0
};

/* Styles */
const TASK_STYLES = `
    <style>
        body { font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 20px; }
        .card-grid { display: grid; gap: 10px; max-width: 600px; margin: 20px auto; }
        .card { width: 80px; height: 120px; border: 2px solid #333; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; transition: all 0.3s ease; }
        .card-back { background: linear-gradient(45deg, #4169E1, #6495ED); color: white; }
        .card-back:hover { background: linear-gradient(45deg, #1E3A8A, #3B82F6); transform: scale(1.05); }
        .card-gain { background: linear-gradient(45deg, #22C55E, #16A34A); color: white; }
        .card-loss { background: linear-gradient(45deg, #EF4444, #DC2626); color: white; }
        .game-info { text-align: center; margin: 20px 0; font-size: 18px; }
        .round-info { background: white; padding: 15px; border-radius: 8px; margin: 10px auto; max-width: 500px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button-container { text-align: center; margin: 20px 0; }
        .stop-button { background-color: #EF4444; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; margin: 10px; }
        .stop-button:hover { background-color: #DC2626; }
        .score-display { font-size: 24px; font-weight: bold; color: #1E3A8A; }
    </style>
`;

/* Internal functions */
function resetState() {
    state = {
        totalScore: 0,
        roundData: null,
        roundsCompleted: 0
    };
}

function setupRound(jsPsych: JsPsych, cfg: RoundConfig, roundNum: number, gridCols: number, numCards: number) {
    // Create card layout
    const lossPositions: number[] = [];
    while (lossPositions.length < cfg.lossCards) {
        const pos = Math.floor(Math.random() * numCards);
        if (!lossPositions.includes(pos)) lossPositions.push(pos);
    }
    
    state.roundData = {
        score: 0,
        cards: 0,
        ended: false,
        startTime: Date.now(),
        selections: []
    };
    
    // Card click handlers
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
        card.addEventListener('click', function() {
            if (!state.roundData || state.roundData.ended || !this.classList.contains('card-back')) return;
            
            state.roundData.cards++;
            state.roundData.selections.push({card: i, time: Date.now() - state.roundData.startTime});
            
            if (lossPositions.includes(i)) {
                this.className = 'card card-loss';
                this.textContent = `-${cfg.lossAmount}`;
                state.roundData.score -= cfg.lossAmount;
                state.roundData.ended = true;
                const messageEl = document.getElementById('message');
                if (messageEl) {
                    messageEl.innerHTML = '<b style="color:#EF4444">Loss card! Round ended.</b>';
                }
                setTimeout(() => endRound(jsPsych, cfg, roundNum, false), 2000);
            } else {
                this.className = 'card card-gain';
                this.textContent = `+${cfg.gainAmount}`;
                state.roundData.score += cfg.gainAmount;
                const scoreEl = document.getElementById('round-score');
                if (scoreEl) {
                    scoreEl.textContent = state.roundData.score.toString();
                }
                
                if (state.roundData.cards === numCards - cfg.lossCards) {
                    state.roundData.ended = true;
                    const messageEl = document.getElementById('message');
                    if (messageEl) {
                        messageEl.innerHTML = '<b style="color:#22C55E">All gain cards found!</b>';
                    }
                    setTimeout(() => endRound(jsPsych, cfg, roundNum, true), 2000);
                }
            }
        });
    });
    
    // Stop button
    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (state.roundData && !state.roundData.ended) {
                state.roundData.ended = true;
                const messageEl = document.getElementById('message');
                if (messageEl) {
                    messageEl.innerHTML = '<b style="color:#1E3A8A">Round stopped!</b>';
                }
                setTimeout(() => endRound(jsPsych, cfg, roundNum, true), 1500);
            }
        });
    }
}

function endRound(jsPsych: JsPsych, cfg: RoundConfig, roundNum: number, voluntary: boolean) {
    if (!state.roundData) return;
    
    state.totalScore += state.roundData.score;
    state.roundsCompleted++;
    
    const currentTrial = jsPsych.getCurrentTrial();
    if (currentTrial) {
        currentTrial.data = {
            task: 'round_complete',
            round: roundNum,
            ...cfg,
            cards_selected: state.roundData.cards,
            round_score: state.roundData.score,
            total_score: state.totalScore,
            voluntary_stop: voluntary,
            selections: state.roundData.selections,
            rt: Date.now() - state.roundData.startTime
        };
    }
    
    jsPsych.finishTrial();
}

/* Timeline component generating functions */
function createInstructions() {
    const instructions = {
        type: jsPsychInstructions,
        pages: [
            `${TASK_STYLES}
            <h1>Columbia Card Task</h1>
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

function createRoundInfo(roundNum: number, totalRounds: number, roundConfig: RoundConfig) {
    const roundInfo = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => {
            return `${TASK_STYLES}
                <div class="round-info">
                    <h2>Round ${roundNum} of ${totalRounds}</h2>
                    <p>Loss cards: <b style="color:#EF4444">${roundConfig.lossCards}</b></p>
                    <p>Loss penalty: <b style="color:#EF4444">-${roundConfig.lossAmount}</b></p>
                    <p>Gain per card: <b style="color:#22C55E">+${roundConfig.gainAmount}</b></p>
                    <p>Total score: <span class="score-display">${state.totalScore}</span></p>
                    <p>Press SPACE to start</p>
                </div>`;
        },
        choices: [' ']
    };
    
    return roundInfo;
}

function createCardGame(
    jsPsych: JsPsych, 
    roundNum: number, 
    roundConfig: RoundConfig, 
    numCards: number, 
    gridCols: number
) {
    const cardGame = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            const cards = Array.from({length: numCards}, (_, i) => 
                `<div class="card card-back" id="card-${i}">?</div>`
            ).join('');
            
            return `${TASK_STYLES}
                <style>.card-grid { grid-template-columns: repeat(${gridCols}, 1fr) !important; }</style>
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

function createResults(jsPsych: JsPsych) {
    const results = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            const data = jsPsych.data.get().filter({task: 'round_complete'});
            const avgCards = data.count() > 0 ? data.select('cards_selected').mean() : 0;
            
            let finalScore = 0;
            if (data.count() > 0) {
                const scores = data.select('total_score').values;
                finalScore = scores[scores.length - 1];
            }
            
            return `${TASK_STYLES}
                <div class="round-info">
                    <h2>Task Complete!</h2>
                    <p>Final Score: <span class="score-display">${finalScore}</span></p>
                    <p>Average cards selected: ${avgCards.toFixed(1)}</p>
                    <p>Press SPACE to continue</p>
                </div>`;
        },
        choices: [' ']
    };
    
    return results;
}

/* Main timeline creation function */
export function createTimeline(
    jsPsych: JsPsych,
    {
        numCards = DEFAULT_NUM_CARDS,
        gridCols = DEFAULT_GRID_COLS,
        rounds = DEFAULT_ROUNDS,
        showInstructions = true,
        showResults = true
    }: {
        numCards?: number,
        gridCols?: number,
        rounds?: RoundConfig[],
        showInstructions?: boolean,
        showResults?: boolean
    } = {}
) {
    // Reset state for new timeline
    resetState();
    
    const timeline: any[] = [];
    
    // Add instructions if requested
    if (showInstructions) {
        timeline.push(createInstructions());
    }
    
    // Add rounds
    rounds.forEach((roundConfig, idx) => {
        const roundNum = idx + 1;
        
        // Round info
        timeline.push(createRoundInfo(roundNum, rounds.length, roundConfig));
        
        // Card game
        timeline.push(createCardGame(jsPsych, roundNum, roundConfig, numCards, gridCols));
    });
    
    // Add results if requested
    if (showResults) {
        timeline.push(createResults(jsPsych));
    }
    
    return timeline;
}

/* Export individual components for custom timeline building */
export const timelineComponents = {
    createInstructions,
    createRoundInfo,
    createCardGame,
    createResults
};

/* Export utility functions */
export const utils = {
    resetState,
    setupRound,
    endRound
};

/* Export types */
export type { RoundConfig, RoundData, GameState };