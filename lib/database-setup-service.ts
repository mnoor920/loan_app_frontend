import { supabaseAdmin } from './supabase'

export interface TableCheckResult {
  allTablesExist: boolean
  missingTables: string[]
  setupRequired: boolean
}

export interface SetupInstructions {
  title: string
  description: string
  steps: string[]
  scriptPath?: string
  sqlCommands?: string[]
}

export interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Database Setup Verification Service
 * 
 * This service checks for required database tables and provides setup instructions
 * when tables are missing. It helps ensure the admin dashboard functions correctly
 * by verifying the database schema is properly configured.
 */
export class DatabaseSetupService {
  private static instance: DatabaseSetupService
  
  // Required tables for the admin dashboard to function properly
  private readonly requiredTables = [
    'users',
    'loans', 
    'user_activation_profiles',
    'user_documents',
    'activation_audit_log',
    'document_access_log',
    'user_notifications',
    'admin_modification_log'
  ]

  private constructor() {}

  public static getInstance(): DatabaseSetupService {
    if (!DatabaseSetupService.instance) {
      DatabaseSetupService.instance = new DatabaseSetupService()
    }
    return DatabaseSetupService.instance
  }

  /**
   * Check if all required tables exist in the database
   */
  async checkRequiredTables(): Promise<TableCheckResult> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available. Check SUPABASE_SERVICE_ROLE_KEY environment variable.')
      }

      // Query information_schema to check for table existence
      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', this.requiredTables)

      if (error) {
        throw new Error(`Failed to check database tables: ${error.message}`)
      }

      const existingTables = data?.map(row => row.table_name) || []
      const missingTables = this.requiredTables.filter(table => !existingTables.includes(table))
      
      return {
        allTablesExist: missingTables.length === 0,
        missingTables,
        setupRequired: missingTables.length > 0
      }
    } catch (error) {
      // If we can't check tables, assume setup is required
      console.error('Error checking database tables:', error)
      return {
        allTablesExist: false,
        missingTables: this.requiredTables,
        setupRequired: true
      }
    }
  }

  /**
   * Get setup instructions based on missing tables
   */
  getSetupInstructions(missingTables?: string[]): SetupInstructions {
    const allMissing = !missingTables || missingTables.length === this.requiredTables.length
    
    if (allMissing) {
      return {
        title: 'Database Setup Required',
        description: 'The database schema is not set up. Please run the setup script to create all required tables.',
        steps: [
          'Open Supabase SQL Editor in your project dashboard',
          'Copy and paste the contents of lib/database-schema.sql',
          'Execute the SQL script to create all tables and functions',
          'Refresh this page to verify the setup'
        ],
        scriptPath: 'lib/database-schema.sql',
        sqlCommands: [
          'Execute the complete database-schema.sql file in Supabase SQL Editor'
        ]
      }
    }

    // Partial setup - some tables missing
    const tableDescriptions: Record<string, string> = {
      'users': 'Core user accounts table',
      'loans': 'Loan applications and records table', 
      'user_activation_profiles': 'User activation and profile data table',
      'user_documents': 'Document attachments table',
      'activation_audit_log': 'Activation process audit log table',
      'document_access_log': 'Document access tracking table',
      'user_notifications': 'User notification system table',
      'admin_modification_log': 'Admin modification tracking table'
    }

    const missingDescriptions = missingTables?.map(table => 
      `• ${table}: ${tableDescriptions[table] || 'Required system table'}`
    ).join('\n') || ''

    return {
      title: 'Incomplete Database Setup',
      description: `Some required tables are missing from your database:\n\n${missingDescriptions}`,
      steps: [
        'Open Supabase SQL Editor in your project dashboard',
        'Copy and paste the contents of lib/database-schema.sql',
        'Execute the SQL script to create missing tables',
        'Alternatively, run the specific CREATE TABLE commands for missing tables',
        'Refresh this page to verify the setup'
      ],
      scriptPath: 'lib/database-schema.sql'
    }
  }

  /**
   * Validate the database schema structure
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      if (!supabaseAdmin) {
        errors.push('Supabase admin client not available')
        return { isValid: false, errors, warnings }
      }

      const tableCheck = await this.checkRequiredTables()
      
      if (!tableCheck.allTablesExist) {
        errors.push(`Missing required tables: ${tableCheck.missingTables.join(', ')}`)
      }

      // Check for critical tables that are absolutely required
      const criticalTables = ['users', 'loans']
      const missingCritical = tableCheck.missingTables.filter(table => 
        criticalTables.includes(table)
      )
      
      if (missingCritical.length > 0) {
        errors.push(`Critical tables missing: ${missingCritical.join(', ')}. The application cannot function without these.`)
      }

      // Check for activation-related tables
      const activationTables = ['user_activation_profiles', 'user_documents']
      const missingActivation = tableCheck.missingTables.filter(table => 
        activationTables.includes(table)
      )
      
      if (missingActivation.length > 0) {
        warnings.push(`Activation system tables missing: ${missingActivation.join(', ')}. User activation features will not work.`)
      }

      // Check for audit/logging tables
      const auditTables = ['activation_audit_log', 'document_access_log', 'admin_modification_log']
      const missingAudit = tableCheck.missingTables.filter(table => 
        auditTables.includes(table)
      )
      
      if (missingAudit.length > 0) {
        warnings.push(`Audit logging tables missing: ${missingAudit.join(', ')}. Audit trails will not be recorded.`)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors, warnings }
    }
  }

  /**
   * Get a summary of the database setup status
   */
  async getSetupStatus(): Promise<{
    isSetup: boolean
    tableStatus: TableCheckResult
    setupInstructions?: SetupInstructions
    validation: SchemaValidationResult
  }> {
    const tableStatus = await this.checkRequiredTables()
    const validation = await this.validateSchema()
    
    const setupInstructions = tableStatus.setupRequired 
      ? this.getSetupInstructions(tableStatus.missingTables)
      : undefined

    return {
      isSetup: tableStatus.allTablesExist && validation.isValid,
      tableStatus,
      setupInstructions,
      validation
    }
  }

  /**
   * Check if a specific table exists
   */
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        return false
      }

      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  /**
   * Get list of existing tables in the public schema
   */
  async getExistingTables(): Promise<string[]> {
    try {
      if (!supabaseAdmin) {
        return []
      }

      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (error) {
        console.error('Error fetching existing tables:', error)
        return []
      }

      return data?.map(row => row.table_name) || []
    } catch (error) {
      console.error('Error fetching existing tables:', error)
      return []
    }
  }
}

// Export singleton instance
export const databaseSetupService = DatabaseSetupService.getInstance()