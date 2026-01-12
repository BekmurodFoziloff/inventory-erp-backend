import { Body, Req, Controller, HttpCode, Post, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import RegisterDto from './dto/register.dto';
import { LocalAuthnticationGuard } from './guards/localAuthentication.guard';
import RequestWithUser from './interfaces/requestWithUser.interface';
import JwtAuthenticationGuard from './guards/jwt-authentication.guard';
import { UsersService } from '../users/users.service';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import MongooseClassSerializerInterceptor from '@common/utils/mongooseClassSerializer.interceptor';
import { User } from '../users/users.schema';

@Controller('authentication')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService
  ) {}

  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthnticationGuard)
  @Post('log-in')
  async logIn(@Req() request: RequestWithUser) {
    const { user } = request;
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(user._id);
    const { cookie: refreshTokenCookie, token: refreshToken } = this.authenticationService.getCookieWithJwtRefreshToken(
      user._id
    );
    await this.usersService.setCurrentRefreshToken(refreshToken, user._id);
    request.res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
    user.password = undefined;
    user.currentHashedRefreshToken = undefined;
    return user;
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post('log-out')
  @HttpCode(200)
  async logOut(@Req() request: RequestWithUser) {
    await this.usersService.removeRefreshToken(request.user._id);
    request.res.setHeader('Set-Cookie', this.authenticationService.getCookiesForLogOut());
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    return request.user;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user._id);
    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }
}
