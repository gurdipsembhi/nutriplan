import { IUser } from "../../models/User";

declare global {
  namespace Express {
    // Augment the passport User interface to include IUser fields
    interface User extends IUser {}

    interface Request {
      user?: IUser;
    }
  }
}

export {};
