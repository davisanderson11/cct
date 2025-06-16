import { JsPsych } from 'jspsych';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychInstructions from '@jspsych/plugin-instructions';

interface round_config {
    loss_cards: number;
    gain_amount: number;
    loss_amount: number;
}
interface round_data {
    score: number;
    cards: number;
    ended: boolean;
    start_time: number;
    selections: Array<{
        card: number;
        time: number;
    }>;
}
interface GameState {
    total_score: number;
    round_data: round_data | null;
    rounds_completed: number;
}
declare function resetState(): void;
declare function setupRound(jsPsych: JsPsych, cfg: round_config, round_num: number, cols: number, n_cards: number): void;
declare function endRound(jsPsych: JsPsych, cfg: round_config, round_num: number, voluntary: boolean): void;
declare function createInstructions(): {
    type: typeof jsPsychInstructions;
    pages: string[];
    show_clickable_nav: boolean;
    allow_backward: boolean;
};
declare function createRoundInfo(round_num: number, totalRounds: number, round_config: round_config): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: () => string;
    choices: string[];
};
declare function createCardGame(jsPsych: JsPsych, round_num: number, round_config: round_config, n_cards: number, cols: number): {
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
declare function createTimeline(jsPsych: JsPsych, { n_cards, cols, rounds, show_instructions, show_results }?: {
    n_cards?: number;
    cols?: number;
    rounds?: round_config[];
    show_instructions?: boolean;
    show_results?: boolean;
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

export { GameState, createTimeline, round_config, round_data, timelineComponents, utils };
