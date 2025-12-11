/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/profile/batch/route';
import jwt from 'jsonwebtoken';

// Mock the ActivationService
jest.mock('@/lib/activation-service', () => ({
  ActivationService: {
    getBatchProfileData: jest.fn()
  }
}));

// Mock JWT
jest.mock('jsonwebtoken');

describe('/api/profile/batch', () => {
  const mockUserId = 'test-user-123';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock JWT verification
    (jwt.verify as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
      role: 'user'
    });
  });

  it('should return batch profile data successfully', async () => {
    const { ActivationService } = require('@/lib/activation-service');
    
    // Mock successful batch data response
    const mockBatchData = {
      profile: {
        id: 'profile-123',
        user_id: mockUserId,
        full_name: 'Test User',
        activation_status: 'in_progress',
        current_step: 3
      },
      documents: [
        {
          id: 'doc-1',
          user_id: mockUserId,
          document_type: 'id_front',
          verification_status: 'pending'
        }
      ],
      documentsByType: {
        id_front: [{
          id: 'doc-1',
          user_id: mockUserId,
          document_type: 'id_front',
          verification_status: 'pending'
        }]
      },
      progress: 50,
      isComplete: false,
      stats: {
        totalDocuments: 1,
        verifiedDocuments: 0,
        pendingDocuments: 1
      }
    };

    ActivationService.getBatchProfileData.mockResolvedValue(mockBatchData);

    // Create mock request with auth cookie
    const request = new NextRequest('http://localhost:3000/api/profile/batch');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: mockToken })
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile).toEqual(mockBatchData.profile);
    expect(data.documents).toEqual(mockBatchData.documents);
    expect(data.documentsByType).toEqual(mockBatchData.documentsByType);
    expect(data.progress).toBe(50);
    expect(data.isComplete).toBe(false);
    expect(data.stats).toEqual(mockBatchData.stats);
    expect(data.activationSteps).toBeDefined();
    expect(data.preferences).toBeDefined();

    // Verify caching headers
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=300');
  });

  it('should return 401 when no auth token provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/batch');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined)
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No authentication token found');
  });

  it('should handle database timeout gracefully', async () => {
    const { ActivationService } = require('@/lib/activation-service');
    
    // Mock timeout by returning a promise that never resolves
    ActivationService.getBatchProfileData.mockImplementation(() => 
      new Promise(() => {}) // Never resolves, will timeout
    );

    const request = new NextRequest('http://localhost:3000/api/profile/batch');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: mockToken })
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile).toBeNull();
    expect(data.documents).toEqual([]);
    expect(data.progress).toBe(0);
    expect(data.isComplete).toBe(false);
    
    // Should have shorter cache for fallback data
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
  });

  it('should handle JWT errors properly', async () => {
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw jwtError;
    });

    const request = new NextRequest('http://localhost:3000/api/profile/batch');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' })
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should structure activation steps correctly', async () => {
    const { ActivationService } = require('@/lib/activation-service');
    
    const mockProfile = {
      id: 'profile-123',
      user_id: mockUserId,
      full_name: 'Test User',
      gender: 'male',
      date_of_birth: '1990-01-01',
      marital_status: 'single',
      nationality: 'Pakistani',
      family_relatives: [{ fullName: 'John Doe', relationship: 'brother' }],
      residing_country: 'Pakistan',
      town_city: 'Karachi',
      id_type: 'NIC',
      id_number: '12345-1234567-1',
      bank_name: 'Test Bank',
      account_number: '1234567890',
      signature_data: 'signature-data',
      activation_status: 'completed',
      current_step: 6
    };

    ActivationService.getBatchProfileData.mockResolvedValue({
      profile: mockProfile,
      documents: [],
      documentsByType: {},
      progress: 100,
      isComplete: true,
      stats: { totalDocuments: 0, verifiedDocuments: 0, pendingDocuments: 0 }
    });

    const request = new NextRequest('http://localhost:3000/api/profile/batch');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: mockToken })
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.activationSteps).toBeDefined();
    expect(data.activationSteps.currentStep).toBe(6);
    expect(data.activationSteps.status).toBe('completed');
    expect(data.activationSteps.stepsData.step1.completed).toBe(true);
    expect(data.activationSteps.stepsData.step1.data.fullName).toBe('Test User');
    expect(data.activationSteps.stepsData.step6.completed).toBe(true);
  });
});