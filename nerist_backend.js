// ============================================
// NERIST ONE - COMPLETE BACKEND SYSTEM
// ============================================
// Unified backend with IndexedDB, localStorage, and real-time sync
// All functionality in one file

class NERISTBackend {
    constructor() {
        this.db = null;
        this.dbName = 'NERIST_One_DB';
        this.dbVersion = 5;
        this.currentUser = null;
        this.isInitialized = false;

        // Initialize immediately
        this.initialize();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    async initialize() {
        if (this.isInitialized) return this;

        try {
            // Initialize IndexedDB
            await this.initDatabase();

            // Check for existing session
            await this.restoreSession();

            // Seed initial data if needed
            await this.seedInitialData();

            this.isInitialized = true;
            console.log('NERIST Backend initialized successfully');

            // Make globally available
            window.neristBackend = this;

            // Start background sync
            this.startBackgroundSync();

            return this;
        } catch (error) {
            console.error('Backend initialization failed:', error);
            throw error;
        }
    }

    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = (event) => this.createObjectStores(event);
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
    }

    createObjectStores(event) {
        const db = event.target.result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
            const store = db.createObjectStore('users', { keyPath: 'id' });
            store.createIndex('username', 'username', { unique: true });
            store.createIndex('email', 'email', { unique: true });
            store.createIndex('role', 'role', { unique: false });
            store.createIndex('department', 'department', { unique: false });
        }

        // Attendance store
        if (!db.objectStoreNames.contains('attendance')) {
            const store = db.createObjectStore('attendance', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('subject', 'subject', { unique: false });
            store.createIndex('status', 'status', { unique: false });
        }

        // Mess menu store
        if (!db.objectStoreNames.contains('messMenu')) {
            const store = db.createObjectStore('messMenu', {
                keyPath: 'id'
            });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('mealType', 'mealType', { unique: false });
            store.createIndex('date_meal', ['date', 'mealType'], { unique: true });
        }

        // Career opportunities store
        if (!db.objectStoreNames.contains('careerOpportunities')) {
            const store = db.createObjectStore('careerOpportunities', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('deadline', 'deadline', { unique: false });
            store.createIndex('status', 'status', { unique: false });
        }

        // Student applications store
        if (!db.objectStoreNames.contains('studentApplications')) {
            const store = db.createObjectStore('studentApplications', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('opportunityId', 'opportunityId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
        }

        // Results store
        if (!db.objectStoreNames.contains('results')) {
            const store = db.createObjectStore('results', {
                keyPath: 'id'
            });
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('semester', 'semester', { unique: false });
            store.createIndex('student_semester', ['studentId', 'semester'], { unique: true });
        }

        // Campus alerts store
        if (!db.objectStoreNames.contains('campusAlerts')) {
            const store = db.createObjectStore('campusAlerts', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('priority', 'priority', { unique: false });
            store.createIndex('expiry', 'expiry', { unique: false });
            store.createIndex('isActive', 'isActive', { unique: false });
        }

        // Emergency contacts store
        if (!db.objectStoreNames.contains('emergencyContacts')) {
            const store = db.createObjectStore('emergencyContacts', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
        }

        // Campus locations store
        if (!db.objectStoreNames.contains('campusLocations')) {
            const store = db.createObjectStore('campusLocations', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
        }

        // System settings store
        if (!db.objectStoreNames.contains('systemSettings')) {
            db.createObjectStore('systemSettings', { keyPath: 'key' });
        }

        // Activity log store
        if (!db.objectStoreNames.contains('activityLog')) {
            const store = db.createObjectStore('activityLog', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('action', 'action', { unique: false });
        }

        // Meal bookings store
        if (!db.objectStoreNames.contains('mealBookings')) {
            const store = db.createObjectStore('mealBookings', {
                keyPath: 'id'
            });
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('date_meal', ['date', 'mealType'], { unique: false });
        }

        // Attendance reports store
        if (!db.objectStoreNames.contains('attendanceReports')) {
            const store = db.createObjectStore('attendanceReports', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('date', 'date', { unique: false });
        }
    }

    // ============================================
    // DATABASE OPERATION HELPERS
    // ============================================

    async executeTransaction(storeName, mode, operation) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            operation(store);
        });
    }

    async getObject(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllObjects(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request;
            if (indexName && query) {
                const index = store.index(indexName);
                request = index.getAll(query);
            } else if (indexName) {
                const index = store.index(indexName);
                request = index.getAll();
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async putObject(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteObject(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async countObjects(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request;
            if (indexName && query) {
                const index = store.index(indexName);
                request = index.count(query);
            } else if (indexName) {
                const index = store.index(indexName);
                request = index.count();
            } else {
                request = store.count();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    async registerUser(userData) {
        try {
            // Validate required fields
            if (!userData.username || !userData.password || !userData.email || !userData.role) {
                throw new Error('Missing required fields');
            }

            // Check if username or email already exists
            const existingUser = await this.getUserByUsername(userData.username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            const existingEmail = await this.getUserByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email already registered');
            }

            // Generate user ID
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create user object
            const user = {
                id: userId,
                username: userData.username,
                password: this.hashPassword(userData.password), // In production, use proper hashing
                email: userData.email,
                name: userData.name || userData.username,
                role: userData.role,
                department: userData.department || '',
                year: userData.year || '',
                avatarColor: userData.avatarColor || 'primary',
                emailPreferences: userData.emailPreferences || {
                    attendance: true,
                    mess: true,
                    career: true,
                    alerts: true
                },
                notificationSettings: userData.notificationSettings || {
                    pushEnabled: true,
                    soundEnabled: true,
                    vibrationEnabled: true
                },
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true
            };

            // Save to database
            await this.putObject('users', user);

            // Log activity
            await this.logActivity(userId, 'register', 'User registered');

            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            // Get user by username
            const user = await this.getUserByUsername(username);

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Verify password (in production, use proper password verification)
            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword) {
                throw new Error('Invalid password');
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            await this.putObject('users', user);

            // Create session
            await this.createSession(user);

            // Log activity
            await this.logActivity(user.id, 'login', 'User logged in');

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            this.currentUser = userWithoutPassword;

            return userWithoutPassword;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            if (this.currentUser) {
                await this.logActivity(this.currentUser.id, 'logout', 'User logged out');
            }

            localStorage.removeItem('nerist_session');
            localStorage.removeItem('nerist_token');
            this.currentUser = null;

            return true;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            // Check if already in memory
            if (this.currentUser) {
                return this.currentUser;
            }

            // Check session
            const session = localStorage.getItem('nerist_session');
            if (!session) {
                return null;
            }

            const sessionData = JSON.parse(session);
            const user = await this.getUserById(sessionData.userId);

            if (user && user.isActive) {
                const { password, ...userWithoutPassword } = user;
                this.currentUser = userWithoutPassword;
                return userWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    async getUserById(userId) {
        return this.getObject('users', userId);
    }

    async getUserByUsername(username) {
        const users = await this.getAllObjects('users', 'username', username);
        return users[0] || null;
    }

    async getUserByEmail(email) {
        const users = await this.getAllObjects('users', 'email', email);
        return users[0] || null;
    }

    async updateUserProfile(userId, updates) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Prevent updating certain fields
            const restrictedFields = ['id', 'username', 'role', 'createdAt'];
            restrictedFields.forEach(field => {
                if (updates[field]) {
                    delete updates[field];
                }
            });

            // Update user
            const updatedUser = { ...user, ...updates };
            await this.putObject('users', updatedUser);

            // Log activity
            await this.logActivity(userId, 'update_profile', 'Profile updated');

            // Return without password
            const { password, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify old password
            if (user.password !== this.hashPassword(oldPassword)) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = this.hashPassword(newPassword);
            await this.putObject('users', user);

            // Log activity
            await this.logActivity(userId, 'change_password', 'Password changed');

            return true;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    // ============================================
    // ATTENDANCE SYSTEM
    // ============================================

    async markAttendance(attendanceData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const attendance = {
                studentId: attendanceData.studentId,
                date: attendanceData.date || new Date().toISOString().split('T')[0],
                subject: attendanceData.subject,
                status: attendanceData.status || 'present',
                time: attendanceData.time || new Date().toLocaleTimeString('en-IN'),
                markedBy: currentUser.id,
                timestamp: new Date().toISOString(),
                semester: attendanceData.semester,
                branch: attendanceData.branch,
                remarks: attendanceData.remarks || ''
            };

            await this.putObject('attendance', attendance);

            // Log activity
            await this.logActivity(currentUser.id, 'mark_attendance',
                `Marked ${attendance.status} for ${attendance.studentId}`);

            return attendance;
        } catch (error) {
            console.error('Mark attendance error:', error);
            throw error;
        }
    }

    async getAttendanceForStudent(studentId, startDate = null, endDate = null) {
        try {
            let attendance = await this.getAllObjects('attendance', 'studentId', studentId);

            // Filter by date range
            if (startDate) {
                attendance = attendance.filter(a => a.date >= startDate);
            }
            if (endDate) {
                attendance = attendance.filter(a => a.date <= endDate);
            }

            // Sort by date (newest first)
            attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

            return attendance;
        } catch (error) {
            console.error('Get attendance error:', error);
            throw error;
        }
    }

    async getAttendanceByDate(date, subject = null) {
        try {
            let attendance = await this.getAllObjects('attendance', 'date', date);

            if (subject) {
                attendance = attendance.filter(a => a.subject === subject);
            }

            return attendance;
        } catch (error) {
            console.error('Get attendance by date error:', error);
            throw error;
        }
    }

    async getAttendanceStats(studentId, period = 'month') {
        try {
            const attendance = await this.getAttendanceForStudent(studentId);

            if (attendance.length === 0) {
                return {
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    percentage: 0
                };
            }

            const total = attendance.length;
            const present = attendance.filter(a => a.status === 'present').length;
            const absent = attendance.filter(a => a.status === 'absent').length;
            const late = attendance.filter(a => a.status === 'late').length;
            const percentage = Math.round((present / total) * 100);

            return {
                total,
                present,
                absent,
                late,
                percentage
            };
        } catch (error) {
            console.error('Get attendance stats error:', error);
            throw error;
        }
    }

    async updateAttendance(attendanceId, updates) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const attendance = await this.getObject('attendance', attendanceId);
            if (!attendance) {
                throw new Error('Attendance record not found');
            }

            // Update record
            const updatedAttendance = {
                ...attendance,
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.id
            };

            await this.putObject('attendance', updatedAttendance);

            // Log activity
            await this.logActivity(currentUser.id, 'update_attendance',
                `Updated attendance record ${attendanceId}`);

            return updatedAttendance;
        } catch (error) {
            console.error('Update attendance error:', error);
            throw error;
        }
    }

    async deleteAttendance(attendanceId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            await this.deleteObject('attendance', attendanceId);

            // Log activity
            await this.logActivity(currentUser.id, 'delete_attendance',
                `Deleted attendance record ${attendanceId}`);

            return true;
        } catch (error) {
            console.error('Delete attendance error:', error);
            throw error;
        }
    }

    // ============================================
    // MESS MANAGEMENT SYSTEM
    // ============================================

    async saveMessMenu(date, mealData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const menuId = `${date}_${mealData.mealType}`;
            const menu = {
                id: menuId,
                date: date,
                mealType: mealData.mealType,
                items: mealData.items || [],
                predictedDemand: mealData.predictedDemand || 50,
                active: mealData.active !== undefined ? mealData.active : true,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                bookings: [],
                feedback: []
            };

            await this.putObject('messMenu', menu);

            // Log activity
            await this.logActivity(currentUser.id, 'save_mess_menu',
                `Saved ${mealData.mealType} menu for ${date}`);

            return menu;
        } catch (error) {
            console.error('Save mess menu error:', error);
            throw error;
        }
    }

    async getMessMenu(date, mealType = null) {
        try {
            let menus;
            if (mealType) {
                // Get specific meal
                const menuId = `${date}_${mealType}`;
                const menu = await this.getObject('messMenu', menuId);
                menus = menu ? [menu] : [];
            } else {
                // Get all meals for date
                menus = await this.getAllObjects('messMenu', 'date', date);
            }

            return menus;
        } catch (error) {
            console.error('Get mess menu error:', error);
            throw error;
        }
    }

    async getMessMenuForWeek(startDate) {
        try {
            const weekMenus = [];
            const start = new Date(startDate);

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                const menus = await this.getMessMenu(dateStr);
                weekMenus.push({
                    date: dateStr,
                    day: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    menus: menus
                });
            }

            return weekMenus;
        } catch (error) {
            console.error('Get mess menu for week error:', error);
            throw error;
        }
    }

    async bookMeal(date, mealType, studentId) {
        try {
            const menuId = `${date}_${mealType}`;
            const menu = await this.getObject('messMenu', menuId);

            if (!menu) {
                throw new Error('Menu not found');
            }

            if (!menu.active) {
                throw new Error('This meal is not active');
            }

            // Check if already booked
            const existingBooking = menu.bookings.find(b => b.studentId === studentId);
            if (existingBooking) {
                throw new Error('Already booked for this meal');
            }

            // Add booking
            menu.bookings.push({
                studentId: studentId,
                bookedAt: new Date().toISOString()
            });

            menu.bookedCount = menu.bookings.length;
            menu.updatedAt = new Date().toISOString();

            await this.putObject('messMenu', menu);

            // Log in meal bookings store
            const bookingId = `${date}_${mealType}_${studentId}`;
            await this.putObject('mealBookings', {
                id: bookingId,
                date: date,
                mealType: mealType,
                studentId: studentId,
                bookedAt: new Date().toISOString()
            });

            // Log activity
            await this.logActivity(studentId, 'book_meal',
                `Booked ${mealType} for ${date}`);

            return menu;
        } catch (error) {
            console.error('Book meal error:', error);
            throw error;
        }
    }

    async submitMealFeedback(date, mealType, studentId, rating, comment) {
        try {
            const menuId = `${date}_${mealType}`;
            const menu = await this.getObject('messMenu', menuId);

            if (!menu) {
                throw new Error('Menu not found');
            }

            // Add feedback
            menu.feedback.push({
                studentId: studentId,
                rating: rating,
                comment: comment,
                submittedAt: new Date().toISOString()
            });

            // Calculate average rating
            if (menu.feedback.length > 0) {
                const totalRating = menu.feedback.reduce((sum, f) => sum + f.rating, 0);
                menu.averageRating = (totalRating / menu.feedback.length).toFixed(1);
            }

            menu.updatedAt = new Date().toISOString();
            await this.putObject('messMenu', menu);

            // Log activity
            await this.logActivity(studentId, 'meal_feedback',
                `Submitted feedback for ${mealType}`);

            return menu;
        } catch (error) {
            console.error('Submit meal feedback error:', error);
            throw error;
        }
    }

    async getMealBookings(studentId, date = null) {
        try {
            let bookings = await this.getAllObjects('mealBookings', 'studentId', studentId);

            if (date) {
                bookings = bookings.filter(b => b.date === date);
            }

            return bookings;
        } catch (error) {
            console.error('Get meal bookings error:', error);
            throw error;
        }
    }

    // ============================================
    // CAREER OPPORTUNITIES SYSTEM
    // ============================================

    async createCareerOpportunity(opportunityData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const opportunity = {
                ...opportunityData,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id,
                status: 'active',
                applicants: 0,
                views: 0
            };

            const result = await this.putObject('careerOpportunities', opportunity);

            // Log activity
            await this.logActivity(currentUser.id, 'create_opportunity',
                `Created opportunity: ${opportunityData.title}`);

            return { id: result, ...opportunity };
        } catch (error) {
            console.error('Create career opportunity error:', error);
            throw error;
        }
    }

    async getCareerOpportunities(filters = {}) {
        try {
            let opportunities = await this.getAllObjects('careerOpportunities');

            // Apply filters
            if (filters.type) {
                opportunities = opportunities.filter(opp => opp.type === filters.type);
            }

            if (filters.status) {
                opportunities = opportunities.filter(opp => opp.status === filters.status);
            }

            if (filters.department) {
                opportunities = opportunities.filter(opp =>
                    !opp.eligibleDepartments ||
                    opp.eligibleDepartments.includes(filters.department)
                );
            }

            // Filter expired opportunities
            const now = new Date();
            opportunities = opportunities.filter(opp => {
                if (!opp.deadline) return true;
                return new Date(opp.deadline) > now;
            });

            // Sort by deadline (earliest first)
            opportunities.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            });

            return opportunities;
        } catch (error) {
            console.error('Get career opportunities error:', error);
            throw error;
        }
    }

    async applyForOpportunity(opportunityId, studentData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            // Get opportunity
            const opportunity = await this.getObject('careerOpportunities', opportunityId);
            if (!opportunity) {
                throw new Error('Opportunity not found');
            }

            // Check if deadline passed
            if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
                throw new Error('Application deadline has passed');
            }

            // Check if already applied
            const existingApplications = await this.getAllObjects('studentApplications', 'studentId', currentUser.id);
            const alreadyApplied = existingApplications.some(app => app.opportunityId === opportunityId);

            if (alreadyApplied) {
                throw new Error('Already applied for this opportunity');
            }

            // Create application
            const application = {
                studentId: currentUser.id,
                studentName: currentUser.name,
                opportunityId: opportunityId,
                opportunityTitle: opportunity.title,
                appliedDate: new Date().toISOString(),
                status: 'pending',
                studentData: studentData,
                lastUpdated: new Date().toISOString()
            };

            const result = await this.putObject('studentApplications', application);

            // Update applicant count
            opportunity.applicants = (opportunity.applicants || 0) + 1;
            await this.putObject('careerOpportunities', opportunity);

            // Log activity
            await this.logActivity(currentUser.id, 'apply_opportunity',
                `Applied for: ${opportunity.title}`);

            return { id: result, ...application };
        } catch (error) {
            console.error('Apply for opportunity error:', error);
            throw error;
        }
    }

    async getStudentApplications(studentId = null, status = null) {
        try {
            let applications;
            if (studentId) {
                applications = await this.getAllObjects('studentApplications', 'studentId', studentId);
            } else {
                applications = await this.getAllObjects('studentApplications');
            }

            // Filter by status
            if (status) {
                applications = applications.filter(app => app.status === status);
            }

            // Sort by application date (newest first)
            applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

            return applications;
        } catch (error) {
            console.error('Get student applications error:', error);
            throw error;
        }
    }

    async updateApplicationStatus(applicationId, status, reviewNotes = null) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const application = await this.getObject('studentApplications', applicationId);
            if (!application) {
                throw new Error('Application not found');
            }

            // Update application
            application.status = status;
            application.reviewedAt = new Date().toISOString();
            application.reviewedBy = currentUser.id;

            if (reviewNotes) {
                application.reviewNotes = reviewNotes;
            }

            await this.putObject('studentApplications', application);

            // Log activity
            await this.logActivity(currentUser.id, 'update_application',
                `Updated application ${applicationId} to ${status}`);

            return application;
        } catch (error) {
            console.error('Update application status error:', error);
            throw error;
        }
    }

    // ============================================
    // RESULTS MANAGEMENT SYSTEM
    // ============================================

    async saveStudentResults(studentId, semester, resultsData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const resultsId = `${studentId}_${semester}`;
            const results = {
                id: resultsId,
                studentId: studentId,
                semester: semester,
                subjects: resultsData.subjects || [],
                sgpa: resultsData.sgpa || 0,
                creditsEarned: resultsData.creditsEarned || 0,
                totalCredits: resultsData.totalCredits || 0,
                publishedDate: new Date().toISOString(),
                publishedBy: currentUser.id,
                lastUpdated: new Date().toISOString()
            };

            // Calculate SGPA if not provided
            if (!resultsData.sgpa && resultsData.subjects) {
                let totalGradePoints = 0;
                let totalCredits = 0;

                resultsData.subjects.forEach(subject => {
                    const gradePoints = this.getGradePoints(subject.grade);
                    totalGradePoints += gradePoints * (subject.credits || 1);
                    totalCredits += subject.credits || 1;
                });

                results.sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
                results.creditsEarned = totalCredits;
            }

            await this.putObject('results', results);

            // Log activity
            await this.logActivity(currentUser.id, 'save_results',
                `Saved results for ${studentId}, Semester ${semester}`);

            return results;
        } catch (error) {
            console.error('Save student results error:', error);
            throw error;
        }
    }

    async getStudentResults(studentId, semester = null) {
        try {
            if (semester) {
                // Get specific semester
                const resultsId = `${studentId}_${semester}`;
                return await this.getObject('results', resultsId);
            } else {
                // Get all semesters
                const allResults = await this.getAllObjects('results', 'studentId', studentId);

                // Sort by semester
                allResults.sort((a, b) => a.semester - b.semester);

                // Calculate CGPA
                let totalGradePoints = 0;
                let totalCredits = 0;

                allResults.forEach(semesterResult => {
                    if (semesterResult.subjects) {
                        semesterResult.subjects.forEach(subject => {
                            const gradePoints = this.getGradePoints(subject.grade);
                            totalGradePoints += gradePoints * (subject.credits || 1);
                            totalCredits += subject.credits || 1;
                        });
                    }
                });

                const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

                return {
                    results: allResults,
                    cgpa: parseFloat(cgpa),
                    totalCredits: totalCredits
                };
            }
        } catch (error) {
            console.error('Get student results error:', error);
            throw error;
        }
    }

    async getGradeStats(studentId) {
        try {
            const results = await this.getStudentResults(studentId);

            if (!results.results || results.results.length === 0) {
                return {
                    totalSubjects: 0,
                    gradeA: 0,
                    gradeB: 0,
                    gradeC: 0,
                    gradeD: 0,
                    gradeF: 0
                };
            }

            let totalSubjects = 0;
            let gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0, gradeF = 0;

            results.results.forEach(semester => {
                if (semester.subjects) {
                    totalSubjects += semester.subjects.length;

                    semester.subjects.forEach(subject => {
                        const grade = subject.grade?.toUpperCase() || '';
                        if (grade.includes('A')) gradeA++;
                        else if (grade.includes('B')) gradeB++;
                        else if (grade.includes('C')) gradeC++;
                        else if (grade.includes('D')) gradeD++;
                        else if (grade.includes('F')) gradeF++;
                    });
                }
            });

            return {
                totalSubjects,
                gradeA,
                gradeB,
                gradeC,
                gradeD,
                gradeF
            };
        } catch (error) {
            console.error('Get grade stats error:', error);
            throw error;
        }
    }

    getGradePoints(grade) {
        const gradeMap = {
            'A+': 10, 'A': 9, 'A-': 8.5,
            'B+': 8, 'B': 7, 'B-': 6,
            'C+': 5, 'C': 4, 'C-': 3,
            'D+': 2, 'D': 1, 'F': 0
        };
        return gradeMap[grade?.toUpperCase()] || 0;
    }

    // ============================================
    // CAMPUS ALERTS SYSTEM
    // ============================================

    async createCampusAlert(alertData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const alert = {
                ...alertData,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id,
                isActive: true,
                views: 0,
                expiry: alertData.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            const result = await this.putObject('campusAlerts', alert);

            // Log activity
            await this.logActivity(currentUser.id, 'create_alert',
                `Created alert: ${alertData.title}`);

            return { id: result, ...alert };
        } catch (error) {
            console.error('Create campus alert error:', error);
            throw error;
        }
    }

    async getActiveAlerts(priority = null) {
        try {
            let alerts = await this.getAllObjects('campusAlerts');

            // Filter active alerts
            const now = new Date();
            alerts = alerts.filter(alert => {
                if (!alert.isActive) return false;
                if (alert.expiry && new Date(alert.expiry) < now) return false;
                return true;
            });

            // Filter by priority
            if (priority) {
                alerts = alerts.filter(alert => alert.priority === priority);
            }

            // Sort by priority and date
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            alerts.sort((a, b) => {
                const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            return alerts;
        } catch (error) {
            console.error('Get active alerts error:', error);
            throw error;
        }
    }

    async markAlertAsRead(alertId) {
        try {
            const alert = await this.getObject('campusAlerts', alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }

            alert.views = (alert.views || 0) + 1;
            await this.putObject('campusAlerts', alert);

            return alert;
        } catch (error) {
            console.error('Mark alert as read error:', error);
            throw error;
        }
    }

    async deactivateAlert(alertId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const alert = await this.getObject('campusAlerts', alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }

            alert.isActive = false;
            alert.deactivatedAt = new Date().toISOString();
            alert.deactivatedBy = currentUser.id;

            await this.putObject('campusAlerts', alert);

            // Log activity
            await this.logActivity(currentUser.id, 'deactivate_alert',
                `Deactivated alert: ${alert.title}`);

            return alert;
        } catch (error) {
            console.error('Deactivate alert error:', error);
            throw error;
        }
    }

    // ============================================
    // EMERGENCY CONTACTS
    // ============================================

    async getEmergencyContacts(type = null) {
        try {
            let contacts = await this.getAllObjects('emergencyContacts');

            // Filter by type if specified
            if (type) {
                contacts = contacts.filter(contact => contact.type === type);
            }

            // Sort by type and name
            contacts.sort((a, b) => {
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return a.name.localeCompare(b.name);
            });

            return contacts;
        } catch (error) {
            console.error('Get emergency contacts error:', error);
            throw error;
        }
    }

    async logEmergencyCall(contactId, userId) {
        try {
            const contact = await this.getObject('emergencyContacts', contactId);
            if (!contact) {
                throw new Error('Contact not found');
            }

            // Log activity
            await this.logActivity(userId, 'emergency_call',
                `Called emergency contact: ${contact.name}`);

            return contact;
        } catch (error) {
            console.error('Log emergency call error:', error);
            throw error;
        }
    }

    // ============================================
    // CAMPUS NAVIGATION
    // ============================================

    async getCampusLocations(type = null) {
        try {
            let locations = await this.getAllObjects('campusLocations');

            // Filter by type if specified
            if (type) {
                locations = locations.filter(location => location.type === type);
            }

            // Sort by name
            locations.sort((a, b) => a.name.localeCompare(b.name));

            return locations;
        } catch (error) {
            console.error('Get campus locations error:', error);
            throw error;
        }
    }

    async searchCampusLocations(query) {
        try {
            const locations = await this.getCampusLocations();

            if (!query) return locations;

            const searchTerm = query.toLowerCase();
            return locations.filter(location =>
                location.name.toLowerCase().includes(searchTerm) ||
                location.description.toLowerCase().includes(searchTerm) ||
                location.type.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('Search campus locations error:', error);
            throw error;
        }
    }

    async logLocationVisit(locationId, userId) {
        try {
            const location = await this.getObject('campusLocations', locationId);
            if (!location) {
                throw new Error('Location not found');
            }

            // Log activity
            await this.logActivity(userId, 'location_visit',
                `Visited location: ${location.name}`);

            return location;
        } catch (error) {
            console.error('Log location visit error:', error);
            throw error;
        }
    }

    // ============================================
    // ATTENDANCE REPORTS SYSTEM
    // ============================================

    async submitAttendanceReport(reportData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const report = {
                ...reportData,
                studentId: currentUser.id,
                submittedAt: new Date().toISOString(),
                status: 'pending',
                reviewedBy: null,
                reviewedAt: null,
                resolution: null
            };

            const result = await this.putObject('attendanceReports', report);

            // Log activity
            await this.logActivity(currentUser.id, 'submit_attendance_report',
                `Submitted attendance report`);

            return { id: result, ...report };
        } catch (error) {
            console.error('Submit attendance report error:', error);
            throw error;
        }
    }

    async getAttendanceReports(studentId = null, status = null) {
        try {
            let reports;
            if (studentId) {
                reports = await this.getAllObjects('attendanceReports', 'studentId', studentId);
            } else {
                reports = await this.getAllObjects('attendanceReports');
            }

            // Filter by status
            if (status) {
                reports = reports.filter(report => report.status === status);
            }

            // Sort by submission date (newest first)
            reports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            return reports;
        } catch (error) {
            console.error('Get attendance reports error:', error);
            throw error;
        }
    }

    async updateReportStatus(reportId, status, resolution = null) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const report = await this.getObject('attendanceReports', reportId);
            if (!report) {
                throw new Error('Report not found');
            }

            report.status = status;
            report.reviewedAt = new Date().toISOString();
            report.reviewedBy = currentUser.id;

            if (resolution) {
                report.resolution = resolution;
            }

            await this.putObject('attendanceReports', report);

            // Log activity
            await this.logActivity(currentUser.id, 'update_report_status',
                `Updated report ${reportId} to ${status}`);

            return report;
        } catch (error) {
            console.error('Update report status error:', error);
            throw error;
        }
    }

    // ============================================
    // SYSTEM SETTINGS
    // ============================================

    async getSystemSetting(key) {
        try {
            const setting = await this.getObject('systemSettings', key);
            return setting ? setting.value : null;
        } catch (error) {
            console.error('Get system setting error:', error);
            throw error;
        }
    }

    async setSystemSetting(key, value) {
        try {
            const setting = {
                key: key,
                value: value,
                updatedAt: new Date().toISOString()
            };

            await this.putObject('systemSettings', setting);
            return setting;
        } catch (error) {
            console.error('Set system setting error:', error);
            throw error;
        }
    }

    async getAllSystemSettings() {
        try {
            const settings = await this.getAllObjects('systemSettings');
            const result = {};

            settings.forEach(setting => {
                result[setting.key] = setting.value;
            });

            return result;
        } catch (error) {
            console.error('Get all system settings error:', error);
            throw error;
        }
    }

    // ============================================
    // ACTIVITY LOGGING
    // ============================================

    async logActivity(userId, action, details) {
        try {
            const logEntry = {
                userId: userId,
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                ip: 'local', // In production, get actual IP
                userAgent: navigator.userAgent
            };

            await this.putObject('activityLog', logEntry);
            return logEntry;
        } catch (error) {
            console.error('Log activity error:', error);
            // Don't throw error for logging failures
        }
    }

    async getUserActivity(userId, limit = 50) {
        try {
            let activities = await this.getAllObjects('activityLog', 'userId', userId);

            // Sort by timestamp (newest first)
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Limit results
            return activities.slice(0, limit);
        } catch (error) {
            console.error('Get user activity error:', error);
            throw error;
        }
    }

    async getRecentActivity(limit = 100) {
        try {
            let activities = await this.getAllObjects('activityLog');

            // Sort by timestamp (newest first)
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Limit results
            return activities.slice(0, limit);
        } catch (error) {
            console.error('Get recent activity error:', error);
            throw error;
        }
    }

    // ============================================
    // STATISTICS AND ANALYTICS
    // ============================================

    async getSystemStats() {
        try {
            const [
                totalUsers,
                totalStudents,
                totalAttendance,
                totalOpportunities,
                totalApplications,
                activeAlerts
            ] = await Promise.all([
                this.countObjects('users'),
                this.countObjects('users', 'role', 'student'),
                this.countObjects('attendance'),
                this.countObjects('careerOpportunities'),
                this.countObjects('studentApplications'),
                this.countObjects('campusAlerts', 'isActive', true)
            ]);

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = await this.getAllObjects('attendance', 'date', today);

            return {
                totalUsers,
                totalStudents,
                totalAttendance,
                todayAttendance: todayAttendance.length,
                totalOpportunities,
                totalApplications,
                activeAlerts,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get system stats error:', error);
            throw error;
        }
    }

    async getUserStats(userId) {
        try {
            const [
                attendanceCount,
                mealBookingsCount,
                applicationsCount,
                recentActivity
            ] = await Promise.all([
                this.countObjects('attendance', 'studentId', userId),
                this.countObjects('mealBookings', 'studentId', userId),
                this.countObjects('studentApplications', 'studentId', userId),
                this.getUserActivity(userId, 10)
            ]);

            // Get attendance stats
            const attendance = await this.getAllObjects('attendance', 'studentId', userId);
            const presentCount = attendance.filter(a => a.status === 'present').length;
            const attendancePercentage = attendance.length > 0 ?
                Math.round((presentCount / attendance.length) * 100) : 0;

            return {
                attendanceCount,
                presentCount,
                attendancePercentage,
                mealBookingsCount,
                applicationsCount,
                recentActivityCount: recentActivity.length,
                lastActivity: recentActivity[0]?.timestamp || null
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            throw error;
        }
    }

    // ============================================
    // DATA EXPORT/IMPORT
    // ============================================

    async exportUserData(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const [
                attendance,
                mealBookings,
                applications,
                results,
                activities
            ] = await Promise.all([
                this.getAllObjects('attendance', 'studentId', userId),
                this.getAllObjects('mealBookings', 'studentId', userId),
                this.getAllObjects('studentApplications', 'studentId', userId),
                this.getAllObjects('results', 'studentId', userId),
                this.getAllObjects('activityLog', 'userId', userId)
            ]);

            const exportData = {
                user: user,
                attendance: attendance,
                mealBookings: mealBookings,
                applications: applications,
                results: results,
                activities: activities,
                exportedAt: new Date().toISOString()
            };

            // Remove password from export
            delete exportData.user.password;

            return exportData;
        } catch (error) {
            console.error('Export user data error:', error);
            throw error;
        }
    }

    async exportDataAsJSON() {
        try {
            const [
                users,
                attendance,
                messMenu,
                careerOpportunities,
                studentApplications,
                results,
                campusAlerts,
                emergencyContacts,
                campusLocations,
                systemSettings,
                activityLog,
                mealBookings,
                attendanceReports
            ] = await Promise.all([
                this.getAllObjects('users'),
                this.getAllObjects('attendance'),
                this.getAllObjects('messMenu'),
                this.getAllObjects('careerOpportunities'),
                this.getAllObjects('studentApplications'),
                this.getAllObjects('results'),
                this.getAllObjects('campusAlerts'),
                this.getAllObjects('emergencyContacts'),
                this.getAllObjects('campusLocations'),
                this.getAllObjects('systemSettings'),
                this.getAllObjects('activityLog'),
                this.getAllObjects('mealBookings'),
                this.getAllObjects('attendanceReports')
            ]);

            // Remove passwords from users
            const sanitizedUsers = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    recordCounts: {
                        users: sanitizedUsers.length,
                        attendance: attendance.length,
                        messMenu: messMenu.length,
                        careerOpportunities: careerOpportunities.length,
                        studentApplications: studentApplications.length,
                        results: results.length,
                        campusAlerts: campusAlerts.length,
                        emergencyContacts: emergencyContacts.length,
                        campusLocations: campusLocations.length,
                        activityLog: activityLog.length,
                        mealBookings: mealBookings.length,
                        attendanceReports: attendanceReports.length
                    }
                },
                data: {
                    users: sanitizedUsers,
                    attendance: attendance,
                    messMenu: messMenu,
                    careerOpportunities: careerOpportunities,
                    studentApplications: studentApplications,
                    results: results,
                    campusAlerts: campusAlerts,
                    emergencyContacts: emergencyContacts,
                    campusLocations: campusLocations,
                    systemSettings: systemSettings,
                    activityLog: activityLog,
                    mealBookings: mealBookings,
                    attendanceReports: attendanceReports
                }
            };

            return exportData;
        } catch (error) {
            console.error('Export data as JSON error:', error);
            throw error;
        }
    }

    async importData(jsonData) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                throw new Error('Admin access required');
            }

            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Import each data type
            const importPromises = [];

            if (data.data.users) {
                data.data.users.forEach(user => {
                    importPromises.push(this.putObject('users', user));
                });
            }

            if (data.data.attendance) {
                data.data.attendance.forEach(record => {
                    importPromises.push(this.putObject('attendance', record));
                });
            }

            if (data.data.messMenu) {
                data.data.messMenu.forEach(menu => {
                    importPromises.push(this.putObject('messMenu', menu));
                });
            }

            if (data.data.careerOpportunities) {
                data.data.careerOpportunities.forEach(opportunity => {
                    importPromises.push(this.putObject('careerOpportunities', opportunity));
                });
            }

            if (data.data.studentApplications) {
                data.data.studentApplications.forEach(application => {
                    importPromises.push(this.putObject('studentApplications', application));
                });
            }

            if (data.data.results) {
                data.data.results.forEach(result => {
                    importPromises.push(this.putObject('results', result));
                });
            }

            if (data.data.campusAlerts) {
                data.data.campusAlerts.forEach(alert => {
                    importPromises.push(this.putObject('campusAlerts', alert));
                });
            }

            if (data.data.emergencyContacts) {
                data.data.emergencyContacts.forEach(contact => {
                    importPromises.push(this.putObject('emergencyContacts', contact));
                });
            }

            if (data.data.campusLocations) {
                data.data.campusLocations.forEach(location => {
                    importPromises.push(this.putObject('campusLocations', location));
                });
            }

            if (data.data.systemSettings) {
                data.data.systemSettings.forEach(setting => {
                    importPromises.push(this.putObject('systemSettings', setting));
                });
            }

            await Promise.all(importPromises);

            // Log activity
            await this.logActivity(currentUser.id, 'data_import',
                `Imported data with ${Object.keys(data.data).length} collections`);

            return {
                success: true,
                importedCollections: Object.keys(data.data).length,
                totalRecords: importPromises.length
            };
        } catch (error) {
            console.error('Import data error:', error);
            throw error;
        }
    }

    // ============================================
    // BACKUP AND RESTORE
    // ============================================

    async createBackup() {
        try {
            const exportData = await this.exportDataAsJSON();
            const backupKey = `nerist_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;

            // Save to localStorage
            localStorage.setItem(backupKey, JSON.stringify(exportData));

            // Update last backup time
            await this.setSystemSetting('last_backup', new Date().toISOString());

            // Log activity
            const currentUser = await this.getCurrentUser();
            if (currentUser) {
                await this.logActivity(currentUser.id, 'create_backup',
                    `Created backup: ${backupKey}`);
            }

            return {
                key: backupKey,
                ...exportData.metadata
            };
        } catch (error) {
            console.error('Create backup error:', error);
            throw error;
        }
    }

    async restoreBackup(backupKey) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                throw new Error('Admin access required');
            }

            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }

            // Clear existing data (optional - you might want to merge instead)
            // await this.clearDatabase();

            // Import the backup
            const result = await this.importData(backupData);

            // Log activity
            await this.logActivity(currentUser.id, 'restore_backup',
                `Restored backup: ${backupKey}`);

            return result;
        } catch (error) {
            console.error('Restore backup error:', error);
            throw error;
        }
    }

    async listBackups() {
        try {
            const backups = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('nerist_backup_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        backups.push({
                            key: key,
                            exportDate: data.metadata?.exportDate || 'Unknown',
                            recordCounts: data.metadata?.recordCounts || {}
                        });
                    } catch (e) {
                        // Skip invalid backups
                    }
                }
            }

            // Sort by date (newest first)
            backups.sort((a, b) => new Date(b.exportDate) - new Date(a.exportDate));

            return backups;
        } catch (error) {
            console.error('List backups error:', error);
            throw error;
        }
    }

    async deleteBackup(backupKey) {
        try {
            localStorage.removeItem(backupKey);
            return true;
        } catch (error) {
            console.error('Delete backup error:', error);
            throw error;
        }
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    hashPassword(password) {
        // Simple hash for demo - in production, use proper hashing (bcrypt, etc.)
        return btoa(password + 'nerist_salt');
    }

    async createSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            token: this.generateToken(user.id),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        localStorage.setItem('nerist_session', JSON.stringify(session));
        localStorage.setItem('nerist_token', session.token);

        return session;
    }

    async restoreSession() {
        const sessionStr = localStorage.getItem('nerist_session');
        if (!sessionStr) return null;

        try {
            const session = JSON.parse(sessionStr);

            // Check if session is expired
            if (new Date(session.expiresAt) < new Date()) {
                localStorage.removeItem('nerist_session');
                localStorage.removeItem('nerist_token');
                return null;
            }

            // Get user data
            const user = await this.getUserById(session.userId);
            if (!user || !user.isActive) {
                localStorage.removeItem('nerist_session');
                localStorage.removeItem('nerist_token');
                return null;
            }

            const { password, ...userWithoutPassword } = user;
            this.currentUser = userWithoutPassword;

            return session;
        } catch (error) {
            console.error('Restore session error:', error);
            localStorage.removeItem('nerist_session');
            localStorage.removeItem('nerist_token');
            return null;
        }
    }

    generateToken(userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return btoa(`${userId}_${timestamp}_${random}`).replace(/=/g, '');
    }

    async seedInitialData() {
        try {
            // Check if already seeded
            const seeded = await this.getSystemSetting('data_seeded');
            if (seeded) return;

            console.log('Seeding initial data...');

            // Seed emergency contacts
            const contacts = [
                {
                    id: 'security',
                    name: 'Campus Security',
                    role: '24/7 Emergency',
                    number: '+91 98765 43210',
                    type: 'security',
                    icon: 'shield-alt',
                    description: 'Campus security control room'
                },
                {
                    id: 'medical',
                    name: 'Medical Center',
                    role: 'Health Emergency',
                    number: '+91 98620 85987',
                    type: 'medical',
                    icon: 'user-md',
                    description: 'Campus medical center'
                },
                {
                    id: 'warden_female',
                    name: 'Miss. Piyali Das',
                    role: "Women's Warden",
                    number: '+91 84150 23777',
                    type: 'warden',
                    icon: 'female',
                    description: 'Hostel warden for female students'
                },
                {
                    id: 'warden_male',
                    name: 'Dr. Ashish Paul',
                    role: "Men's Warden",
                    number: '+91 70177 18821',
                    type: 'warden',
                    icon: 'male',
                    description: 'Hostel warden for male students'
                },
                {
                    id: 'director',
                    name: 'Director Office',
                    role: 'Administration',
                    number: '+91 360 2257401',
                    type: 'admin',
                    icon: 'landmark',
                    description: 'Director office contact'
                },
                {
                    id: 'transport',
                    name: 'Transport Office',
                    role: 'Campus Transport',
                    number: '+91 98620 85986',
                    type: 'transport',
                    icon: 'bus',
                    description: 'Campus transport services'
                }
            ];

            for (const contact of contacts) {
                await this.putObject('emergencyContacts', contact);
            }

            // Seed campus locations
            const locations = [
                {
                    id: 'cs_dept',
                    name: 'Computer Science Department',
                    description: 'CSE Building, 2nd Floor | 0.4 km away',
                    type: 'academic',
                    coords: [27.1050, 93.7270],
                    icon: 'laptop-code'
                },
                {
                    id: 'library',
                    name: 'Central Library',
                    description: 'Main Building, Ground Floor | 0.7 km away',
                    type: 'facility',
                    coords: [27.1042, 93.7281],
                    icon: 'book'
                },
                {
                    id: 'admin',
                    name: 'Administration Office',
                    description: 'Admin Block, 1st Floor | 0.5 km away',
                    type: 'administrative',
                    coords: [27.1056, 93.7268],
                    icon: 'landmark'
                },
                {
                    id: 'cafeteria',
                    name: 'Cafeteria',
                    description: 'Near Hostel Block | 0.3 km away',
                    type: 'food',
                    coords: [27.1039, 93.7262],
                    icon: 'utensils'
                },
                {
                    id: 'sports',
                    name: 'Sports Complex',
                    description: 'East Campus | 1.2 km away',
                    type: 'sports',
                    coords: [27.1068, 93.7290],
                    icon: 'running'
                },
                {
                    id: 'medical_center',
                    name: 'Medical Center',
                    description: 'Near Admin Block | 0.6 km away',
                    type: 'medical',
                    coords: [27.1041, 93.7279],
                    icon: 'heartbeat'
                },
                {
                    id: 'auditorium',
                    name: 'Auditorium',
                    description: 'Central Campus | 0.8 km away',
                    type: 'event',
                    coords: [27.1053, 93.7284],
                    icon: 'theater-masks'
                },
                {
                    id: 'hostel_a',
                    name: 'Hostel Block A',
                    description: 'North Campus | 0.9 km away',
                    type: 'hostel',
                    coords: [27.1061, 93.7265],
                    icon: 'bed'
                },
                {
                    id: 'workshop',
                    name: 'Workshop Complex',
                    description: 'West Campus | 1.1 km away',
                    type: 'academic',
                    coords: [27.1045, 93.7255],
                    icon: 'tools'
                }
            ];

            for (const location of locations) {
                await this.putObject('campusLocations', location);
            }

            // Seed default users
            const defaultUsers = [
                {
                    id: 'student_001',
                    username: 'NER20231045',
                    password: this.hashPassword('demo123'),
                    email: 'ankit.sharma@nerist.ac.in',
                    name: 'Ankit Sharma',
                    role: 'student',
                    department: 'Computer Science & Engineering',
                    year: '3rd Year',
                    avatarColor: 'primary',
                    emailPreferences: {
                        attendance: true,
                        mess: true,
                        career: true,
                        alerts: false
                    },
                    notificationSettings: {
                        pushEnabled: true,
                        soundEnabled: true,
                        vibrationEnabled: true
                    },
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 'admin_001',
                    username: 'admin',
                    password: this.hashPassword('admin123'),
                    email: 'admin@nerist.ac.in',
                    name: 'Admin User',
                    role: 'admin',
                    department: 'Administration',
                    year: 'Faculty',
                    avatarColor: 'secondary',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 'mess_001',
                    username: 'mess',
                    password: this.hashPassword('mess123'),
                    email: 'mess@nerist.ac.in',
                    name: 'Mess Secretary',
                    role: 'mess',
                    department: 'Hostel Administration',
                    year: 'Staff',
                    avatarColor: 'nerist-green',
                    createdAt: new Date().toISOString(),
                    isActive: true
                }
            ];

            for (const user of defaultUsers) {
                await this.putObject('users', user);
            }

            // Seed system settings
            const settings = [
                { key: 'data_seeded', value: 'true' },
                { key: 'system_version', value: '1.0.0' },
                { key: 'mess_booking_deadline', value: '2' },
                { key: 'attendance_threshold', value: '75' },
                { key: 'emergency_sound_volume', value: '70' },
                { key: 'default_theme', value: 'dark' },
                { key: 'last_backup', value: new Date().toISOString() }
            ];

            for (const setting of settings) {
                await this.putObject('systemSettings', {
                    key: setting.key,
                    value: setting.value,
                    updatedAt: new Date().toISOString()
                });
            }

            console.log('Initial data seeded successfully');
        } catch (error) {
            console.error('Seeding initial data failed:', error);
        }
    }

    async clearDatabase() {
        // Clear all object stores
        const storeNames = [
            'users', 'attendance', 'messMenu', 'careerOpportunities',
            'studentApplications', 'results', 'campusAlerts',
            'emergencyContacts', 'campusLocations', 'systemSettings',
            'activityLog', 'mealBookings', 'attendanceReports'
        ];

        for (const storeName of storeNames) {
            try {
                await this.executeTransaction(storeName, 'readwrite', (store) => {
                    store.clear();
                });
            } catch (error) {
                console.error(`Error clearing ${storeName}:`, error);
            }
        }
    }

    startBackgroundSync() {
        // Sync every 5 minutes
        setInterval(async () => {
            try {
                await this.performBackgroundSync();
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        }, 5 * 60 * 1000);
    }

    async performBackgroundSync() {
        // Clean up expired alerts
        const alerts = await this.getAllObjects('campusAlerts');
        const now = new Date();

        for (const alert of alerts) {
            if (alert.expiry && new Date(alert.expiry) < now && alert.isActive) {
                alert.isActive = false;
                await this.putObject('campusAlerts', alert);
            }
        }

        // Clean up old activity logs (keep only last 1000 entries)
        const activities = await this.getAllObjects('activityLog');
        if (activities.length > 1000) {
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toKeep = activities.slice(0, 1000);

            // Clear and re-add
            await this.executeTransaction('activityLog', 'readwrite', (store) => {
                store.clear();
            });

            for (const activity of toKeep) {
                await this.putObject('activityLog', activity);
            }
        }

        // Update last sync time
        await this.setSystemSetting('last_sync', new Date().toISOString());
    }

    // ============================================
    // FRONTEND INTEGRATION HELPERS
    // ============================================

    async syncFrontendData() {
        // This method syncs backend data with frontend state
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return null;

        const [attendance, mealBookings, applications, results, alerts] = await Promise.all([
            this.getAttendanceForStudent(currentUser.id),
            this.getMealBookings(currentUser.id),
            this.getStudentApplications(currentUser.id),
            this.getStudentResults(currentUser.id),
            this.getActiveAlerts()
        ]);

        return {
            currentUser,
            attendance,
            mealBookings,
            applications,
            results,
            alerts,
            lastSync: new Date().toISOString()
        };
    }

    async validateUserAccess(page, action) {
        const user = await this.getCurrentUser();
        if (!user) return false;

        // Define access rules
        const accessRules = {
            student: {
                attendance: ['view', 'report'],
                mess: ['view', 'book', 'feedback'],
                navigation: ['view'],
                career: ['view', 'apply'],
                safety: ['view', 'sos'],
                results: ['view'],
                home: ['view']
            },
            admin: {
                attendance: ['view', 'mark', 'edit', 'delete'],
                mess: ['view', 'manage'],
                navigation: ['view'],
                career: ['view', 'manage', 'review'],
                safety: ['view', 'manage'],
                home: ['view']
            },
            mess: {
                mess: ['view', 'manage'],
                navigation: ['view'],
                safety: ['view'],
                home: ['view']
            }
        };

        const userRules = accessRules[user.role];
        if (!userRules) return false;

        const pageRules = userRules[page];
        if (!pageRules) return false;

        return pageRules.includes(action);
    }

    // ============================================
    // REAL-TIME EVENT SYSTEM
    // ============================================

    constructor() {
        this.events = {};
        this.initialize();
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    // ============================================
    // QUICK ACCESS METHODS FOR FRONTEND
    // ============================================

    // Quick login for demo
    async quickLogin() {
        return this.login('NER20231045', 'demo123');
    }

    // Get dashboard data
    async getDashboardData() {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const [
            attendanceStats,
            todayMenu,
            upcomingOpportunities,
            recentAlerts,
            systemStats
        ] = await Promise.all([
            this.getAttendanceStats(user.id),
            this.getMessMenu(new Date().toISOString().split('T')[0]),
            this.getCareerOpportunities({ status: 'active' }).then(opps => opps.slice(0, 3)),
            this.getActiveAlerts().then(alerts => alerts.slice(0, 5)),
            this.getSystemStats()
        ]);

        return {
            user,
            attendance: attendanceStats,
            todayMenu,
            opportunities: upcomingOpportunities,
            alerts: recentAlerts,
            stats: systemStats,
            lastUpdated: new Date().toISOString()
        };
    }

    // Emergency SOS
    async triggerSOS() {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        // Log emergency
        await this.logActivity(user.id, 'emergency_sos', 'Emergency SOS activated');

        // Send notification to security
        await this.createCampusAlert({
            title: 'EMERGENCY SOS ACTIVATED',
            message: `Student ${user.name} (${user.id}) has activated SOS. Location: Campus (approximate).`,
            priority: 'high',
            type: 'emergency',
            expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        });

        // Return emergency contacts
        const contacts = await this.getEmergencyContacts(['security', 'medical']);

        return {
            success: true,
            message: 'SOS alert sent to campus security',
            contacts,
            timestamp: new Date().toISOString()
        };
    }
}

// Auto-initialize and make globally available
let neristBackendInstance = null;

async function initializeNERISTBackend() {
    if (!neristBackendInstance) {
        neristBackendInstance = new NERISTBackend();
        await neristBackendInstance.initialize();
    }
    return neristBackendInstance;
}

// Initialize when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeNERISTBackend().catch(console.error);
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NERISTBackend, initializeNERISTBackend };
}

// Global access
window.NERISTBackend = NERISTBackend;
window.initializeNERISTBackend = initializeNERISTBackend;
