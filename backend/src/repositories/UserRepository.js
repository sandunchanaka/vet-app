const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');

/**
 * User Repository - Handles all user-related database operations
 */
class UserRepository extends BaseRepository {
  constructor(prisma) {
    super('user', prisma);
  }

  /**
   * Get default includes for user queries
   * @returns {Object} Include clause
   */
  getDefaultIncludes() {
    return {
      userType: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
  }

  /**
   * Build search clause for user queries
   * @param {string} searchTerm - Search term
   * @returns {Array} OR conditions
   */
  buildSearchClause(searchTerm) {
    return [
      { firstName: { contains: searchTerm, mode: 'insensitive' } },
      { lastName: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: this.getDefaultIncludes(),
      });
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create user with hashed password
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const { password, ...otherData } = userData;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      return await this.create({
        ...otherData,
        passwordHash: hashedPassword,
      });
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Updated user
   */
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      return await this.updateById(userId, {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Verify user password
   * @param {string} userId - User ID
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>} Password match
   */
  async verifyPassword(userId, password) {
    try {
      const user = await this.findById(userId, {
        include: false,
      });
      
      if (!user) {
        return false;
      }
      
      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      this.logger.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Find users by user type
   * @param {number} userTypeId - User type ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with pagination
   */
  async findByUserType(userTypeId, options = {}) {
    try {
      return await this.findAll({}, {
        ...options,
        where: { userTypeId },
      });
    } catch (error) {
      this.logger.error('Error finding users by type:', error);
      throw error;
    }
  }

  /**
   * Find active users
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Active users with pagination
   */
  async findActiveUsers(options = {}) {
    try {
      return await this.findAll({}, {
        ...options,
        where: { isActive: true },
      });
    } catch (error) {
      this.logger.error('Error finding active users:', error);
      throw error;
    }
  }

  /**
   * Update user last login
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async updateLastLogin(userId) {
    try {
      return await this.updateById(userId, {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      });
    } catch (error) {
      this.logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
        this.count(),
        this.count({ isActive: true }),
        this.count({
          isActive: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        newUsersThisMonth,
      };
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}

module.exports = UserRepository;
