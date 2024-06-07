const procedure = {
  nodes: [
    {
      id: 1,
      name: "Node Title 1",
      successors: [2],
    },
    {
      id: 2,
      name: "Node Title 2",
      successors: [3, 5, 6],
    },
    {
      id: 3,
      name: "Node Title 3",
      successors: [4],
    },
    {
      id: 4,
      name: "Node Title 4",
      successors: [7, 8, 9, 22],
    },

    {
      id: 5,
      name: "Node Title 5",
      successors: [10, 11, 12],
    },
    {
      id: 6,
      name: "Node Title 6",
      successors: [13, 14, 15],
    },
    {
      id: 7,
      name: "Node Title 7",
      successors: [],
    },
    {
      id: 8,
      name: "Node Title 8",
      successors: [],
    },
    {
      id: 9,
      name: "Node Title 9",
    },
    {
      id: 10,
      name: "Node Title 10",
      successors: [19],
    },
    {
      id: 11,
      name: "Node Title 11",
      successors: [20],
    },
    {
      id: 12,
      name: "Node Title 12",
      successors: [],
    },

    {
      id: 13,
      name: "Node Title 13",
      successors: [21],
    },

    {
      id: 14,
      name: "Node Title 14",
      successors: [],
    },
    {
      id: 15,
      name: "Node Title 15",
      successors: [],
    },
    {
      id: 16,
      name: "Node Title 16",
      successors: [],
    },
    {
      id: 17,
      name: "Node Title 17",
      successors: [],
    },
    {
      id: 18,
      name: "Node Title 18",
      successors: [],
    },
    {
      id: 19,
      name: "Node Title 19",
      successors: [],
    },
    {
      id: 20,
      name: "Node Title 20",
      successors: [],
    },
    {
      id: 21,
      name: "Node Title 21",
      successors: [16, 17, 18],
    },
    {
      id: 22,
      name: "Node Title 22",
      successors: [],
    },
  ],
  start_node_id: "1",
};

const flowSettings = {
  smoothness: 3,
  orientation: 1,
  active_action: 3,
  node_highlight: 2,
  highlight_visibility: 1,
};
export { procedure, flowSettings };
