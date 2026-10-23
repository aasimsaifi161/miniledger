import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  repaidAt: string | null;
  receiptPath: string | null;
  receiptUrl: string | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  totalCount: number;
  repaidCount: number;
  overdueCount: number;
}

export interface CreateLoanInput {
  friendName: string;
  amount: number;
  dueDate: string;
}

export const QUERY_KEYS = {
  loans: ["loans"] as const,
  summary: ["summary"] as const,
};

export function useLoans() {
  return useQuery<Loan[], Error>({
    queryKey: QUERY_KEYS.loans,
    queryFn: () => api.get<Loan[]>("/loans"),
  });
}

export function useSummary() {
  return useQuery<Summary, Error>({
    queryKey: QUERY_KEYS.summary,
    queryFn: () => api.get<Summary>("/summary"),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation<Loan, Error, CreateLoanInput>({
    mutationFn: (newLoan) => api.post<Loan>("/loans", newLoan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
    },
  });
}

export function useRepayLoan() {
  const queryClient = useQueryClient();

  return useMutation<Loan, Error, string>({
    mutationFn: (loanId) => api.patch<Loan>(`/loans/${loanId}/repay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation<Loan, Error, { loanId: string; imageUri: string }>({
    mutationFn: ({ loanId, imageUri }) =>
      api.uploadReceipt<Loan>(loanId, imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (loanId) =>
      api.delete<{ success: boolean; message: string }>(`/loans/${loanId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
    },
  });
}
