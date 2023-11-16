import { UsersService } from "src/users/users.service";
import { ChatService } from "src/chat/chat.service";
export declare class ChatController {
    private usersService;
    private chatService;
    constructor(usersService: UsersService, chatService: ChatService);
    createRoom(req: any, res: any): Promise<any>;
    getAllRooms(req: any, res: any): Promise<any>;
    getRoomById(req: any, res: any): Promise<any>;
    getOldMessages(req: any, res: any): Promise<any>;
    JoinRoom(req: any, res: any): Promise<any>;
    isInRoom(req: any, res: any): Promise<any>;
    getUserIdByMessageId(req: any, res: any): Promise<any>;
    isOwnerOfRoom(req: any, res: any): Promise<any>;
    isOwnerOfRoomForKick(req: any, res: any): Promise<any>;
    isAdminOfRoom(req: any, res: any): Promise<any>;
    setAdmin(req: any, res: any): Promise<any>;
    deleteRoom(req: any, res: any): Promise<any>;
    BanUser(req: any, res: any): Promise<any>;
    ChangePassword(req: any, res: any): Promise<any>;
    doesRoomAsPassword(req: any, res: any): Promise<any>;
    muteUser(req: any, res: any): Promise<any>;
}
