import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationService: AuthenticationService) {
    super({
      usernameField: 'identifier'
    });
  }
  async validate(identifier: string, password: string): Promise<any> {
    return this.authenticationService.getAuthenticatedUser(identifier, password);
  }
}
