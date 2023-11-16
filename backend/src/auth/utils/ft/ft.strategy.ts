import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-42';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../../auth.service';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy) {

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.FT_CLIENT_ID,
      clientSecret: process.env.FT_CLIENT_SECRET,
      callbackURL: process.env.FT_CALLBACK_URL,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const ftUser = {
      username: profile.username,
      image: profile._json.image.link,
      displayName: profile.username,
    };
    const user = await this.authService.registerOrRetrieveUser(ftUser);
    return user;
  }
}