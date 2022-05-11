const colors = {
  label: {
    background: [
      'bg-label-0',
      'bg-label-1',
      'bg-label-2',
      'bg-label-3',
      'bg-label-4',
      'bg-label-5',
    ],
    border: [
      'border-label-0',
      'border-label-1',
      'border-label-2',
      'border-label-3',
      'border-label-4',
      'border-label-5',
    ],
  },
  // TODO share with tailwind.config.js
  // From Darcula color theme. If updating here, update in tailwind.config.js
  values: {
    '-1': 'transparent',
    '0': 'hsl(191, 97%, 77%)',
    '1': 'hsl(135, 94%, 65%)',
    '2': 'hsl(31, 100%, 71%)',
    '3': 'hsl(326, 100%, 74%)',
    // purple used for tables
    // '4': 'hsl(265, 89%, 78%)',
    '4': 'hsl(0, 100%, 67%)',
    '5': 'hsl(65, 92%, 76%)',
  },
  viz: {
    purple1: 'hsl(245, 95%, 68%)',
    purple2: 'hsl(269, 100%, 80%)',
    purple3: 'hsl(270, 99%, 64%)',
    blue: 'hsl(188, 97%, 44%)',
    green: 'hsl(165, 74%, 51%)',
    white: 'hsl(0, 0%, 100%)',
    background: 'hsl(215, 28%, 17%)',
    pink: 'hsl(337, 80%, 82%)',
  }
};

export default colors;
