import { Box, IconButton, Tooltip } from "@mui/material";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Group,
  Shape,
  RegularPolygon,
} from "react-konva";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdZoomIn,
  MdZoomOut,
  MdZoomOutMap,
} from "react-icons/md";
import { Easings } from "konva/lib/Tween";

import { dagreLayout } from "../LayoutEngines/DagreLayout";
import { geminiLayout } from "../LayoutEngines/GeminiLayout";
import useResizeObserver from "use-resize-observer";
import {
  active_node_actions,
  highlight_visibility,
  node_highlighting,
  orientations,
  smoothness,
} from "./FlowSettingsOptions";

import { flowSettings } from "./utils";
import { arcTo, pointOnLine } from "../_helper/mathutils";
import { useSelector } from "react-redux";
import { selectActiveUser } from "../../_features/account/accountSlice";
import { Html } from "react-konva-utils";

const ProcedureFlow = ({
  draggable,
  layoutEngine,
  data,
  activeNodeId,
  onNodeEdit,
  onNodeActive,
  onNodePreview,
  setClickedAddButton,
  onNodeDelete,
  nodeDisplayPanel,
  selectedLanguage,
}) => {
  //#region Constants
  //#endregion Constants

  //#region Hooks
  // Have to get actual size of parent div in order to set
  // Stage to same size
  const { ref, width = 0, height = 0 } = useResizeObserver();

  const stageWidth = width;
  const stageHeight = height;

  //#endregion Hooks

  //#region State

  const [stageSettings, setStageSettings] = useState(null);
  const [flowChart, setFlowChart] = useState(data);
  const [autoLayout, setAutoLayout] = useState(true);

  const [highlightAction, setHighlightAction] = useState(
    node_highlighting.Incoming.id
  );
  const [highlightVisibility, setHighlightVisibility] = useState(
    highlight_visibility.Normal.id
  );

  //#endregion State

  //#region Selectors
  //#endregion Selectors

  //#region Refs

  const stageRef = useRef(null);

  //#endregion Refs

  //#region Effects

  useEffect(() => {
    let value = Object.keys(node_highlighting).find(
      (nd) =>
        node_highlighting[nd].id ===
        (flowSettings?.node_highlight ?? node_highlighting.Incoming.id)
    );
    setHighlightAction(value);
  }, []);

  useEffect(() => {
    let value = Object.keys(highlight_visibility).find(
      (nd) =>
        highlight_visibility[nd].id ===
        (flowSettings?.highlight_visibility ?? highlight_visibility.Normal.id)
    );
    setHighlightVisibility(highlight_visibility?.[value]?.id);
  }, []);

  useEffect(() => {
    let newData = data;
    let orientationDir =
      Object.keys(orientations).find(
        (dir) => orientations[dir].id === flowSettings?.orientation
      ) ?? orientations.TB.value;

    let smoothnessType = Object.keys(smoothness).find(
      (obj) =>
        smoothness[obj].id === (flowSettings?.smoothness ?? smoothness.Low.id)
    );
    let radius = smoothness[smoothnessType].value;

    if (autoLayout) {
      layoutEngine.layout(newData, orientationDir, radius, false);
    } else {
      layoutEngine.updateConnections(newData, orientationDir, radius);
    }
    if (!newData.bounds) {
      setBounds(newData);
    }

    setFlowChart(newData);

    zoomToNode(activeNodeId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, flowSettings?.orientation, flowSettings?.smoothness]);

  useEffect(() => {
    zoomToNode(activeNodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeDisplayPanel?.current, flowChart]);

  //#endregion Effects

  //#region Methods

  const fitStage = useCallback(() => {
    let chartWidth = flowChart.bounds.maxX - flowChart.bounds.minX;
    let chartHeight = flowChart.bounds.maxY - flowChart.bounds.minY;
    let newScale =
      Math.min(
        stageRef.current.attrs.width / chartWidth,
        stageRef.current.attrs.height / chartHeight
      ) * 0.9;
    let newX =
      -flowChart.bounds.minX * newScale +
      stageRef.current.attrs.width / 2.0 -
      (chartWidth * newScale) / 2.0;
    let newY =
      -flowChart.bounds.minY * newScale +
      stageRef.current.attrs.height / 2.0 -
      (chartHeight * newScale) / 2.0;

    moveStage(
      stageRef.current,
      { x: newX, y: newY },
      { x: newScale, y: newScale }
    );
  }, [flowChart]);

  const zoomToNode = useCallback(
    (nodeId, resetScale = false) => {
      const node = flowChart.nodes.find((node) => node.id === nodeId);
      if (node) {
        let newScale = resetScale
          ? 0.5
          : stageSettings
          ? stageSettings.scale
          : 1;
        if (flowSettings?.active_action === active_node_actions.CenterZoom.id) {
          newScale = 1;
        } else if (
          flowSettings?.active_action === active_node_actions.Center.id
        ) {
          newScale = stageRef.current.attrs.scaleX;
        }
        let stageRefWidth = stageWidth;
        let stageRefHeight = stageHeight;
        if (stageRefWidth === 0) {
          stageRefWidth = nodeDisplayPanel?.current?.offsetWidth || stageWidth;
        }
        if (stageRefHeight === 0) {
          stageRefHeight =
            nodeDisplayPanel?.current?.offsetHeight || stageHeight;
        }
        let newX =
          -node.x * newScale +
          stageRefWidth / 2.0 -
          (flowChart.nodeWidth * newScale) / 2.0;
        let newY =
          -node.y * newScale +
          stageRefHeight / 2.0 -
          (flowChart.nodeHeight * newScale) / 2.0;
        if (flowSettings?.active_action === active_node_actions.None.id) {
          newX = stageRef.current.attrs.x;
          newY = stageRef.current.attrs.y;
          newScale = stageRef.current.attrs.scaleX;
        }
        moveStage(
          stageRef.current,
          { x: newX, y: newY },
          { x: newScale, y: newScale }
        );
      }
    },
    [
      flowChart.nodes,
      flowChart.nodeWidth,
      flowChart.nodeHeight,
      stageSettings,
      stageWidth,
      stageHeight,
      nodeDisplayPanel,
    ]
  );

  const moveStage = (stage, location, scale) => {
    stage.to({
      duration: 0.35,
      easing: Easings.EaseInOut,
      node: stage,
      scaleX: (scale && scale.x) || 1,
      scaleY: (scale && scale.y) || 1,
      x: location.x,
      y: location.y,
    });
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.02;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageSettings({
      scale: newScale,
      x: (stage.getPointerPosition().x / newScale - mousePointTo.x) * newScale,
      y: (stage.getPointerPosition().y / newScale - mousePointTo.y) * newScale,
    });
  };

  const updateNodePosition = useCallback(
    (nodeId, x, y) => {
      let node = flowChart.nodes.find((e) => +e.id === +nodeId);
      node.x = x;
      node.y = y;

      setAutoLayout(false);

      let smoothnessType = Object.keys(smoothness).find(
        (obj) =>
          smoothness[obj].id === (flowSettings?.smoothness ?? smoothness.Low.id)
      );
      let radius = smoothness[smoothnessType].value;

      layoutEngine.updateConnections(
        flowChart,
        Object.keys(orientations).find(
          (dir) => orientations[dir].id === flowSettings?.orientation
        ) ?? orientations.TB.value,
        radius
      );

      setFlowChart({
        nodeWidth: flowChart.nodeWidth,
        nodeHeight: flowChart.nodeHeight,
        marginTop: flowChart.marginTop,
        marginLeft: flowChart.marginLeft,
        nodeHorizontalSpacing: flowChart.nodeHorizontalSpacing,
        nodeVerticalSpacing: flowChart.nodeVerticalSpacing,
        nodes: flowChart.nodes,
        connectors: flowChart.connectors,
        nodesByLevel: flowChart.nodesByLevel,
      });
    },
    [flowChart, layoutEngine]
  );

  const onZoom = useCallback(
    (type) => {
      let upFactor = 1.1;
      let downFactor = 0.9;
      let minScale = 0.2;
      let chartWidth = flowChart.bounds.maxX - flowChart.bounds.minX;
      let chartHeight = flowChart.bounds.maxY - flowChart.bounds.minY;
      let scaleX = stageRef.current.attrs.scaleX;
      let scaleY = stageRef.current.attrs.scaleY;
      let newX =
        -flowChart.bounds.minX * scaleX +
        stageRef.current.attrs.width / 2.0 -
        (chartWidth * scaleX) / 2.0;
      let newY =
        -flowChart.bounds.minY * scaleY +
        stageRef.current.attrs.height / 2.0 -
        (chartHeight * scaleY) / 2.0;
      if (type === "zoomin") {
        scaleX = scaleX * upFactor > minScale ? scaleX * upFactor : scaleX;
        scaleY = scaleY * upFactor > minScale ? scaleY * upFactor : scaleY;
      } else {
        scaleX = scaleX * downFactor > minScale ? scaleX * downFactor : scaleX;
        scaleY = scaleY * downFactor > minScale ? scaleY * downFactor : scaleY;
      }
      moveStage(
        stageRef.current,
        { x: newX, y: newY },
        { x: scaleX, y: scaleY }
      );
    },
    [flowChart]
  );

  const findRelationalNodes = useMemo(
    () =>
      (connectors, activeNodeId, relational = []) => {
        const getNode = connectors.find(
          (conn) => conn.endNodeId === activeNodeId
        );
        if (getNode) {
          relational.push(activeNodeId);
          return findRelationalNodes(
            connectors,
            getNode.startNodeId,
            relational
          );
        }
        relational.push(activeNodeId);
        return relational;
      },
    []
  );

  const creatorNodeRelation = useMemo(
    () =>
      findRelationalNodes(
        flowChart.connectors,
        +process.env.REACT_APP_CREATOR_ID
      ),
    [findRelationalNodes, flowChart.connectors]
  );

  const relationalNodes = useMemo(
    () => findRelationalNodes(flowChart.connectors, activeNodeId),
    [activeNodeId, findRelationalNodes, flowChart.connectors]
  );
  //#endregion Methods

  //#region Render time calcs

  let flowNodes = flowChart.nodes.map((node) => {
    let outNode = [];
    flowChart.nodes.forEach((flowChartNode) => {
      if (flowChartNode.id === activeNodeId) {
        flowChartNode.connections.forEach((e) => {
          outNode.push(e.nodeId);
        });
      }
    });
    return (
      <FlowNode
        draggable={draggable}
        isActive={relationalNodes.includes(+node.id)}
        isCreatorNode={creatorNodeRelation.includes(+node.id)}
        isParentActive={+activeNodeId === +node.parentId}
        isBranchNode={Boolean(node.parentId)}
        isConnectedToActive={node.connections
          .map((e) => e.nodeId)
          .includes(activeNodeId)}
        outNode={outNode.map((e) => e).includes(node.id)}
        onNodeEdit={onNodeEdit}
        onNodeActive={onNodeActive}
        onNodePreview={onNodePreview}
        onMove={(nodeId, x, y) => {
          updateNodePosition(nodeId, x, y);
        }}
        nodeId={node.id}
        key={node.id}
        position={{ x: node.x ?? 300.0, y: node.y ?? 0.0 }}
        width={flowChart.nodeWidth}
        height={flowChart.nodeHeight}
        num={node.id.toString()}
        name={selectedLanguage === "english" ? node.name : node.guj_name}
        icons={node.icons}
        homeNode={node?.isHome}
        data={node?.data}
        zoomToNode={zoomToNode}
        highlightAction={highlightAction}
        highlightVisibility={highlightVisibility}
        setClickedAddButton={setClickedAddButton}
        onNodeDelete={onNodeDelete}
      />
    );
  });

  let smoothnessType = Object.keys(smoothness).find(
    (obj) =>
      smoothness[obj].id === (flowSettings?.smoothness ?? smoothness.Low.id)
  );
  let radius = smoothness[smoothnessType].value;

  let flowConnectors = flowChart.connectors.map((connector, index) => {
    return (
      <FlowConnector
        key={`${connector.startNodeId}${connector.endNodeId}${connector.label}${connector.x1}}${connector.y1}`}
        position={{ x: connector.x1, y: connector.y1 }}
        labelPosition={{ x: connector.labelX, y: connector.labelY }}
        label={connector.label}
        isActive={relationalNodes.includes(connector.endNodeId)}
        isCreatorNode={creatorNodeRelation.includes(connector.endNodeId)}
        points={connector.points}
        highlightAction={highlightAction}
        outConnection={+connector.startNodeId === +activeNodeId}
        highlightVisibility={highlightVisibility}
        radius={radius}
      />
    );
  });

  let scale = 1.0;
  let posX = 0.0;
  let posY = 0.0;

  if (stageSettings) {
    scale = stageSettings.scale;
    posX = stageSettings.x;
    posY = stageSettings.y;
  }

  //#endregion Render time calcs

  //#region Render

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        overflow: "clip",
        position: "relative",
      }}
    >
      <Stage
        ref={stageRef}
        draggable
        width={stageWidth}
        height={stageHeight}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={posX}
        y={posY}
        perfectDrawEnabled={false}
      >
        <Layer perfectDrawEnabled={false}>
          {flowNodes}
          {flowConnectors}
        </Layer>
      </Stage>
      <FlowConfigs fitStage={fitStage} onZoom={onZoom} />
    </div>
  );

  //#endregion Render
};

/**
 * Flow Connector component. Draws connector line, label, and arrow from one node to another.
 * @param {{position: Coordinate, labelPosition: Coordinate, label: String, isActive: Boolean, points: Array<Coordinate>}}
 * @property position Start position in global space
 * @property labelPosition Label position relative to start point
 * @property label Text to display as label
 * @property isActive If true then draw in active color
 * @property points Array of points along connector relative to start point
 * @returns {ReactElement}
 */
const FlowConnector = ({
  position,
  labelPosition,
  label,
  isActive,
  isCreatorNode,
  points,
  radius,
  highlightAction,
  highlightVisibility,
  outConnection,
}) => {
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];

  let angleDegrees =
    (Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x) * 180) /
    Math.PI;

  let arrowCenter = pointOnLine(lastPoint, lastPoint, prevPoint, 10.0);
  const arrowRef = useRef();
  const connectionRef = useRef();
  const textShapeRef = useRef();
  let stroke = null;
  let strokeWidth = null;
  let textBackground = null;

  if (isCreatorNode) {
    stroke = "red";
    strokeWidth = 4;
    textBackground = "red";
  } else if (isActive) {
    stroke = "green";
    strokeWidth = 4;
    textBackground = "green";
  } else {
    stroke = "grey";
    strokeWidth = 2;
    textBackground = "grey";
  }
  switch (highlightAction) {
    case node_highlighting.None.label:
      stroke = "grey";
      strokeWidth = 2;
      textBackground = "grey";
      break;
    case node_highlighting.Incoming.label:
      if (isActive) {
        stroke = "green";
        strokeWidth = 4;
        textBackground = "green";
      }
      break;
    case node_highlighting.Outgoing.label:
      if (isActive) {
        stroke = "grey";
        strokeWidth = 2;
        textBackground = "grey";
      }
      if (outConnection) {
        stroke = "green";
        strokeWidth = 4;
        textBackground = "green";
      }
      break;
    case node_highlighting.Both.label:
      if (outConnection || isActive) {
        stroke = "green";
        strokeWidth = 4;
        textBackground = "green";
      }
      break;
    default:
      stroke = "grey";
      strokeWidth = 2;
      textBackground = "grey";
      break;
  }

  useEffect(() => {
    if (arrowRef && connectionRef) {
      arrowRef.current.opacity(1);
      connectionRef.current.opacity(1);
      textShapeRef?.current?.opacity(1);
      if (highlightVisibility === highlight_visibility.Faded.id) {
        arrowRef.current.opacity(0.1);
        connectionRef.current.opacity(0.1);
        textShapeRef?.current?.opacity(0.1);
        switch (highlightAction) {
          case node_highlighting.None.label:
            break;
          case node_highlighting.Incoming.label:
            if (isActive) {
              arrowRef.current.opacity(1);
              connectionRef.current.opacity(1);
              textShapeRef?.current?.opacity(1);
            }
            break;
          case node_highlighting.Outgoing.label:
            if (outConnection) {
              arrowRef.current.opacity(1);
              connectionRef.current.opacity(1);
              textShapeRef?.current?.opacity(1);
            }
            break;
          case node_highlighting.Both.label:
            if (outConnection || isActive) {
              arrowRef.current.opacity(1);
              connectionRef.current.opacity(1);
              textShapeRef?.current?.opacity(1);
            }
            break;
          default:
            arrowRef.current.opacity(0.1);
            connectionRef.current.opacity(0.1);
            textShapeRef?.current?.opacity(0.1);
            break;
        }
      }
    }
  }, [
    highlightVisibility,
    arrowRef,
    connectionRef,
    outConnection,
    textShapeRef,
    isActive,
    highlightAction,
  ]);

  return (
    <Group x={position.x} y={position.y}>
      <Arrow
        arrowRef={arrowRef}
        size={10}
        position={arrowCenter}
        rotation={angleDegrees + 90}
        fill={stroke}
      />
      <ConnectorLine
        connectionRef={connectionRef}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        radius={radius}
      />
      {label && (
        <TextShape
          textShapeRef={textShapeRef}
          position={labelPosition}
          label={label}
          background={textBackground}
          fill="white"
          padding={8}
          fontSize={12}
          isActive={isActive}
        />
      )}

      {/* <ConnectorDebug points={points} radius={radius} /> */}
    </Group>
  );
};

/**
 * Flow Connector line component. Draws connector line from one node to another.
 * @param {{points: Array<Coordinate>, stroke: String | CanvasGradiant, strokeWidth: number}}
 * @property points Array of points along connector relative to start point
 * @property stroke Stroke color
 * @property strokeWidth Stroke width
 * @returns {ReactElement}
 */
const ConnectorLine = ({
  points,
  stroke,
  strokeWidth,
  connectionRef,
  radius,
}) => {
  return (
    <Shape
      ref={connectionRef}
      perfectDrawEnabled={false}
      sceneFunc={(context, shape) => {
        context.beginPath();

        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          context.arcTo(
            points[i].x,
            points[i].y,
            points[i + 1].x,
            points[i + 1].y,
            radius
          );
        }
        context.lineTo(
          points[points.length - 1].x,
          points[points.length - 1].y
        );
        context.strokeShape(shape);
      }}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

/**
 * Flow Connector debug component. Draws a shape at each point along the connector,
 * @param {{points: Array<Coordinate>}}
 * @property points Array of points along connector relative to start point
 * @returns {ReactElement}
 */
// eslint-disable-next-line no-unused-vars
const ConnectorDebug = ({ points, radius }) => {
  // Find points along path given a corner smoothing radius

  let inPoint = points[0];

  let arcInfos = [];
  let allPoints = [{ point: inPoint, color: "red" }];

  for (var i = 1; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    let arcInfo = arcTo(inPoint.x, inPoint.y, p1.x, p1.y, p2.x, p2.y, radius);

    arcInfo.inPoint = inPoint;
    arcInfo.p1 = p1;
    arcInfo.p2 = p2;

    arcInfos.push(arcInfo);
    allPoints.push({ point: arcInfo.center, color: "black" });
    allPoints.push({ point: arcInfo.start, color: "orange" });
    allPoints.push({ point: arcInfo.end, color: "brown" });
    allPoints.push({ point: p1, color: "green" });
    allPoints.push({ point: p2, color: "blue" });
    inPoint = p1;
  }

  var circles = allPoints.map((e, index) => {
    return (
      <Circle
        key={`connect-debug-circle-${index}`}
        radius={3}
        x={e.point.x}
        y={e.point.y}
        fill={e.color}
      />
    );
  });

  const fontSize = 2;
  const spacing = 3;
  var infos = arcInfos.map((e, index) => {
    return (
      <>
        <TextShape
          key={`connect-debug-textshape-1-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y }}
          label={`alen = ${e.arcLen.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        {/* <TextShape
                    key={`connect-debug-textshape-2-${index}`}
                    position={{ x: e.p1.x + 20, y: e.p1.y + spacing }}
                    label={`radius = ${e.radius.toFixed(2)}`}
                    background="red"
                    fill="white"
                    padding={fontSize}
                    fontSize={fontSize}
                    isActive={false}
                /> */}
        <TextShape
          key={`connect-debug-textshape-2-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 1 }}
          label={`angle1 = ${e.angle1.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-3-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 2 }}
          label={`angle2 = ${e.angle2.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-4-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 3 }}
          label={`angle = ${e.angle.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-5-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 4 }}
          label={`startAngle = ${e.startAngle.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-6-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 5 }}
          label={`endAngle = ${e.endAngle.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-7-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 6 }}
          label={`${e.clockwise ? "cw" : "ccw"}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-8-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 7 }}
          label={`rawAngle = ${e.rawAngle.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
        <TextShape
          key={`connect-debug-textshape-9-${index}`}
          position={{ x: e.p1.x + 20, y: e.p1.y + spacing * 8 }}
          label={`direction = ${e.direction.toFixed(2)}`}
          background="red"
          fill="white"
          padding={fontSize}
          fontSize={fontSize}
          isActive={false}
        />
      </>
    );
  });
  return circles.concat(infos);
};

/**
 * Arrow component. Draws arrow with rotation.
 *
 * @param {{position: Coordinate, rotation: number, fill: String | CanvasGradiant }}
 * @property position Position at center of arrow
 * @property rotation Rotation of arrow
 * @property fill Fill color
 * @returns {ReactElement}
 */
const Arrow = ({ position, rotation, fill, arrowRef }) => {
  return (
    <RegularPolygon
      ref={arrowRef}
      perfectDrawEnabled={false}
      sides={3}
      radius={10}
      x={position.x}
      y={position.y}
      rotation={rotation}
      fill={fill}
    />
  );
};

const TextShape = ({
  position,
  label,
  padding,
  fontSize,
  background,
  fill,
  textShapeRef,
}) => {
  const [width, setWidth] = useState(0);
  const rectRef = useRef();
  const textRef = useRef();
  useEffect(() => {
    if (width !== textRef.current.getTextWidth()) {
      setWidth(textRef.current.getTextWidth());
    }
  }, [width]);
  let rectWidth = width + padding;
  let rectHeight = fontSize + padding;
  return (
    <Group
      ref={textShapeRef}
      x={position.x - rectWidth / 2.0}
      y={position.y - rectHeight / 2.0}
    >
      <Rect
        ref={rectRef}
        width={rectWidth}
        height={rectHeight}
        cornerRadius={5}
        fill={background}
      />
      <Text
        perfectDrawEnabled={false}
        text={label}
        ref={textRef}
        fontSize={fontSize}
        x={rectWidth - 50 - rectWidth / 2.0}
        width={100}
        height={rectHeight}
        padding={padding}
        align="center"
        verticalAlign="middle"
        fill={fill}
        listening={false}
      />
    </Group>
  );
};

const FlowNode = ({
  position,
  draggable,
  isActive,
  isCreatorNode,
  isParentActive,
  isConnectedToActive,
  nodeId,
  onNodeActive,
  onMove,
  width,
  height,
  num,
  name,
  data,
  zoomToNode,
  outNode,
  highlightAction,
  highlightVisibility,
  setClickedAddButton,
  onNodeEdit,
  onNodeDelete,
}) => {
  const rectRef = useRef();
  const activeUser = useSelector(selectActiveUser);
  const addButtonleft = position.x + (width / 2.0 - 12.0);
  const addButtonTop = position.y + (height - 12.0);
  const iconsleft = position.x + 5;
  const iconsTop = position.y + 3;
  const size = 20;

  const fillNode = useCallback(() => {
    if (isParentActive) {
      return "aquamarine";
    } else if (isCreatorNode) {
      return "lightblue";
    } else if (isActive) {
      return "lightyellow";
    } else {
      switch (highlightAction) {
        case node_highlighting.None.label:
          break;
        case node_highlighting.Incoming.label:
          if (isConnectedToActive) {
            return "lightyellow";
          } else break;
        case node_highlighting.Outgoing.label:
          if (outNode) {
            return "lightyellow";
          } else break;
        case node_highlighting.Both.label:
          if (outNode || isConnectedToActive) {
            return "lightyellow";
          } else break;
        // case node_highlighting.Path.label:
        //     if (outNode || isConnectedToActive) {
        //         return 'lightyellow';
        //     } else break;
        default:
          if (rectRef.current) {
            if (highlightVisibility === highlight_visibility.Faded.id) {
              rectRef.current.opacity(0.1);
            } else {
              rectRef.current.opacity(1);
            }
          }
          break;
      }
    }
  }, [
    isParentActive,
    isCreatorNode,
    isActive,
    highlightAction,
    isConnectedToActive,
    outNode,
    highlightVisibility,
  ]);

  useEffect(() => {
    if (rectRef) {
      rectRef.current.opacity(1);
      if (highlightVisibility === highlight_visibility.Normal.id) {
        rectRef.current.opacity(1);
      } else if (highlightVisibility === highlight_visibility.Faded.id) {
        rectRef.current.opacity(0.1);
        switch (highlightAction) {
          case node_highlighting.None.label:
            if (isActive) {
              rectRef.current.opacity(1);
            }
            break;
          case node_highlighting.Incoming.label:
            if (isConnectedToActive || isActive) {
              rectRef.current.opacity(1);
            }
            break;
          case node_highlighting.Outgoing.label:
            if (outNode || isActive) {
              rectRef.current.opacity(1);
            }
            break;
          case node_highlighting.Both.label:
            if (outNode || isConnectedToActive || isActive) {
              rectRef.current.opacity(1);
            }
            break;
          default:
            if (isActive) {
              rectRef.current.opacity(1);
            }
            break;
        }
      }
    }
  }, [
    highlightVisibility,
    highlightAction,
    outNode,
    isConnectedToActive,
    isActive,
    isParentActive,
  ]);

  return (
    <>
      {activeUser.role === "admin" && (
        <>
          <Group x={addButtonleft} y={addButtonTop}>
            <Html
              divProps={{
                style: {
                  display: "flex",
                },
              }}
            >
              <IconButton
                width={size}
                height={size}
                style={{
                  padding: "0px",
                  background: "red",
                  color: "white",
                }}
                onClick={() => {
                  setClickedAddButton(nodeId);
                }}
              >
                <MdAdd />
              </IconButton>
            </Html>
          </Group>
          <Group x={iconsleft} y={iconsTop}>
            <Html
              divProps={{
                style: {
                  display: "flex",
                  gap: "1px",
                },
              }}
            >
              <Tooltip
                title={"Edit"}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeEdit(data);
                  zoomToNode(nodeId, true);
                }}
              >
                <Box>
                  <MdEdit fontSize="24px" />
                </Box>
              </Tooltip>
              <Tooltip
                title={"Delete"}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeDelete(nodeId);
                  zoomToNode(nodeId, true);
                }}
              >
                <Box>
                  <MdDelete fontSize="24px" />
                </Box>
              </Tooltip>
            </Html>
          </Group>
        </>
      )}
      <Group
        x={position.x}
        y={position.y}
        draggable={draggable}
        onDragMove={(e) => {
          onMove(nodeId, e.target.x(), e.target.y());
        }}
      >
        <Rect
          ref={rectRef}
          perfectDrawEnabled={false}
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fillNode()}
          stroke="black"
          strokeWidth={1}
          shadowBlur={2}
          onClick={() => {
            onNodeActive(nodeId, data);
            zoomToNode(nodeId, true);
          }}
        />
        <Text
          perfectDrawEnabled={false}
          x={5}
          y={height / 2.0 - height / 6.0}
          width={width - 10}
          height={height / 3.0}
          text={name}
          fontSize={18}
          align="center"
          verticalAlign="middle"
          fill="black"
          listening={false}
        />
        {/* <Text
          perfectDrawEnabled={false}
          x={5}
          y={height / 2.0 - height / 3.8}
          width={width - 10}
          height={height / 3.0}
          text={name}
          fontSize={18}
          align="center"
          verticalAlign="middle"
          fill="black"
          listening={false}
        />
        <Text
          perfectDrawEnabled={false}
          x={5}
          y={height / 1.0 - height / 1.8}
          width={width - 10}
          height={height / 3.0}
          text={name}
          fontSize={16}
          align="center"
          verticalAlign="middle"
          fill="black"
          listening={false}
        /> */}
        <NodeNumber
          position={{ x: width - 30, y: 4 }}
          radius={13}
          label={num.toString()}
        />
      </Group>
    </>
  );
};

/**
 * Node number component. Draws a number with a circular background
 *
 * @param {{position: Coordinate, radius: number, label: String }}
 * @property position Position at center of number
 * @property radius Size of the number circle
 * @property label Number label
 * @returns {ReactElement}
 */
const NodeNumber = ({ position, radius, label }) => {
  return (
    <Group x={position.x} y={position.y} listening={false}>
      <Circle
        perfectDrawEnabled={false}
        x={radius}
        y={radius}
        radius={radius}
        fill="grey"
      />
      <Text
        perfectDrawEnabled={false}
        width={radius * 2}
        height={radius * 2}
        text={label}
        fontSize={10}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        fill="white"
      />
    </Group>
  );
};

const FlowConfigs = ({ fitStage, onZoom }) => {
  const btnStyle = {
    padding: 0,
    borderRight: "1px solid #000000",
    borderRadius: "unset",
  };

  const iconStyle = { color: "#000000", fontSize: "30px" };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        border: "1.5px solid #000000",
        borderRadius: "5px",
        display: "flex",
        zIndex: 15,
        backgroundColor: "#eeed",
      }}
    >
      <IconButton
        style={btnStyle}
        title="Zoom In"
        onClick={() => onZoom("zoomin")}
      >
        <MdZoomIn className="react-icon" style={iconStyle} />
      </IconButton>
      <IconButton
        style={btnStyle}
        title="Zoom Out"
        onClick={() => onZoom("zoomout")}
      >
        <MdZoomOut className="react-icon" style={iconStyle} />
      </IconButton>
      <IconButton style={btnStyle} title="Zoom Fit" onClick={fitStage}>
        <MdZoomOutMap className="react-icon" style={iconStyle} />
      </IconButton>
    </div>
  );
};

const setBounds = (flowChart) => {
  let minX = Number.MAX_VALUE,
    maxX = Number.MIN_VALUE,
    minY = Number.MAX_VALUE,
    maxY = Number.MIN_VALUE;

  flowChart.nodes.forEach((node) => {
    let nodeMinX = node.x;
    let nodeMinY = node.y;
    let nodeMaxX = node.x + flowChart.nodeWidth;
    let nodeMaxY = node.y + flowChart.nodeHeight;
    minX = nodeMinX < minX ? nodeMinX : minX;
    maxX = nodeMaxX > maxX ? nodeMaxX : maxX;
    minY = nodeMinY < minY ? nodeMinY : minY;
    maxY = nodeMaxY > maxY ? nodeMaxY : maxY;
  });

  flowChart.bounds = {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
  };
};
export const layoutEngines = {
  dagreLayout,
  geminiLayout,
};

export { ProcedureFlow };
