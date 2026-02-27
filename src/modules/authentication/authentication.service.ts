import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import TokenPayload from './interfaces/token-payload.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /** Validate user credentials with lockout protection */
  public async getAuthenticatedUser(identifier: string, plainTextPassword: string) {
    const user = await this.usersService.getByIdentifier(identifier);

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new BadRequestException(`Account is temporarily locked. Try again in ${remainingMinutes} minutes.`);
    }

    try {
      await this.verifyPassword(plainTextPassword, user.password);

      await this.usersService.resetLoginAttempts(user.id);
      return user;
    } catch (error) {
      await this.usersService.handleFailedLogin(user.id);
      throw new BadRequestException('Wrong credentials provided');
    }
  }

  /** Internally compare plain text password with hashed version */
  private async verifyPassword(plainTextPassword: string, hashedPassword: string) {
    const isPasswordMatching = await bcrypt.compare(plainTextPassword, hashedPassword);
    if (!isPasswordMatching) {
      throw new BadRequestException('Wrong credentials provided');
    }
  }

  /** Generate JWT access token and secure HTTP-only cookie */
  public getCookieWithJwtAccessToken(id: string) {
    const payload: TokenPayload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}s`
    });
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
    )}`;
  }

  /** Generate JWT refresh token and secure HTTP-only cookie */
  public getCookieWithJwtRefreshToken(id: string) {
    const payload: TokenPayload = { id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}s`
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
    )}`;
    return {
      cookie,
      token
    };
  }

  /** Generate cookies to clear session on logout */
  public getCookiesForLogOut() {
    return ['Authentication=; HttpOnly; Path=/; Max-Age=0', 'Refresh=; HttpOnly; Path=/; Max-Age=0'];
  }
}
