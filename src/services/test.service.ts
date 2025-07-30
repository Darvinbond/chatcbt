import { ApiClient } from '@/lib/api/client'
import { Test, CreateTestDto, UpdateTestDto } from '@/types/test'

class TestService {
  private client = new ApiClient('/api/tests')
  
  async getTests(params?: { page?: number; limit?: number }) {
    return this.client.get<Test[]>('', params)
  }
  
  async getTest(id: string) {
    return this.client.get<Test>(`/${id}`)
  }
  
  async createTest(data: CreateTestDto) {
    return this.client.post<Test>('', data)
  }
  
  async updateTest(id: string, data: UpdateTestDto) {
    return this.client.patch<Test>(`/${id}`, data)
  }
  
  async deleteTest(id: string) {
    return this.client.delete(`/${id}`)
  }
  
  async generateShareLink(testId: string): Promise<string> {
    const { data } = await this.client.post<{ link: string }>(`/${testId}/share`);
    if (!data) {
      throw new Error('Failed to generate share link');
    }
    return data.link;
  }

  async submitTest(testId: string, studentId: string, answers: Record<string, string>) {
    return this.client.post(`/${testId}/submit`, { studentId, answers, submittedAt: new Date() });
  }

  async attemptTest(testId: string, studentId: string) {
    return this.client.post(`/${testId}/attempt`, { studentId });
  }

  async deleteAttempt(attemptId: string) {
    const apiClient = new ApiClient('/api')
    return apiClient.delete(`/attempts/${attemptId}`);
  }

  async deleteAttempts(attemptIds: string[]) {
    const apiClient = new ApiClient('/api')
    return apiClient.delete('/attempts', { attemptIds });
  }
}

export const testService = new TestService()
