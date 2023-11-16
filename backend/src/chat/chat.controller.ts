import {
  Controller,
  Post,
  Get,
  Put,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";

import { UsersService } from "src/users/users.service";
import { ChatService } from "src/chat/chat.service";

import { JwtAuthGuard } from "src/auth/utils/jwt/jwt.auth.guard";

@Controller("chat")
export class ChatController {
  constructor(
    private usersService: UsersService,
    private chatService: ChatService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post("createRoom")
  async createRoom(@Req() req, @Res() res) {
    const userId = req.user.userId;
    if (req.body.privacy === "private") {
      const r = await this.chatService.checkPrivateRoomUsingTwoUsers(
        userId,
        req.body.userId
      );
      if (r) return res.status(200).json(r);
    }
    const room = await this.chatService.createRoom(req.body, userId);
    if (!room) return console.log("Error creating room");
    await this.chatService.putUserInRoom(userId, room.id, req.body.userId);
    await this.chatService.setAdmin(userId, room.id);
    return res.status(200).json(room);
  }

  @UseGuards(JwtAuthGuard)
  @Get("getAllRooms")
  async getAllRooms(@Req() req, @Res() res) {
    const rooms = await this.chatService.getAllRooms();
    const publicRooms = rooms.filter((room) => !room.private);
    return res.status(200).json(publicRooms);
  }

  @UseGuards(JwtAuthGuard)
  @Post("getRoomById")
  async getRoomById(@Req() req, @Res() res) {
    const roomId = req.body.roomId;
    const room = await this.chatService.getRoomById(roomId);
    return res.status(200).json(room);
  }

  @UseGuards(JwtAuthGuard)
  @Put("getOldMessages")
  async getOldMessages(@Req() req, @Res() res) {
    const roomId = req.body.roomId;
    const messages = await this.chatService.getOldMessages(roomId);
    return res.status(200).json(messages);
  }

  @UseGuards(JwtAuthGuard)
  @Post("joinRoom")
  async JoinRoom(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("isInRoom")
  async isInRoom(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("getUserIdByMessageId")
  async getUserIdByMessageId(@Req() req, @Res() res) {
    const messageId = req.body.messageId;
    const userId = await this.chatService.getUserIdFromMessage(messageId);
    return res.status(200).json(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("isOwnerOfRoom")
  async isOwnerOfRoom(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("isOwnerOfRoomForKick")
  async isOwnerOfRoomForKick(@Req() req, @Res() res) {
    const roomId = req.body.roomId;
    const userToCheck = req.body.userToCheck;
    const isOwner = await this.chatService.isOwner(userToCheck, roomId);
    console.log(isOwner)
    if (isOwner === true) {
      return res.status(403).json({ message: "User is the owner of room" });
    }
    else
      return res.status(200).json(true);
  }

  @UseGuards(JwtAuthGuard)
  @Post("isAdminOfRoom")
  async isAdminOfRoom(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("setAdmin")
  async setAdmin(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("deleteRoom")
  async deleteRoom(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("BanUser")
  async BanUser(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("ChangePassword")
  async ChangePassword(@Req() req, @Res() res) {
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

  @UseGuards(JwtAuthGuard)
  @Post("doesRoomAsPassword")
  async doesRoomAsPassword(@Req() req, @Res() res) {
    const roomId = req.body.roomId;
    const hasPassword = await this.chatService.doesRoomAsPassword(roomId);
    return res.status(200).json(hasPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("muteUser")
  async muteUser(@Req() req, @Res() res) {
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

}