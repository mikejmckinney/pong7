#!/usr/bin/env node
/**
 * Connection Validation Script
 * Tests connectivity to backend server and Supabase database
 * 
 * Usage:
 *   node scripts/validate-connections.js
 *   npm run validate:connections
 */

const https = require('https');
const http = require('http');

// Configuration - uses environment variables with fallbacks matching js/config.js
// Note: API key is also stored in js/config.js which is required for the frontend
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'https://pong7.onrender.com',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://sjeyisealyvavzjrdcgf.supabase.co',
  // Supabase publishable key - safe to expose (read-only access via RLS)
  // This matches the key in js/config.js for consistency
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || require('../js/config.js').SUPABASE_ANON_KEY || ''
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(name, success, details = '') {
  const icon = success ? '✓' : '✗';
  const color = success ? 'green' : 'red';
  log(`  ${icon} ${name}${details ? ': ' + details : ''}`, color);
}

/**
 * Make an HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    
    const req = lib.get(url, {
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    // Set timeout after creating the request
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * Test 1: Backend Server Health Check
 */
async function testBackendHealth() {
  log('\n📡 Testing Backend Server...', 'cyan');
  log(`   URL: ${CONFIG.BACKEND_URL}`, 'yellow');
  
  try {
    const response = await makeRequest(CONFIG.BACKEND_URL);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      logResult('Health endpoint', true, `Status: ${data.status || 'running'}`);
      
      if (data.players !== undefined) {
        logResult('Players online', true, data.players.toString());
      }
      if (data.rooms !== undefined) {
        logResult('Active rooms', true, data.rooms.toString());
      }
      if (data.queue !== undefined) {
        logResult('Queue size', true, data.queue.toString());
      }
      
      return { success: true, data };
    } else {
      logResult('Health endpoint', false, `HTTP ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    logResult('Health endpoint', false, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Backend API - Leaderboard Endpoint
 */
async function testBackendLeaderboard() {
  log('\n📊 Testing Backend Leaderboard API...', 'cyan');
  
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/leaderboard`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      logResult('Leaderboard endpoint', true, `${Array.isArray(data) ? data.length : 0} entries`);
      return { success: true, data };
    } else if (response.statusCode === 503) {
      logResult('Leaderboard endpoint', false, 'Database not configured on server');
      return { success: false, error: 'Database not configured' };
    } else {
      logResult('Leaderboard endpoint', false, `HTTP ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    logResult('Leaderboard endpoint', false, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Supabase Direct Connection (REST API)
 */
async function testSupabaseConnection() {
  log('\n🗄️  Testing Supabase Database...', 'cyan');
  log(`   URL: ${CONFIG.SUPABASE_URL}`, 'yellow');
  
  try {
    // Test the health endpoint
    const healthUrl = `${CONFIG.SUPABASE_URL}/rest/v1/`;
    const response = await makeRequest(healthUrl, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      // 404 is expected for root endpoint, it means the server is responding
      logResult('Supabase REST API', true, 'Connection established');
      
      // Try to query leaderboard view
      const leaderboardUrl = `${CONFIG.SUPABASE_URL}/rest/v1/leaderboard?limit=5`;
      const lbResponse = await makeRequest(leaderboardUrl, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      });
      
      if (lbResponse.statusCode === 200) {
        const data = JSON.parse(lbResponse.body);
        logResult('Leaderboard view', true, `${data.length} entries found`);
        return { success: true, data };
      } else if (lbResponse.statusCode === 404) {
        logResult('Leaderboard view', false, 'View not found - run database migrations');
        return { success: false, error: 'Leaderboard view not found' };
      } else {
        logResult('Leaderboard view', false, `HTTP ${lbResponse.statusCode}`);
        return { success: false, error: `HTTP ${lbResponse.statusCode}` };
      }
    } else if (response.statusCode === 401) {
      logResult('Supabase REST API', false, 'Invalid API key');
      return { success: false, error: 'Invalid API key' };
    } else {
      logResult('Supabase REST API', false, `HTTP ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    logResult('Supabase REST API', false, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Check if database tables exist
 */
async function testDatabaseTables() {
  log('\n📋 Testing Database Tables...', 'cyan');
  
  const tables = ['players', 'player_stats', 'matches'];
  const results = {};
  
  for (const table of tables) {
    try {
      const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}?limit=1`;
      const response = await makeRequest(url, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        logResult(`Table: ${table}`, true, `${data.length} sample records`);
        results[table] = { success: true };
      } else if (response.statusCode === 404) {
        logResult(`Table: ${table}`, false, 'Not found');
        results[table] = { success: false, error: 'Not found' };
      } else {
        logResult(`Table: ${table}`, false, `HTTP ${response.statusCode}`);
        results[table] = { success: false, error: `HTTP ${response.statusCode}` };
      }
    } catch (error) {
      logResult(`Table: ${table}`, false, error.message);
      results[table] = { success: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Main validation runner
 */
async function runValidation() {
  log('\n' + '='.repeat(50), 'bold');
  log('🎮 Pong7 Connection Validation', 'bold');
  log('='.repeat(50), 'bold');
  
  const results = {
    backend: { health: null, leaderboard: null },
    supabase: { connection: null, tables: null }
  };
  
  // Run all tests
  results.backend.health = await testBackendHealth();
  results.backend.leaderboard = await testBackendLeaderboard();
  results.supabase.connection = await testSupabaseConnection();
  results.supabase.tables = await testDatabaseTables();
  
  // Summary
  log('\n' + '='.repeat(50), 'bold');
  log('📝 Summary', 'bold');
  log('='.repeat(50), 'bold');
  
  const backendOk = results.backend.health.success;
  const dbConnected = results.supabase.connection.success;
  const tablesOk = results.supabase.tables && 
    Object.values(results.supabase.tables).every(t => t.success);
  
  log(`\n  Backend Server: ${backendOk ? '✓ Online' : '✗ Offline'}`, backendOk ? 'green' : 'red');
  log(`  Database Connection: ${dbConnected ? '✓ Connected' : '✗ Failed'}`, dbConnected ? 'green' : 'red');
  log(`  Database Tables: ${tablesOk ? '✓ All present' : '✗ Missing tables'}`, tablesOk ? 'green' : 'red');
  
  if (!tablesOk && dbConnected) {
    log('\n⚠️  To create missing tables, run the migration:', 'yellow');
    log('   supabase db push', 'yellow');
    log('   Or run the SQL in supabase/migrations/ via Supabase SQL Editor', 'yellow');
  }
  
  const allPassed = backendOk && dbConnected && tablesOk;
  log(`\n${allPassed ? '✅ All connections validated!' : '❌ Some connections failed'}`, allPassed ? 'green' : 'red');
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run validation
runValidation().catch(error => {
  log(`\n❌ Validation failed with error: ${error.message}`, 'red');
  process.exit(1);
});
