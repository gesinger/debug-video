# debug.video

A debugging tool for streaming media. See the [debug.video](https://debug.video) website for more details.

## Downloading and Installing

### Requirements

`ffmpeg` and `ffprobe` (version 4 or 5) are required on your [PATH](https://en.wikipedia.org/wiki/PATH_(variable)) for debug.video to work. Note that `ffprobe` comes with `ffmpeg`. If you've previously installed `ffmpeg`, or anything that uses `ffmpeg`, you most likely have it available on your PATH already. You can check that they're available by opening a terminal and running `ffmpeg` and `ffprobe`. If you see output that isn't "command not found," you should be set.

If you don't have `ffmpeg` and `ffprobe`, you can install them via your favorite package manager or [the ffmpeg website](https://ffmpeg.org/).

### Getting the Latest Release

* Go to the [releases](https://github.com/gesinger/debug-video/releases) page.
* Download the DMG of the latest release. The file is named "debug-video-#.#.#.dmg", where "#.#.#" is the version of the release.

### Installing

Open the DMG and drag the app into the Applications directory.

## Developing

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), and Electron was added on top. There are two main directories: `electron` and `src`.

`electron` has all of the Electron code.

`src` has the React app (rendered as a BrowserWindow by Electron).

### `npm run dev`

Starts both the React app and Electron.

Any updates to the React component tree (starting with `src/App.js`) will auto refresh in the BrowserWindow. Changes outside of the tree and in Electron require a new run.

### `npm run debug`

Does the same as `npm run dev` but adds `--inspect`. After running, open `chrome://inspect` in Chrome to debug the main process.

## Releasing

For testing a packaged build yourself, `npm run package` builds both React and Electron and runs `electron-builder` to package everything together. The app is put into the `dist/` directory and can be installed by opening `debug.video-v#.#.#.dmg`.

For releasing to others, macOS requires the code to be signed and notarized. This is done automatically by a GitHub action when a tag is pushed. It will create a draft of a release on the Releases page. Once that draft is published, users can download the `debug-video-v#.#.#.dmg` asset.

The GitHub action can be viewed in the `.github` directory. The notarization script is `notarize.js`. The entitlements file is `entitlements.mac.plist`.

## Contributing

Any and all contributions are welcome and appreciated!
