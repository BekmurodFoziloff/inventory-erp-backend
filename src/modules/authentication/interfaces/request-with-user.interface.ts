import { Request } from 'express';
import { UserDocument } from '@modules/users/user.schema';

interface RequestWithUser extends Request {
  user: UserDocument;
}

export default RequestWithUser;
