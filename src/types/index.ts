export interface StacksUser {
  address: string;
  profile?: {
    stxAddress: string;
    btcAddress?: string;
    name?: string;
    avatar?: string;
  };
}

export interface SavingsContract {
  address: string;
  name: string;
}

export interface UserDeposit {
  amount: number;
  timestamp: number;
  interestEarned: number;
}

export interface ContractState {
  totalDeposits: number;
  interestRate: number;
  userBalance: number;
  userDeposit: UserDeposit | null;
}

export interface TransactionStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Enhanced transaction types for detailed flow
export type TransactionState = 'idle' | 'pending' | 'broadcasting' | 'confirmed' | 'failed';

export interface TransactionDetails {
  id: string;
  txId?: string;
  type: 'deposit' | 'withdraw' | 'create-plan' | 'update-plan' | 'toggle-auto' | 'execute-purchase';
  amount?: number;
  state: TransactionState;
  error?: string;
  timestamp: number;
  confirmations?: number;
  blockHeight?: number;
  explorerUrl?: string;
  retryCount?: number;
}

export interface TransactionFlowState {
  currentTransaction: TransactionDetails | null;
  queue: TransactionDetails[];
  history: TransactionDetails[];
}

export interface StacksNetworkConfig {
  network: 'mainnet' | 'testnet';
  coreApiUrl: string;
  broadcastApiUrl: string;
}

// Savings Plan Types
export type TokenType = 'STX' | 'sBTC';
export type FrequencyType = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';

export interface SavingsPlanForm {
  amount: string;
  tokenType: TokenType;
  frequency: FrequencyType;
  startDate: string;
  endDate?: string;
  targetAmount?: string;
}

export interface SavingsPlanCalculation {
  totalContributions: number;
  estimatedValue: number;
  estimatedEarnings: number;
  totalMonths: number;
  contributionCount: number;
  fees: number;
}

export interface SavingsPlan {
  id: string;
  amount: number;
  tokenType: TokenType;
  frequency: FrequencyType;
  frequencyInBlocks: number;
  startDate: Date;
  endDate?: Date;
  targetAmount?: number;
  isActive: boolean;
  createdAt: Date;
  nextPurchaseDate: Date;
}

export interface FormValidationError {
  field: keyof SavingsPlanForm;
  message: string;
}

export interface SavingsPlanState {
  currentStep: 'form' | 'preview' | 'confirmation' | 'success';
  formData: SavingsPlanForm;
  calculation: SavingsPlanCalculation | null;
  errors: FormValidationError[];
  isSubmitting: boolean;
}

// Enhanced transaction types for transaction history
export interface SavingsTransaction {
  id: string;
  txHash: string;
  type: 'deposit' | 'withdrawal' | 'interest' | 'dca-purchase';
  amount: number; // in microSTX
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  confirmations?: number;
  fee?: number; // in microSTX
  btcPrice?: number; // Price of BTC at time of transaction (for DCA)
  stxBalance?: number; // STX balance after transaction
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TransactionFilters {
  dateRange: DateRange;
  type: 'all' | 'deposit' | 'withdrawal' | 'interest' | 'dca-purchase';
  status: 'all' | 'pending' | 'success' | 'failed';
  searchTerm: string;
}

export interface DCAPerformance {
  totalInvested: number;
  currentValue: number;
  totalGain: number;
  percentageGain: number;
  averagePurchasePrice: number;
  currentPrice: number;
  lumpSumValue: number;
  dcaValue: number;
}

export interface SortConfig {
  key: keyof SavingsTransaction;
  direction: 'asc' | 'desc';
}