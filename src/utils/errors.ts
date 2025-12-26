// Error types for better error handling
export enum ErrorType {
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  TRANSACTION_CANCELLED = 'TRANSACTION_CANCELLED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  USER_REJECTED = 'USER_REJECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error class for structured error handling
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

// Error message mapping to plain English
const errorMessages: Record<ErrorType, (details?: any) => string> = {
  [ErrorType.WALLET_NOT_INSTALLED]: () => 
    'No Stacks wallet found. Please install a compatible wallet like Hiro or Xverse to continue.',
  
  [ErrorType.WALLET_NOT_CONNECTED]: () => 
    'Your wallet is not connected. Please connect your wallet to perform this action.',
  
  [ErrorType.WRONG_NETWORK]: (details) => {
    const currentNetwork = details?.currentNetwork || 'unknown';
    const expectedNetwork = details?.expectedNetwork || 'testnet';
    return `You're on the ${currentNetwork} network, but this app uses ${expectedNetwork}. Please switch your wallet network to continue.`;
  },
  
  [ErrorType.INSUFFICIENT_BALANCE]: (details) => {
    const required = details?.required || 0;
    const available = details?.available || 0;
    const symbol = details?.symbol || 'STX';
    return `Not enough ${symbol} to complete this transaction. You need ${(required - available).toFixed(6)} more ${symbol}.`;
  },
  
  [ErrorType.CONTRACT_CALL_FAILED]: (details) => {
    const functionName = details?.functionName || 'contract function';
    const reason = details?.reason || 'unknown reason';
    return `The ${functionName} failed because: ${reason}. Please try again or contact support if the issue persists.`;
  },
  
  [ErrorType.NETWORK_TIMEOUT]: () => 
    'The network is taking too long to respond. Please check your internet connection and try again.',
  
  [ErrorType.TRANSACTION_CANCELLED]: () => 
    'Transaction was cancelled. If this was a mistake, please try again.',
  
  [ErrorType.TRANSACTION_FAILED]: (details) => {
    const reason = details?.reason || 'unknown reason';
    return `Transaction failed: ${reason}. Please check your wallet balance and try again.`;
  },
  
  [ErrorType.USER_REJECTED]: () => 
    'You rejected this action in your wallet. If this was a mistake, please try again.',
  
  [ErrorType.UNKNOWN_ERROR]: (details) => {
    const originalError = details?.originalError || 'unknown error';
    return `Something went wrong: ${originalError}. Please try again or contact support if the issue continues.`;
  },
};

// Function to get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return errorMessages[error.type](error.details);
  }

  // Handle common error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Wallet not installed
    if (message.includes('no wallet') || message.includes('wallet not found')) {
      return errorMessages[ErrorType.WALLET_NOT_INSTALLED]();
    }
    
    // User rejected
    if (message.includes('user rejected') || message.includes('user denied')) {
      return errorMessages[ErrorType.USER_REJECTED]();
    }
    
    // Network timeout
    if (message.includes('timeout') || message.includes('network error')) {
      return errorMessages[ErrorType.NETWORK_TIMEOUT]();
    }
    
    // Insufficient balance
    if (message.includes('insufficient balance') || message.includes('not enough')) {
      return errorMessages[ErrorType.INSUFFICIENT_BALANCE]();
    }
    
    // Transaction cancelled
    if (message.includes('cancelled') || message.includes('canceled')) {
      return errorMessages[ErrorType.TRANSACTION_CANCELLED]();
    }
  }

  // Default error message
  return errorMessages[ErrorType.UNKNOWN_ERROR]({ originalError: String(error) });
}

// Function to create structured errors
export function createError(
  type: ErrorType,
  details?: any,
  originalError?: unknown
): AppError {
  const message = errorMessages[type](details);
  const code = originalError instanceof Error ? originalError.name : undefined;
  
  return new AppError(type, message, code, {
    ...details,
    originalError: originalError instanceof Error ? originalError.message : String(originalError),
  });
}

// Function to check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return [
      ErrorType.NETWORK_TIMEOUT,
      ErrorType.CONTRACT_CALL_FAILED,
      ErrorType.TRANSACTION_FAILED,
    ].includes(error.type);
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || 
           message.includes('network') || 
           message.includes('rate limit');
  }
  
  return false;
}

// Function to check if error requires wallet reconnection
export function requiresReconnection(error: unknown): boolean {
  if (error instanceof AppError) {
    return [
      ErrorType.WALLET_NOT_CONNECTED,
      ErrorType.WRONG_NETWORK,
    ].includes(error.type);
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('not connected') || 
           message.includes('wrong network') ||
           message.includes('account changed');
  }
  
  return false;
}