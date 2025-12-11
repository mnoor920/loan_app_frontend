// Quick test script to verify database setup
import { databaseSetup } from './database-setup';

export async function testDatabaseSetup() {
  console.log('Testing database setup...');
  
  try {
    // Test database connection
    const connectionOk = await databaseSetup.testDatabaseConnection();
    console.log('Database connection:', connectionOk ? 'OK' : 'FAILED');
    
    if (!connectionOk) {
      return { success: false, error: 'Database connection failed' };
    }

    // Check required tables
    const tableCheck = await databaseSetup.checkRequiredTables();
    console.log('Table check result:', tableCheck);

    // Check essential tables
    const essentialTablesOk = await databaseSetup.checkEssentialTables();
    console.log('Essential tables:', essentialTablesOk ? 'OK' : 'MISSING');

    // Get setup instructions if needed
    if (tableCheck.setupRequired) {
      const instructions = databaseSetup.getSetupInstructions(tableCheck.missingTables);
      console.log('Setup instructions:', instructions);
      
      return {
        success: false,
        setupRequired: true,
        missingTables: tableCheck.missingTables,
        instructions
      };
    }

    return {
      success: true,
      message: 'Database setup is complete',
      existingTables: tableCheck.existingTables
    };

  } catch (error: any) {
    console.error('Database setup test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in API routes or components
export default testDatabaseSetup;