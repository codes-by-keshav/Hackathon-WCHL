import { useState } from 'react';
import extensionBridge from '../utils/extensionBridge';

const useExtension = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const registerUser = async (username, email) => {
        setLoading(true);
        setError(null);
        try {
            // Use the extensionBridge instead of window.extension
            const response = await extensionBridge.register({ username, email });
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (identifier) => {
        setLoading(true);
        setError(null);
        try {
            // Use the extensionBridge instead of window.extension
            const response = await extensionBridge.login(identifier);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            await extensionBridge.logout();
            return { success: true };
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const checkAuthStatus = async () => {
        try {
            const isLoggedIn = await extensionBridge.isLoggedIn();
            const user = isLoggedIn ? await extensionBridge.getCurrentUser() : null;
            return { isAuthenticated: isLoggedIn, user };
        } catch (err) {
            console.warn('Failed to check auth status:', err);
            return { isAuthenticated: false, user: null };
        }
    };

    const isExtensionAvailable = () => {
        return extensionBridge.isExtensionAvailable || !!window.quantumSafeExtension;
    };

    return {
        loading,
        error,
        registerUser,
        loginUser,
        logout,
        checkAuthStatus,
        isExtensionAvailable,
    };
};

export default useExtension;