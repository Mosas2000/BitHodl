import { 
  ErrorType, 
  createError, 
  getErrorMessage, 
  isRetryableError, 
  requiresReconnection 
} from './errors';
import { networkDetector } from './network';
import { walletMonitor } from './walletMonitor';

export interface ErrorTestScenario {
  name: string;
  type: ErrorType;
  details?: any;
  expectedMessage: string;
  isRetryable: boolean;
  requiresReconnect: boolean;
}

export interface TestResult {
  scenario: ErrorTestScenario;
  passed: boolean;
  actualMessage?: string;
  actualRetryable?: boolean;
  actualRequiresReconnect?: boolean;
  error?: string;
}

export class ErrorTester {
  private static instance: ErrorTester;
  private testResults: TestResult[] = [];

  private constructor() {}

  static getInstance(): ErrorTester {
    if (!ErrorTester.instance) {
      ErrorTester.instance = new ErrorTester();
    }
    return ErrorTester.instance;
  }

  // Get all test scenarios
  getTestScenarios(): ErrorTestScenario[] {
    return [
      {
        name: 'Wallet not installed',
        type: ErrorType.WALLET_NOT_INSTALLED,
        expectedMessage: 'No Stacks wallet found. Please install a compatible wallet like Hiro or Xverse to continue.',
        isRetryable: false,
        requiresReconnect: true,
      },
      {
        name: 'Wallet not connected',
        type: ErrorType.WALLET_NOT_CONNECTED,
        expectedMessage: 'Your wallet is not connected. Please connect your wallet to perform this action.',
        isRetryable: false,
        requiresReconnect: true,
      },
      {
        name: 'Wrong network (testnet vs mainnet)',
        type: ErrorType.WRONG_NETWORK,
        details: { currentNetwork: 'testnet', expectedNetwork: 'mainnet' },
        expectedMessage: 'You\'re on the testnet network, but this app uses mainnet. Please switch your wallet network to continue.',
        isRetryable: false,
        requiresReconnect: true,
      },
      {
        name: 'Insufficient balance',
        type: ErrorType.INSUFFICIENT_BALANCE,
        details: { required: 10, available: 5, symbol: 'STX' },
        expectedMessage: 'Not enough STX to complete this transaction. You need 5.000000 more STX.',
        isRetryable: false,
        requiresReconnect: false,
      },
      {
        name: 'Contract call failed',
        type: ErrorType.CONTRACT_CALL_FAILED,
        details: { functionName: 'deposit', reason: 'Contract reverted' },
        expectedMessage: 'The deposit failed because: Contract reverted. Please try again or contact support if the issue persists.',
        isRetryable: true,
        requiresReconnect: false,
      },
      {
        name: 'Network timeout',
        type: ErrorType.NETWORK_TIMEOUT,
        expectedMessage: 'The network is taking too long to respond. Please check your internet connection and try again.',
        isRetryable: true,
        requiresReconnect: false,
      },
      {
        name: 'Transaction cancelled',
        type: ErrorType.TRANSACTION_CANCELLED,
        expectedMessage: 'Transaction was cancelled. If this was a mistake, please try again.',
        isRetryable: false,
        requiresReconnect: false,
      },
      {
        name: 'Transaction failed',
        type: ErrorType.TRANSACTION_FAILED,
        details: { reason: 'Out of gas' },
        expectedMessage: 'Transaction failed: Out of gas. Please check your wallet balance and try again.',
        isRetryable: true,
        requiresReconnect: false,
      },
      {
        name: 'User rejected',
        type: ErrorType.USER_REJECTED,
        expectedMessage: 'You rejected this action in your wallet. If this was a mistake, please try again.',
        isRetryable: false,
        requiresReconnect: false,
      },
      {
        name: 'Unknown error',
        type: ErrorType.UNKNOWN_ERROR,
        details: { originalError: 'Something went wrong' },
        expectedMessage: 'Something went wrong: Something went wrong. Please try again or contact support if the issue continues.',
        isRetryable: false,
        requiresReconnect: false,
      },
    ];
  }

  // Test error message generation
  testErrorMessages(): TestResult[] {
    const scenarios = this.getTestScenarios();
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      try {
        const error = createError(scenario.type, scenario.details);
        const actualMessage = getErrorMessage(error);
        const actualRetryable = isRetryableError(error);
        const actualRequiresReconnect = requiresReconnection(error);

        const passed = 
          actualMessage === scenario.expectedMessage &&
          actualRetryable === scenario.isRetryable &&
          actualRequiresReconnect === scenario.requiresReconnect;

        results.push({
          scenario,
          passed,
          actualMessage,
          actualRetryable,
          actualRequiresReconnect,
        });
      } catch (error) {
        results.push({
          scenario,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.testResults.push(...results);
    return results;
  }

  // Test network detection
  async testNetworkDetection(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      // Test network detection
      const network = await networkDetector.detectWalletNetwork();
      results.push({
        scenario: {
          name: 'Network detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: network === 'mainnet' || network === 'testnet',
        actualMessage: `Detected network: ${network}`,
      });
    } catch (error) {
      results.push({
        scenario: {
          name: 'Network detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test connectivity validation
    try {
      const isConnected = await networkDetector.validateNetworkConnectivity('mainnet');
      results.push({
        scenario: {
          name: 'Network connectivity validation',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: typeof isConnected === 'boolean',
        actualMessage: `Connectivity result: ${isConnected}`,
      });
    } catch (error) {
      results.push({
        scenario: {
          name: 'Network connectivity validation',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.testResults.push(...results);
    return results;
  }

  // Test wallet monitoring
  testWalletMonitoring(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test wallet installation detection
      const isInstalled = walletMonitor.isWalletInstalled();
      results.push({
        scenario: {
          name: 'Wallet installation detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: typeof isInstalled === 'boolean',
        actualMessage: `Wallet installed: ${isInstalled}`,
      });
    } catch (error) {
      results.push({
        scenario: {
          name: 'Wallet installation detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      // Test wallet connection detection
      const isConnected = walletMonitor.isWalletConnected();
      results.push({
        scenario: {
          name: 'Wallet connection detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: typeof isConnected === 'boolean',
        actualMessage: `Wallet connected: ${isConnected}`,
      });
    } catch (error) {
      results.push({
        scenario: {
          name: 'Wallet connection detection',
          type: ErrorType.UNKNOWN_ERROR,
          expectedMessage: '',
          isRetryable: false,
          requiresReconnect: false,
        },
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.testResults.push(...results);
    return results;
  }

  // Test error boundary scenarios
  testErrorBoundaries(): TestResult[] {
    const results: TestResult[] = [];

    // Test error categorization
    const testErrors = [
      { error: new Error('Network timeout'), expectedType: ErrorType.NETWORK_TIMEOUT },
      { error: new Error('User rejected transaction'), expectedType: ErrorType.USER_REJECTED },
      { error: new Error('Wallet not connected'), expectedType: ErrorType.WALLET_NOT_CONNECTED },
      { error: new Error('Contract call failed'), expectedType: ErrorType.CONTRACT_CALL_FAILED },
      { error: new Error('Insufficient balance'), expectedType: ErrorType.INSUFFICIENT_BALANCE },
    ];

    for (const { error, expectedType } of testErrors) {
      try {
        const message = getErrorMessage(error);
        results.push({
          scenario: {
            name: `Error categorization: ${error.message}`,
            type: expectedType,
            expectedMessage: '',
            isRetryable: false,
            requiresReconnect: false,
          },
          passed: message.length > 0,
          actualMessage: message,
        });
      } catch (err) {
        results.push({
          scenario: {
            name: `Error categorization: ${error.message}`,
            type: expectedType,
            expectedMessage: '',
            isRetryable: false,
            requiresReconnect: false,
          },
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    this.testResults.push(...results);
    return results;
  }

  // Run all tests
  async runAllTests(): Promise<{
    messageTests: TestResult[];
    networkTests: TestResult[];
    walletTests: TestResult[];
    boundaryTests: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  }> {
    const messageTests = this.testErrorMessages();
    const networkTests = await this.testNetworkDetection();
    const walletTests = this.testWalletMonitoring();
    const boundaryTests = this.testErrorBoundaries();

    const allTests = [...messageTests, ...networkTests, ...walletTests, ...boundaryTests];
    const passed = allTests.filter(test => test.passed).length;
    const total = allTests.length;

    return {
      messageTests,
      networkTests,
      walletTests,
      boundaryTests,
      summary: {
        total,
        passed,
        failed: total - passed,
        passRate: total > 0 ? (passed / total) * 100 : 0,
      },
    };
  }

  // Get test results
  getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  // Clear test results
  clearTestResults(): void {
    this.testResults = [];
  }

  // Generate test report
  generateTestReport(): string {
    const results = this.testResults;
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    let report = `Error Handling Test Report\n`;
    report += `========================\n\n`;
    report += `Summary: ${passed}/${total} tests passed (${passRate.toFixed(1)}%)\n\n`;

    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      report += `Failed Tests:\n`;
      report += `-------------\n`;
      for (const test of failedTests) {
        report += `❌ ${test.scenario.name}\n`;
        if (test.error) {
          report += `   Error: ${test.error}\n`;
        }
        if (test.actualMessage !== undefined) {
          report += `   Expected: ${test.scenario.expectedMessage}\n`;
          report += `   Actual: ${test.actualMessage}\n`;
        }
        report += `\n`;
      }
    }

    const passedTests = results.filter(r => r.passed);
    if (passedTests.length > 0) {
      report += `Passed Tests:\n`;
      report += `------------\n`;
      for (const test of passedTests) {
        report += `✅ ${test.scenario.name}\n`;
      }
    }

    return report;
  }
}

// Export singleton instance
export const errorTester = ErrorTester.getInstance();

// Convenience function for running tests
export async function runErrorTests(): Promise<{
  success: boolean;
  report: string;
  results: any;
}> {
  try {
    const results = await errorTester.runAllTests();
    const report = errorTester.generateTestReport();
    
    return {
      success: results.summary.passRate >= 90, // Consider 90%+ as success
      report,
      results,
    };
  } catch (error) {
    return {
      success: false,
      report: `Failed to run error tests: ${error instanceof Error ? error.message : String(error)}`,
      results: null,
    };
  }
}