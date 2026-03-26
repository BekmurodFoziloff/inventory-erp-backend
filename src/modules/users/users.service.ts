import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /** Get paginated, filtered, and searchable user list */
  async findAll(params: FindAllUsersDto) {
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
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec()
    ]);

    return { data: data as any as User[], total, page, lastPage: Math.ceil(total / limit) };
  }

  /** Get detailed user information by ID */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user as any as User;
  }

  /** Find user by email or userName for authentication */
  async getByIdentifier(identifier: string): Promise<User> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.toLowerCase().trim() }],
      isActive: true,
      deletedAt: null
    });

    if (!user) throw new BadRequestException('Invalid credentials');
    return user as any as User;
  }

  /** Create a new staff member */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const user = new this.userModel({ ...createUserDto, password: hashedPassword });
      const saved = await user.save();
      return saved.toObject() as any as User;
    } catch (error) {
      throw error;
    }
  }

  /** Update user profile or role details by ID */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateUserDto },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .exec();

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user as any as User;
  }

  /** Reset or change user password by Administrator */
  async changePassword(id: string, passwordPlain: string): Promise<User> {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { password: passwordHash } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user as any as User;
  }

  /** Quickly toggle user active status */
  async toggleStatus(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user as any as User;
  }

  /** Soft delete user by ID */
  async softDelete(id: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user as any as User;
  }

  /** Update user last login timestamp */
  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id, deletedAt: null }, { $set: { lastLogin: new Date() } }).exec();
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

  /** Clear session refresh token */
  async removeRefreshToken(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id, deletedAt: null }, { $set: { currentHashedRefreshToken: null } }).exec();
  }

  /** Handle failed login for account lockout */
  async handleFailedLogin(id: string): Promise<void> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $inc: { failedLoginAttempts: 1 } }, { returnDocument: 'after' })
      .exec();
    if (user && user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60000);
      await user.save();
    }
  }

  /** Reset login security counters */
  async resetLoginAttempts(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0, lockoutUntil: null } }).exec();
  }
}
