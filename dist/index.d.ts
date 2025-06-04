import { JsPsych } from 'jspsych';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychInstructions from '@jspsych/plugin-instructions';

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
    selections: Array<{
        card: number;
        time: number;
    }>;
}
interface GameState {
    totalScore: number;
    roundData: RoundData | null;
    roundsCompleted: number;
}
declare function resetState(): void;
declare function setupRound(jsPsych: JsPsych, cfg: RoundConfig, roundNum: number, gridCols: number, numCards: number): void;
declare function endRound(jsPsych: JsPsych, cfg: RoundConfig, roundNum: number, voluntary: boolean): void;
declare function createInstructions(): {
    type: typeof jsPsychInstructions;
    pages: string[];
    show_clickable_nav: boolean;
};
declare function createRoundInfo(roundNum: number, totalRounds: number, roundConfig: RoundConfig): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: () => string;
    choices: string[];
};
declare function createCardGame(jsPsych: JsPsych, roundNum: number, roundConfig: RoundConfig, numCards: number, gridCols: number): {
    type: typeof jsPsychHtmlKeyboardResponse;
    stimulus: () => string;
    choices: string;
    on_load: () => void;
};
declare function createResults(jsPsych: JsPsych): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: () => string;
    choices: string[];
};
declare function createTimeline(jsPsych: JsPsych, { numCards, gridCols, rounds, showInstructions, showResults }?: {
    numCards?: number;
    gridCols?: number;
    rounds?: RoundConfig[];
    showInstructions?: boolean;
    showResults?: boolean;
}): any[];
declare const timelineComponents: {
    createInstructions: typeof createInstructions;
    createRoundInfo: typeof createRoundInfo;
    createCardGame: typeof createCardGame;
    createResults: typeof createResults;
};
declare const utils: {
    resetState: typeof resetState;
    setupRound: typeof setupRound;
    endRound: typeof endRound;
};

export { GameState, RoundConfig, RoundData, createTimeline, timelineComponents, utils };
