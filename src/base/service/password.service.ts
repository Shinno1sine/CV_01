import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class PasswordService {
  hashingPassword = (password: string) => bcrypt.hashSync(password, 10);
  comparePassword = (plainText: string, hash: string) =>
    bcrypt.compareSync(plainText, hash);
  generateRandomToken = () => uuidv4().toString();
}
