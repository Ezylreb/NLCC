/**
 * Unified API Client for NLCC Refactored Endpoints
 * Wraps /api/rest/* endpoints with convenient methods
 * Handles all HTTP operations, error handling, and type safety
 */

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Base API client with common functionality
 */
class APIClient {
  protected baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API Error: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Request Failed: ${url}`, error);
      throw error;
    }
  }

  protected get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  protected patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  protected put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Bahagi (Module) API methods
 */
class BahagiAPI extends APIClient {
  constructor() {
    super('/api/teacher');
  }

  /**
   * Fetch all bahagis (optionally filtered by teacher and class)
   */
  async fetchAll(teacherId?: string, className?: string): Promise<APIResponse> {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId);
    if (className) params.append('className', className);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    // Use REST endpoint directly with cache-busting
    const url = `/api/rest/bahagis${query}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch bahagis');
    }
    return await response.json();
  }

  /**
   * Fetch single bahagi by ID
   */
  async fetchById(bahagiId: number): Promise<APIResponse> {
    const url = `/api/rest/bahagis/${bahagiId}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch bahagi');
    }
    return await response.json();
  }

  /**
   * Create new bahagi
   */
  async create(data: {
    title: string;
    yunit?: string;
    description?: string;
    teacher_id: string;
    class_name?: string;
    classId?: string;
    className?: string;
    subject?: string;
    image_url?: string;
  }): Promise<APIResponse> {
    // Use teacher endpoint for creating
    return this.post('/create-bahagi', {
      title: data.title,
      teacherId: data.teacher_id,
      classId: data.classId || data.class_name,
      className: data.className || data.class_name
    });
  }

  /**
   * Update bahagi
   */
  async update(
    bahagiId: number,
    data: Partial<{
      title: string;
      description: string;
      subject: string;
      image_url: string;
      is_archived: boolean;
      is_published: boolean;
    }>
  ): Promise<APIResponse> {
    return this.put('/update-bahagi', { id: bahagiId, ...data });
  }

  /**
   * Delete bahagi
   */
  async deleteBahagi(bahagiId: number): Promise<APIResponse> {
    return this.delete(`/delete-bahagi?id=${bahagiId}`);
  }

  /**
   * Archive bahagi
   */
  async archive(bahagiId: number): Promise<APIResponse> {
    return this.put('/archive-bahagi', { id: bahagiId, isArchived: true });
  }

  /**
   * Restore archived bahagi
   */
  async restore(bahagiId: number): Promise<APIResponse> {
    return this.put('/archive-bahagi', { id: bahagiId, isArchived: false });
  }

  /**
   * Publish bahagi (make public)
   */
  async publish(bahagiId: number): Promise<APIResponse> {
    return this.put('/update-bahagi', { id: bahagiId, isPublished: true });
  }
}

/**
 * Yunit (Lesson) API methods
 */
class YunitAPI extends APIClient {
  constructor() {
    super('/api/rest');
  }

  /**
   * Fetch all yunits in a bahagi
   */
  async fetchByBahagi(bahagiId: number): Promise<APIResponse> {
    return this.get(`/yunits?bahagiId=${bahagiId}`);
  }

  /**
   * Fetch single yunit by ID
   */
  async fetchById(yunitId: number): Promise<APIResponse> {
    return this.get(`/yunits/${yunitId}`);
  }

  /**
   * Create new yunit
   */
  async create(data: {
    bahagi_id: number;
    title: string;
    description: string;
    discussion?: string;
    media_url?: string;
    order?: number;
  }): Promise<APIResponse> {
    return this.post('/yunits', data);
  }

  /**
   * Update yunit
   */
  async update(
    yunitId: number,
    data: Partial<{
      title: string;
      description: string;
      discussion: string;
      media_url: string;
      order: number;
    }>
  ): Promise<APIResponse> {
    return this.patch(`/yunits/${yunitId}`, data);
  }

  /**
   * Delete yunit
   */
  async deleteYunit(yunitId: number): Promise<APIResponse> {
    return this.delete(`/yunits/${yunitId}`);
  }

  /**
   * Archive yunit
   */
  async archive(yunitId: number): Promise<APIResponse> {
    return this.patch(`/yunits/${yunitId}`, { is_archived: true });
  }

  /**
   * Restore archived yunit
   */
  async restore(yunitId: number): Promise<APIResponse> {
    return this.patch(`/yunits/${yunitId}`, { is_archived: false });
  }
}

/**
 * Assessment API methods
 */
class AssessmentAPI extends APIClient {
  constructor() {
    super('/api/rest');
  }

  /**
   * Fetch assessments (optionally filtered by yunit or bahagi)
   */
  async fetch(filters?: {
    yunit_id?: number;
    bahagi_id?: number;
  }): Promise<APIResponse> {
    const query = new URLSearchParams();
    if (filters?.yunit_id) query.append('yunitId', String(filters.yunit_id));
    if (filters?.bahagi_id)
      query.append('bahagiId', String(filters.bahagi_id));

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.get(`/assessments${queryStr}`);
  }

  /**
   * Fetch single assessment by ID
   */
  async fetchById(assessmentId: number): Promise<APIResponse> {
    return this.get(`/assessments/${assessmentId}`);
  }

  /**
   * Create new assessment
   */
  async create(data: {
    yunit_id: number;
    bahagi_id: number;
    title: string;
    description?: string;
    total_questions?: number;
    time_limit?: number;
    questions?: any[];
  }): Promise<APIResponse> {
    return this.post('/assessments', data);
  }

  /**
   * Update assessment
   */
  async update(
    assessmentId: number,
    data: Partial<{
      title: string;
      description: string;
      total_questions: number;
      time_limit: number;
      questions: any[];
    }>
  ): Promise<APIResponse> {
    return this.patch(`/assessments/${assessmentId}`, data);
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(assessmentId: number): Promise<APIResponse> {
    return this.delete(`/assessments/${assessmentId}`);
  }

  /**
   * Submit assessment answers
   * @param assessmentId - Assessment ID
   * @param data - Submission data with answers, student_id, etc.
   */
  async submit(assessmentId: number, data: {
    student_id: string;
    answers: any[];
    yunit_id?: number;
    bahagi_id?: number;
    total_questions?: number;
  }): Promise<APIResponse> {
    return this.post(`/assessments/${assessmentId}/submit`, data);
  }

  /**
   * Get assessment attempts for a student
   */
  async getAttempts(assessmentId: number, studentId?: string): Promise<APIResponse> {
    const query = studentId ? `?student_id=${studentId}` : '';
    return this.get(`/assessments/${assessmentId}/attempts${query}`);
  }
}

/**
 * Analytics API methods
 */
class AnalyticsAPI extends APIClient {
  constructor() {
    super('/api/rest');
  }

  /**
   * Get student performance analytics
   */
  async getStudentPerformance(studentId: string): Promise<APIResponse> {
    return this.get(`/analytics?type=student_performance&student_id=${studentId}`);
  }

  /**
   * Get class statistics
   */
  async getClassStats(classId: string): Promise<APIResponse> {
    return this.get(`/analytics?type=class_stats&class_id=${classId}`);
  }

  /**
   * Get assignment analytics
   */
  async getAssignmentAnalytics(assignmentId: string): Promise<APIResponse> {
    return this.get(
      `/analytics?type=assignment_analytics&assignment_id=${assignmentId}`
    );
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(): Promise<APIResponse> {
    return this.get('/analytics?type=activity_stats');
  }
}

/**
 * Upload API methods
 */
class UploadAPI extends APIClient {
  /**
   * Upload file to storage
   */
  async uploadFile(file: File, type?: string): Promise<APIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);

    // Override baseUrl for this request due to FormData
    const baseUrl = '/api/rest';
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Upload failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

/**
 * User API methods
 */
class UserAPI extends APIClient {
  constructor() {
    super('/api/rest');
  }

  /**
   * Fetch user by email
   */
  async fetchByEmail(email: string): Promise<APIResponse> {
    return this.get(`/users?email=${encodeURIComponent(email)}`);
  }

  /**
   * Get user stats
   */
  async getStats(userId: string): Promise<APIResponse> {
    return this.get(`/users/${userId}/stats`);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    preferences?: any;
  }): Promise<APIResponse> {
    return this.patch(`/users/${userId}`, data);
  }

  /**
   * Update own profile (first name, last name, email)
   */
  async updateOwnProfile(userId: string, data: {
    firstName: string;
    lastName: string;
    email?: string;
  }): Promise<APIResponse> {
    // Use absolute path to bypass baseUrl (/api/rest)
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user lesson progress
   */
  async getLessonProgress(userId: string, lessonId: string): Promise<APIResponse> {
    return this.get(`/users/${userId}/lessons/${lessonId}`);
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(userId: string, lessonId: string, data: any): Promise<APIResponse> {
    return this.patch(`/users/${userId}/lessons/${lessonId}`, data);
  }
}

/**
 * Avatar API methods
 */
class AvatarAPI extends APIClient {
  constructor() {
    super('/api/student');
  }

  /**
   * Get student avatar
   */
  async getAvatar(studentId: string): Promise<APIResponse> {
    return this.get(`/avatar?studentId=${studentId}`);
  }

  /**
   * Update student avatar
   */
  async updateAvatar(studentId: string, data: any): Promise<APIResponse> {
    return this.patch(`/avatars/${studentId}`, {
      studentId: studentId,
      ...data
    });
  }

  /**
   * Get avatar items/customizations
   */
  async getItems(studentId: string): Promise<APIResponse> {
    return this.get(`/avatar-items?studentId=${studentId}`);
  }

  /**
   * Purchase avatar item
   */
  async purchaseItem(studentId: string, itemId: string): Promise<APIResponse> {
    return this.post(`/avatar-items`, {
      studentId: studentId,
      itemId: itemId
    });
  }
}

/**
 * Admin API methods
 */
class AdminAPI extends APIClient {
  constructor() {
    super('/api/admin');
  }

  /**
   * Get admin settings
   */
  async getSettings(): Promise<APIResponse> {
    return this.get(`/settings`);
  }

  /**
   * Update admin settings
   */
  async updateSettings(data: any): Promise<APIResponse> {
    return this.patch(`/settings`, data);
  }

  /**
   * Get admin statistics
   */
  async getStats(): Promise<APIResponse> {
    return this.get(`/stats`);
  }

  /**
   * Get system activities
   */
  async getActivities(page?: number, limit?: number): Promise<APIResponse> {
    const query = new URLSearchParams();
    if (page) query.append('page', String(page));
    if (limit) query.append('limit', String(limit));
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.get(`/activities${queryStr}`);
  }

  /**
   * Get all teachers
   */
  async getTeachers(): Promise<APIResponse> {
    return this.get(`/teachers`);
  }

  /**
   * Get classes for teacher
   */
  async getClassesByTeacher(teacherId: string): Promise<APIResponse> {
    return this.get(`/classes?teacherId=${teacherId}`);
  }

  /**
   * Get all classes with teacher info (for combined dropdown)
   */
  async getAllClassesWithTeachers(): Promise<APIResponse> {
    return this.get(`/classes`);
  }

  /**
   * Create student
   */
  async createStudent(data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string;
    lrn?: string;
    teacher_id?: string;
    teacherId?: string;
    class_id?: string;
    classId?: string;
  }): Promise<APIResponse> {
    // Convert to backend format if using snake_case
    const payload = {
      firstName: data.firstName || (data.name?.split(' ')[0] || ''),
      lastName: data.lastName || (data.name?.split(' ').slice(1).join(' ') || ''),
      email: data.email,
      password: data.password,
      lrn: data.lrn,
      teacherId: data.teacherId || data.teacher_id,
      classId: data.classId || data.class_id,
    };
    return this.post(`/create-student`, payload);
  }

  /**
   * Create teacher
   */
  async createTeacher(data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string;
    className?: string;
  }): Promise<APIResponse> {
    // Convert to backend format if using name field
    const payload = {
      firstName: data.firstName || (data.name?.split(' ')[0] || ''),
      lastName: data.lastName || (data.name?.split(' ').slice(1).join(' ') || ''),
      email: data.email,
      password: data.password,
      className: data.className,
    };
    return this.post(`/create-teacher`, payload);
  }

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(page?: number, limit?: number, role?: string, search?: string, section?: string): Promise<APIResponse> {
    const query = new URLSearchParams();
    if (page) query.append('page', String(page));
    if (limit) query.append('limit', String(limit));
    if (role && role !== 'all') query.append('role', role);
    if (search) query.append('search', search);
    if (section && section !== 'all') query.append('section', section);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.get(`/users${queryStr}`);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: any): Promise<APIResponse> {
    return this.patch(`/users/${userId}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<APIResponse> {
    return this.delete(`/users/${userId}`);
  }
}

/**
 * Class API methods
 */
class ClassService extends APIClient {
  constructor() {
    super('/api/teacher');
  }

  /**
   * Create a new class
   */
  async create(data: {
    name: string;
    description?: string;
    teacher_id: string;
    subject?: string;
  }): Promise<APIResponse> {
    return this.post(`/create-class`, data);
  }

  /**
   * Fetch classes for teacher
   */
  async fetchByTeacher(teacherId: string): Promise<APIResponse> {
    return this.get(`/classes?teacher_id=${teacherId}`);
  }

  /**
   * Fetch single class
   */
  async fetchById(classId: number | string): Promise<APIResponse> {
    const tid = this.getTeacherId();
    return this.get(`/classes/${classId}?teacherId=${tid}`);
  }

  /**
   * Update class
   */
  async update(classId: number | string, data: any): Promise<APIResponse> {
    const tid = this.getTeacherId();
    return this.patch(`/classes/${classId}`, { ...data, teacherId: tid });
  }

  /**
   * Archive class (soft delete)
   */
  async archiveClass(classId: number | string): Promise<APIResponse> {
    const tid = this.getTeacherId();
    return this.patch(`/classes/${classId}`, { is_archived: true, teacherId: tid });
  }

  /**
   * Restore archived class
   */
  async restoreClass(classId: number | string): Promise<APIResponse> {
    const tid = this.getTeacherId();
    return this.patch(`/classes/${classId}`, { is_archived: false, teacherId: tid });
  }

  /**
   * Delete class (hard delete)
   */
  async deleteClass(classId: number | string): Promise<APIResponse> {
    const tid = this.getTeacherId();
    return this.delete(`/classes/${classId}?teacherId=${tid}`);
  }

  /**
   * Get class students
   */
  async getStudents(classId: number | string, teacherId?: string): Promise<APIResponse> {
    const tid = teacherId || this.getTeacherId();
    return this.get(`/class-students?classId=${classId}&teacherId=${tid}`);
  }

  /**
   * Get available students (not enrolled in class)
   */
  async getAvailableStudents(classId: number | string, teacherId?: string): Promise<APIResponse> {
    const tid = teacherId || this.getTeacherId();
    return this.get(`/available-students?classId=${classId}&teacherId=${tid}`);
  }

  /**
   * Add student to class
   */
  async addStudent(classId: number | string, studentId: string, teacherId?: string): Promise<APIResponse> {
    const tid = teacherId || this.getTeacherId();
    return this.post(`/class-students`, { classId, studentId, teacherId: tid });
  }

  /**
   * Remove student from class
   */
  async removeStudent(classId: number | string, studentId: string, teacherId?: string): Promise<APIResponse> {
    const tid = teacherId || this.getTeacherId();
    return this.delete(`/unenroll-student?classId=${classId}&studentId=${studentId}&teacherId=${tid}`);
  }

  /**
   * Get teacher ID from localStorage
   */
  private getTeacherId(): string {
    if (typeof window === 'undefined') return '';
    const savedUser = localStorage.getItem('nllc_user');
    if (!savedUser) return '';
    try {
      const user = JSON.parse(savedUser);
      return user.id || '';
    } catch {
      return '';
    }
  }

  /**
   * Get class statistics
   */
  async getStats(classId: number | string): Promise<APIResponse> {
    return this.get(`/classes/${classId}/stats`);
  }
}

/**
 * Lesson Service methods (extends YunitAPI)
 */
class LessonService extends APIClient {
  /**
   * Get lesson by ID with full details
   */
  async fetchById(lessonId: number | string): Promise<APIResponse> {
    return this.get(`/lessons/${lessonId}`);
  }

  /**
   * Update lesson
   */
  async update(lessonId: number | string, data: any): Promise<APIResponse> {
    return this.patch(`/lessons/${lessonId}`, data);
  }

  /**
   * Delete lesson
   */
  async deleteLesson(lessonId: number | string): Promise<APIResponse> {
    return this.delete(`/lessons/${lessonId}`);
  }

  /**
   * Add item to lesson
   */
  async addItem(lessonId: number | string, data: any): Promise<APIResponse> {
    return this.post(`/lessons/${lessonId}/items`, data);
  }

  /**
   * Get lesson progress for student
   */
  async getProgress(lessonId: number | string, studentId: string): Promise<APIResponse> {
    return this.get(`/lessons/${lessonId}/progress?student_id=${studentId}`);
  }

  /**
   * Update lesson progress
   */
  async updateProgress(lessonId: number | string, studentId: string, data: any): Promise<APIResponse> {
    return this.patch(`/lessons/${lessonId}/progress?student_id=${studentId}`, data);
  }
}

/**
 * Student Service
 */
class StudentService extends APIClient {
  constructor() {
    super('/api/student');
  }

  /**
   * Get student ID from localStorage
   */
  private getStudentId(): string {
    if (typeof window === 'undefined') return '';
    const savedUser = localStorage.getItem('nllc_user');
    if (!savedUser) {
      console.warn('No nllc_user found in localStorage for StudentService');
      return '';
    }
    try {
      const user = JSON.parse(savedUser);
      return user.id || '';
    } catch {
      console.warn('Failed to parse nllc_user from localStorage');
      return '';
    }
  }

  /**
   * Override request to add student ID header
   */
  private async requestWithStudentId<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const studentId = this.getStudentId();
    
    if (!studentId) {
      throw new Error('Student ID required - user session not found');
    }
    
    const headers = {
      ...options.headers,
      'x-student-id': studentId,
    };

    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API Error: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Request Failed: ${url}`, error);
      throw error;
    }
  }

  private getWithStudentId<T>(endpoint: string): Promise<T> {
    return this.requestWithStudentId<T>(endpoint, { method: 'GET' });
  }

  private postWithStudentId<T>(endpoint: string, body: any): Promise<T> {
    return this.requestWithStudentId<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private patchWithStudentId<T>(endpoint: string, body: any): Promise<T> {
    return this.requestWithStudentId<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get student by ID
   */
  async fetchById(studentId: string): Promise<APIResponse> {
    return this.get(`/${studentId}`);
  }

  /**
   * Get student's teacher info
   */
  async getTeacherInfo(studentId: string): Promise<APIResponse> {
    return this.get(`/teacher-info?studentId=${studentId}`);
  }

  /**
   * Get student details (teacher view)
   */
  async getDetails(studentId: string): Promise<APIResponse> {
    return this.get(`/teacher-info?studentId=${studentId}`);
  }

  /**
   * Get student enrollment
   */
  async getEnrollment(studentId: string): Promise<APIResponse> {
    return this.get(`/enrollment`);
  }

  /**
   * Update student enrollment
   */
  async updateEnrollment(studentId: string, data: any): Promise<APIResponse> {
    return this.patch(`/enrollment`, data);
  }

  /**
   * Get enrolled classes
   */
  async getEnrolledClasses(studentId: string): Promise<APIResponse> {
    return this.get(`/enrolled-classes?studentId=${studentId}`);
  }

  /**
   * Get bahagis for a teacher (for students)
   */
  async getBahagis(studentId: string, teacherId: string): Promise<APIResponse> {
    return this.get(`/bahagis?studentId=${studentId}&teacherId=${teacherId}`);
  }

  /**
   * Get teacher lessons (bahagi) for student
   */
  async getTeacherLessons(studentId: string, teacherId: string): Promise<APIResponse> {
    return this.get(`/teacher-lessons?studentId=${studentId}&teacherId=${teacherId}`);
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(timeframe: 'week' | 'month' | 'all' = 'all'): Promise<APIResponse> {
    return this.getWithStudentId(`/leaderboard?timeframe=${timeframe}`);
  }

  /**
   * Get student missions
   */
  async getMissions(): Promise<APIResponse> {
    return this.getWithStudentId(`/missions`);
  }

  /**
   * Get shop items
   */
  async getShopItems(): Promise<APIResponse> {
    return this.getWithStudentId(`/shop-items`);
  }

  /**
   * Purchase item from shop
   */
  async purchaseItem(itemId: string, quantity: number = 1): Promise<APIResponse> {
    return this.postWithStudentId(`/shop-items/purchase`, { itemId, quantity });
  }

  /**
   * Get student avatar customization
   */
  async getAvatarCustomization(): Promise<APIResponse> {
    return this.getWithStudentId(`/avatar`);
  }

  /**
   * Save avatar customization
   */
  async saveAvatarCustomization(customization: any): Promise<APIResponse> {
    return this.patchWithStudentId(`/avatar`, customization);
  }

  /**
   * Complete mission
   */
  async completeMission(missionId: string): Promise<APIResponse> {
    return this.postWithStudentId(`/missions/${missionId}/complete`, {});
  }

  /**
   * Get student XP and coins
   */
  async getStats(): Promise<APIResponse> {
    return this.getWithStudentId(`/stats`);
  }
}

/**
 * Assignment/Link Service for teacher resources
 */
class ResourceService extends APIClient {
  constructor() {
    super('/api/rest');
  }

  /**
   * Fetch all lesson links
   */
  async fetchLinks(): Promise<APIResponse> {
    return this.get(`/resources/links`);
  }

  /**
   * Create lesson link
   */
  async createLink(data: any): Promise<APIResponse> {
    return this.post(`/resources/links`, data);
  }

  /**
   * Update lesson link
   */
  async updateLink(linkId: string | number, data: any): Promise<APIResponse> {
    return this.patch(`/resources/links/${linkId}`, data);
  }

  /**
   * Delete lesson link
   */
  async deleteLink(linkId: string | number): Promise<APIResponse> {
    return this.delete(`/resources/links/${linkId}`);
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(assignmentId: string): Promise<APIResponse> {
    return this.get(`/resources/assignments/${assignmentId}/stats`);
  }

  /**
   * Fetch all assignments (teacher)
   */
  async fetchAssignments(): Promise<APIResponse> {
    return this.get(`/resources/assignments`);
  }
}

/**
 * Teacher Stats Service
 */
class TeacherStatsService extends APIClient {
  constructor() {
    super('/api/teacher');
  }

  /**
   * Get teacher dashboard stats
   */
  async getStats(teacherId: string): Promise<APIResponse> {
    return this.get(`/stats?teacherId=${teacherId}`);
  }

  /**
   * Get class statistics
   */
  async getClassStats(classId: string): Promise<APIResponse> {
    return this.get(`/class-stats?classId=${classId}`);
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(assignmentId: string): Promise<APIResponse> {
    return this.get(`/assignment-stats?assignment_id=${assignmentId}`);
  }

  /**
   * Get student performance in teacher view
   */
  async getStudentPerformance(studentId: string): Promise<APIResponse> {
    return this.get(`/student-performance?student_id=${studentId}`);
  }
}

/**
 * Export singleton instances
 */
export const apiClient = {
  bahagi: new BahagiAPI(),
  yunit: new YunitAPI(),
  assessment: new AssessmentAPI(),
  analytics: new AnalyticsAPI(),
  upload: new UploadAPI(),
  user: new UserAPI(),
  avatar: new AvatarAPI(),
  admin: new AdminAPI(),
  class: new ClassService(),
  lesson: new LessonService(),
  student: new StudentService(),
  resource: new ResourceService(),
  teacherStats: new TeacherStatsService(),
};

export type { APIResponse };
export { APIClient, BahagiAPI, YunitAPI, AssessmentAPI, AnalyticsAPI, UploadAPI, UserAPI, AvatarAPI, AdminAPI, ClassService, LessonService, StudentService, ResourceService, TeacherStatsService };
