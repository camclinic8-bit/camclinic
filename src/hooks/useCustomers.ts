'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  searchCustomers,
  createCustomer, 
  updateCustomer,
  getCustomerWithJobCount 
} from '@/features/customers/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

export function useCustomers(page = 1, pageSize = 20, search?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.customers.list(page, pageSize, search),
    queryFn: () => getCustomers(search, page, pageSize),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getCustomerWithJobCount(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: queryKeys.customers.search(query),
    queryFn: () => searchCustomers(query),
    enabled: query.length >= 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (input: { name: string; phone: string; email?: string | null; address?: string | null }) => {
      if (!user?.shop_id) {
        throw new Error('User not authenticated');
      }
      return createCustomer(input, user.shop_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to create customer';
      toast.error(message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; phone?: string; email?: string | null; address?: string | null } }) => {
      return updateCustomer(id, input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update customer';
      toast.error(message);
    },
  });
}
