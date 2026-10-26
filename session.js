/**
 * TechPulse - User Authentication, Profile & Session Sync Engine
 * Manages accounts, sessions, favorites, study streaks, and cross-device sync.
 */

(function (window) {
  'use strict';

  class UserSessionManager {
    constructor() {
      this.STORAGE_KEY_ACCOUNTS = 'techpulse_accounts_v1';
      this.STORAGE_KEY_ACTIVE_USER = 'techpulse_active_user_v1';
      this.accounts = this.loadAccounts();
      this.currentUser = this.loadActiveUser();
    }

    loadAccounts() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY_ACCOUNTS);
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        return {};
      }
    }

    saveAccounts() {
      try {
        localStorage.setItem(this.STORAGE_KEY_ACCOUNTS, JSON.stringify(this.accounts));
      } catch (e) {
        console.error('Failed to save accounts to localStorage', e);
      }
    }

    loadActiveUser() {
      const username = localStorage.getItem(this.STORAGE_KEY_ACTIVE_USER);
      if (username && this.accounts[username]) {
        return this.accounts[username];
      }
      // Default Guest account
      if (!this.accounts['guest']) {
        this.accounts['guest'] = this.createNewAccountData('guest');
        this.saveAccounts();
      }
      return this.accounts['guest'];
    }

    createNewAccountData(username, passwordHash = '') {
      return {
        username: username,
        passwordHash: passwordHash,
        created: new Date().toISOString(),
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        favorites: [],
        masteredTopics: [],
        notes: {}, // { [topicId]: string }
        quizScores: {
          totalCompleted: 0,
          totalCorrect: 0
        }
      };
    }

    // Simple hash for local profile protection
    hashPassword(password) {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return hash.toString(16);
    }

    register(username, password) {
      const cleanUser = username.trim().toLowerCase();
      if (!cleanUser || cleanUser.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters.' };
      }
      if (!password || password.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters.' };
      }
      if (this.accounts[cleanUser] && cleanUser !== 'guest') {
        return { success: false, message: 'Username already taken on this device.' };
      }

      const newAccount = this.createNewAccountData(cleanUser, this.hashPassword(password));
      
      // Migrate guest progress if registering from guest session
      if (this.currentUser && this.currentUser.username === 'guest') {
        newAccount.favorites = [...this.currentUser.favorites];
        newAccount.masteredTopics = [...this.currentUser.masteredTopics];
        newAccount.notes = { ...this.currentUser.notes };
        newAccount.streak = this.currentUser.streak;
      }

      this.accounts[cleanUser] = newAccount;
      this.saveAccounts();
      this.login(cleanUser, password);
      return { success: true, message: `Account created! Welcome, ${cleanUser}!` };
    }

    login(username, password) {
      const cleanUser = username.trim().toLowerCase();
      const account = this.accounts[cleanUser];
      if (!account) {
        return { success: false, message: 'User not found. Please sign up.' };
      }
      if (account.passwordHash && account.passwordHash !== this.hashPassword(password)) {
        return { success: false, message: 'Incorrect password.' };
      }

      this.currentUser = account;
      localStorage.setItem(this.STORAGE_KEY_ACTIVE_USER, cleanUser);
      this.updateStreak();
      this.saveAccounts();
      return { success: true, message: `Logged in as ${cleanUser}.` };
    }

    logout() {
      localStorage.setItem(this.STORAGE_KEY_ACTIVE_USER, 'guest');
      this.currentUser = this.accounts['guest'];
      return { success: true, message: 'Logged out. Switched to Guest profile.' };
    }

    isGuest() {
      return !this.currentUser || this.currentUser.username === 'guest';
    }

    getUsername() {
      return this.currentUser ? this.currentUser.username : 'Guest';
    }

    // --- Streak Tracker ---
    updateStreak() {
      if (!this.currentUser) return;
      const today = new Date().toISOString().split('T')[0];
      const lastActive = this.currentUser.lastActiveDate;

      if (lastActive === today) return; // Already counted today

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        this.currentUser.streak = (this.currentUser.streak || 1) + 1;
      } else {
        this.currentUser.streak = 1;
      }
      this.currentUser.lastActiveDate = today;
      this.saveAccounts();
    }

    getStreak() {
      this.updateStreak();
      return this.currentUser ? (this.currentUser.streak || 1) : 1;
    }

    // --- Favorites ---
    getFavorites() {
      return this.currentUser ? (this.currentUser.favorites || []) : [];
    }

    saveFavorites(favoritesArray) {
      if (this.currentUser) {
        this.currentUser.favorites = favoritesArray;
        this.saveAccounts();
      }
    }

    // --- Mastered Topics ---
    getMasteredTopics() {
      return new Set(this.currentUser ? (this.currentUser.masteredTopics || []) : []);
    }

    toggleMasteredTopic(topicId) {
      if (!this.currentUser) return false;
      const list = this.currentUser.masteredTopics || [];
      const index = list.indexOf(topicId);
      let isNowMastered = false;

      if (index > -1) {
        list.splice(index, 1);
        isNowMastered = false;
      } else {
        list.push(topicId);
        isNowMastered = true;
      }

      this.currentUser.masteredTopics = list;
      this.saveAccounts();
      return isNowMastered;
    }

    // --- Personal Notes ---
    getNote(topicId) {
      if (!this.currentUser || !this.currentUser.notes) return '';
      return this.currentUser.notes[topicId] || '';
    }

    saveNote(topicId, noteText) {
      if (!this.currentUser) return;
      if (!this.currentUser.notes) this.currentUser.notes = {};
      this.currentUser.notes[topicId] = noteText;
      this.saveAccounts();
    }

    // --- Quiz Stats ---
    recordQuizResult(correctCount, totalQuestions = 3) {
      if (!this.currentUser) return;
      if (!this.currentUser.quizScores) {
        this.currentUser.quizScores = { totalCompleted: 0, totalCorrect: 0 };
      }
      this.currentUser.quizScores.totalCompleted += totalQuestions;
      this.currentUser.quizScores.totalCorrect += correctCount;
      this.updateStreak();
      this.saveAccounts();
    }

    // --- Export / Sync Data ---
    exportProfileJSON() {
      const payload = {
        app: 'TechPulse',
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: this.currentUser
      };
      return JSON.stringify(payload, null, 2);
    }

    importProfileJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.app !== 'TechPulse' || !parsed.profile || !parsed.profile.username) {
          return { success: false, message: 'Invalid TechPulse profile file format.' };
        }
        const profile = parsed.profile;
        this.accounts[profile.username] = profile;
        this.currentUser = profile;
        localStorage.setItem(this.STORAGE_KEY_ACTIVE_USER, profile.username);
        this.saveAccounts();
        return { success: true, message: `Successfully imported profile for ${profile.username}!` };
      } catch (err) {
        return { success: false, message: 'Could not parse JSON profile file.' };
      }
    }
  }

  window.TechPulseSession = new UserSessionManager();
})(window);
