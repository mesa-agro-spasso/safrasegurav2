import { create } from 'zustand';
import type { Combination, GlobalParameters, DailyTableData, Operation, MarketData } from '@/types/pricing';
import { defaultGlobalParameters } from './mock-data';
import { getMarketData } from './services/market';
import type { CreateOperationInput } from './services/operations';
import {
  loadDailyTableParams,
  saveMarketData,
  saveGlobalParams,
  saveCombinations,
  saveResults,
  loadOperations,
  createOperationInDb,
  updateOperationStatusInDb,
  loadInsuranceProfiles,
  type InsuranceProfile,
} from './services/supabase-data';
import { executePricing } from './services/pricing-engine';
import { toast } from 'sonner';

interface AppState {
  // Loading
  isLoading: boolean;

  // Market
  marketData: MarketData;
  refreshMarketData: () => void;
  saveMarketDataToDb: () => Promise<void>;

  // Parameters
  globalParameters: GlobalParameters;
  setGlobalParameters: (params: GlobalParameters) => void;
  saveGlobalParamsToDb: () => Promise<void>;

  // Combinations
  combinations: Combination[];
  setCombinations: (combos: Combination[]) => void;
  updateCombination: (id: string, updates: Partial<Combination>) => void;
  addCombination: (combo: Combination) => void;
  removeCombination: (id: string) => void;
  saveCombinationsToDb: () => Promise<void>;

  // Daily Table
  dailyTable: DailyTableData | null;
  generateTable: () => Promise<void>;

  // Operations
  operations: Operation[];
  addOperation: (input: CreateOperationInput) => Promise<void>;
  updateOperationStatus: (id: string, status: Operation['status']) => Promise<void>;

  // Insurance Profiles
  insuranceProfiles: InsuranceProfile[];

  // Init
  loadFromSupabase: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: true,

  marketData: getMarketData(),
  refreshMarketData: () => set({ marketData: getMarketData() }),
  saveMarketDataToDb: async () => {
    try {
      await saveMarketData(get().marketData);
      toast.success('Market data salvo');
    } catch (e: any) {
      toast.error('Erro ao salvar market data: ' + e.message);
    }
  },

  globalParameters: defaultGlobalParameters,
  setGlobalParameters: (params) => set({ globalParameters: params }),
  saveGlobalParamsToDb: async () => {
    try {
      await saveGlobalParams(get().globalParameters);
      toast.success('Parâmetros salvos');
    } catch (e: any) {
      toast.error('Erro ao salvar parâmetros: ' + e.message);
    }
  },

  combinations: [],
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
  saveCombinationsToDb: async () => {
    try {
      await saveCombinations(get().combinations);
      toast.success('Combinações salvas');
    } catch (e: any) {
      toast.error('Erro ao salvar combinações: ' + e.message);
    }
  },

  dailyTable: null,
  generateTable: async () => {
    try {
      const result = await executePricing();
      if (result.success) {
        toast.success(`Pricing executado: ${result.calculated_items ?? 0} itens calculados`);
      } else {
        toast.error('Erro no pricing: ' + (result.error ?? 'desconhecido'));
      }
    } catch (e: any) {
      toast.error('Erro ao executar pricing: ' + e.message);
    }
  },

  operations: [],
  addOperation: async (input) => {
    try {
      const op = await createOperationInDb(input);
      set((state) => ({ operations: [op, ...state.operations] }));
      toast.success('Operação criada');
    } catch (e: any) {
      toast.error('Erro ao criar operação: ' + e.message);
    }
  },
  updateOperationStatus: async (id, status) => {
    try {
      await updateOperationStatusInDb(id, status);
      set((state) => ({
        operations: state.operations.map((op) =>
          op.id === id ? { ...op, status } : op
        ),
      }));
    } catch (e: any) {
      toast.error('Erro ao atualizar status: ' + e.message);
    }
  },

  insuranceProfiles: [],

  loadFromSupabase: async () => {
    try {
      const [params, ops, profiles] = await Promise.all([
        loadDailyTableParams(),
        loadOperations(),
        loadInsuranceProfiles(),
      ]);

      const hasResults = params.results && 'results' in (params.results as any) && (params.results as any).results?.length > 0;

      set({
        marketData: params.market_data,
        globalParameters: params.global_params,
        combinations: params.combinations ?? [],
        dailyTable: hasResults ? (params.results as unknown as DailyTableData) : null,
        operations: ops,
        insuranceProfiles: profiles,
        isLoading: false,
      });
    } catch (e: any) {
      console.error('Failed to load from Supabase:', e);
      toast.error('Erro ao carregar dados do Supabase');
      set({ isLoading: false });
    }
  },
}));
