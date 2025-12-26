/**
 * Users Hooks
 * React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    type CreateUserData,
    type UpdateUserData,
} from '@/lib/api/users';

/**
 * Hook to fetch all users
 */
export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
            updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
