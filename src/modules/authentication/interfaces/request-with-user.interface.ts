import { Request } from 'express';
import { UserDocument } from '@modules/users//users.schema';

interface RequestWithUser extends Request {
  user: UserDocument;
}

export default RequestWithUser;
