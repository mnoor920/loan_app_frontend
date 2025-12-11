// Database Setup Verification Service
// This service checks if all required tables exist and creates them if needed

import { supabaseAdmin } from './supabase';

interface TableCheck {
  name: string;
  exists: boolean;
  error?: string;
}

interface DatabaseHealth {
  isHealthy: boolean;
  tables: TableCheck[];
  missingTables: string[];
  errors: string[];
}

// List of required tables for the loan approval system
const REQUIRED_TABLES = [
  'users',
  'loan_applications', 
  'user_activation_profiles',
  'admin_modifications',
  'user_notifications'
];

// List of required functions
const REQUIRED_FUNCTIONS = [
  'calculate_loan_payments',
  'log_admin_modification',
  'update_updated_at_column',
  'update_loan_calculations'
];

/**
 * Check if a specific table exists in the database
 */
export async function checkTableExists(tableName: string): Promise<TableCheck> {
  try {
    if (!supabaseAdmin) {
      return {
        name: tableName,
        exists: false,
        error: 'Supabase admin client not available'
      };
    }

    // Try to query the table with a limit of 0 to check existence
    const { error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(0);

    return {
      name: tableName,
      exists: !error,
      error: error?.message
    };
  } catch (error: any) {
    return {
      name: tableName,
      exists: false,
      error: error.message
    };
  }
}

/**
 * Check if a specific function exists in the database
 */
export async function checkFunctionExists(functionName: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      return false;
    }

    const { data, error } = await supabaseAdmin
      .rpc('pg_get_functiondef', { funcid: `${functionName}()` });

    return !error && data !== null;
  } catch (error) {
    // Function doesn't exist or other error
    return false;
  }
}

/**
 * Perform comprehensive database health check
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const tableChecks: TableCheck[] = [];
  const errors: string[] = [];

  // Check all required tables
  for (const tableName of REQUIRED_TABLES) {
    const check = await checkTableExists(tableName);
    tableChecks.push(check);
    
    if (!check.exists && check.error) {
      errors.push(`Table ${tableName}: ${check.error}`);
    }
  }

  const missingTables = tableChecks
    .filter(check => !check.exists)
    .map(check => check.name);

  const isHealthy = missingTables.length === 0 && errors.length === 0;

  return {
    isHealthy,
    tables: tableChecks,
    missingTables,
    errors
  };
}

/**
 * Create missing tables by executing the schema script
 */
export async function createMissingTables(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase admin client not available'
      };
    }

    // Read the schema file content
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'lib', 'loan-approval-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      return {
        success: false,
        error: 'Schema file not found at lib/loan-approval-schema.sql'
      };
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      return {
        success: false,
        error: `Failed to execute schema: ${error.message}`
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Error creating tables: ${error.message}`
    };
  }
}

/**
 * Get setup instructions for manual database setup
 */
export function getSetupInstructions(): string {
  return `
To fix the loan approval system, please run the following SQL script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of: loan-app/lib/loan-approval-schema.sql
5. Run the query

This will create all required tables and functions for the loan approval system.

Required tables:
${REQUIRED_TABLES.map(table => `- ${table}`).join('\n')}

Required functions:
${REQUIRED_FUNCTIONS.map(func => `- ${func}`).join('\n')}
  `.trim();
}

/**
 * Validate loan application data structure
 */
export async function validateLoanApplicationStructure(): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    if (!supabaseAdmin) {
      issues.push('Supabase admin client not available');
      return { valid: false, issues };
    }

    // Check if loan_applications table has required columns
    const { data, error } = await supabaseAdmin
      .from('loan_applications')
      .select('id, user_id, loan_amount, duration_months, interest_rate, status, application_date')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        issues.push('loan_applications table does not exist');
      } else {
        issues.push(`Error accessing loan_applications table: ${error.message}`);
      }
    }

    // Check if users table exists and has proper relationship
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .limit(1);

    if (usersError) {
      if (usersError.message.includes('relation') && usersError.message.includes('does not exist')) {
        issues.push('users table does not exist');
      } else {
        issues.push(`Error accessing users table: ${usersError.message}`);
      }
    }

  } catch (error: any) {
    issues.push(`Validation error: ${error.message}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Auto-setup database if possible
 */
export async function autoSetupDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // First check current health
    const health = await checkDatabaseHealth();
    
    if (health.isHealthy) {
      return {
        success: true,
        message: 'Database is already properly configured'
      };
    }

    // Try to create missing tables
    const createResult = await createMissingTables();
    
    if (!createResult.success) {
      return {
        success: false,
        message: `Auto-setup failed: ${createResult.error}\n\n${getSetupInstructions()}`
      };
    }

    // Verify setup worked
    const newHealth = await checkDatabaseHealth();
    
    if (newHealth.isHealthy) {
      return {
        success: true,
        message: 'Database setup completed successfully'
      };
    } else {
      return {
        success: false,
        message: `Setup partially completed. Missing: ${newHealth.missingTables.join(', ')}\n\n${getSetupInstructions()}`
      };
    }

  } catch (error: any) {
    return {
      success: false,
      message: `Auto-setup error: ${error.message}\n\n${getSetupInstructions()}`
    };
  }
}

/**
 * Middleware function to check database health before loan operations
 */
export async function ensureDatabaseReady(): Promise<{ ready: boolean; error?: string; instructions?: string }> {
  const health = await checkDatabaseHealth();
  
  if (health.isHealthy) {
    return { ready: true };
  }

  return {
    ready: false,
    error: `Database not ready. Missing tables: ${health.missingTables.join(', ')}`,
    instructions: getSetupInstructions()
  };
}