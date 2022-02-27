import { hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);
    if (user) {
      const hashedPassword = await hash(pass, user.salt);
      if (hashedPassword === user.password) {
        return {
          email: user.email,
          username: user.username,
          _id: user._id,
        };
      }
    }

    return null;
  }

  async issueToken(user: UserDocument) {
    const payload = {
      email: user.email,
      username: user.username,
      _id: user._id,
    };

    return {
      token: this.jwtService.sign(payload),
      user: payload,
    };
  }

  async validatePayload(payload: any) {
    const user = await this.userService.findUserByEmail(payload.email);

    if (user) {
      return user;
    }

    return null;
  }
}
