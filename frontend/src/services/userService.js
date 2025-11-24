import apiService from './api';

/**
 * User Service - Handles all user-related API calls
 */
class UserService {
  // Get all users with pagination and filtering
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      // Add filter params
      if (params.search) queryParams.append('search', params.search);
      if (params.userTypeId) queryParams.append('userTypeId', params.userTypeId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiService.get(url);
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      return await apiService.get(`/users/${userId}`);
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      return await apiService.post('/users', userData);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      return await apiService.put(`/users/${userId}`, userData);
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      return await apiService.delete(`/users/${userId}`);
    } catch (error) {
      throw error;
    }
  }

  // Change user password
  async changePassword(userId, passwordData) {
    try {
      return await apiService.put(`/users/${userId}/password`, passwordData);
    } catch (error) {
      throw error;
    }
  }

  // Toggle user active status
  async toggleUserStatus(userId, isActive) {
    try {
      return await apiService.put(`/users/${userId}/status`, { isActive });
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      return await apiService.get('/users/stats');
    } catch (error) {
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, options = {}) {
    try {
      return await this.getUsers({
        search: searchTerm,
        ...options,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get users by type
  async getUsersByType(userTypeId, options = {}) {
    try {
      return await this.getUsers({
        userTypeId,
        ...options,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get active users
  async getActiveUsers(options = {}) {
    try {
      return await this.getUsers({
        isActive: true,
        ...options,
      });
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdateUsers(userIds, updateData) {
    try {
      return await apiService.post('/users/bulk-update', {
        userIds,
        updateData,
      });
    } catch (error) {
      throw error;
    }
  }

  async bulkDeleteUsers(userIds) {
    try {
      return await apiService.post('/users/bulk-delete', { userIds });
    } catch (error) {
      throw error;
    }
  }

  // Export users
  async exportUsers(format = 'csv', filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await apiService.get(`/users/export?${queryParams.toString()}`, {
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Import users
  async importUsers(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return await apiService.post('/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;
