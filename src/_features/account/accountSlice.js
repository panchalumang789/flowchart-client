import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LoadingStatus } from "../AsyncStatus";
import { getAccountService } from "../_service/account.service";

const accountService = getAccountService({});

const initialState = {
  accountStatus: LoadingStatus.Idle,
  activeUser: { role: "" },
  error: null,
};

export const loginUser = createAsyncThunk(
  "account/loginUser",
  async (params, { rejectWithValue }) => {
    try {
      const response = await accountService.login(
        params.username,
        params.password
      );
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    logoutUser: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state, action) => {
        state.status = LoadingStatus.Loading;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = LoadingStatus.Loaded;
        state.activeUser = { ...action.payload, role: "admin" };
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = LoadingStatus.Failed;
        state.error = action.payload;
      });
  },
});

export const loginError = (state) => state.account.error;
export const selectActiveUser = (state) => state.account.activeUser;

export const { logoutUser } = accountSlice.actions;

export default accountSlice.reducer;
