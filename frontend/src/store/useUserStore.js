import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import userService from '../services/userService';

const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        users: [],
        currentUser: null,
        userStats: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        filters: {
          search: '',
          userTypeId: null,
          isActive: null,
        },
        sortBy: 'createdAt',
        sortOrder: 'desc',

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // User management
        setUsers: (users) => set({ users }),
        setCurrentUser: (user) => set({ currentUser: user }),
        setUserStats: (stats) => set({ userStats: stats }),

        // Pagination
        setPagination: (pagination) => set({ pagination }),
        setPage: (page) => set((state) => ({
          pagination: { ...state.pagination, page },
        })),

        // Filters
        setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
        clearFilters: () => set({
          filters: {
            search: '',
            userTypeId: null,
            isActive: null,
          },
        }),

        // Sorting
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

        // API Actions
        fetchUsers: async (params = {}) => {
          try {
            set({ loading: true, error: null });
            
            const currentState = get();
            const queryParams = {
              page: params.page || currentState.pagination.page,
              limit: params.limit || currentState.pagination.limit,
              sortBy: params.sortBy || currentState.sortBy,
              sortOrder: params.sortOrder || currentState.sortOrder,
              ...currentState.filters,
              ...params,
            };

            const response = await userService.getUsers(queryParams);
            
            set({
              users: response.data,
              pagination: response.pagination,
              loading: false,
            });

            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        fetchUserById: async (userId) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.getUserById(userId);
            set({ loading: false });
            return response.data;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        createUser: async (userData) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.createUser(userData);
            
            // Add new user to the list
            set((state) => ({
              users: [response.data, ...state.users],
              loading: false,
            }));

            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        updateUser: async (userId, userData) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.updateUser(userId, userData);
            
            // Update user in the list
            set((state) => ({
              users: state.users.map(user =>
                user.id === userId ? response.data : user
              ),
              loading: false,
            }));

            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        deleteUser: async (userId) => {
          try {
            set({ loading: true, error: null });
            await userService.deleteUser(userId);
            
            // Remove user from the list
            set((state) => ({
              users: state.users.filter(user => user.id !== userId),
              loading: false,
            }));

            return true;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        toggleUserStatus: async (userId, isActive) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.toggleUserStatus(userId, isActive);
            
            // Update user status in the list
            set((state) => ({
              users: state.users.map(user =>
                user.id === userId ? { ...user, isActive } : user
              ),
              loading: false,
            }));

            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        changePassword: async (userId, passwordData) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.changePassword(userId, passwordData);
            set({ loading: false });
            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        fetchUserStats: async () => {
          try {
            set({ loading: true, error: null });
            const response = await userService.getUserStats();
            set({ userStats: response.data, loading: false });
            return response.data;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        searchUsers: async (searchTerm) => {
          try {
            set({ loading: true, error: null });
            const response = await userService.searchUsers(searchTerm);
            set({
              users: response.data,
              pagination: response.pagination,
              loading: false,
            });
            return response;
          } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        // Utility actions
        reset: () => set({
          users: [],
          currentUser: null,
          userStats: null,
          loading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
          filters: {
            search: '',
            userTypeId: null,
            isActive: null,
          },
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),

        // Getters
        getActiveUsers: () => get().users.filter(user => user.isActive),
        getInactiveUsers: () => get().users.filter(user => !user.isActive),
        getUserById: (userId) => get().users.find(user => user.id === userId),
        getUsersByType: (userTypeId) => get().users.filter(user => user.userTypeId === userTypeId),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          currentUser: state.currentUser,
          filters: state.filters,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
);

export default useUserStore;
