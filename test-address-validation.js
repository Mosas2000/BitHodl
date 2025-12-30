// Test script to verify address validation functions
// This can be run in the browser console or Node.js

// Import the validation functions (adjust path as needed)
// For browser console, these would be available through the app's global scope
// For Node.js, you would need to import from the utils file

// Test cases for address validation
const testCases = [
  {
    name: 'Valid Stacks Address (SP)',
    address: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T',
    expected: { isValidStacks: true, isBitcoin: false }
  },
  {
    name: 'Valid Stacks Address (ST)',
    address: 'ST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678',
    expected: { isValidStacks: true, isBitcoin: false }
  },
  {
    name: 'Invalid Stacks Address (too short)',
    address: 'SP123',
    expected: { isValidStacks: false, isBitcoin: false }
  },
  {
    name: 'Bitcoin Address (bc1)',
    address: 'bc1qp32afzjnyqgq7x53htj4k29nme99c2s8k7e5nn',
    expected: { isValidStacks: false, isBitcoin: true }
  },
  {
    name: 'Bitcoin Address (1)',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    expected: { isValidStacks: false, isBitcoin: true }
  },
  {
    name: 'Bitcoin Address (3)',
    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    expected: { isValidStacks: false, isBitcoin: true }
  },
  {
    name: 'Empty Address',
    address: '',
    expected: { isValidStacks: false, isBitcoin: false }
  },
  {
    name: 'Null Address',
    address: null,
    expected: { isValidStacks: false, isBitcoin: false }
  }
];

// Validation functions (copied from utils/stacks.ts)
function validateStacksAddress(address) {
  if (!address) return false;
  
  // Stacks addresses start with 'SP' or 'ST' and are typically 41-42 characters long
  const stacksAddressRegex = /^(SP|ST)[A-Za-z0-9]{38,40}$/;
  return stacksAddressRegex.test(address);
}

function isBitcoinAddress(address) {
  if (!address) return false;
  
  // Bitcoin addresses can start with '1', '3', or 'bc1'
  const bitcoinAddressRegex = /^(1|3|bc1)[A-Za-z0-9]{25,87}$/;
  return bitcoinAddressRegex.test(address);
}

// Run tests
console.log('Running address validation tests...\n');

testCases.forEach((testCase, index) => {
  const { name, address, expected } = testCase;
  
  const isValidStacks = validateStacksAddress(address);
  const isBitcoin = isBitcoinAddress(address);
  
  const stacksPassed = isValidStacks === expected.isValidStacks;
  const bitcoinPassed = isBitcoin === expected.isBitcoin;
  const allPassed = stacksPassed && bitcoinPassed;
  
  console.log(`Test ${index + 1}: ${name}`);
  console.log(`  Address: ${address || 'null/empty'}`);
  console.log(`  Expected: Stacks=${expected.isValidStacks}, Bitcoin=${expected.isBitcoin}`);
  console.log(`  Actual:   Stacks=${isValidStacks}, Bitcoin=${isBitcoin}`);
  console.log(`  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

console.log('Address validation tests completed.');
console.log('\nIf you see this in the browser console after connecting a wallet,');
console.log('check the logs to see if the address validation is working correctly.');