import { configureStore } from "@reduxjs/toolkit";

import usersSlice from "./_features/users/usersSlice";
import accountSlice from "./_features/account/accountSlice";

export default configureStore({
  reducer: {
    account: accountSlice,
    users: usersSlice,
  },
});
