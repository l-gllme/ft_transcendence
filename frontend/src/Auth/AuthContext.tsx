import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode,
} from 'react';

import TwoFA from './2FA';

export interface User {
    id: number;
    username: string;
    display_name: string;
    image: string;
    connected: number;
    twoFAEnabled: boolean;
    twoFAlogin: boolean;
}

interface AuthContextType {
    user: User | null;
    refresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
    children: ReactNode;
}

const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    // Pas sur de ca
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthentication = async () => {
        try {
            const response = await fetch('http://localhost:4000/auth/profile', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthentication();
    }, []);



    const refresh = async () => {
        setIsLoading(false);
        try {
            const response = await fetch('http://localhost:4000/auth/profile', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error refreshing authentication:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const contextValue: AuthContextType = { user, refresh };

    if (user != null && user.twoFAEnabled && !user?.twoFAlogin) {
        return (
            <AuthContext.Provider value={contextValue}>
                <TwoFA />
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {isLoading ? <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-4"><h1 className="text-amber-50 font-semibold text-3xl pt-3">Loading...</h1></div> : children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthContextProvider };

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};
