# NLCC Codebase Analysis Report

**Generated:** April 13, 2026

---

## ACTIVE PAGES

### Main Entry Point
- **[app/page.tsx](app/page.tsx)** - Single-page application root with portal router
  - Implements view states: `landing`, `auth`, `app`, `lesson`, `game`
  - Role-based auto-redirect: ADMIN → AdminDashboard, TEACHER → TeacherDashboardV2, STUDENT → StudentDashboard
  - Session persistence via localStorage (`nllc_user`)
  - Maintenance mode support

### Supporting Pages
- [app/layout.tsx](app/layout.tsx) - Root layout wrapper
- No traditional pages directory (uses Next.js 13+ app router only)

---

## UNUSED/DUPLICATE PAGES & COMPONENTS

### Deprecated Dashboard (Replaced)
- **[app/components/TeacherDashboard.tsx](app/components/TeacherDashboard.tsx)** - UNUSED
  - Superseded by TeacherDashboardV2
  - Status: Legacy, not imported in app/page.tsx
  - Recommendation: Remove or archive

### Disabled Components
- **[app/components/StudentProfileWithAvatar.tsx.disabled](app/components/StudentProfileWithAvatar.tsx.disabled)** - DISABLED
  - File extension `.disabled` marks it as inactive
  - Recommendation: Convert to active or remove

---

## ADMIN PORTAL

### Entry Point
- [app/components/AdminDashboard.tsx](app/components/AdminDashboard.tsx)

### Components & Functionality
| Feature | Status | Details |
|---------|--------|---------|
| **Overview Tab** | ✓ Active | Dashboard statistics, charts, recent activities |
| **Users Management** | ✓ Active | Create students/teachers, manage permissions |
| **Settings** | ✓ Active | Maintenance mode, signup controls |
| **Student Creation** | ✓ Active | Form with LRN validation, class/teacher assignment |
| **Teacher Creation** | ✓ Active | Form with class name assignment |
| **Activity Logs** | ✓ Active | Paginated activity tracking |
| **Role-based Search** | ✓ Active | Filter users by role (ADMIN, TEACHER, USER/STUDENT) |

### Subcomponents Used
- None (monolithic component)

### Missing Components
- **User Profile Management** - Individual user detail view with edit capability
- **Analytics Dashboard** - Advanced analytics and reporting
- **System Health Monitor** - Server metrics, database status
- **Audit Logs** - Detailed system audit trail
- **Batch Operations** - Bulk user import/export

---

## TEACHER PORTAL

### Entry Point
- [app/components/TeacherDashboardV2.tsx](app/components/TeacherDashboardV2.tsx) (ACTIVE)
- Legacy: [app/components/TeacherDashboard.tsx](app/components/TeacherDashboard.tsx) (UNUSED)

### Main Components

#### Navigation & Layout
- [TeacherComponents/TeacherSidebar.tsx](app/components/TeacherComponents/TeacherSidebar.tsx) - Main navigation

#### Dashboard Sections
- [TeacherComponents/TeacherOverviewPage.tsx](app/components/TeacherComponents/TeacherOverviewPage.tsx) - Stats, charts, class overview
- [TeacherComponents/TeacherClassesPage.tsx](app/components/TeacherComponents/TeacherClassesPage.tsx) - Class listing and management
- [TeacherComponents/TeacherProfilePage.tsx](app/components/TeacherComponents/TeacherProfilePage.tsx) - Teacher profile settings

#### Class Management
- [TeacherComponents/ClassDetailPage.tsx](app/components/TeacherComponents/ClassDetailPage.tsx) - Class details and bahagi/lesson management
- [TeacherComponents/ManageClassStudents.tsx](app/components/TeacherComponents/ManageClassStudents.tsx) - Manage class enrollment

#### Content Management - Bahagi (Module)
- [TeacherComponents/CreateBahagiForm.tsx](app/components/TeacherComponents/CreateBahagiForm.tsx) - Create new bahagi
- [TeacherComponents/EditBahagiForm.tsx](app/components/TeacherComponents/EditBahagiForm.tsx) - Edit existing bahagi
- [TeacherComponents/EnhancedBahagiCard.tsx](app/components/TeacherComponents/EnhancedBahagiCard.tsx) - Display bahagi (v1)
- [TeacherComponents/EnhancedBahagiCardV2.tsx](app/components/TeacherComponents/EnhancedBahagiCardV2.tsx) - Display bahagi (v2)
- [TeacherComponents/BahagiIconSelector.tsx](app/components/TeacherComponents/BahagiIconSelector.tsx) - Icon selection for bahagi

#### Content Management - Yunit (Lesson Unit)
- [TeacherComponents/CreateYunitForm.tsx](app/components/TeacherComponents/CreateYunitForm.tsx) - Create new yunit
- [TeacherComponents/EditYunitForm.tsx](app/components/TeacherComponents/EditYunitForm.tsx) - Edit existing yunit
- [TeacherComponents/StudentYunitView.tsx](app/components/TeacherComponents/StudentYunitView.tsx) - View yunit content

#### Assessment Management
- [TeacherComponents/CreateAssessmentForm.tsx](app/components/TeacherComponents/CreateAssessmentForm.tsx) - Create new assessment
- [TeacherComponents/EditAssessmentForm.tsx](app/components/TeacherComponents/EditAssessmentForm.tsx) - Edit assessment (v1)
- [TeacherComponents/EditAssessmentV2Form.tsx](app/components/TeacherComponents/EditAssessmentV2Form.tsx) - Edit assessment (v2)
- [TeacherComponents/AssessmentDisplay.tsx](app/components/TeacherComponents/AssessmentDisplay.tsx) - Display assessment
- [TeacherComponents/AssessmentAnswerSubmission.tsx](app/components/TeacherComponents/AssessmentAnswerSubmission.tsx) - View student submissions
- [TeacherComponents/RandomizedAssessment.tsx](app/components/TeacherComponents/RandomizedAssessment.tsx) - Randomized assessment logic
- [TeacherComponents/TimedAssessment.tsx](app/components/TeacherComponents/TimedAssessment.tsx) - Timed assessment implementation

#### Analytics & Grading
- [TeacherComponents/TeacherAnalyticsDashboard.tsx](app/components/TeacherComponents/TeacherAnalyticsDashboard.tsx) - Student analytics and progress
- [TeacherComponents/StudentGradebook.tsx](app/components/TeacherComponents/StudentGradebook.tsx) - Grade tracking and management

#### Utilities
- [TeacherComponents/RichTextEditor.tsx](app/components/TeacherComponents/RichTextEditor.tsx) - Rich text editing with `SimpleTextEditor` export
- [TeacherComponents/DraftLessonManager.tsx](app/components/TeacherComponents/DraftLessonManager.tsx) - Draft lesson management

#### Legacy/Standalone Components
- [TeacherBahagi.tsx](app/components/TeacherBahagi.tsx) - Standalone bahagi component (may be legacy)
- [TeacherLessonEditor.tsx](app/components/TeacherLessonEditor.tsx) - Standalone lesson editor (may be legacy)

### Missing Components
- **Lesson Publishing Workflow** - Formal publish/unpublish with versioning
- **Content Duplication** - Copy lessons/assessments to new classes
- **Batch Assessment Creation** - Template-based bulk creation
- **Student Progress Comparison** - Comparative analytics across classes
- **Assignment Feedback System** - Detailed feedback on student submissions
- **Content Library** - Sharable content templates across teachers
- **Time Tracking** - Student engagement by time spent
- **Attendance Tracking** - Class attendance records

---

## STUDENT PORTAL

### Entry Point
- [app/components/StudentDashboard.tsx](app/components/StudentDashboard.tsx)

### Tab-Based Navigation

#### Dashboard Tabs
| Tab | Component | Status |
|-----|-----------|--------|
| **lessons** | StudentComponents/[various] | ✓ Active |
| **magaral** | StudentComponents/MagAralPage.tsx | ✓ Active |
| **leaders** | N/A | 🔜 Coming Soon |
| **missions** | N/A | 🔜 Coming Soon |
| **store** | N/A | 🔜 Coming Soon |
| **avatar** | (placeholder) | 🔜 Coming Soon |
| **profile** | (inline) | ✓ Active |

### Active Student Components

#### Lesson & Content Management
- [StudentComponents/StudentLessonsPage.tsx](app/components/StudentComponents/StudentLessonsPage.tsx) - Main lesson listing
- [StudentComponents/LessonCard.tsx](app/components/StudentComponents/LessonCard.tsx) - Individual lesson card
- [StudentComponents/TeacherLessonsView.tsx](app/components/StudentComponents/TeacherLessonsView.tsx) - Teacher's lesson view for students
- [StudentComponents/MagAralPage.tsx](app/components/StudentComponents/MagAralPage.tsx) - Learning content page ("MagAral" = Learn in Tagalog)

#### Bahagi (Module) Navigation
- [StudentComponents/BahagiView.tsx](app/components/StudentComponents/BahagiView.tsx) - View bahagi content hierarchy

#### Class Management
- [StudentComponents/ClassView.tsx](app/components/StudentComponents/ClassView.tsx) - View class information

#### Yunit (Lesson Unit) Management
- [StudentComponents/YunitView.tsx](app/components/StudentComponents/YunitView.tsx) - Interactive yunit viewing
- [StudentComponents/StudentYunitView.tsx](app/components/StudentComponents/StudentYunitView.tsx) - Alternative yunit view (in TeacherComponents, reused)

#### Assessment
- [StudentComponents/AssessmentScreen.tsx](app/components/StudentComponents/AssessmentScreen.tsx) - Take assessments
- [AssessmentModal.tsx](app/components/AssessmentModal.tsx) - Assessment modal interface

#### Rewards & Achievements
- [StudentComponents/RewardModal.tsx](app/components/StudentComponents/RewardModal.tsx) - Display rewards/achievements

### Standalone Student-Related Components
- [StudentProfileWithAvatar.tsx.disabled](app/components/StudentProfileWithAvatar.tsx.disabled) - (DISABLED)
- [ProfilePage.tsx](app/components/ProfilePage.tsx) - Generic profile page

### Missing Components (Coming Soon placeholders in code)
1. **Leaderboard** - Ranking system (leaders tab)
2. **Mission System** - Gamified mission tracker (missions tab)
3. **Shop System** - Avatar item store (store tab)
4. **Avatar Customization** - Full avatar editor (avatar tab - partial stub exists)
5. **Progress Tracking** - Detailed progress analytics
6. **Achievement Badges** - Visual achievement system
7. **Social Features** - Peer interaction, messaging
8. **Content Recommendations** - AI-based lesson recommendations

---

## API ENDPOINTS

### API Organization Structure
```
/api/
  ├── admin/          - Admin operations
  ├── auth/           - Authentication (single route)
  ├── lessons/        - Lesson fetching
  ├── rest/           - Unified REST API (primary)
  ├── student/        - Student-specific operations
  ├── teacher/        - Teacher-specific operations
  ├── tutor/          - Tutor operations (if applicable)
  ├── upload/         - File uploads
  └── user/           - User operations
```

### Admin API - `/api/admin/`

| Endpoint | Type | Purpose |
|----------|------|---------|
| activities/ | GET/POST | System activity logging |
| classes/ | GET/POST/PATCH/DELETE | Class management |
| create-student/ | POST | Create new student |
| create-teacher/ | POST | Create new teacher |
| migrations/ | GET/POST | Data migrations |
| settings/ | GET/POST/PATCH | System settings (maintenance mode, signup) |
| stats/ | GET | Dashboard statistics |
| teachers/ | GET/POST/PATCH/DELETE | Teacher management |
| users/ | GET/POST/PATCH/DELETE | User management |

### Auth API - `/api/auth/`

| Endpoint | Type | Purpose |
|----------|------|---------|
| route.ts | POST | Authentication/Login |

### Lessons API - `/api/lessons/`

| Endpoint | Type | Purpose |
|----------|------|---------|
| route.ts | GET | Fetch lessons |
| [id]/route.ts | GET | Fetch lesson by ID |

### Teacher API - `/api/teacher/`

**CRUD Operations:**
- add-lesson-item/
- create-assessment/
- create-assessment-yunit/
- create-assignment/
- create-bahagi/
- create-class/
- create-lesson/
- create-yunit/
- create-yunit-bahagi/
- delete-assessment/
- delete-assignment/
- delete-bahagi/
- delete-lesson/
- delete-yunit/
- edit-assessment/
- update-assessment/
- update-bahagi/
- update-lesson/
- update-yunit/

**Query & Management:**
- assessments/
- bahagis/
- bahagi-yunits/
- class-bahagi/
- class-lessons/
- class-students/
- lesson/
- lesson-links/
- publish-lesson/
- publish-yunit/
- publish-assessment/
- yunits/
- yunit-assessments/

**Admin Functions:**
- analytics/
- archive-assessment/
- archive-bahagi/
- archive-yunit/
- manage-assessment/
- manage-yunit/
- search-students/
- student-detail/
- unenroll-student/

**Student Management:**
- available-students/

**Grading & Validation:**
- gradebook/
- validate-answer/
- validate-answer-enhanced/

**Utility:**
- assignment-stats/
- reward/
- upload-media/
- bahagi-icon/

### Student API - `/api/student/`

**Lesson & Content:**
- assessment/
- assessments/
- avatar/
- avatar-items/
- bahagi/
- bahagis/
- get-lessons/
- lesson/
- teacher-lessons/
- yunits/

**Learning Activities:**
- enrolled-classes/
- submit-assessment/
- teacher-info/

**Progress & Rewards:**
- progress/
- rewards/

### User API - `/api/user/`

| Endpoint | Type | Purpose |
|----------|------|---------|
| lesson-progress/ | GET | Track lesson progress |
| route.ts | GET/POST | User profile operations |
| stats/ | GET | User statistics |
| submit-assignment/ | POST | Submit assignment |

### REST API - `/api/rest/` (Unified)

**Bahagi (Modules):**
- bahagis/ - CRUD operations
- bahagis/{id} - Single bahagi operations

**Yunit (Lesson Units):**
- yunits/ - CRUD operations
- yunits/{id} - Single yunit operations

**Assessment:**
- assessments/ - CRUD operations
- assessments/{id} - Single assessment operations

**Additional Routes:**
- upload/
- analytics/
- stats/

### Upload API - `/api/upload/`

- Media file uploads for lessons, assessments, avatars

### Tutor API - `/api/tutor/`

| Endpoint | Type | Purpose |
|----------|------|---------|
| route.ts | POST | Tutor/AI interaction |

---

## MODULES/FEATURES INVENTORY

### Core Learning Modules

#### 1. **Bahagi (Subject Module)**
- **Purpose:** Organize content by subject/topic
- **Status:** ✓ Fully Implemented
- **Components:** 
  - Creation: `CreateBahagiForm`, `TeacherBahagi`
  - Management: `EditBahagiForm`, `EnhancedBahagiCard`, `EnhancedBahagiCardV2`
  - Display: `BahagiView`, `BahagiCard`
- **API:** `/api/rest/bahagis/*`, `/api/teacher/bahagis/*`, `/api/student/bahagis/*`
- **Service:** `BahagiService` in `lib/services/`
- **Features:**
  - Create, read, update, delete (CRUD)
  - Archive/restore functionality
  - Publish/unpublish
  - Icon selection
  - Teacher-scoped filtering

#### 2. **Yunit (Lesson Unit)**
- **Purpose:** Individual lesson content units within Bahagi
- **Status:** ✓ Fully Implemented
- **Components:**
  - Creation: `CreateYunitForm`
  - Management: `EditYunitForm`, `StudentYunitView`
  - Display: `YunitView`
- **API:** `/api/rest/yunits/*`, `/api/teacher/yunits/*`
- **Service:** `YunitService` in `lib/services/`
- **Features:**
  - CRUD operations
  - Archive/restore
  - Media attachments
  - Student answer tracking
  - Hierarchical structure (Bahagi → Yunit)

#### 3. **Assessment System**
- **Purpose:** Student evaluation and testing
- **Status:** ✓ Fully Implemented
- **Components:**
  - Creation: `CreateAssessmentForm`
  - Management: `EditAssessmentForm`, `EditAssessmentV2Form`
  - Delivery: `AssessmentModal`, `AssessmentScreen`, `TimedAssessment`, `RandomizedAssessment`
  - Teacher Review: `AssessmentDisplay`, `AssessmentAnswerSubmission`
  - Grading: `StudentGradebook`
- **API:** 
  - Student: `/api/student/assessment*`, `/api/student/submit-assessment/`
  - Teacher: `/api/teacher/assessment*`, `/api/teacher/create-assessment/*`
  - Validation: `/api/teacher/validate-answer*`
- **Service:** `AssessmentService` in `lib/services/`
- **Features:**
  - Multiple question types
  - Time-limited assessments
  - Randomized question orders
  - Automatic validation and grading
  - Student submission tracking
  - Answer review

#### 4. **Avatar System**
- **Purpose:** Student personalization and gamification
- **Status:** ✓ Partially Implemented (Customization placeholder in Dashboard)
- **Components:**
  - Display: `AvatarDisplay`
  - Customization: `AvatarCustomization`
  - Shop: `AvatarShop`
- **API:** 
  - `/api/student/avatar/`, `/api/student/avatar-items/`
  - `/api/teacher/reward/`
- **Features:**
  - Avatar display system
  - Customization options (in progress)
  - Item shop system
  - Reward integration

#### 5. **Gamification System**
- **Purpose:** Engagement through game mechanics
- **Status:** ✓ Fully Implemented
- **Components:**
  - Main Hub: `ForestGameMenu`, `GamePages`, `FloatingGameNav`
  - Individual Games:
    - `MemoryMatchGame` - Memory matching
    - `WordScrambleGame` - Word puzzle
    - `SyllableGame` - Syllable activities
    - `MissingLetterGame` - Letter recognition
    - `AdaptiveMindGame` - Adaptive challenge
  - Background/Visuals:
    - `MissionOneBackground`, `MissionTwoBackground`, `MissionThreeBackground`
    - `LessonBackground3D`, `QuestionBoard3D`
    - `ForestGameMenu` (3D environment)
  - Progress: `RewardModal`
- **Service:** `GamificationService` in `lib/services/`
- **Features:**
  - Mini-game collection
  - Reward tracking
  - Achievement unlocking
  - Multiple difficulty levels (adaptive)
  - 3D visual environments
  - Floating navigation

#### 6. **Voice/Audio Module**
- **Purpose:** Oral language practice
- **Status:** ✓ Implemented (component exists)
- **Components:** `VoiceModule`
- **Features:**
  - Voice input capturing
  - Word pronunciation practice
  - Feedback system

#### 7. **Class/Course Management** 
- **Purpose:** Organize students and content
- **Status:** ✓ Fully Implemented
- **Components:**
  - Teacher: `TeacherClassesPage`, `ClassDetailPage`, `ManageClassStudents`
  - Student: `ClassView`
- **API:**
  - `/api/admin/classes/`
  - `/api/teacher/class-*`
  - `/api/student/enrolled-classes/`
- **Features:**
  - Class CRUD
  - Student enrollment/unenrollment
  - Class-specific bahagis and lessons

#### 8. **Assignment System**
- **Purpose:** Teacher-assigned tasks
- **Status:** ✓ Implemented
- **Components:** `AssignmentsPage`
- **API:**
  - `/api/teacher/create-assignment/`, `/api/teacher/assignments/`
  - `/api/user/submit-assignment/`
- **Features:**
  - Create, edit, delete assignments
  - Due date tracking
  - Submission tracking
  - Assignment statistics

#### 9. **Analytics & Progress Tracking**
- **Purpose:** Monitor learning outcomes
- **Status:** ✓ Fully Implemented
- **Components:**
  - Teacher: `TeacherAnalyticsDashboard`, `StudentGradebook`
  - Dashboard: Stats and charts in overview pages
- **API:** `/api/rest/analytics/`, `/api/teacher/analytics/`, `/api/user/lesson-progress/`
- **Service:** `AnalyticsService` in `lib/services/`
- **Features:**
  - Student progress tracking
  - Grade analytics
  - Chart visualizations
  - Performance metrics

#### 10. **Authentication System**
- **Purpose:** Role-based access control
- **Status:** ✓ Fully Implemented
- **Components:** `LoginPage`, `AuthPage`
- **API:** `/api/auth/`
- **Roles:** ADMIN, TEACHER, STUDENT (USER)
- **Features:**
  - Email/password login
  - Session management (localStorage)
  - Role-based auto-redirect
  - Logout functionality

#### 11. **Lesson Publishing System**
- **Purpose:** Manage lesson lifecycle
- **Status:** ✓ Implemented
- **API:** 
  - `/api/teacher/publish-lesson/`, `/api/teacher/publish-yunit/`, `/api/teacher/publish-assessment/`
  - `/api/teacher/archive-*`
- **Features:**
  - Publish/unpublish lessons
  - Archive old content
  - Version control (in assessment)

### UI/UX Components

#### 3D Visual Components
- `Auth3DBackground` - Authentication page background
- `Landing3DParallax` - Landing page 3D parallax
- `Parent3DBackground` - Parent portal background
- `Student3DBackground` - Student dashboard background
- `MissionOneBackground`, `MissionTwoBackground`, `MissionThreeBackground` - Game backgrounds
- `LessonBackground3D` - Lesson viewing background
- `QuestionBoard3D` - Assessment UI background

#### Loading & Navigation
- `LoadingScreen` - Loading state with messages
- `SplashScreen` - App splash screen
- `FloatingGameNav` - Game floating menu

#### Utility Components
- `RichTextEditor` (with `SimpleTextEditor` export) - Content editing
- `BahagiIconSelector` - Icon picker

### Content Pages
- `LandingPage` - Welcome/intro page
- `LessonDetailPage` - Detailed lesson view
- `LessonScreen` - Interactive lesson interface
- `AchievementsPage` - Achievements display
- `ProfilePage` - User profile (generic)
- `SettingsPage` - Settings management

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| **Total Components** | 43 |
| **Student Components** | 9 |
| **Teacher Components** | 26 |
| **Active Pages** | 1 main + app/layout.tsx |
| **Unused Components** | 2 (TeacherDashboard.tsx, StudentProfileWithAvatar.tsx.disabled) |
| **API Route Groups** | 9 |
| **API Endpoints** | ~100+ (across all groups) |
| **Modules/Features** | 11 core modules |
| **Games** | 5 mini-games |
| **3D Components** | 8 visual components |
| **Services** | 5 business logic services |
| **Roles** | 3 (ADMIN, TEACHER, STUDENT) |

---

## RECOMMENDATIONS

### High Priority
1. **Remove unused TeacherDashboard.tsx** - Clean up deprecated code
2. **Activate StudentProfileWithAvatar.tsx** - Re-enable or remove the `.disabled` extension
3. **Complete Coming Soon placeholders** - Implement leaderboard, missions, store, avatar shop
4. **Consolidate BahagiCard variants** - Merge `EnhancedBahagiCard` and `EnhancedBahagiCardV2`
5. **Standardize assessment forms** - Merge `EditAssessmentForm` and `EditAssessmentV2Form`

### Medium Priority
1. **Separate legacy components** - Move `TeacherBahagi.tsx` and `TeacherLessonEditor.tsx` to legacy folder or integrate into TeacherComponents
2. **Add comprehensive error handling** - Centralize API error responses
3. **Implement content library** - Share lessons across teachers
4. **Create component documentation** - JSDoc and Storybook setup
5. **Add unit tests** - Services and components need test coverage

### Lower Priority
1. **Performance optimization** - Code-split large components
2. **Accessibility audit** - WCAG compliance
3. **Internationalization** - Full multi-language support beyond Tagalog
4. **API documentation** - Generate OpenAPI/Swagger docs
5. **Analytics enhancement** - Advanced reporting features

---

**End of Report**
