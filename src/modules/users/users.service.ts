import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /** Create new user with hashed password */
  async createUser(userData: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    try {
      const user = new this.userModel({ ...userData, password: hashedPassword });
      return await user.save();
    } catch (error) {
      if (error?.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException('User with that username or email already exists');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  /** Get all users with pagination and name/email search */
  async findAll(params: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const { page = 1, limit = 20, search, isActive } = params;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null };

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.userModel.countDocuments(filter)
    ]);

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  /** Get single user by unique ID */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found  or has been deleted`);
    }
    return user;
  }

  /** Update user profile information or role */
  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found or has been deleted`);
    }
    return user;
  }

  /** Hash and update user password */
  async changePassword(id: string, passwordPlain: string): Promise<User> {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { password: passwordHash },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found or has been deleted`);
    }
    return user;
  }

  /** Toggle user active status to control system access */
  async toggleStatus(id: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found or has been deleted`);
    }

    user.isActive = !user.isActive;
    await user.save();

    return user;
  }

  /** Perform soft delete to preserve historical document links */
  async softDelete(id: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found or has been deleted`);
    }
    return user;
  }

  /** Log user activity by updating the last login timestamp */
  async updateLastLogin(id: string): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { lastLogin: new Date() },
      { returnDocument: 'after', runValidators: true }
    );
  }

  /** Find user by email or username for authentication */
  async getByIdentifier(identifier: string): Promise<User> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
      isActive: true,
      deletedAt: null
    });

    if (!user) {
      throw new BadRequestException('User with this email or username does not exist');
    }
    return user;
  }

  /** Get user by email for authentication */
  async getByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email, deletedAt: null });
  }

  /** Find user by username to validate uniqueness */
  async getByUsername(username: string): Promise<User> {
    return await this.userModel.findOne({ username, deletedAt: null });
  }

  /** Save hashed refresh token for persistent sessions */
  async setCurrentRefreshToken(refreshToken: string, id: string): Promise<void> {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.userModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { currentHashedRefreshToken } });
  }

  /** Validate refresh token for token rotation */
  async getUserIfRefreshTokenMatches(refreshToken: string, id: string): Promise<User> {
    const user = await this.findById(id);

    const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  /** Clear refresh token on user logout */
  async removeRefreshToken(id: string): Promise<void> {
    await this.userModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { currentHashedRefreshToken: null } });
  }

  /** Increment failed login attempts and lock user if threshold reached */
  async handleFailedLogin(id: string) {
    const user = await this.userModel.findById(id);
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      const lockoutTime = new Date();
      lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
      user.lockoutUntil = lockoutTime;
    }

    return await user.save();
  }

  /** Reset login attempts after a successful login */
  async resetLoginAttempts(id: string) {
    return await this.userModel.findByIdAndUpdate(id, {
      $set: { failedLoginAttempts: 0, lockoutUntil: null }
    });
  }
}
