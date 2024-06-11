import React, { useCallback, useEffect, useState } from "react";
import {
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  DialogTitle,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { loginUser } from "../../_features/account/accountSlice";
import {
  activateLoading,
  deActivateLoading,
} from "../../_features/users/usersSlice";

const INIT_VALUES = {
  username: "",
  password: "",
};
const LoginDialog = ({ isModalOpen, closeModal }) => {
  const dispatch = useDispatch();
  const [userFormData, setUserFormData] = useState(INIT_VALUES);
  const [errors, setErrors] = useState({ username: false, password: false });

  useEffect(() => {
    return () => {
      setUserFormData(INIT_VALUES);
      setErrors({ username: false, password: false });
    };
  }, [isModalOpen]);

  const login = async (userData) => {
    await dispatch(activateLoading());
    const login = await dispatch(loginUser(userData));
    if (login?.meta?.requestStatus === "fulfilled") {
      closeModal();
    } else {
      setErrors((prev) => ({ ...prev, password: true }));
    }
    await dispatch(deActivateLoading());
  };

  const validateLoginForm = useCallback(() => {
    if (!userFormData.username) {
      setErrors((prev) => ({ ...prev, username: true }));
    }
    if (!userFormData.password) {
      setErrors((prev) => ({ ...prev, password: true }));
    }
    if (userFormData.username && userFormData.password) {
      return true;
    }
    return false;
  }, [userFormData]);

  return (
    <Dialog open={isModalOpen} onClose={closeModal}>
      <DialogTitle>Login User</DialogTitle>
      <DialogContent sx={{ width: "400px", maxWidth: "fit-content" }}>
        <TextField
          fullWidth
          autoFocus
          margin="dense"
          id="username"
          value={userFormData.username}
          onChange={(event) => {
            setErrors((prev) => ({ ...prev, username: !event.target.value }));
            setUserFormData((prev) => ({
              ...prev,
              username: event.target.value,
            }));
          }}
          label="User Name"
          type="text"
          variant="outlined"
          error={!!errors.username}
          helperText={!!errors.username ? "Enter valid Username" : ""}
        />
        <TextField
          fullWidth
          autoFocus
          margin="dense"
          id="password"
          value={userFormData.password}
          onChange={(event) => {
            setErrors((prev) => ({ ...prev, password: !event.target.value }));
            setUserFormData((prev) => ({
              ...prev,
              password: event.target.value,
            }));
          }}
          label="Password"
          type="password"
          variant="outlined"
          error={!!errors.password}
          helperText={!!errors.password ? "Enter valid Password" : ""}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="info" onClick={closeModal}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            if (validateLoginForm()) {
              login(userFormData);
            }
          }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
