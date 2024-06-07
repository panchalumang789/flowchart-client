import React, { useEffect, useState } from "react";
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
  const [errors, setErrors] = useState(false);

  useEffect(() => {
    setUserFormData({ name: userData?.name || "", transferChilds: false });
    return () => {
      setUserFormData(INIT_VALUES);
      setErrors(false);
    };
  }, [isModalOpen, userData]);

  return (
    <Dialog open={isModalOpen} onClose={closeModal}>
      <DialogTitle>{userData.predecessorId ? "Add" : "Edit"} User</DialogTitle>
      <DialogContent sx={{ width: "400px" }}>
        <TextField
          fullWidth
          autoFocus
          margin="dense"
          id="name"
          value={userFormData.name}
          onChange={(event) => {
            setErrors(!event.target.value);
            setUserFormData((prev) => ({ ...prev, name: event.target.value }));
          }}
          label="User Name"
          type="text"
          variant="outlined"
          error={!!errors}
          helperText={!!errors ? "Enter valid user name" : ""}
        />
        <FormControlLabel
          value={userFormData.transferChilds}
          control={<Checkbox />}
          onChange={(event) => {
            setUserFormData((prev) => ({ ...prev, transferChilds: event.target.checked }));
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
          disabled={errors}
          onClick={() => submitData(userFormData)}
        >
          {userData.predecessorId ? "Add" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserDialog;
