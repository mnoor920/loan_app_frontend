import { DatabaseSetupService, databaseSetupService } from '../../lib/database-setup-service'

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('DatabaseSetupService', () => {
  let service: DatabaseSetupService
  let mockSupabaseAdmin: any

  beforeEach(() => {
    service = DatabaseSetupService.getInstance()
    mockSupabaseAdmin = require('../../lib/supabase').supabaseAdmin
    jest.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseSetupService.getInstance()
      const instance2 = DatabaseSetupService.getInstance()
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(databaseSetupService)
    })
  })

  describe('checkRequiredTables', () => {
    it('should return all tables exist when all required tables are present', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' },
        { table_name: 'user_activation_profiles' },
        { table_name: 'user_documents' },
        { table_name: 'activation_audit_log' },
        { table_name: 'document_access_log' },
        { table_name: 'user_notifications' },
        { table_name: 'admin_modification_log' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.checkRequiredTables()

      expect(result).toEqual({
        allTablesExist: true,
        missingTables: [],
        setupRequired: false
      })
    })

    it('should return missing tables when some tables are absent', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.checkRequiredTables()

      expect(result).toEqual({
        allTablesExist: false,
        missingTables: [
          'user_activation_profiles',
          'user_documents',
          'activation_audit_log',
          'document_access_log',
          'user_notifications',
          'admin_modification_log'
        ],
        setupRequired: true
      })
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const result = await service.checkRequiredTables()

      expect(result.allTablesExist).toBe(false)
      expect(result.setupRequired).toBe(true)
      expect(result.missingTables.length).toBeGreaterThan(0)
    })

    it('should handle missing supabaseAdmin client', async () => {
      // Mock supabaseAdmin as null
      jest.doMock('../../lib/supabase', () => ({
        supabaseAdmin: null
      }))

      const result = await service.checkRequiredTables()

      expect(result.allTablesExist).toBe(false)
      expect(result.setupRequired).toBe(true)
    })
  })

  describe('getSetupInstructions', () => {
    it('should return complete setup instructions when all tables are missing', () => {
      const allRequiredTables = [
        'users', 'loans', 'user_activation_profiles', 'user_documents',
        'activation_audit_log', 'document_access_log', 'user_notifications', 'admin_modification_log'
      ]

      const instructions = service.getSetupInstructions(allRequiredTables)

      expect(instructions.title).toBe('Database Setup Required')
      expect(instructions.description).toContain('database schema is not set up')
      expect(instructions.steps).toHaveLength(4)
      expect(instructions.scriptPath).toBe('lib/database-schema.sql')
      expect(instructions.steps[0]).toContain('Supabase SQL Editor')
    })

    it('should return partial setup instructions when some tables are missing', () => {
      const missingTables = ['user_activation_profiles', 'user_documents']

      const instructions = service.getSetupInstructions(missingTables)

      expect(instructions.title).toBe('Incomplete Database Setup')
      expect(instructions.description).toContain('Some required tables are missing')
      expect(instructions.description).toContain('user_activation_profiles')
      expect(instructions.description).toContain('user_documents')
      expect(instructions.steps).toHaveLength(5)
    })

    it('should return complete setup instructions when no missing tables provided', () => {
      const instructions = service.getSetupInstructions()

      expect(instructions.title).toBe('Database Setup Required')
      expect(instructions.scriptPath).toBe('lib/database-schema.sql')
    })
  })

  describe('validateSchema', () => {
    it('should return valid schema when all tables exist', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' },
        { table_name: 'user_activation_profiles' },
        { table_name: 'user_documents' },
        { table_name: 'activation_audit_log' },
        { table_name: 'document_access_log' },
        { table_name: 'user_notifications' },
        { table_name: 'admin_modification_log' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.validateSchema()

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for missing critical tables', async () => {
      const mockData = [
        { table_name: 'user_activation_profiles' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.validateSchema()

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Missing required tables')
      expect(result.errors[1]).toContain('Critical tables missing: users, loans')
    })

    it('should return warnings for missing activation tables', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' },
        { table_name: 'user_notifications' },
        { table_name: 'admin_modification_log' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.validateSchema()

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('Activation system tables missing'))).toBe(true)
      expect(result.warnings.some(w => w.includes('Audit logging tables missing'))).toBe(true)
    })
  })

  describe('getSetupStatus', () => {
    it('should return complete setup status', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      })

      const result = await service.getSetupStatus()

      expect(result.isSetup).toBe(false)
      expect(result.tableStatus.setupRequired).toBe(true)
      expect(result.setupInstructions).toBeDefined()
      expect(result.validation.isValid).toBe(false)
    })
  })

  describe('checkTableExists', () => {
    it('should return true when table exists', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { table_name: 'users' },
                error: null
              })
            })
          })
        })
      })

      const result = await service.checkTableExists('users')
      expect(result).toBe(true)
    })

    it('should return false when table does not exist', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows found' }
              })
            })
          })
        })
      })

      const result = await service.checkTableExists('nonexistent_table')
      expect(result).toBe(false)
    })
  })

  describe('getExistingTables', () => {
    it('should return list of existing tables', async () => {
      const mockData = [
        { table_name: 'users' },
        { table_name: 'loans' },
        { table_name: 'user_activation_profiles' }
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })

      const result = await service.getExistingTables()
      expect(result).toEqual(['users', 'loans', 'user_activation_profiles'])
    })

    it('should return empty array on error', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      const result = await service.getExistingTables()
      expect(result).toEqual([])
    })
  })
})