const { app, Menu } = require('electron')

const isMac = process.platform === 'darwin'

const DEFAULT_MENUS = {
  app: {
    label: app.name,
    submenu: [
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  file: {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  edit: {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  view: {
    label: 'View',
    submenu: [
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  window: {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  help: {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
};

const createApplicationMenu = ({ openPreferences, createNewSession, exportSession }) => {
  const preferencesSubmenuItem = {
    label: 'Preferences',
    accelerator: 'CommandOrControl+,',
    role: 'preferences',
    click: openPreferences,
  };
  const appMenu = Object.assign({}, DEFAULT_MENUS.app, {
    submenu: [preferencesSubmenuItem].concat(DEFAULT_MENUS.app.submenu),
  });
  const fileMenu = Object.assign({}, DEFAULT_MENUS.file, {
    submenu: [{
      label: 'Export Session',
      accelerator: 'CommandOrControl+E',
      role: 'export',
      click: exportSession,
    }, {
      label: 'New Session',
      accelerator: 'CommandOrControl+N',
      role: 'new',
      click: createNewSession,
    },
    ...(!isMac ? [{ type: 'separator' }, preferencesSubMenuItem] : []),
    { type: 'separator' },
    ].concat(DEFAULT_MENUS.file.submenu),
  });

  const template = [
    ...(isMac ? [appMenu] : []),
    ...([fileMenu]),
    ...([DEFAULT_MENUS.edit]),
    ...([DEFAULT_MENUS.view]),
    ...([DEFAULT_MENUS.window]),
    ...([DEFAULT_MENUS.help]),
  ];

  return Menu.buildFromTemplate(template);
};

module.exports = {
  createApplicationMenu,
};
