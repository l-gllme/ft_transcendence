/// <reference types="multer" />
import { UsersService } from 'src/users/users.service';
import { GamesService } from '../game/game.service';
import { Request, Response } from 'express';
export declare class UsersController {
    private readonly usersService;
    private readonly gamesService;
    constructor(usersService: UsersService, gamesService: GamesService);
    uploadAvatar(req: Request, file: Express.Multer.File, res: Response): Promise<Response<any, Record<string, any>>>;
    updateDisplayName(req: any, res: any): Promise<any>;
    checkDisplayName(req: any, res: any): Promise<void>;
    getUserGames(req: any, res: any): Promise<any>;
    getUserImage(req: any, res: any): Promise<any>;
    getMatchHistory(req: any, res: any): Promise<any>;
    getAllUsers(req: any, res: any): Promise<any>;
    getOne(req: any, res: any): Promise<any>;
    getFriends(req: any, res: any): Promise<any>;
    addFriend(req: any, res: any): Promise<void>;
    removeFriend(req: any, res: any): Promise<void>;
    blockUser(req: any, res: any): Promise<void>;
    getBlockedUsers(req: any, res: any): Promise<void>;
}
