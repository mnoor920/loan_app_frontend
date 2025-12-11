// Database setup verification service
import { supabaseAdmin } from './supabase';

export interface TableCheckResult {
  allTablesExist: boolean;
  missingTables: string[];
  setupRequired: boolean;
  existingTables: string[];
}

export interface SetupInstructions {
  title: string;
  description: string;
  steps: string[];
  sqlScript?: string;
}

export class DatabaseSetupService {
  private requiredTables = [
    'user_activation_profiles',
    'user_documents',
    'activation_audit_log',
    'user_notifications',
    'admin_modification_log'
  ];

  private essentialTables = [
    'user_activation_profiles'
  ];

  /**
   * Check if required tables exist in the database
   */
  async checkRequiredTables(): Promise<TableCheckResult> {
    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    try {
      // Check each table by attempting a simple query
      const existingTables: string[] = [];
      const missingTables: string[] = [];

      for (const tableName of this.requiredTables) {
        try {
          // Try to query the table with a limit of 0 to check existence
          const { error } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(0);

          if (error) {
            // If error contains "does not exist" or similar, table is missing
            if (error.message.includes('does not exist') || 
                error.message.includes('relation') ||
                error.code === 'PGRST106') {
              missingTables.push(tableName);
            } else {
              // Table exists but there might be other issues
              existingTables.push(tableName);
            }
          } else {
            // No error means table exists
            existingTables.push(tableName);
          }
        } catch (tableError: any) {
          console.error(`Error checking table ${tableName}:`, tableError);
          missingTables.push(tableName);
        }
      }

      const allTablesExist = missingTables.length === 0;
      const setupRequired = missingTables.some(table => 
        this.essentialTables.includes(table)
      );

      return {
        allTablesExist,
        missingTables,
        setupRequired,
        existingTables
      };
    } catch (error: any) {
      console.error('Database setup check failed:', error);
      throw new Error(`Database setup verification failed: ${error.message}`);
    }
  }

  /**
   * Check if essential tables exist (minimum required for basic functionality)
   */
  async checkEssentialTables(): Promise<boolean> {
    if (!supabaseAdmin) {
      return false;
    }

    try {
      // Check each essential table by attempting a simple query
      for (const tableName of this.essentialTables) {
        try {
          const { error } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(0);

          if (error && (error.message.includes('does not exist') || 
                       error.message.includes('relation') ||
                       error.code === 'PGRST106')) {
            return false;
          }
        } catch (tableError) {
          console.error(`Essential table ${tableName} check failed:`, tableError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Essential tables check failed:', error);
      return false;
    }
  }

  /**
   * Validate the structure of existing tables
   */
  async validateTableStructure(tableName: string): Promise<boolean> {
    if (!supabaseAdmin) {
      return false;
    }

    try {
      // For now, just check if the table exists and is accessible
      // We can't easily check column structure through Supabase REST API
      const { error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(0);

      return !error || (!error.message.includes('does not exist') && 
                       !error.message.includes('relation') &&
                       error.code !== 'PGRST106');
    } catch (error) {
      console.error(`Table structure validation failed for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Get setup instructions based on missing tables
   */
  getSetupInstructions(missingTables: string[]): SetupInstructions {
    if (missingTables.length === 0) {
      return {
        title: 'Database Setup Complete',
        description: 'All required tables are properly configured.',
        steps: ['No action required - your database is ready to use.']
      };
    }

    const isEssentialMissing = missingTables.some(table => 
      this.essentialTables.includes(table)
    );

    if (isEssentialMissing) {
      return {
        title: 'Critical Database Setup Required',
        description: 'Essential tables are missing. The admin dashboard cannot function without these tables.',
        steps: [
          'Open Supabase SQL Editor in your dashboard',
          'Copy and paste the minimal schema SQL',
          'Execute the SQL to create required tables',
          'Refresh the admin dashboard to verify the fix',
          'Contact support if issues persist'
        ],
        sqlScript: this.getMinimalSetupSQL()
      };
    }

    return {
      title: 'Optional Database Setup',
      description: 'Some optional tables are missing. Basic functionality will work, but some features may be limited.',
      steps: [
        'Review which tables are missing',
        'Decide if you need the additional functionality',
        'Run the complete database schema if needed',
        'Or continue with basic functionality'
      ]
    };
  }

  /**
   * Get expected columns for a table
   */
  private getExpectedColumns(tableName: string): string[] {
    const columnMap: Record<string, string[]> = {
      'user_activation_profiles': [
        'id', 'user_id', 'full_name', 'activation_status', 
        'current_step', 'completed_at', 'created_at', 'updated_at'
      ],
      'user_documents': [
        'id', 'user_id', 'activation_profile_id', 'document_type',
        'file_path', 'verification_status', 'created_at'
      ],
      'user_notifications': [
        'id', 'user_id', 'type', 'title', 'message', 'read', 'created_at'
      ]
    };

    return columnMap[tableName] || [];
  }

  /**
   * Get minimal setup SQL for essential tables
   */
  private getMinimalSetupSQL(): string {
    return `
-- Minimal Database Schema for Admin Dashboard
CREATE TABLE IF NOT EXISTS user_activation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
  current_step INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id ON user_activation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status ON user_activation_profiles(activation_status);
    `.trim();
  }

  /**
   * Test database connection and basic functionality
   */
  async testDatabaseConnection(): Promise<boolean> {
    if (!supabaseAdmin) {
      return false;
    }

    try {
      // Try to query the users table which should always exist
      const { error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseSetup = new DatabaseSetupService();

// Export utility functions
export const checkDatabaseSetup = () => databaseSetup.checkRequiredTables();
export const checkEssentialTables = () => databaseSetup.checkEssentialTables();
export const getSetupInstructions = (missingTables: string[]) => 
  databaseSetup.getSetupInstructions(missingTables);