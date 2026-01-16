/**
 * Utility functions to trigger chat from anywhere in the app
 */

/**
 * Start a chat with a user
 * Can be called from profile pages, user cards, etc.
 */
export function startChatWithUser(userId: string, userName: string, userAvatar?: string) {
    window.dispatchEvent(new CustomEvent('start-chat', {
        detail: {
            userId,
            userName,
            userAvatar,
        }
    }));
}

/**
 * Open friends list
 */
export function openFriendsList() {
    window.dispatchEvent(new CustomEvent('toggle-friends-list', {
        detail: { show: true }
    }));
}

/**
 * Close friends list
 */
export function closeFriendsList() {
    window.dispatchEvent(new CustomEvent('toggle-friends-list', {
        detail: { show: false }
    }));
}
