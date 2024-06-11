import React from "react";
import { getLoadingStatus } from "../_features/users/usersSlice";
import { useSelector } from "react-redux";

const Loading = () => {
  const loading = useSelector(getLoadingStatus);
  return (
    loading && (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          height: "100vh",
          width: "100vw",
          justifyContent: "center",
          backgroundColor: "#00000035",
          alignItems: "center",
          zIndex: "9999",
        }}
      >
        <div class="loader"></div>
      </div>
    )
  );
};

export default Loading;
