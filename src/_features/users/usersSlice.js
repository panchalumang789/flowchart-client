import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LoadingStatus } from "../AsyncStatus";
import { userService } from "../_service/users.service";

const initialState = {
  usersStatus: LoadingStatus.Idle,
  allUsers: [],
  error: null,
  loading: false,
};

export const getAllUsers = createAsyncThunk("users/getAllUsers", async () => {
  try {
    const response = await userService.getAllUsers();
    return response;
  } catch (e) {
    Promise.reject(e);
  }
});

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userId) => {
    try {
      const response = await userService.createUser(userId);
      return response;
    } catch (e) {
      Promise.reject(e);
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (userId) => {
    try {
      const response = await userService.updateUser(userId);
      return response;
    } catch (e) {
      Promise.reject(e);
    }
  }
);
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId) => {
    try {
      const response = await userService.deleteUser(userId);
      return response;
    } catch (e) {
      Promise.reject(e);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUsers: (state) => initialState,
    activateLoading: (state) => {
      state.loading = true;
    },
    deActivateLoading: (state) => {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsers.pending, (state, action) => {
        state.usersStatus = LoadingStatus.Loading;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersStatus = LoadingStatus.Loaded;
        state.allUsers = action.payload;
        state.error = null;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersStatus = LoadingStatus.Failed;
        state.error = action.payload;
      })
      .addCase(createUser.pending, (state, action) => {
        state.usersStatus = LoadingStatus.Loading;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.usersStatus = LoadingStatus.Idle;
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.usersStatus = LoadingStatus.Failed;
        state.error = action.payload;
      })
      .addCase(updateUser.pending, (state, action) => {
        state.usersStatus = LoadingStatus.Loading;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.usersStatus = LoadingStatus.Idle;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.usersStatus = LoadingStatus.Failed;
        state.error = action.payload;
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.usersStatus = LoadingStatus.Loading;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.usersStatus = LoadingStatus.Idle;
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.usersStatus = LoadingStatus.Failed;
        state.error = action.payload;
      });
  },
});

export const usersError = (state) => state.users.error;
export const getAllUserData = (state) => state.users.allUsers;
export const getUsersStatus = (state) => state.users.usersStatus;
export const getLoadingStatus = (state) => state.users.loading;

export const { resetUsers, activateLoading, deActivateLoading } =
  usersSlice.actions;

export default usersSlice.reducer;
