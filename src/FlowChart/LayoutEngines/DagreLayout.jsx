import dagre from "dagre";
import {
  smoothPolylineLength,
  pointOnSmoothPolyline,
} from "../_helper/mathutils";

/**
 * Layout engine for the ProcedureFlow component using the Dagre library.
 * Does not currently support updating connections. This was attempted
 * with the keepNodePositions option, but did not work as expected. The idea
 * was to rebuild the graph using existing node locations.
 *
 * Support additional ranker property on the flowChart object. This controls
 * the internal layout algorithm. The default network-simplex seems to
 * be the best option. longest-path places disconnected nodes at the bottom.
 */
export const dagreLayout = (function () {
  // Private
  // eslint-disable-next-line no-unused-vars
  const addDebugConnectors = (flowChart) => {
    var lastConnector = flowChart.connectors[flowChart.connectors.length - 1];

    flowChart.connectors.push({
      x1: lastConnector.x1,
      y1: lastConnector.y1,
      x2: lastConnector.x2,
      y2: lastConnector.y2,
      labelX: lastConnector.labelX,
      labelY: lastConnector.labelX,
      label: lastConnector.label,
      startNodeId: lastConnector.label,
      endNodeId: lastConnector.endNodeId,
      points: [
        { x: 500, y: 100 },
        { x: 600, y: 100 },
        { x: 600, y: 130 },
        { x: 630, y: 150 },
        { x: 600, y: 170 },
        { x: 600, y: 200 },
        { x: 570, y: 200 },
        { x: 550, y: 230 },
        { x: 530, y: 200 },
        { x: 500, y: 200 },
        { x: 500, y: 100 },
      ],
    });
    flowChart.connectors.push({
      x1: lastConnector.x1,
      y1: lastConnector.y1,
      x2: lastConnector.x2,
      y2: lastConnector.y2,
      labelX: lastConnector.labelX,
      labelY: lastConnector.labelX,
      label: lastConnector.label,
      startNodeId: lastConnector.label,
      endNodeId: lastConnector.endNodeId,
      points: [
        { x: 400, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 200 },
        { x: 400, y: 200 },
        { x: 400, y: 100 },
      ],
    });
  };

  // Public
  return {
    updateConnections: async (flowChart, orientation = "TB", radius = 50) => {
      // dagreLayout.layout(flowChart, orientation, true);
    },
    layout: async (
      flowChart,
      orientation = "TB",
      radius = 50,
      keepNodePositions = false
    ) => {
      flowChart.bounds = null;

      // Create a new directed graph
      var g = new dagre.graphlib.Graph({
        multigraph: true,
      });

      // Set an object for the graph label
      // ranker types: 'network-simplex', 'tight-tree' or 'longest-path'
      g.setGraph({ ranker: flowChart.ranker, rankdir: orientation });

      // Default to assigning a new object as a label for each new edge.
      g.setDefaultEdgeLabel(function () {
        return {};
      });

      // Add nodes to the graph. The first argument is the node id. The second is
      // metadata about the node. In this case we're going to add labels to each of
      // our nodes.
      flowChart.nodes.forEach((node) => {
        g.setNode(node.id.toString(), {
          label: node.name,
          width: flowChart.nodeWidth,
          height: flowChart.nodeHeight,
          x: keepNodePositions ? node.x + flowChart.nodeWidth / 2.0 : undefined,
          y: keepNodePositions
            ? node.y + flowChart.nodeHeight / 2.0
            : undefined,
        });
        if (node?.branchNode) {
          node?.branchNode?.nodes.forEach((nd) => {
            g.setNode(`${nd?.id.toString()}`, {
              label: nd.name,
              width: flowChart.nodeWidth,
              height: flowChart.nodeHeight,
              x: keepNodePositions
                ? nd.x + flowChart.nodeWidth / 2.0
                : undefined,
              y: keepNodePositions
                ? nd.y + flowChart.nodeHeight / 2.0
                : undefined,
            });
          });
          g.setEdge(
            node?.id?.toString(),
            `${node?.branchNode?.nodes[0].id.toString()}`,
            {
              width: 60,
              height: 60,
              labelpos: "c",
            },
            `Sub branch `
          );
        }
      });

      flowChart.nodes.forEach((node) => {
        node.connections.forEach((connectionInfo) => {
          // Verify that connection is valid
          var outNode = flowChart.nodes.find(
            (node) => +node.id === +connectionInfo.nodeId
          );
          if (outNode) {
            g.setEdge(
              node.id.toString(),
              connectionInfo.nodeId.toString(),
              {
                width: 60,
                height: 60,
                labelpos: "c",
              },
              connectionInfo.label
            );
          } else {
            console.log("ERROR: Could not find node");
          }
        });
      });

      dagre.layout(g);

      flowChart.bounds = {
        minX: 0.0,
        minY: 0.0,
        maxX: g.graph().width,
        maxY: g.graph().height,
      };

      g.nodes().forEach(function (v) {
        let gnode = g.node(v);
        let node = flowChart.nodes.find((node) => +node.id === +v);
        if (node) {
          node.x = gnode.x - flowChart.nodeWidth / 2.0;
          node.y = gnode.y - flowChart.nodeHeight / 2.0;
        }
      });

      flowChart.connectors = [];
      g.edges().forEach(function (e) {
        let edge = g.edge(e);
        let startNode = flowChart.nodes.find((node) => +node.id === +e.v);
        let endNode = flowChart.nodes.find((node) => +node.id === +e.w);

        // Account for the fact the ProcedureFlow expects
        // connection points to be relative to starting node position
        let deltaPoints = edge.points.map((point) => {
          return {
            x: point.x - startNode.x,
            y: point.y - startNode.y,
          };
        });

        let totalLength = smoothPolylineLength(deltaPoints, radius);

        let midPoint = pointOnSmoothPolyline(
          deltaPoints,
          radius,
          totalLength / 2
        );

        flowChart.connectors.push({
          x1: startNode.x,
          y1: startNode.y,
          x2: endNode.x,
          y2: endNode.y,
          labelX: midPoint.x,
          labelY: midPoint.y,
          label: e.name,
          startNodeId: startNode.id,
          endNodeId: endNode.id,
          points: deltaPoints,
        });
      });
    },
  };
})();
