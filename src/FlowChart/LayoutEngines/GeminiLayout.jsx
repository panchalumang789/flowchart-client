export const geminiLayout = (function () {
  // Private

  const getNodePosition = (flowChart, node) => {
    // Find index on current level

    let levelNodes = flowChart.nodesByLevel[node.level];

    var levelIndex = levelNodes.findIndex((e) => +e.id === +node.id);

    let currentY =
      flowChart.marginTop +
      (node.level - 1) * (flowChart.nodeHeight + flowChart.nodeVerticalSpacing);

    let levelWidth =
      levelNodes.length * flowChart.nodeWidth +
      (levelNodes.length - 1) * flowChart.nodeHorizontalSpacing;

    let levelStartX =
      flowChart.marginLeft + flowChart.chartCenterX - levelWidth / 2.0;

    let currentX =
      levelStartX +
      levelIndex * (flowChart.nodeWidth + flowChart.nodeHorizontalSpacing);
    return { x: currentX, y: currentY };
  };

  const setChildLevels = (flowChart, node) => {
    if (node.level === undefined) {
      node.level = 1;
    }
    node.needsChildrenLeveled = false;
    node.connections.forEach((connectionInfo) => {
      // Layout connecting node and its children before moving on
      let childNode = flowChart.nodes.find(
        (e) => +e.id === +connectionInfo.nodeId
      );
      if (childNode) {
        if (childNode.level === undefined) {
          childNode.level = node.level + 1;
        } else if (+childNode.level === +node.level) {
          childNode.level = node.level + 1;
        }
      }
    });
  };

  const assignLevels = (flowChart) => {
    let startNode = flowChart.nodes.find((e) => e.isHome === true);

    if (startNode == null) {
      startNode = flowChart.nodes[0];
    }

    startNode.level = 1;

    setChildLevels(flowChart, startNode);

    flowChart.nodes.forEach((node) => {
      setChildLevels(flowChart, node);
    });
  };

  const setTreeMetadata = (flowChart) => {
    // Create mapping by level
    // flowChart.nodes.sort((a, b) => a - b);

    flowChart.nodesByLevel = {};
    flowChart.nodes.forEach((element) => {
      var nodes = flowChart.nodesByLevel[element.level];
      if (!nodes) {
        flowChart.nodesByLevel[element.level] = [];
        nodes = flowChart.nodesByLevel[element.level];
      }
      nodes.push(element);
    });

    // Find level with most nodes - that will determine full width
    const counts = Object.keys(flowChart.nodesByLevel).map((key) => {
      return { level: key, count: flowChart.nodesByLevel[key].length };
    });

    const maxNodes = Math.max(...counts.map((e) => e.count));

    // Compute full width

    const fullWidth =
      maxNodes * flowChart.nodeWidth +
      (maxNodes - 1) * flowChart.nodeHorizontalSpacing;
    flowChart.chartCenterX = fullWidth / 2.0;
  };

  const setTreeConnections = (flowChart) => {
    flowChart.connectors = Object.keys(flowChart.nodesByLevel ?? {})
      .map((key) => {
        let levelNodes = flowChart.nodesByLevel[key];

        // TODO: Prepass to get all connecting lines for all nodes
        // on this level that are overlapping and space them out.
        // The simplified algorithm below just adds a bend offset for each
        // line on each node which only prevents overlap of lines from the same node.

        return levelNodes.map((node) => {
          // Figure out starting position for connectors
          let outFullWidth = (node.connections.length - 1) * 20;
          let outStartOffset = -outFullWidth / 2.0;

          let rightCount = 0;
          let leftCount = 0;

          return node.connections.map((connectionInfo, index) => {
            var label = connectionInfo.label;
            var nodeId = connectionInfo.nodeId;
            let connectingNode = flowChart.nodes.find((e) => +e.id === +nodeId);

            let inFullWidth = (connectingNode.inConnections.length - 1) * 20;
            let inStartOffset = -inFullWidth / 2.0;

            let connectingNodeIndex = connectingNode.inConnections.findIndex(
              (e) => +e === +node.id
            );

            let startPos = { x: node.x, y: node.y };
            let endPos = {
              x: connectingNode.x,
              y: connectingNode.y,
            };
            if (endPos.y < startPos.y) {
              endPos.y = endPos.y + flowChart.nodeHeight;
            }
            startPos.x =
              startPos.x +
              flowChart.nodeWidth / 2.0 +
              (outStartOffset + index * 20);
            startPos.y = startPos.y + flowChart.nodeHeight;
            endPos.x =
              endPos.x +
              flowChart.nodeWidth / 2.0 +
              (inStartOffset + connectingNodeIndex * 20);

            // Set location for connector bend based on line locaiton

            let bendOffset = 0;

            if (endPos.x > startPos.x) {
              rightCount++;
              bendOffset = rightCount * 3;
            } else {
              leftCount++;
              bendOffset = leftCount * -3;
            }

            let dx = endPos.x - startPos.x;
            let dy = endPos.y - startPos.y;

            let points = [];

            let labelX = dx;
            let labelY = dy / 2.0;

            points.push({
              x: 0,
              y: 0,
            });

            // Create points along connector path
            if (Math.abs(dx) > 1) {
              let bendLocationY = flowChart.nodeVerticalSpacing / 2.0;
              bendLocationY -= bendOffset;

              points.push({ x: 0, y: bendLocationY });
              points.push({ x: dx, y: bendLocationY });

              labelX = dx / 2.0;
              labelY = bendLocationY;
            }
            points.push({ x: dx, y: dy });

            return {
              x1: startPos.x,
              y1: startPos.y,
              x2: endPos.x,
              y2: endPos.y,
              labelX: labelX,
              labelY: labelY,
              label: label,
              startNodeId: nodeId,
              endNodeId: connectingNode.id,
              points: points,
            };
          });
        });
      })
      .flat(2);
  };
  // Public
  return {
    updateConnections: async (flowChart) => {
      setTreeConnections(flowChart);
    },
    layout: async (flowChart) => {
      flowChart.bounds = null;

      if (flowChart.nodes.length === 0) {
        return;
      }

      // Assign levels starting with home position

      assignLevels(flowChart);

      setTreeMetadata(flowChart);

      flowChart.nodes.forEach((node) => {
        let nodePos = getNodePosition(flowChart, node);
        node.x = nodePos.x;
        node.y = nodePos.y;
      });

      setTreeConnections(flowChart);
    },
  };
})();
