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
          name: user.username,
          id: user._id,
        };
      }
    }

    return null;
  }

  async issueToken(user: UserDocument) {
    const payload = {
      email: user.email,
      username: user.username,
      id: user._id,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateTokenEmail(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (user) {
      return {
        email: user.email,
        username: user.username,
        id: user._id,
      };
    }

    return null;
  }
}
