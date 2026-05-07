import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
import type {
  CreateMemberPayload,
  UpdateMemberPayload,
  TopUpPayload,
} from '@/types';

export const memberKeys = {
  all:       ['members']                     as const,
  list:      (search?: string) =>
               ['members', 'list', search]   as const,
  detail:    (id: number) =>
               ['members', 'detail', id]     as const,
  statement: (id: number) =>
               ['members', 'statement', id]  as const,
};

export function useMembersList(search?: string) {
  return useQuery({
    queryKey: memberKeys.list(search),
    queryFn:  () => membersApi.getMembers(search),
    staleTime: 30_000,
  });
}

export function useMember(id: number | null) {
  return useQuery({
    queryKey: memberKeys.detail(id!),
    queryFn:  () => membersApi.getMember(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  });
}

export function useMemberStatement(id: number | null) {
  return useQuery({
    queryKey: memberKeys.statement(id!),
    queryFn:  () => membersApi.getStatement(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberPayload) => membersApi.createMember(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useUpdateMember(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMemberPayload) => membersApi.updateMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useTopUp(memberId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TopUpPayload) => membersApi.topUp(memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.detail(memberId) });
      qc.invalidateQueries({ queryKey: memberKeys.statement(memberId) });
      qc.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
