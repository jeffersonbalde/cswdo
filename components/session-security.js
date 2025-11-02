class SessionSecurity {
    constructor() {
        this.sessionCheckInterval = null;
        this.isValidating = false;
        this.init();
    }

    init() {
        // Check session immediately on page load
        this.validateSession();
        
        // Set up periodic session validation (every 30 seconds)
        this.sessionCheckInterval = setInterval(() => {
            this.validateSession();
        }, 30000);

        // Enhanced browser history protection
        this.setupHistoryProtection();
        
        // Handle page visibility changes (tab switching)
        this.setupVisibilityHandler();
        
        // Handle beforeunload event
        this.setupBeforeUnloadHandler();
    }

    setupHistoryProtection() {
        // Push current state to history
        window.history.pushState({ timestamp: Date.now() }, '', window.location.href);
        
        // Handle popstate (back/forward button)
        window.addEventListener('popstate', (event) => {
            // Show logout confirmation
            this.showLogoutConfirmation();
            
            // Push state back to prevent navigation
            window.history.pushState({ timestamp: Date.now() }, '', window.location.href);
        });

        // Handle beforeunload (page refresh/close)
        window.addEventListener('beforeunload', (event) => {
            // Clear session check interval
            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }
        });
    }

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible again - validate session
                this.validateSession();
            }
        });
    }

    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (event) => {
            // Clear any intervals
            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }
        });
    }

    async validateSession() {
        if (this.isValidating) return; // Prevent multiple simultaneous checks
        
        this.isValidating = true;
        
        try {
            const response = await fetch('/php_folder/session-check.php', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();

            if (!result.success) {
                // Session is invalid - force logout
                this.forceLogout(result.message || 'Session expired');
                return;
            }

            // Session is valid - update user data if needed
            if (result.data && window.userData) {
                window.userData = {
                    username: result.data.username,
                    user_type: result.data.user_type,
                    user_handler: result.data.user_handler
                };
            }

        } catch (error) {
            console.error('Session validation error:', error);
            // On network error, don't logout immediately but log the error
        } finally {
            this.isValidating = false;
        }
    }

    showLogoutConfirmation() {
        // Remove any existing logout modals
        const existingModals = document.querySelectorAll('logout-confirmation-modal');
        existingModals.forEach(modal => modal.remove());

        // Create and show logout confirmation modal
        const logoutModal = document.createElement('logout-confirmation-modal');
        document.body.appendChild(logoutModal);
    }

    forceLogout(message = 'Session expired') {
        // Clear session check interval
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }

        // Show logout message
        alert(message + '. You will be redirected to login page.');
        
        // Redirect to login page
        window.location.href = '/login.html';
    }

    destroy() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }
}

// Auto-initialize session security when script loads
const sessionSecurity = new SessionSecurity();

// Export for potential use in other scripts
window.sessionSecurity = sessionSecurity;

