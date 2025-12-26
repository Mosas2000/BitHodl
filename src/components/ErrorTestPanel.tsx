import { useState } from 'react';
import { runErrorTests, errorTester } from '@/utils/errorTesting';
import { TestResult } from '@/utils/errorTesting';

interface ErrorTestPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ErrorTestPanel({ isVisible, onClose }: ErrorTestPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [report, setReport] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runErrorTests();
      setResults(testResults.results);
      setReport(testResults.report);
    } catch (error) {
      console.error('Failed to run error tests:', error);
      setReport(`Failed to run tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setReport('');
    errorTester.clearTestResults();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Error Handling Test Suite
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Error Tests'}
            </button>
          </div>

          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Test Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.summary.passRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
                  </div>
                </div>
              </div>

              {/* Test Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Message Tests */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Error Messages</h4>
                  <div className="space-y-2">
                    {results.messageTests.map((test: TestResult, index: number) => (
                      <TestResultItem key={index} test={test} />
                    ))}
                  </div>
                </div>

                {/* Network Tests */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Network Detection</h4>
                  <div className="space-y-2">
                    {results.networkTests.map((test: TestResult, index: number) => (
                      <TestResultItem key={index} test={test} />
                    ))}
                  </div>
                </div>

                {/* Wallet Tests */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Wallet Monitoring</h4>
                  <div className="space-y-2">
                    {results.walletTests.map((test: TestResult, index: number) => (
                      <TestResultItem key={index} test={test} />
                    ))}
                  </div>
                </div>

                {/* Boundary Tests */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Error Boundaries</h4>
                  <div className="space-y-2">
                    {results.boundaryTests.map((test: TestResult, index: number) => (
                      <TestResultItem key={index} test={test} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Report */}
              {report && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Report</h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {report}
                  </pre>
                </div>
              )}
            </div>
          )}

          {isRunning && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Running error tests...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestResultItem({ test }: { test: TestResult }) {
  return (
    <div className={`p-3 rounded-lg border ${test.passed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${test.passed ? 'bg-green-500' : 'bg-red-500'}`}>
            {test.passed ? (
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M2.5 4L3.5 5L5.5 3L6 3.5L3.5 6L2 4.5L2.5 4Z" />
              </svg>
            ) : (
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {test.scenario.name}
          </span>
        </div>
        {!test.passed && (
          <div className="text-xs text-red-600 dark:text-red-400">
            Failed
          </div>
        )}
      </div>
      
      {!test.passed && test.error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          Error: {test.error}
        </div>
      )}
      
      {test.actualMessage && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {test.actualMessage}
        </div>
      )}
    </div>
  );
}