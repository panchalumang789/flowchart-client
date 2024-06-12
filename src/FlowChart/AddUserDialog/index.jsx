import React, { useCallback, useEffect, useState } from "react";
import {
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  DialogTitle,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const INIT_VALUES = {
  name: "",
  transferChilds: false,
};
const AddUserDialog = ({ userData, isModalOpen, closeModal, submitData }) => {
  const [userFormData, setUserFormData] = useState(INIT_VALUES);
  const [errors, setErrors] = useState({ name: false, guj_name: false });

  useEffect(() => {
    setUserFormData({
      name: userData?.name || "",
      guj_name: userData?.guj_name || "",
      transferChilds: false,
    });
    return () => {
      setUserFormData(INIT_VALUES);
      setErrors({ name: false, guj_name: false });
    };
  }, [isModalOpen, userData]);

  const validateLoginForm = useCallback(() => {
    if (!userFormData.name) {
      setErrors((prev) => ({ ...prev, name: true }));
    }
    if (!userFormData.guj_name) {
      setErrors((prev) => ({ ...prev, guj_name: true }));
    }
    if (userFormData.name && userFormData.guj_name) {
      return true;
    }
    return false;
  }, [userFormData]);

  const keyPress = useCallback(
    (e) => {
      if (e.keyCode === 13) {
        if (validateLoginForm()) {
          submitData(userFormData);
        }
      }
    },
    [submitData, userFormData, validateLoginForm]
  );

  return (
    <Dialog open={isModalOpen} onClose={closeModal}>
      <DialogTitle>{userData.predecessorId ? "Add" : "Edit"} User</DialogTitle>
      <DialogContent sx={{ width: "400px", maxWidth: "fit-content" }}>
        <TextField
          fullWidth
          autoFocus
          margin="dense"
          id="name"
          value={userFormData.name}
          onChange={(event) => {
            setErrors((prev) => ({ ...prev, name: !event.target.value }));
            setUserFormData((prev) => ({ ...prev, name: event.target.value }));
          }}
          onKeyDown={(e) => keyPress(e)}
          label="Name"
          type="text"
          variant="outlined"
          error={!!errors.name}
          helperText={!!errors.name ? "Enter valid user name" : ""}
        />
        <TextField
          fullWidth
          margin="dense"
          id="guj_name"
          value={userFormData.guj_name}
          onChange={(event) => {
            setErrors((prev) => ({ ...prev, guj_name: !event.target.value }));
            setUserFormData((prev) => ({
              ...prev,
              guj_name: event.target.value,
            }));
          }}
          onKeyDown={(e) => keyPress(e)}
          label="Gujarati Name"
          type="text"
          variant="outlined"
          error={!!errors.guj_name}
          helperText={!!errors.guj_name ? "Enter valid user name" : ""}
        />
        <FormControlLabel
          value={userFormData.transferChilds}
          control={<Checkbox />}
          onChange={(event) => {
            setUserFormData((prev) => ({
              ...prev,
              transferChilds: event.target.checked,
            }));
          }}
          label="Transfer Child"
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
              submitData(userFormData);
            }
          }}
        >
          {userData.predecessorId ? "Add" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserDialog;
