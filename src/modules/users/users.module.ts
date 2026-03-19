import { Module } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { User, UserSchema } from '@modules/users/user.schema';
import { IsUniqueUsernameValidator } from '@common/validators/is-unique-username.validator';
import { IsUniqueEmailValidator } from '@common/validators/is-unique-email.validator';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100
      }
    ])
  ],
  providers: [
    UsersService,
    IsUniqueUsernameValidator,
    IsUniqueEmailValidator,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
