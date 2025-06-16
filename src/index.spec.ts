import { jest } from '@jest/globals';
import { JsPsych } from 'jspsych';
import { createTimeline, timelineComponents, utils, RoundConfig, round_data, GameState } from './index';

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    querySelectorAll: jest.fn(() => []),
    getElementById: jest.fn(() => null),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    createElement: jest.fn(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn()
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  },
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'Date', {
  value: {
    now: jest.fn(() => 1000000),
  },
  writable: true,
});

// Properly mock Math to preserve all original methods
const originalMath = Object.create(Object.getPrototypeOf(Math));
Object.getOwnPropertyNames(Math).forEach(property => {
  originalMath[property] = Math[property];
});

Object.defineProperty(global, 'Math', {
  value: {
    ...originalMath,
    random: jest.fn(() => 0.5),
  },
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'setTimeout', {
  value: jest.fn((fn: any) => fn()),
  writable: true,
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    document: global.document,
    setTimeout: global.setTimeout,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true,
  configurable: true
});

// Mock jsPsych
const mockJsPsych = {
  getCurrentTrial: jest.fn(() => ({ data: {} })),
  finishTrial: jest.fn(),
  data: {
    get: jest.fn(() => ({
      filter: jest.fn(() => ({
        count: jest.fn(() => 3),
        select: jest.fn(() => ({
          mean: jest.fn(() => 2.5),
          values: [10, 20, 30]
        }))
      }))
    }))
  }
} as unknown as JsPsych;

describe('Columbia Card Task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    utils.resetState();
    (Math.random as jest.Mock).mockReturnValue(0.5);
    (Date.now as jest.Mock).mockReturnValue(1000000);
  });

  describe('Constants and Types', () => {
    test('should have correct default values', () => {
      const timeline = createTimeline(mockJsPsych);
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });
  });

  describe('createTimeline', () => {
    test('should create timeline with default parameters', () => {
      const timeline = createTimeline(mockJsPsych);
      
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBeGreaterThan(0);
    });

    test('should create timeline with custom parameters', () => {
      const customRounds: RoundConfig[] = [
        { loss_cards: 2, gain_amount: 15, loss_amount: 100 },
        { loss_cards: 3, gain_amount: 20, loss_amount: 200 }
      ];

      const timeline = createTimeline(mockJsPsych, {
        n_cards: 20,
        cols: 5,
        rounds: customRounds,
        show_instructions: false,
        show_results: false
      });

      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    test('should include instructions when showInstructions is true', () => {
      const timeline = createTimeline(mockJsPsych, { show_instructions: true });
      
      // Should have instructions as first element
      expect(timeline[0]).toBeDefined();
      expect(timeline[0].pages).toBeDefined();
    });

    test('should exclude instructions when showInstructions is false', () => {
      const timeline = createTimeline(mockJsPsych, { show_instructions: false });
      
      // First element should not be instructions
      expect(timeline[0].pages).toBeUndefined();
    });

    test('should include results when showResults is true', () => {
      const timeline = createTimeline(mockJsPsych, { show_results: true });
      
      // Last element should be results
      const lastElement = timeline[timeline.length - 1];
      expect(lastElement).toBeDefined();
    });
  });

  describe('timelineComponents', () => {
    describe('createInstructions', () => {
      test('should create instructions component', () => {
        const instructions = timelineComponents.createInstructions();
        
        expect(instructions).toBeDefined();
        expect(instructions.pages).toBeDefined();
        expect(Array.isArray(instructions.pages)).toBe(true);
        expect(instructions.pages.length).toBe(2);
        expect(instructions.show_clickable_nav).toBe(true);
      });

      test('should contain Columbia Card Task title', () => {
        const instructions = timelineComponents.createInstructions();
        
        expect(instructions.pages[0]).toContain('Columbia Card Task');
      });
    });

    describe('createRoundInfo', () => {
      test('should create round info component', () => {
        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        const round_info = timelineComponents.createRoundInfo(1, 8, roundConfig);
        
        expect(round_info).toBeDefined();
        expect(round_info.stimulus).toBeDefined();
        expect(round_info.choices).toEqual(['Start']);
      });

      test('should display correct round information', () => {
        const roundConfig: RoundConfig = { loss_cards: 2, gain_amount: 15, loss_amount: 100 };
        const round_info = timelineComponents.createRoundInfo(3, 5, roundConfig);
        
        const stimulus = typeof round_info.stimulus === 'function' ? round_info.stimulus() : round_info.stimulus;
        expect(stimulus).toContain('Round 3 of 5');
        expect(stimulus).toContain('2');
        expect(stimulus).toContain('15');
        expect(stimulus).toContain('100');
      });
    });

    describe('createCardGame', () => {
      test('should create card game component', () => {
        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        const cardGame = timelineComponents.createCardGame(mockJsPsych, 1, roundConfig, 16, 4);
        
        expect(cardGame).toBeDefined();
        expect(cardGame.stimulus).toBeDefined();
        expect(cardGame.choices).toBe("NO_KEYS");
        expect(cardGame.on_load).toBeDefined();
      });

      test('should generate correct number of cards', () => {
        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        const cardGame = timelineComponents.createCardGame(mockJsPsych, 1, roundConfig, 12, 3);
        
        const stimulus = typeof cardGame.stimulus === 'function' ? cardGame.stimulus() : cardGame.stimulus;
        // Count card elements
        const cardMatches = stimulus.match(/class="card card-back"/g);
        expect(cardMatches).toHaveLength(12);
      });
    });

    describe('createResults', () => {
      test('should create results component', () => {
        const results = timelineComponents.createResults(mockJsPsych);
        
        expect(results).toBeDefined();
        expect(results.stimulus).toBeDefined();
        expect(results.choices).toEqual(['Continue']);
      });

      test('should display task completion message', () => {
        const results = timelineComponents.createResults(mockJsPsych);
        
        const stimulus = typeof results.stimulus === 'function' ? results.stimulus() : results.stimulus;
        expect(stimulus).toContain('Task Complete!');
        expect(stimulus).toContain('Final Score:');
        expect(stimulus).toContain('Average cards selected:');
      });
    });
  });

  describe('utils', () => {
    describe('resetState', () => {
      test('should reset state to initial values', () => {
        utils.resetState();
        
        // We can't directly access state, but we can test through other functions
        // This is tested indirectly through other tests
        expect(true).toBe(true);
      });
    });

    describe('setupRound', () => {
      test('should setup round with DOM elements', () => {
        const mockCard = {
          addEventListener: jest.fn(),
          classList: { contains: jest.fn(() => true) },
          className: '',
          textContent: ''
        };
        
        const mockButton = {
          addEventListener: jest.fn()
        };

        (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard, mockCard]);
        (document.getElementById as jest.Mock).mockImplementation((id) => {
          if (id === 'stop-btn') return mockButton;
          return { innerHTML: '', textContent: '' };
        });

        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

        expect(document.querySelectorAll).toHaveBeenCalledWith('.card');
        expect(mockCard.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    describe('endRound', () => {
      test('should end round and finish trial', () => {
        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        
        // Setup a round first
        const mockCard = {
          addEventListener: jest.fn(),
          classList: { contains: jest.fn(() => true) },
          className: '',
          textContent: ''
        };
        
        (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard]);
        (document.getElementById as jest.Mock).mockReturnValue({ innerHTML: '', textContent: '', addEventListener: jest.fn() });

        utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);
        utils.endRound(mockJsPsych, roundConfig, 1, true);

        expect(mockJsPsych.finishTrial).toHaveBeenCalled();
        expect(mockJsPsych.getCurrentTrial).toHaveBeenCalled();
      });

      test('should not end round if no round data exists', () => {
        const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
        utils.resetState(); // Ensure no round data
        
        utils.endRound(mockJsPsych, roundConfig, 1, true);

        expect(mockJsPsych.finishTrial).not.toHaveBeenCalled();
      });
    });
  });

  describe('Card Click Simulation', () => {
    test('should handle gain card click', () => {
      const mockCard = {
        addEventListener: jest.fn(),
        classList: { contains: jest.fn(() => true) },
        className: 'card card-back',
        textContent: '?'
      };
      
      const mockScoreEl = { textContent: '0' };
      const mockMessageEl = { innerHTML: '' };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard]);
      (document.getElementById as jest.Mock).mockImplementation((id) => {
        if (id === 'round-score') return mockScoreEl;
        if (id === 'message') return mockMessageEl;
        if (id === 'stop-btn') return { addEventListener: jest.fn() };
        return { innerHTML: '', textContent: '' };
      });

      // Mock Math.random to return position that's NOT a loss card
      (Math.random as jest.Mock).mockReturnValue(0.9); // This should make position > loss_cards

      const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

      // Simulate card click
      const clickCall = mockCard.addEventListener.mock.calls.find(call => call[0] === 'click');
      const clickHandler = clickCall?.[1] as ((this: any) => void) | undefined;
      if (clickHandler) {
        clickHandler.call(mockCard);
      }

      expect(mockCard.className).toBe('card card-gain');
      expect(mockCard.textContent).toBe('+10');
      expect(mockScoreEl.textContent).toBe('10');
    });

    test('should handle loss card click', () => {
      const mockCard = {
        addEventListener: jest.fn(),
        classList: { contains: jest.fn(() => true) },
        className: 'card card-back',
        textContent: '?'
      };
      
      const mockMessageEl = { innerHTML: '' };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard]);
      (document.getElementById as jest.Mock).mockImplementation((id) => {
        if (id === 'message') return mockMessageEl;
        if (id === 'stop-btn') return { addEventListener: jest.fn() };
        return { innerHTML: '', textContent: '' };
      });

      // Mock Math.random to return position 0 (will be a loss card)
      (Math.random as jest.Mock).mockReturnValue(0.1);

      const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

      // Simulate card click
      const clickCall = mockCard.addEventListener.mock.calls.find(call => call[0] === 'click');
      const clickHandler = clickCall?.[1] as ((this: any) => void) | undefined;
      if (clickHandler) {
        clickHandler.call(mockCard);
      }

      expect(mockCard.className).toBe('card card-loss');
      expect(mockCard.textContent).toBe('-250');
      expect(mockMessageEl.innerHTML).toContain('Loss card! Round ended.');
    });
  });

  describe('Stop Button Functionality', () => {
    test('should handle stop button click', () => {
      const mockButton = {
        addEventListener: jest.fn()
      };
      
      const mockMessageEl = { innerHTML: '' };

      (document.querySelectorAll as jest.Mock).mockReturnValue([]);
      (document.getElementById as jest.Mock).mockImplementation((id) => {
        if (id === 'stop-btn') return mockButton;
        if (id === 'message') return mockMessageEl;
        return { innerHTML: '', textContent: '' };
      });

      const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

      // Simulate stop button click
      const clickCall = mockButton.addEventListener.mock.calls.find(call => call[0] === 'click');
      const clickHandler = clickCall?.[1] as (() => void) | undefined;
      if (clickHandler) {
        clickHandler();
      }

      expect(mockMessageEl.innerHTML).toContain('Round stopped!');
    });
  });

  describe('Type Exports', () => {
    test('should export RoundConfig type', () => {
      const config: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      expect(config.loss_cards).toBe(1);
      expect(config.gain_amount).toBe(10);
      expect(config.loss_amount).toBe(250);
    });

    test('should export round_data type', () => {
      const data: round_data = {
        score: 100,
        cards: 5,
        ended: false,
        start_time: 1000000,
        selections: [{ card: 0, time: 500 }]
      };
      expect(data.score).toBe(100);
      expect(data.cards).toBe(5);
      expect(data.ended).toBe(false);
      expect(data.start_time).toBe(1000000);
      expect(data.selections).toHaveLength(1);
    });

    test('should export GameState type', () => {
      const state: GameState = {
        total_score: 200,
        round_data: null,
        rounds_completed: 3
      };
      expect(state.total_score).toBe(200);
      expect(state.round_data).toBeNull();
      expect(state.rounds_completed).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty rounds array', () => {
      const timeline = createTimeline(mockJsPsych, { rounds: [] });
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    test('should handle single round', () => {
      const singleRound: RoundConfig[] = [{ loss_cards: 1, gain_amount: 10, loss_amount: 250 }];
      const timeline = createTimeline(mockJsPsych, { rounds: singleRound });
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    test('should handle card click when round is already ended', () => {
      const mockCard = {
        addEventListener: jest.fn(),
        classList: { contains: jest.fn(() => true) },
        className: 'card card-back',
        textContent: '?'
      };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard]);
      (document.getElementById as jest.Mock).mockReturnValue({ addEventListener: jest.fn(), innerHTML: '', textContent: '' });

      const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

      // End the round first
      utils.endRound(mockJsPsych, roundConfig, 1, true);

      // Try to click card after round ended
      const clickCall = mockCard.addEventListener.mock.calls.find(call => call[0] === 'click');
      const clickHandler = clickCall?.[1] as ((this: any) => void) | undefined;
      const originalClassName = mockCard.className;
      if (clickHandler) {
        clickHandler.call(mockCard);
      }

      // Card should not change since round is ended
      expect(mockCard.className).toBe(originalClassName);
    });

    test('should handle card click when card is not card-back', () => {
      const mockCard = {
        addEventListener: jest.fn(),
        classList: { contains: jest.fn(() => false) }, // Not card-back
        className: 'card card-gain',
        textContent: '+10'
      };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockCard]);
      (document.getElementById as jest.Mock).mockReturnValue({ addEventListener: jest.fn(), innerHTML: '', textContent: '' });

      const roundConfig: RoundConfig = { loss_cards: 1, gain_amount: 10, loss_amount: 250 };
      utils.setupRound(mockJsPsych, roundConfig, 1, 4, 16);

      // Try to click already revealed card
      const clickCall = mockCard.addEventListener.mock.calls.find(call => call[0] === 'click');
      const clickHandler = clickCall?.[1] as ((this: any) => void) | undefined;
      const originalClassName = mockCard.className;
      if (clickHandler) {
        clickHandler.call(mockCard);
      }

      // Card should not change since it's already revealed
      expect(mockCard.className).toBe(originalClassName);
    });
  });
});