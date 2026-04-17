class ApiService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ========== AUTH METHODS ==========
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    age?: number;
    healthGoals?: string[];
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async updateProfile(profileData: any) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ========== FOOD METHODS ==========
  async logFood(foodData: {
    meal_type: string;
    items: any[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }) {
    return this.request('/api/food/log', {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  }

  async getTodayFood() {
    return this.request('/api/food/today');
  }

  async getFoodHistory(days: number = 7) {
    return this.request(`/api/food/history/${days}`);
  }

  async estimateNutrition(description: string) {
    return this.request('/api/food/estimate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // ========== CHAT METHODS ==========
  async sendSymptomMessage(symptom: string, context?: any) {
    return this.request('/api/chat/symptom', {
      method: 'POST',
      body: JSON.stringify({ symptom, context }),
    });
  }

  async sendQuickCheck(message: string) {
    return this.request('/api/chat/quick-check', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory(limit: number = 20) {
    return this.request(`/api/chat/history?limit=${limit}`);
  }

  // ========== REPORTS METHODS ==========
  async uploadLabReport(file: File, analysis?: any) {
    const formData = new FormData();
    formData.append('file', file);
    if (analysis) {
      formData.append('analysis', JSON.stringify(analysis));
    }

    return fetch(`${this.baseURL}/api/reports/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  }

  async getLabReports() {
    return this.request('/api/reports/list');
  }

  async getLabReport(id: string) {
    return this.request(`/api/reports/${id}`);
  }

  // ========== RECORDS METHODS ==========
  async uploadHealthRecord(file: File, recordData: {
    record_type: string;
    label: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('record_type', recordData.record_type);
    formData.append('label', recordData.label);

    return fetch(`${this.baseURL}/api/reports/records/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  }

  async getHealthRecords() {
    return this.request('/api/reports/records/list');
  }

  async deleteHealthRecord(id: string) {
    return this.request(`/api/reports/records/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== SLEEP METHODS ==========
  async logSleep(sleepData: {
    bedtime: string;
    wake_time: string;
    duration_hours: number;
    quality: number;
  }) {
    return this.request('/api/sleep/log', {
      method: 'POST',
      body: JSON.stringify(sleepData),
    });
  }

  async getSleepHistory(days: number = 7) {
    return this.request(`/api/sleep/history?days=${days}`);
  }

  // ========== WATER METHODS ==========
  async logWater(amount_ml: number = 250) {
    return this.request('/api/water/log', {
      method: 'POST',
      body: JSON.stringify({ amount_ml }),
    });
  }

  async getTodayWater() {
    return this.request('/api/water/today');
  }

  // ========== GAMIFICATION METHODS ==========
  async getPoints() {
    return this.request('/api/gamification/points');
  }

  async getLeaderboard(limit: number = 10) {
    return this.request(`/api/gamification/leaderboard?limit=${limit}`);
  }
}

export const apiService = new ApiService();