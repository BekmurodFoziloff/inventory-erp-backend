import { Controller, Get, Post, HttpCode, Req, Res, UseInterceptors, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticationService } from './authentication.service';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import RequestWithUser from './interfaces/request-with-user.interface';
import { Response } from 'express';
import JwtAuthenticationGuard from './guards/jwt-authentication.guard';
import { UsersService } from '../users/users.service';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { User } from '../users/user.schema';

@Controller('authentication')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService
  ) {}

  /** Authenticate user and establish secure session cookies */
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthenticationGuard)
  @Post('log-in')
  async logIn(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    const { user } = request;
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(user.id);
    const { cookie: refreshTokenCookie, token: refreshToken } = this.authenticationService.getCookieWithJwtRefreshToken(
      user.id
    );
    await this.usersService.setCurrentRefreshToken(refreshToken, user.id);
    await this.usersService.updateLastLogin(user.id);
    response.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
    return user;
  }

  /** Terminate session and invalidate security tokens */
  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('log-out')
  async logOut(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    await this.usersService.removeRefreshToken(request.user.id);
    response.setHeader('Set-Cookie', this.authenticationService.getCookiesForLogOut());
  }

  /** Retrieve profile of the currently authenticated user */
  @UseGuards(JwtAuthenticationGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    return request.user;
  }

  /** Generate new access token using valid refresh token */
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user.id);
    response.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }
}
