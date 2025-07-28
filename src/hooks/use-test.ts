import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testService } from '@/services/test.service'
import { CreateTestDto, UpdateTestDto } from '@/types/test'
import { toast } from 'sonner'

export function useTest(testId: string) {
  return useQuery({
    queryKey: ['test', testId],
    queryFn: () => testService.getTest(testId),
    enabled: !!testId,
  })
}

export function useCreateTest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTestDto) => testService.createTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] })
      toast.success('Test created successfully!')
    },
  })
}

export function useUpdateTest(testId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateTestDto) => testService.updateTest(testId, data),
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['test', testId] })
      const previousData = queryClient.getQueryData(['test', testId])
      
      queryClient.setQueryData(['test', testId], (old: any) => ({
        ...old,
        ...newData,
      }))
      
      return { previousData }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['test', testId], context?.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
    },
  })
}
