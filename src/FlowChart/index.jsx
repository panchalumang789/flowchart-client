import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import AddUserDialog from "./AddUserDialog";
import { LoadingStatus } from "../_features/AsyncStatus";
import { ProcedureFlow, layoutEngines } from "./ProcedureFlow";
import {
  getAllUsers,
  getUsersStatus,
  getAllUserData,
  deleteUser,
  createUser,
  updateUser,
} from "../_features/users/usersSlice";
import LoginDialog from "./LoginDialog";
import {
  logoutUser,
  selectActiveUser,
} from "../_features/account/accountSlice";

const treeRanker = "network-simplex";

const computeTargetInfoFromAction = (
  node,
  label,
  successor,
  nodes,
  parentId = null
) => {
  if (
    typeof successor == "number" ||
    (typeof successor == "string" && !isNaN(parseInt(successor)))
  ) {
    return {
      label: label ? label : undefined,
      nodeId: parentId ? parentId + ":" + successor : successor,
    };
  } else {
    return null;
  }
};

const getNodeConnections = (node, nodes, parentId = null) => {
  let connections = [];
  let getOptions = false;

  if (getOptions === false) {
    connections =
      node.successors?.map((button) => {
        const targetId = computeTargetInfoFromAction(
          node,
          node?.connection_text,
          button,
          nodes,
          parentId
        );
        return targetId;
      }) ?? [];
  }

  if (node.successor) {
    connections.push(
      computeTargetInfoFromAction(
        node,
        node.successor,
        node.successor,
        nodes,
        parentId
      )
    );
  }

  connections = connections.filter((e) => e != null);

  return connections;
};

const generateProcedureFlow = (
  startNodeId,
  nodes,
  ranker,
  showBranch = false,
  parentId = null
) => {
  if (typeof startNodeId == "string") {
    startNodeId = parseInt(startNodeId);
  }
  let subNodes = [];
  let flowNodes = Object.keys(nodes ?? {}).map((key) => {
    const node = nodes[key];
    let branchNodes = null;
    if (showBranch && node?.asset_title && !parentId) {
      branchNodes = generateProcedureFlow(
        Number(node.branch_procedure?.start_node_id ?? 1),
        node?.branch_procedure?.nodes ?? [],
        treeRanker,
        showBranch,
        node.id
      );
      if (branchNodes?.nodes?.length > 0) {
        subNodes.push(...branchNodes.nodes);
      }
    }

    return {
      name: node.name,
      id: parentId ? parentId + ":" + node.id : node.id,
      isHome: String(node.id) === String(startNodeId),
      connections: getNodeConnections(node, nodes, parentId),
      inConnections: [],
      data: node,
      parentId,
      branchNode: branchNodes ?? null,
    };
  });

  if (subNodes?.length > 0) {
    flowNodes = [...flowNodes, ...subNodes];
  }
  return {
    nodeWidth: 200,
    nodeHeight: 100,
    marginTop: 20,
    marginLeft: 20,
    nodeHorizontalSpacing: 40,
    nodeVerticalSpacing: 60,
    activeNode: startNodeId,
    connectors: [],
    ranker: ranker,
    nodes: flowNodes,
  };
};

export const FlowChart = () => {
  const dispatch = useDispatch();
  const [selectedNodeId, setSelectedNodeId] = useState(1);
  const [openAddNewModal, setOpenAddNewModal] = useState(false);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [userModalData, setUserModalData] = useState({ predecessorId: null });
  const [flowData, setFlowData] = useState(
    generateProcedureFlow(1, [{
      id: 1,
      name: "Node Title 1",
      successors: [2],
    }], treeRanker)
  );
  const usersStatus = useSelector(getUsersStatus);
  const usersData = useSelector(getAllUserData);
  const activeUser = useSelector(selectActiveUser);

  useEffect(() => {
    if (usersStatus === LoadingStatus.Idle) {
      dispatch(getAllUsers());
    }
  }, [dispatch, usersStatus]);

  useEffect(() => {
    setFlowData(generateProcedureFlow(1, usersData, treeRanker));
  }, [usersData]);

  const nodeDisplayPanel = useRef(null);

  const handleNodeSelected = (nodeId, node) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodePreview = ({ node }) => {
    console.log("index_27-procedure, node==>", node);
  };

  const setClickedAddButton = (nodeId) => {
    setUserModalData({ predecessorId: nodeId });
    setOpenAddNewModal(true);
  };

  const closeAddNewModal = () => {
    setOpenAddNewModal(false);
  };

  const closeLoginModal = () => {
    setOpenLoginModal(false);
  };

  const onNodeDelete = async (nodeId) => {
    dispatch(deleteUser(nodeId));
  };

  const onNodeEdit = (node) => {
    setUserModalData(node);
    setOpenAddNewModal(true);
  };

  const addData = async (newNodeData) => {
    if (userModalData.predecessorId) {
      // Create Mode
      dispatch(
        createUser({
          predecessor: userModalData.predecessorId,
          successors: [],
          ...newNodeData,
        })
      );
    } else {
      // Edit Mode
      dispatch(
        updateUser({
          predecessor: userModalData.predecessorId,
          ...userModalData,
          ...newNodeData,
        })
      );
    }
    closeAddNewModal();
    setUserModalData({ predecessorId: null });
  };

  return (
    <div ref={nodeDisplayPanel} style={{ height: "100vh", width: "100vw" }}>
      <Button
        variant="contained"
        style={{
          position: "absolute",
          right: "15px",
          top: "15px",
          zIndex: 999,
        }}
        color="info"
        onClick={() => {
          activeUser?.role ? dispatch(logoutUser()) : setOpenLoginModal(true);
        }}
      >
        {activeUser?.role ? "Logout" : "Login"}
      </Button>
      <ProcedureFlow
        draggable={false}
        layoutEngine={layoutEngines.dagreLayout}
        data={flowData}
        activeNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        onNodeActive={handleNodeSelected}
        onNodePreview={(node) => handleNodePreview({ node })}
        setClickedAddButton={setClickedAddButton}
        nodeDisplayPanel={nodeDisplayPanel}
        onNodeDelete={onNodeDelete}
        onNodeEdit={onNodeEdit}
      />
      <AddUserDialog
        userData={userModalData}
        isModalOpen={openAddNewModal}
        closeModal={closeAddNewModal}
        submitData={addData}
      />
      <LoginDialog
        isModalOpen={openLoginModal}
        closeModal={closeLoginModal}
        submitData={addData}
      />
    </div>
  );
};
