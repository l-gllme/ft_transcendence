"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../auth/utils/jwt/jwt.auth.guard");
let ChatController = exports.ChatController = class ChatController {
    constructor(usersService, chatService) {
        this.usersService = usersService;
        this.chatService = chatService;
    }
    async createRoom(req, res) {
        const userId = req.user.userId;
        if (req.body.privacy === "private") {
            const r = await this.chatService.checkPrivateRoomUsingTwoUsers(userId, req.body.userId);
            if (r)
                return res.status(200).json(r);
        }
        const room = await this.chatService.createRoom(req.body, userId);
        if (!room)
            return console.log("Error creating room");
        await this.chatService.putUserInRoom(userId, room.id, req.body.userId);
        await this.chatService.setAdmin(userId, room.id);
        return res.status(200).json(room);
    }
    async getAllRooms(req, res) {
        const rooms = await this.chatService.getAllRooms();
        const publicRooms = rooms.filter((room) => !room.private);
        return res.status(200).json(publicRooms);
    }
    async getRoomById(req, res) {
        const roomId = req.body.roomId;
        const room = await this.chatService.getRoomById(roomId);
        return res.status(200).json(room);
    }
    async getOldMessages(req, res) {
        const roomId = req.body.roomId;
        const messages = await this.chatService.getOldMessages(roomId);
        return res.status(200).json(messages);
    }
    async JoinRoom(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const password = req.body.password;
        const privateRoom = await this.chatService.checkIsRoomPrivate(roomId);
        if (privateRoom === true) {
            if (await this.chatService.isInRoom(userId, roomId))
                return res.status(200).json({ message: "User joined the room" });
            else
                return res.status(403).json({ message: "User is not in the room" });
        }
        if (await this.chatService.isUserBanned(userId, roomId)) {
            return res.status(403).json({ message: "User is banned from the room" });
        }
        const match = await this.chatService.checkPassword(roomId, password);
        if (match === false) {
            return res.status(401).json({ message: "Wrong password" });
        }
        await this.chatService.putUserInRoom(userId, roomId, null);
        return res.status(200).json({ message: "User joined the room" });
    }
    async isInRoom(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        if (await this.chatService.isUserBanned(userId, roomId)) {
            return res.status(403).json({ message: "User is banned from the room" });
        }
        const isInRoom = await this.chatService.isInRoom(userId, roomId);
        if (isInRoom === false) {
            return res.status(403).json({ message: "User is not in the room" });
        }
        return res.status(200).json(isInRoom);
    }
    async getUserIdByMessageId(req, res) {
        const messageId = req.body.messageId;
        const userId = await this.chatService.getUserIdFromMessage(messageId);
        return res.status(200).json(userId);
    }
    async isOwnerOfRoom(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const userToCheck = req.body.userToCheck;
        if (await this.chatService.checkIsRoomPrivate(roomId)) {
            return res.status(200).json(false);
        }
        const isOwner = await this.chatService.isOwner(userId, roomId);
        if (isOwner === false) {
            return res.status(200).json({ message: "User is not the owner of room" });
        }
        if (await this.chatService.isOwner(userToCheck, roomId))
            return res.status(403).json({ message: "User is the owner of room" });
        return res.status(200).json(isOwner);
    }
    async isOwnerOfRoomForKick(req, res) {
        const roomId = req.body.roomId;
        const userToCheck = req.body.userToCheck;
        const isOwner = await this.chatService.isOwner(userToCheck, roomId);
        console.log(isOwner);
        if (isOwner === true) {
            return res.status(403).json({ message: "User is the owner of room" });
        }
        else
            return res.status(200).json(true);
    }
    async isAdminOfRoom(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        if (await this.chatService.checkIsRoomPrivate(roomId)) {
            return res.status(403).json({ message: "Room is private" });
        }
        const isAdmin = await this.chatService.isAdmin(userId, roomId);
        if (isAdmin === false) {
            return res.status(202).json({ message: "User is not the admin of room" });
        }
        return res.status(200).json(isAdmin);
    }
    async setAdmin(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const userToSetAdmin = req.body.userToSetAdmin;
        if (await this.chatService.checkIsRoomPrivate(roomId)) {
            return res.status(403).json({ message: "Room is private" });
        }
        const isAdmin = await this.chatService.isAdmin(userId, roomId);
        if (isAdmin === false) {
            return res.status(403).json({ message: "User is not the admin of room" });
        }
        const admin = await this.chatService.setAdmin(userToSetAdmin, roomId);
        return res.status(200).json(admin);
    }
    async deleteRoom(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        if (await this.chatService.checkIsRoomPrivate(roomId)) {
            return res.status(403).json({ message: "Room is private" });
        }
        const isOwner = await this.chatService.isOwner(userId, roomId);
        if (isOwner === false) {
            return res.status(403).json({ message: "User is not the owner of room" });
        }
        const room = await this.chatService.deleteRoom(roomId);
        return res.status(200).json(room);
    }
    async BanUser(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const userToBan = req.body.userToBan;
        const isOwner = await this.chatService.isOwner(userId, roomId);
        const isAdmin = await this.chatService.isAdmin(userId, roomId);
        const isUserToBanAdmin = await this.chatService.isAdmin(userToBan, roomId);
        if (isAdmin === false) {
            return res.status(403).json({ message: "User is not the admin of room" });
        }
        if (isUserToBanAdmin === true && isOwner === false) {
            return res.status(403).json({ message: "User is admin of room" });
        }
        const banned = await this.chatService.BanUser(userToBan, roomId);
        return res.status(200).json(banned);
    }
    async ChangePassword(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const password = req.body.password;
        if (password === "") {
            return res.status(403).json({ message: "Password cannot be empty" });
        }
        const isOwner = await this.chatService.isOwner(userId, roomId);
        if (isOwner === false) {
            return res.status(403).json({ message: "User is not the owner of room" });
        }
        const changed = await this.chatService.ChangePassword(roomId, password);
        if (changed === false) {
            return res.status(403).json({ message: "Error changing password" });
        }
        const map = await this.chatService.removeAllUsersFromRoomExceptOne(roomId, userId);
        return res.status(200).json(map);
    }
    async doesRoomAsPassword(req, res) {
        const roomId = req.body.roomId;
        const hasPassword = await this.chatService.doesRoomAsPassword(roomId);
        return res.status(200).json(hasPassword);
    }
    async muteUser(req, res) {
        const userId = req.user.userId;
        const roomId = req.body.roomId;
        const userToMute = req.body.userToMute;
        const isOwner = await this.chatService.isOwner(userId, roomId);
        const isAdmin = await this.chatService.isAdmin(userId, roomId);
        const isUserToMuteAdmin = await this.chatService.isAdmin(userToMute, roomId);
        if (isAdmin === false) {
            return res.status(403).json({ message: "User is not the admin of room" });
        }
        if (isUserToMuteAdmin === true && isOwner === false) {
            return res.status(403).json({ message: "User is admin of room" });
        }
        const muted = await this.chatService.muteUser(userToMute, roomId);
        return res.status(200).json(muted);
    }
};
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("createRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("getAllRooms"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAllRooms", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("getRoomById"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRoomById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)("getOldMessages"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOldMessages", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("joinRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "JoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("isInRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "isInRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("getUserIdByMessageId"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserIdByMessageId", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("isOwnerOfRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "isOwnerOfRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("isOwnerOfRoomForKick"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "isOwnerOfRoomForKick", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("isAdminOfRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "isAdminOfRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("setAdmin"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "setAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("deleteRoom"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("BanUser"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "BanUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("ChangePassword"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "ChangePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("doesRoomAsPassword"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "doesRoomAsPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("muteUser"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "muteUser", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)("chat"),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map