import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    ftLogin(): Promise<void>;
    ftCallback(req: any, res: any): Promise<void>;
    googleLogin(): Promise<void>;
    googleCallback(req: any, res: any): Promise<void>;
    profile(req: any): Promise<{
        id: number;
        gamesWon: number;
        gamesLost: number;
        username: string;
        display_name: string;
        image: string;
        friends: number[];
        connected: number;
        blocked: number[];
        currentRoom: number;
        twoFASecret: string;
        twoFAEnabled: boolean;
        twoFAlogin: boolean;
    }>;
    logout(req: any, res: any): Promise<void>;
    disable2FA(req: any, res: any): Promise<any>;
    enable2FA(req: any, res: any): Promise<any>;
    is2FAEnabled(req: any, res: any): Promise<any>;
    verify2fa(req: any, res: any): Promise<any>;
}
