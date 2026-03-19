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
      const saved = await user.save();
      return saved.toObject() as any as User;
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
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec()
    ]);

    return {
      data: data as any as User[],
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }

  /** Get single user by unique ID */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).lean().exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user as any as User;
  }

  /** Update user profile information or role */
  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateData },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user as any as User;
  }

  /** Hash and update user password */
  async changePassword(id: string, passwordPlain: string): Promise<User> {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { password: passwordHash } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user as any as User;
  }

  /** Toggle user active status to control system access */
  async toggleStatus(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user as any as User;
  }

  /** Perform soft delete to preserve historical document links */
  async softDelete(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user as any as User;
  }

  /** Log user activity by updating the last login timestamp */
  async updateLastLogin(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { lastLogin: new Date() } },
        { returnDocument: 'after', lean: true }
      )
      .exec();
    return user as any as User;
  }

  /** Find user by email or username for authentication */
  async getByIdentifier(identifier: string): Promise<User> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.toLowerCase().trim() }],
      isActive: true,
      deletedAt: null
    });

    if (!user) {
      throw new BadRequestException('User with this email or username does not exist');
    }
    return user as any as User;
  }

  /** Get user by email for authentication */
  async getByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email, deletedAt: null }).lean().exec();
    return user as any as User;
  }

  /** Find user by username to validate uniqueness */
  async getByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username, deletedAt: null }).lean().exec();
    return user as any as User;
  }

  /** Save hashed refresh token for persistent sessions */
  async setCurrentRefreshToken(refreshToken: string, id: string): Promise<void> {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.updateOne({ _id: id, deletedAt: null }, { $set: { currentHashedRefreshToken } }).exec();
  }

  /** Validate refresh token for token rotation */
  async getUserIfRefreshTokenMatches(refreshToken: string, id: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!user || !user.currentHashedRefreshToken) return null;

    const isMatching = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);
    return isMatching ? (user as any as User) : null;
  }

  /** Clear refresh token on user logout */
  async removeRefreshToken(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id, deletedAt: null }, { $set: { currentHashedRefreshToken: null } }).exec();
  }

  /** Increment failed login attempts and lock user if threshold reached */
  async handleFailedLogin(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $inc: { failedLoginAttempts: 1 } }, { returnDocument: 'after' })
      .exec();

    if (user && user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60000);
      await user.save();
    }
    return user ? (user.toObject() as User) : null;
  }

  /** Reset login attempts after a successful login */
  async resetLoginAttempts(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0, lockoutUntil: null } }).exec();
  }
}
