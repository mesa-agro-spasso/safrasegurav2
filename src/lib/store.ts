import { create } from 'zustand';
import type { Combination, GlobalParameters, DailyTableData, Operation, MarketData } from '@/types/pricing';
import { defaultGlobalParameters, defaultCombinations, sampleOperations } from './mock-data';
import { getMarketData } from './services/market';
import { generateDailyTable } from './services/pricing';
import { createOperation, type CreateOperationInput } from './services/operations';

interface AppState {
  // Market
  marketData: MarketData;
  refreshMarketData: () => void;

  // Parameters
  globalParameters: GlobalParameters;
  setGlobalParameters: (params: GlobalParameters) => void;

  // Combinations
  combinations: Combination[];
  setCombinations: (combos: Combination[]) => void;
  updateCombination: (id: string, updates: Partial<Combination>) => void;
  addCombination: (combo: Combination) => void;
  removeCombination: (id: string) => void;

  // Daily Table
  dailyTable: DailyTableData | null;
  generateTable: () => void;

  // Operations
  operations: Operation[];
  addOperation: (input: CreateOperationInput) => void;
  updateOperationStatus: (id: string, status: Operation['status']) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  marketData: getMarketData(),
  refreshMarketData: () => set({ marketData: getMarketData() }),

  globalParameters: defaultGlobalParameters,
  setGlobalParameters: (params) => set({ globalParameters: params }),

  combinations: defaultCombinations,
  setCombinations: (combos) => set({ combinations: combos }),
  updateCombination: (id, updates) =>
    set((state) => ({
      combinations: state.combinations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  addCombination: (combo) =>
    set((state) => ({ combinations: [...state.combinations, combo] })),
  removeCombination: (id) =>
    set((state) => ({
      combinations: state.combinations.filter((c) => c.id !== id),
    })),

  dailyTable: null,
  generateTable: () => {
    const { combinations, globalParameters, marketData } = get();
    const table = generateDailyTable(combinations, globalParameters, marketData);
    set({ dailyTable: table });
  },

  operations: sampleOperations,
  addOperation: (input) => {
    const op = createOperation(input);
    set((state) => ({ operations: [op, ...state.operations] }));
  },
  updateOperationStatus: (id, status) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, status } : op
      ),
    })),
}));
