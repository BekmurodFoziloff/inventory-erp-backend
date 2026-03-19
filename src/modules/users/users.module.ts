import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { IsUniqueUsernameValidator } from '@common/validators/is-unique-username.validator';
import { IsUniqueEmailValidator } from '@common/validators/is-unique-email.validator';

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
