const ApiResponse = require('../../src/utils/apiResponse');

describe('ApiResponse Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('success()', () => {
    it('should format a basic success response', () => {
      ApiResponse.success(mockRes, { user: 'test' });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { user: 'test' }
      });
    });

    it('should format a success response with custom message and status', () => {
      ApiResponse.success(mockRes, { id: 1 }, 'Custom Message', 202);
      
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom Message',
        data: { id: 1 }
      });
    });

    it('should include pagination data when provided', () => {
      const pagination = { page: 1, limit: 10, totalItems: 100, totalPages: 10, hasNext: true, hasPrev: false };
      ApiResponse.success(mockRes, [], 'List', 200, pagination);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: pagination
        })
      );
    });
  });

  describe('error()', () => {
    it('should format a basic error response', () => {
      ApiResponse.error(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error'
      });
    });

    it('should format an error response with custom details', () => {
      const errors = [{ field: 'username', message: 'Required' }];
      ApiResponse.error(mockRes, 'Validation Failed', 400, errors);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation Failed',
        errors: errors
      });
    });
  });

  describe('buildPagination()', () => {
    it('should correctly calculate pagination metadata', () => {
      const page = 2;
      const limit = 10;
      const total = 25;
      
      const pagination = ApiResponse.buildPagination(page, limit, total);
      
      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNext: true, // 2 < 3
        hasPrev: true  // 2 > 1
      });
    });
  });
});
