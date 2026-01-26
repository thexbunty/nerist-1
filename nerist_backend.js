// ============================================
// NERIST ONE BACKEND SYSTEM - PURE JAVASCRIPT
// ============================================
// This is a complete backend implementation using IndexedDB and localStorage
// All data persists across browser sessions and app updates

class NERISTBackend {
    constructor() {
        this.db = null;
        this.dbName = 'NERIST_One_DB';
        this.dbVersion = 3;

        // Initialize the database
        this.initDatabase();

        // Seed initial data if needed
        this.seedInitialData();
    }

    // ============================================
    // DATABASE INITIALIZATION
    // ============================================

    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createObjectStores(event);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('NERIST One Database initialized successfully');
                resolve(this.db);
            };
        });
    }

    createObjectStores(event) {
        const db = event.target.result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'id' });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('role', 'role', { unique: false });
            usersStore.createIndex('department', 'department', { unique: false });
        }

        // Attendance store
        if (!db.objectStoreNames.contains('attendance')) {
            const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
            attendanceStore.createIndex('studentId', 'studentId', { unique: false });
            attendanceStore.createIndex('date', 'date', { unique: false });
            attendanceStore.createIndex('subject', 'subject', { unique: false });
            attendanceStore.createIndex('status', 'status', { unique: false });
        }

        // Mess Menu store
        if (!db.objectStoreNames.contains('messMenu')) {
            const messStore = db.createObjectStore('messMenu', { keyPath: 'id' });
            messStore.createIndex('date', 'date', { unique: true });
            messStore.createIndex('mealType', 'mealType', { unique: false });
        }

        // Career Opportunities store
        if (!db.objectStoreNames.contains('careerOpportunities')) {
            const careerStore = db.createObjectStore('careerOpportunities', { keyPath: 'id', autoIncrement: true });
            careerStore.createIndex('type', 'type', { unique: false });
            careerStore.createIndex('deadline', 'deadline', { unique: false });
            careerStore.createIndex('status', 'status', { unique: false });
        }

        // Student Applications store
        if (!db.objectStoreNames.contains('studentApplications')) {
            const applicationsStore = db.createObjectStore('studentApplications', { keyPath: 'id', autoIncrement: true });
            applicationsStore.createIndex('studentId', 'studentId', { unique: false });
            applicationsStore.createIndex('opportunityId', 'opportunityId', { unique: false });
            applicationsStore.createIndex('status', 'status', { unique: false });
        }

        // Results store
        if (!db.objectStoreNames.contains('results')) {
            const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
            resultsStore.createIndex('studentId', 'studentId', { unique: true });
            resultsStore.createIndex('semester', 'semester', { unique: false });
        }

        // Campus Alerts store
        if (!db.objectStoreNames.contains('campusAlerts')) {
            const alertsStore = db.createObjectStore('campusAlerts', { keyPath: 'id', autoIncrement: true });
            alertsStore.createIndex('priority', 'priority', { unique: false });
            alertsStore.createIndex('expiry', 'expiry', { unique: false });
        }

        // Emergency Contacts store
        if (!db.objectStoreNames.contains('emergencyContacts')) {
            const contactsStore = db.createObjectStore('emergencyContacts', { keyPath: 'id' });
            contactsStore.createIndex('type', 'type', { unique: false });
        }

        // Campus Locations store
        if (!db.objectStoreNames.contains('campusLocations')) {
            const locationsStore = db.createObjectStore('campusLocations', { keyPath: 'id' });
            locationsStore.createIndex('type', 'type', { unique: false });
        }

        // System Settings store
        if (!db.objectStoreNames.contains('systemSettings')) {
            const settingsStore = db.createObjectStore('systemSettings', { keyPath: 'key' });
        }
    }

    // ============================================
    // SEED INITIAL DATA
    // ============================================

    async seedInitialData() {
        // Check if data already seeded
        const seeded = localStorage.getItem('nerist_data_seeded');
        if (seeded) return;

        try {
            await this.seedEmergencyContacts();
            await this.seedCampusLocations();
            await this.seedSystemSettings();
            await this.seedDefaultUsers();

            localStorage.setItem('nerist_data_seeded', 'true');
            console.log('Initial data seeded successfully');
        } catch (error) {
            console.error('Error seeding data:', error);
        }
    }

    async seedEmergencyContacts() {
        const contacts = [
            {
                id: 'security',
                name: 'Campus Security',
                role: '24/7 Emergency',
                number: '+91 98765 43210',
                type: 'security',
                icon: 'shield-alt'
            },
            {
                id: 'medical',
                name: 'Medical Center',
                role: 'Health Emergency',
                number: '+91 98620 85987',
                type: 'medical',
                icon: 'user-md'
            },
            {
                id: 'warden_female',
                name: 'Miss. Piyali Das',
                role: "Women's Warden",
                number: '+91 84150 23777',
                type: 'warden',
                icon: 'female'
            },
            {
                id: 'warden_male',
                name: 'Dr. Ashish Paul',
                role: "Men's Warden",
                number: '+91 70177 18821',
                type: 'warden',
                icon: 'male'
            },
            {
                id: 'director',
                name: 'Director Office',
                role: 'Administration',
                number: '+91 360 2257401',
                type: 'admin',
                icon: 'landmark'
            },
            {
                id: 'transport',
                name: 'Transport Office',
                role: 'Campus Transport',
                number: '+91 98620 85986',
                type: 'transport',
                icon: 'bus'
            }
        ];

        for (const contact of contacts) {
            await this.addEmergencyContact(contact);
        }
    }

    async seedCampusLocations() {
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
                coords: [27.1039, 93.7268],
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
                id: 'hostel_b',
                name: 'Hostel Block B',
                description: 'North Campus | 1.0 km away',
                type: 'hostel',
                coords: [27.1063, 93.7268],
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
            await this.addCampusLocation(location);
        }
    }

    async seedSystemSettings() {
        const settings = [
            {
                key: 'system_version',
                value: '1.0.0'
            },
            {
                key: 'last_backup',
                value: new Date().toISOString()
            },
            {
                key: 'mess_booking_deadline',
                value: '2' // hours before meal
            },
            {
                key: 'attendance_threshold',
                value: '75' // percentage
            },
            {
                key: 'emergency_sound_volume',
                value: '70'
            },
            {
                key: 'default_theme',
                value: 'dark'
            }
        ];

        for (const setting of settings) {
            await this.setSystemSetting(setting.key, setting.value);
        }
    }

    async seedDefaultUsers() {
        const defaultUsers = [
            {
                id: 'student_001',
                username: 'NER20231045',
                password: 'demo123', // In production, this would be hashed
                name: 'Ankit Sharma',
                role: 'student',
                department: 'Computer Science & Engineering',
                year: '3rd Year',
                email: 'ankit.sharma@nerist.ac.in',
                phone: '+91 9876543210',
                avatarColor: 'primary',
                emailPreferences: {
                    attendance: true,
                    mess: true,
                    career: true,
                    alerts: false
                },
                notificationSettings: {
                    pushEnabled: true,
                    types: {
                        attendance: true,
                        mess: true,
                        career: true,
                        safety: true,
                        campusAlerts: true,
                        events: false
                    },
                    frequency: 'immediate',
                    quietHours: {
                        start: '22:00',
                        end: '06:00'
                    },
                    soundEnabled: true,
                    vibrationEnabled: true
                }
            },
            {
                id: 'admin_001',
                username: 'admin',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin',
                department: 'Administration',
                year: 'Faculty',
                email: 'admin@nerist.ac.in',
                phone: '+91 9876543201',
                avatarColor: 'secondary'
            },
            {
                id: 'mess_001',
                username: 'mess',
                password: 'mess123',
                name: 'Mess Secretary',
                role: 'mess',
                department: 'Hostel Administration',
                year: 'Staff',
                email: 'mess.secretary@nerist.ac.in',
                phone: '+91 9876543202',
                avatarColor: 'nerist-green'
            }
        ];

        for (const user of defaultUsers) {
            await this.registerUser(user);
        }
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    async registerUser(userData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            // Check if user already exists
            const index = store.index('username');
            const request = index.get(userData.username);

            request.onsuccess = (event) => {
                if (event.target.result) {
                    reject(new Error('Username already exists'));
                    return;
                }

                // Add new user
                const addRequest = store.add(userData);

                addRequest.onsuccess = () => {
                    // Don't return password in response
                    const { password, ...userWithoutPassword } = userData;
                    resolve(userWithoutPassword);
                };

                addRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async login(username, password) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('username');

            const request = index.get(username);

            request.onsuccess = (event) => {
                const user = event.target.result;

                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                // In production, use proper password hashing comparison
                if (user.password !== password) {
                    reject(new Error('Invalid password'));
                    return;
                }

                // Create session
                const session = {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    year: user.year,
                    avatarColor: user.avatarColor,
                    token: this.generateToken(user.id),
                    lastLogin: new Date().toISOString()
                };

                // Store session in localStorage
                localStorage.setItem('nerist_session', JSON.stringify(session));

                // Don't return password
                const { password: _, ...userWithoutPassword } = user;
                resolve(userWithoutPassword);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async logout() {
        localStorage.removeItem('nerist_session');
        return Promise.resolve();
    }

    async getCurrentUser() {
        const session = localStorage.getItem('nerist_session');
        if (!session) return null;

        const sessionData = JSON.parse(session);
        return this.getUserById(sessionData.id);
    }

    async getUserById(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');

            const request = store.get(userId);

            request.onsuccess = (event) => {
                const user = event.target.result;
                if (user) {
                    const { password, ...userWithoutPassword } = user;
                    resolve(userWithoutPassword);
                } else {
                    resolve(null);
                }
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async updateUserProfile(userId, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            // Get existing user
            const getRequest = store.get(userId);

            getRequest.onsuccess = (event) => {
                const user = event.target.result;
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                // Update user data
                const updatedUser = { ...user, ...updates };

                // Don't allow changing username or role
                updatedUser.username = user.username;
                updatedUser.role = user.role;

                const putRequest = store.put(updatedUser);

                putRequest.onsuccess = () => {
                    const { password, ...userWithoutPassword } = updatedUser;
                    resolve(userWithoutPassword);
                };

                putRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            getRequest.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAllUsers(role = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = (event) => {
                let users = event.target.result;

                // Filter by role if specified
                if (role) {
                    users = users.filter(user => user.role === role);
                }

                // Remove passwords from response
                users = users.map(user => {
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                });

                resolve(users);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // ATTENDANCE SYSTEM
    // ============================================

    async markAttendance(attendanceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');

            // Add timestamp
            const attendanceRecord = {
                ...attendanceData,
                timestamp: new Date().toISOString(),
                markedBy: (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })()
            };

            const request = store.add(attendanceRecord);

            request.onsuccess = () => {
                resolve({
                    id: request.result,
                    ...attendanceRecord
                });
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAttendanceForStudent(studentId, startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('studentId');

            const request = index.getAll(studentId);

            request.onsuccess = (event) => {
                let records = event.target.result;

                // Filter by date range if provided
                if (startDate) {
                    const start = new Date(startDate);
                    records = records.filter(record => new Date(record.date) >= start);
                }

                if (endDate) {
                    const end = new Date(endDate);
                    records = records.filter(record => new Date(record.date) <= end);
                }

                // Sort by date (newest first)
                records.sort((a, b) => new Date(b.date) - new Date(a.date));

                resolve(records);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAttendanceByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('date');

            const request = index.getAll(date);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAttendanceStats(studentId, semester = null) {
        const attendance = await this.getAttendanceForStudent(studentId);

        if (!attendance.length) {
            return {
                totalClasses: 0,
                present: 0,
                absent: 0,
                late: 0,
                percentage: 0
            };
        }

        // Filter by semester if specified
        let filteredAttendance = attendance;
        if (semester) {
            filteredAttendance = attendance.filter(record => record.semester === semester);
        }

        const totalClasses = filteredAttendance.length;
        const present = filteredAttendance.filter(r => r.status === 'present').length;
        const absent = filteredAttendance.filter(r => r.status === 'absent').length;
        const late = filteredAttendance.filter(r => r.status === 'late').length;
        const percentage = Math.round((present / totalClasses) * 100);

        return {
            totalClasses,
            present,
            absent,
            late,
            percentage
        };
    }

    async updateAttendance(attendanceId, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');

            // Get existing record
            const getRequest = store.get(attendanceId);

            getRequest.onsuccess = (event) => {
                const record = event.target.result;
                if (!record) {
                    reject(new Error('Attendance record not found'));
                    return;
                }

                // Update record
                const updatedRecord = {
                    ...record,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                const putRequest = store.put(updatedRecord);

                putRequest.onsuccess = () => {
                    resolve(updatedRecord);
                };

                putRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            getRequest.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async deleteAttendance(attendanceId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');

            const request = store.delete(attendanceId);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // MESS MANAGEMENT SYSTEM
    // ============================================

    async saveMessMenu(date, menuData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messMenu'], 'readwrite');
            const store = transaction.objectStore('messMenu');

            const menuRecord = {
                id: `${date}_${menuData.mealType}`,
                date: date,
                ...menuData,
                lastUpdated: new Date().toISOString(),
                updatedBy: (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })()
            };

            const request = store.put(menuRecord);

            request.onsuccess = () => {
                resolve(menuRecord);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getMessMenu(date, mealType = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messMenu'], 'readonly');
            const store = transaction.objectStore('messMenu');
            const index = store.index('date');

            const request = index.getAll(date);

            request.onsuccess = (event) => {
                let menus = event.target.result;

                // Filter by meal type if specified
                if (mealType) {
                    menus = menus.filter(menu => menu.mealType === mealType);
                }

                resolve(menus);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getMessMenuForWeek(startDate) {
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
    }

    async bookMeal(date, mealType, studentId, booked = true) {
        const menu = await this.getMessMenu(date, mealType);

        if (!menu || menu.length === 0) {
            throw new Error('Menu not found for this date and meal type');
        }

        const meal = menu[0];

        // Initialize bookings array if not exists
        if (!meal.bookings) {
            meal.bookings = [];
        }

        // Check if already booked
        const existingBookingIndex = meal.bookings.findIndex(b => b.studentId === studentId);

        if (booked) {
            if (existingBookingIndex === -1) {
                // Add booking
                meal.bookings.push({
                    studentId: studentId,
                    bookedAt: new Date().toISOString()
                });
            }
        } else {
            // Remove booking
            if (existingBookingIndex !== -1) {
                meal.bookings.splice(existingBookingIndex, 1);
            }
        }

        // Update meal booking count
        meal.bookedCount = meal.bookings.length;
        meal.predictedDemand = Math.min(100, Math.round((meal.bookedCount / 100) * 100)); // Simplified prediction

        return this.saveMessMenu(date, meal);
    }

    async submitMealFeedback(date, mealType, studentId, rating, feedback) {
        const menu = await this.getMessMenu(date, mealType);

        if (!menu || menu.length === 0) {
            throw new Error('Menu not found');
        }

        const meal = menu[0];

        // Initialize feedback array if not exists
        if (!meal.feedback) {
            meal.feedback = [];
        }

        // Add feedback
        meal.feedback.push({
            studentId: studentId,
            rating: rating,
            feedback: feedback,
            submittedAt: new Date().toISOString()
        });

        // Calculate average rating
        const totalRating = meal.feedback.reduce((sum, f) => sum + parseInt(f.rating), 0);
        meal.averageRating = (totalRating / meal.feedback.length).toFixed(1);

        return this.saveMessMenu(date, meal);
    }

    // ============================================
    // CAREER SYSTEM
    // ============================================

    async createCareerOpportunity(opportunityData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['careerOpportunities'], 'readwrite');
            const store = transaction.objectStore('careerOpportunities');

            const opportunity = {
                ...opportunityData,
                createdAt: new Date().toISOString(),
                createdBy: (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })(),
                status: 'active',
                applicants: 0
            };

            const request = store.add(opportunity);

            request.onsuccess = () => {
                resolve({
                    id: request.result,
                    ...opportunity
                });
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getCareerOpportunities(filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['careerOpportunities'], 'readonly');
            const store = transaction.objectStore('careerOpportunities');
            const request = store.getAll();

            request.onsuccess = (event) => {
                let opportunities = event.target.result;

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

                resolve(opportunities);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async applyForOpportunity(opportunityId, studentData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['studentApplications', 'careerOpportunities'], 'readwrite');
            const applicationsStore = transaction.objectStore('studentApplications');
            const opportunitiesStore = transaction.objectStore('careerOpportunities');

            // First, get the opportunity
            const getOpportunityRequest = opportunitiesStore.get(opportunityId);

            getOpportunityRequest.onsuccess = (event) => {
                const opportunity = event.target.result;

                if (!opportunity) {
                    reject(new Error('Opportunity not found'));
                    return;
                }

                // Check if deadline has passed
                if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
                    reject(new Error('Application deadline has passed'));
                    return;
                }

                // Create application
                const application = {
                    studentId: studentData.studentId,
                    studentName: studentData.name,
                    opportunityId: opportunityId,
                    opportunityTitle: opportunity.title,
                    appliedDate: new Date().toISOString(),
                    status: 'pending',
                    studentData: studentData,
                    lastUpdated: new Date().toISOString()
                };

                const addApplicationRequest = applicationsStore.add(application);

                addApplicationRequest.onsuccess = () => {
                    // Update applicant count in opportunity
                    opportunity.applicants = (opportunity.applicants || 0) + 1;
                    opportunitiesStore.put(opportunity);

                    resolve({
                        id: addApplicationRequest.result,
                        ...application
                    });
                };

                addApplicationRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            getOpportunityRequest.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getStudentApplications(studentId = null, status = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['studentApplications'], 'readonly');
            const store = transaction.objectStore('studentApplications');
            const request = store.getAll();

            request.onsuccess = (event) => {
                let applications = event.target.result;

                // Filter by student ID if provided
                if (studentId) {
                    applications = applications.filter(app => app.studentId === studentId);
                }

                // Filter by status if provided
                if (status) {
                    applications = applications.filter(app => app.status === status);
                }

                // Sort by application date (newest first)
                applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

                resolve(applications);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async updateApplicationStatus(applicationId, status, reviewNotes = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['studentApplications'], 'readwrite');
            const store = transaction.objectStore('studentApplications');

            const getRequest = store.get(applicationId);

            getRequest.onsuccess = (event) => {
                const application = event.target.result;

                if (!application) {
                    reject(new Error('Application not found'));
                    return;
                }

                // Update application
                application.status = status;
                application.reviewedAt = new Date().toISOString();
                application.reviewedBy = (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })();

                if (reviewNotes) {
                    application.reviewNotes = reviewNotes;
                }

                const putRequest = store.put(application);

                putRequest.onsuccess = () => {
                    resolve(application);
                };

                putRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            getRequest.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // RESULTS SYSTEM
    // ============================================

    async saveStudentResults(studentId, semester, resultsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readwrite');
            const store = transaction.objectStore('results');

            const resultsId = `${studentId}_${semester}`;
            const results = {
                id: resultsId,
                studentId: studentId,
                semester: semester,
                ...resultsData,
                calculatedAt: new Date().toISOString(),
                calculatedBy: (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })()
            };

            const request = store.put(results);

            request.onsuccess = () => {
                resolve(results);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getStudentResults(studentId, semester = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');

            if (semester) {
                // Get specific semester
                const resultsId = `${studentId}_${semester}`;
                const request = store.get(resultsId);

                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            } else {
                // Get all semesters for student
                const index = store.index('studentId');
                const request = index.getAll(studentId);

                request.onsuccess = (event) => {
                    const results = event.target.result;

                    // Sort by semester
                    results.sort((a, b) => a.semester - b.semester);

                    // Calculate CGPA
                    let totalCredits = 0;
                    let totalGradePoints = 0;

                    results.forEach(semesterResult => {
                        if (semesterResult.subjects) {
                            semesterResult.subjects.forEach(subject => {
                                totalCredits += subject.credits || 0;
                                totalGradePoints += (subject.points || 0) * (subject.credits || 0);
                            });
                        }
                    });

                    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

                    resolve({
                        results: results,
                        cgpa: parseFloat(cgpa),
                        totalCredits: totalCredits
                    });
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            }
        });
    }

    // ============================================
    // CAMPUS ALERTS SYSTEM
    // ============================================

    async createCampusAlert(alertData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusAlerts'], 'readwrite');
            const store = transaction.objectStore('campusAlerts');

            const alert = {
                ...alertData,
                createdAt: new Date().toISOString(),
                createdBy: (async () => {
                    const user = await this.getCurrentUser();
                    return user?.id || 'system';
                })(),
                isActive: true,
                views: 0
            };

            // Set expiry if not provided (default 7 days)
            if (!alert.expiry) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 7);
                alert.expiry = expiryDate.toISOString();
            }

            const request = store.add(alert);

            request.onsuccess = () => {
                resolve({
                    id: request.result,
                    ...alert
                });
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getActiveAlerts(priority = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusAlerts'], 'readonly');
            const store = transaction.objectStore('campusAlerts');
            const request = store.getAll();

            request.onsuccess = (event) => {
                const now = new Date();
                let alerts = event.target.result;

                // Filter active alerts
                alerts = alerts.filter(alert => {
                    // Check if alert is active
                    if (!alert.isActive) return false;

                    // Check if expired
                    if (alert.expiry && new Date(alert.expiry) < now) return false;

                    return true;
                });

                // Filter by priority if specified
                if (priority) {
                    alerts = alerts.filter(alert => alert.priority === priority);
                }

                // Sort by priority (high to low) and date (newest first)
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                alerts.sort((a, b) => {
                    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                resolve(alerts);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async incrementAlertViews(alertId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusAlerts'], 'readwrite');
            const store = transaction.objectStore('campusAlerts');

            const getRequest = store.get(alertId);

            getRequest.onsuccess = (event) => {
                const alert = event.target.result;

                if (!alert) {
                    reject(new Error('Alert not found'));
                    return;
                }

                // Increment views
                alert.views = (alert.views || 0) + 1;

                const putRequest = store.put(alert);

                putRequest.onsuccess = () => {
                    resolve(alert);
                };

                putRequest.onerror = (error) => {
                    reject(error.target.error);
                };
            };

            getRequest.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // EMERGENCY CONTACTS
    // ============================================

    async addEmergencyContact(contactData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['emergencyContacts'], 'readwrite');
            const store = transaction.objectStore('emergencyContacts');

            const request = store.put(contactData);

            request.onsuccess = () => {
                resolve(contactData);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getEmergencyContacts(type = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['emergencyContacts'], 'readonly');
            const store = transaction.objectStore('emergencyContacts');
            const request = store.getAll();

            request.onsuccess = (event) => {
                let contacts = event.target.result;

                // Filter by type if specified
                if (type) {
                    contacts = contacts.filter(contact => contact.type === type);
                }

                // Sort by type and name
                contacts.sort((a, b) => {
                    if (a.type !== b.type) return a.type.localeCompare(b.type);
                    return a.name.localeCompare(b.name);
                });

                resolve(contacts);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // CAMPUS LOCATIONS
    // ============================================

    async addCampusLocation(locationData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusLocations'], 'readwrite');
            const store = transaction.objectStore('campusLocations');

            const request = store.put(locationData);

            request.onsuccess = () => {
                resolve(locationData);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getCampusLocations(type = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusLocations'], 'readonly');
            const store = transaction.objectStore('campusLocations');
            const request = store.getAll();

            request.onsuccess = (event) => {
                let locations = event.target.result;

                // Filter by type if specified
                if (type) {
                    locations = locations.filter(location => location.type === type);
                }

                // Sort by name
                locations.sort((a, b) => a.name.localeCompare(b.name));

                resolve(locations);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async searchCampusLocations(query) {
        const locations = await this.getCampusLocations();

        if (!query) return locations;

        const searchTerm = query.toLowerCase();
        return locations.filter(location =>
            location.name.toLowerCase().includes(searchTerm) ||
            location.description.toLowerCase().includes(searchTerm) ||
            location.type.toLowerCase().includes(searchTerm)
        );
    }

    // ============================================
    // SYSTEM SETTINGS
    // ============================================

    async setSystemSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systemSettings'], 'readwrite');
            const store = transaction.objectStore('systemSettings');

            const setting = {
                key: key,
                value: value,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(setting);

            request.onsuccess = () => {
                resolve(setting);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getSystemSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systemSettings'], 'readonly');
            const store = transaction.objectStore('systemSettings');

            const request = store.get(key);

            request.onsuccess = (event) => {
                const setting = event.target.result;
                resolve(setting ? setting.value : null);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAllSystemSettings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systemSettings'], 'readonly');
            const store = transaction.objectStore('systemSettings');
            const request = store.getAll();

            request.onsuccess = (event) => {
                const settings = {};
                event.target.result.forEach(setting => {
                    settings[setting.key] = setting.value;
                });
                resolve(settings);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // STATISTICS AND ANALYTICS
    // ============================================

    async getSystemStatistics() {
        return new Promise(async (resolve, reject) => {
            try {
                const [
                    totalUsers,
                    totalStudents,
                    totalAttendanceRecords,
                    totalApplications,
                    activeAlerts,
                    todayAttendance
                ] = await Promise.all([
                    this.getAllUsers(),
                    this.getAllUsers('student'),
                    this.getAllAttendanceCount(),
                    this.getStudentApplications(),
                    this.getActiveAlerts(),
                    this.getAttendanceByDate(new Date().toISOString().split('T')[0])
                ]);

                const statistics = {
                    totalUsers: totalUsers.length,
                    totalStudents: totalStudents.length,
                    totalAttendanceRecords: totalAttendanceRecords,
                    totalApplications: totalApplications.length,
                    activeAlerts: activeAlerts.length,
                    todayAttendance: todayAttendance.length,
                    systemVersion: await this.getSystemSetting('system_version') || '1.0.0',
                    lastBackup: await this.getSystemSetting('last_backup') || 'Never'
                };

                resolve(statistics);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllAttendanceCount() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.count();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    // ============================================
    // BACKUP AND RESTORE
    // ============================================

    async createBackup() {
        return new Promise(async (resolve, reject) => {
            try {
                const backup = {
                    timestamp: new Date().toISOString(),
                    version: await this.getSystemSetting('system_version') || '1.0.0',
                    data: {
                        users: await this.getAllUsers(),
                        attendance: await this.getAllAttendance(),
                        messMenu: await this.getAllMessMenus(),
                        careerOpportunities: await this.getCareerOpportunities(),
                        studentApplications: await this.getStudentApplications(),
                        results: await this.getAllResults(),
                        campusAlerts: await this.getAllAlerts(),
                        emergencyContacts: await this.getEmergencyContacts(),
                        campusLocations: await this.getCampusLocations(),
                        systemSettings: await this.getAllSystemSettings()
                    }
                };

                // Save backup to localStorage
                const backupKey = `nerist_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
                localStorage.setItem(backupKey, JSON.stringify(backup));

                // Update last backup time
                await this.setSystemSetting('last_backup', new Date().toISOString());

                resolve({
                    key: backupKey,
                    ...backup
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllAttendance() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAllMessMenus() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messMenu'], 'readonly');
            const store = transaction.objectStore('messMenu');
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAllAlerts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusAlerts'], 'readonly');
            const store = transaction.objectStore('campusAlerts');
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async getAllResults() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async restoreBackup(backupKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const backupData = localStorage.getItem(backupKey);
                if (!backupData) {
                    reject(new Error('Backup not found'));
                    return;
                }

                const backup = JSON.parse(backupData);

                // Clear all existing data
                await this.clearAllData();

                // Restore data
                const restorePromises = [];

                // Restore users
                if (backup.data.users) {
                    for (const user of backup.data.users) {
                        restorePromises.push(this.registerUser(user));
                    }
                }

                // Restore attendance
                if (backup.data.attendance) {
                    restorePromises.push(this.restoreAttendance(backup.data.attendance));
                }

                // Restore mess menu
                if (backup.data.messMenu) {
                    restorePromises.push(this.restoreMessMenu(backup.data.messMenu));
                }

                // Restore career opportunities
                if (backup.data.careerOpportunities) {
                    restorePromises.push(this.restoreCareerOpportunities(backup.data.careerOpportunities));
                }

                // Restore applications
                if (backup.data.studentApplications) {
                    restorePromises.push(this.restoreStudentApplications(backup.data.studentApplications));
                }

                // Restore results
                if (backup.data.results) {
                    restorePromises.push(this.restoreResults(backup.data.results));
                }

                // Restore alerts
                if (backup.data.campusAlerts) {
                    restorePromises.push(this.restoreAlerts(backup.data.campusAlerts));
                }

                // Restore contacts
                if (backup.data.emergencyContacts) {
                    restorePromises.push(this.restoreContacts(backup.data.emergencyContacts));
                }

                // Restore locations
                if (backup.data.campusLocations) {
                    restorePromises.push(this.restoreLocations(backup.data.campusLocations));
                }

                // Restore settings
                if (backup.data.systemSettings) {
                    for (const [key, value] of Object.entries(backup.data.systemSettings)) {
                        restorePromises.push(this.setSystemSetting(key, value));
                    }
                }

                await Promise.all(restorePromises);

                resolve({
                    message: 'Backup restored successfully',
                    timestamp: backup.timestamp,
                    itemsRestored: Object.keys(backup.data).length
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearAllData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);

            request.onsuccess = () => {
                // Reinitialize database
                this.initDatabase().then(() => {
                    resolve(true);
                }).catch(reject);
            };

            request.onerror = (error) => {
                reject(error.target.error);
            };
        });
    }

    async restoreAttendance(attendanceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');

            let completed = 0;
            const total = attendanceData.length;

            if (total === 0) {
                resolve();
                return;
            }

            attendanceData.forEach(record => {
                const request = store.add(record);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreMessMenu(messData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messMenu'], 'readwrite');
            const store = transaction.objectStore('messMenu');

            let completed = 0;
            const total = messData.length;

            if (total === 0) {
                resolve();
                return;
            }

            messData.forEach(menu => {
                const request = store.put(menu);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreCareerOpportunities(opportunitiesData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['careerOpportunities'], 'readwrite');
            const store = transaction.objectStore('careerOpportunities');

            let completed = 0;
            const total = opportunitiesData.length;

            if (total === 0) {
                resolve();
                return;
            }

            opportunitiesData.forEach(opportunity => {
                const request = store.put(opportunity);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreStudentApplications(applicationsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['studentApplications'], 'readwrite');
            const store = transaction.objectStore('studentApplications');

            let completed = 0;
            const total = applicationsData.length;

            if (total === 0) {
                resolve();
                return;
            }

            applicationsData.forEach(application => {
                const request = store.put(application);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreResults(resultsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readwrite');
            const store = transaction.objectStore('results');

            let completed = 0;
            const total = resultsData.length;

            if (total === 0) {
                resolve();
                return;
            }

            resultsData.forEach(result => {
                const request = store.put(result);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreAlerts(alertsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusAlerts'], 'readwrite');
            const store = transaction.objectStore('campusAlerts');

            let completed = 0;
            const total = alertsData.length;

            if (total === 0) {
                resolve();
                return;
            }

            alertsData.forEach(alert => {
                const request = store.put(alert);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreContacts(contactsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['emergencyContacts'], 'readwrite');
            const store = transaction.objectStore('emergencyContacts');

            let completed = 0;
            const total = contactsData.length;

            if (total === 0) {
                resolve();
                return;
            }

            contactsData.forEach(contact => {
                const request = store.put(contact);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    async restoreLocations(locationsData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['campusLocations'], 'readwrite');
            const store = transaction.objectStore('campusLocations');

            let completed = 0;
            const total = locationsData.length;

            if (total === 0) {
                resolve();
                return;
            }

            locationsData.forEach(location => {
                const request = store.put(location);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = (error) => {
                    reject(error.target.error);
                };
            });
        });
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    generateToken(userId) {
        // Simple token generation for demo purposes
        // In production, use a proper JWT implementation
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${userId}_${timestamp}_${random}`).replace(/=/g, '');
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^\+?[1-9]\d{1,14}$/;
        return re.test(phone);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        return Math.floor(seconds) + ' seconds ago';
    }

    // ============================================
    // EXPORT/IMPORT DATA
    // ============================================

    async exportData(format = 'json') {
        const data = await this.createBackup();

        if (format === 'json') {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else if (format === 'csv') {
            // Convert to CSV (simplified)
            const csvData = this.convertToCSV(data);
            const blob = new Blob([csvData], { type: 'text/csv' });
            return URL.createObjectURL(blob);
        }

        throw new Error('Unsupported format');
    }

    convertToCSV(data) {
        // Simplified CSV conversion
        let csv = 'Type,Count,Last Updated\n';

        Object.keys(data.data).forEach(key => {
            const count = Array.isArray(data.data[key]) ? data.data[key].length : 1;
            csv += `${key},${count},${new Date().toISOString()}\n`;
        });

        return csv;
    }

    // ============================================
    // INITIALIZATION ON PAGE LOAD
    // ============================================

    static async initialize() {
        const backend = new NERISTBackend();
        window.neristBackend = backend; // Make it globally available

        // Wait for database initialization
        await backend.initDatabase;

        console.log('NERIST One Backend System Ready');
        return backend;
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    NERISTBackend.initialize().catch(console.error);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NERISTBackend;

}
