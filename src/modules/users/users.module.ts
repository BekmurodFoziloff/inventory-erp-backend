import { Module } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@modules/users/users.schema';
import { IsUniqueEmailValidator } from '@common/validators/is-unique-email.validator';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService, IsUniqueEmailValidator],
  exports: [UsersService],
  controllers: []
})
export class UsersModule {}
