const smoothness = {
  Low: { id: 1, label: "Low", value: 0 },
  Medium: { id: 2, label: "Medium", value: 20 },
  High: { id: 3, label: "High", value: 50 },
};

const orientations = {
  TB: { id: 1, label: "Top to Bottom", value: "TB" },
  LR: { id: 2, label: "Left to Right", value: "LR" },
};

const active_node_actions = {
  None: { id: 1, label: "None" },
  CenterZoom: { id: 2, label: "Center and zoom" },
  Center: { id: 3, label: "Center only" },
};

const node_highlighting = {
  None: { id: 1, label: "None" },
  Incoming: { id: 2, label: "Incoming" },
  Outgoing: { id: 3, label: "Outgoing" },
  Both: { id: 4, label: "Both" },
};

const highlight_visibility = {
  Normal: { id: 1, label: "Normal" },
  Faded: { id: 2, label: "Faded" },
};

export {
  smoothness,
  orientations,
  active_node_actions,
  node_highlighting,
  highlight_visibility,
};
