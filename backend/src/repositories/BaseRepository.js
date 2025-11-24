const logger = require('../utils/logger');

/**
 * Base Repository class providing common database operations
 * Implements Repository pattern for database abstraction
 */
class BaseRepository {
  constructor(model, prisma) {
    this.model = model;
    this.prisma = prisma;
  }

  /**
   * Create a new record
   * @param {Object} data - Data to create
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    try {
      const result = await this.prisma[this.model].create({
        data,
        include: this.getDefaultIncludes(),
      });
      logger.info(`${this.model} created successfully`, { id: result.id });
      return result;
    } catch (error) {
      logger.error(`Error creating ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Find record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found record or null
   */
  async findById(id, options = {}) {
    try {
      const result = await this.prisma[this.model].findUnique({
        where: { id },
        include: options.include || this.getDefaultIncludes(),
      });
      return result;
    } catch (error) {
      logger.error(`Error finding ${this.model} by ID:`, error);
      throw error;
    }
  }

  /**
   * Find all records with pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        include,
        where = {},
      } = options;

      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      // Build where clause
      const whereClause = {
        ...where,
        ...this.buildWhereClause(filters),
      };

      // Execute queries in parallel
      const [records, total] = await Promise.all([
        this.prisma[this.model].findMany({
          where: whereClause,
          include: include || this.getDefaultIncludes(),
          orderBy: { [sortBy]: sortOrder },
          skip,
          take,
        }),
        this.prisma[this.model].count({ where: whereClause }),
      ]);

      return {
        data: records,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      logger.error(`Error finding ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async updateById(id, data, options = {}) {
    try {
      const result = await this.prisma[this.model].update({
        where: { id },
        data,
        include: options.include || this.getDefaultIncludes(),
      });
      logger.info(`${this.model} updated successfully`, { id });
      return result;
    } catch (error) {
      logger.error(`Error updating ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Deleted record
   */
  async deleteById(id, options = {}) {
    try {
      const result = await this.prisma[this.model].delete({
        where: { id },
        include: options.include || this.getDefaultIncludes(),
      });
      logger.info(`${this.model} deleted successfully`, { id });
      return result;
    } catch (error) {
      logger.error(`Error deleting ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete record by ID
   * @param {string|number} id - Record ID
   * @returns {Promise<Object>} Updated record
   */
  async softDeleteById(id) {
    try {
      const result = await this.prisma[this.model].update({
        where: { id },
        data: { 
          isActive: false,
          deletedAt: new Date(),
        },
      });
      logger.info(`${this.model} soft deleted successfully`, { id });
      return result;
    } catch (error) {
      logger.error(`Error soft deleting ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Count records
   * @param {Object} where - Where clause
   * @returns {Promise<number>} Record count
   */
  async count(where = {}) {
    try {
      return await this.prisma[this.model].count({ where });
    } catch (error) {
      logger.error(`Error counting ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   * @param {Object} where - Where clause
   * @returns {Promise<boolean>} Exists or not
   */
  async exists(where) {
    try {
      const count = await this.prisma[this.model].count({ where });
      return count > 0;
    } catch (error) {
      logger.error(`Error checking existence of ${this.model}:`, error);
      throw error;
    }
  }

  /**
   * Build where clause from filters
   * Override in child classes for specific filtering logic
   * @param {Object} filters - Filter criteria
   * @returns {Object} Where clause
   */
  buildWhereClause(filters) {
    const where = {};
    
    // Add common filters
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.search) {
      // Override in child classes for specific search logic
      where.OR = this.buildSearchClause(filters.search);
    }
    
    return where;
  }

  /**
   * Build search clause
   * Override in child classes for specific search fields
   * @param {string} searchTerm - Search term
   * @returns {Array} OR conditions
   */
  buildSearchClause(searchTerm) {
    // Override in child classes
    return [];
  }

  /**
   * Get default includes
   * Override in child classes for specific relations
   * @returns {Object} Include clause
   */
  getDefaultIncludes() {
    return {};
  }

  /**
   * Execute raw query
   * @param {string} query - Raw SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<any>} Query result
   */
  async rawQuery(query, params = []) {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...params);
    } catch (error) {
      logger.error(`Error executing raw query:`, error);
      throw error;
    }
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    try {
      return await this.prisma.$transaction(callback);
    } catch (error) {
      logger.error(`Error executing transaction:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
