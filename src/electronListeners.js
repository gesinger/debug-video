import { store } from './app/store';
import {
  push as pushManifest,
  clear as clearManifests,
  setSelected as setSelectedManifests,
  clearExpandedManifestLines,
} from './features/manifests/manifestsSlice';
import {
  push as pushSegment,
  clear as clearSegments,
  setSelected as setSelectedSegments,
  setShowAllTimelines,
  setSelectedTimelines,
} from './features/segments/segmentsSlice';
import {
  push as pushAppend,
  clear as clearAppends,
  setSelected as setSelectedAppends,
} from './features/appends/appendsSlice';
import {
  push as pushSourceBuffer,
  clear as clearSourceBuffers
} from './features/sourceBuffers/sourceBuffersSlice';
import {
  setSessionId,
  setSessionDir,
  setIsDebugVideoArchive,
  setWebsiteUrl,
  setLoadingInput,
  pushLoadingDownloadRequest,
  removeLoadingDownloadRequest,
  clearLoadingDownloadRequests,
  clearFailedInput,
  clearFailedDownloadRequests,
  setFailedInput,
} from './features/sessionInfo/sessionInfoSlice';
import { setInput as setFocusInput } from './features/focus/focusSlice';
import { setFfprobeExists } from './features/capabilities/capabilitiesSlice';
import { setShowPreferences } from './features/preferences/preferencesSlice';
import { setSelectedView } from './features/selections/selectionsSlice';

export const updateStoreFromElectronEvents = () => {
  // Originally, the useEffect hook was used to listen for events from electron, and state
  // was managed without Redux. However, events were missed, because electron's event
  // sending to renderers is async, and on re-render React would unsubscribe then
  // re-subscribe to the events. useSubscription wouldn't work for this case because
  // there's no element to retrieve the value of after an event. The events alone contain
  // the data.
  //
  // Instead of implementing a queue and confirmation events sent from the renderer to
  // electron, Redux provides a simple way of having a single store and allow it to be
  // updated outside of the component tree, and is done here. It also provides a convenient
  // way to persist the state of the application in the future.
  window.electron.on('ffprobe-exists', (e, data) =>
    store.dispatch(setFfprobeExists(data)));
  window.electron.on('session-id', (e, data) => store.dispatch(setSessionId(data)));
  window.electron.on('session-dir', (e, data) => store.dispatch(setSessionDir(data.path)));
  window.electron.on('is-debug-video-archive', (e, data) =>
    store.dispatch(setIsDebugVideoArchive(data)));
  window.electron.on('website-url', (e, data) => store.dispatch(setWebsiteUrl(data)));
  window.electron.on('manifest', (e, data) => {
    const sessionInfo = store.getState().sessionInfo;

    if (data.sessionId !== sessionInfo.sessionId && !sessionInfo.isDebugVideoArchive) {
      return;
    }
    store.dispatch(pushManifest(data));
  });
  window.electron.on('segment', (e, data) => {
    const sessionInfo = store.getState().sessionInfo;

    if (data.sessionId !== sessionInfo.sessionId && !sessionInfo.isDebugVideoArchive) {
      return;
    }
    store.dispatch(pushSegment(data));
  });
  window.electron.on('append', (e, data) => {
    const sessionInfo = store.getState().sessionInfo;

    if (data.sessionId !== sessionInfo.sessionId && !sessionInfo.isDebugVideoArchive) {
      return;
    }
    store.dispatch(pushAppend(data));
  })
  window.electron.on(
    'add-source-buffer', (e, data) => store.dispatch(pushSourceBuffer(data.mimeType)));
  window.electron.on(
    'loading-download-request',
    (e, data) => store.dispatch(pushLoadingDownloadRequest(data))
  );
  window.electron.on(
    'finished-download-request',
    (e, data) => store.dispatch(removeLoadingDownloadRequest(data))
  );
  window.electron.on('loading-input', (e, data) => store.dispatch(setLoadingInput(true)));
  window.electron.on(
    'finished-loading-input',
    (e, data) => {
      store.dispatch(setLoadingInput(false));

      if (data.error) {
        store.dispatch(setFailedInput(data));
        return;
      }

      store.dispatch(clearFailedInput());
    }
  );

  window.electron.on('clear-session', (e) => {
    store.dispatch(clearManifests());
    store.dispatch(clearSegments());
    store.dispatch(clearAppends());
    store.dispatch(clearSourceBuffers());
    store.dispatch(setSessionId(null));
    store.dispatch(setSessionDir(''));
    store.dispatch(setIsDebugVideoArchive(false));
    store.dispatch(setWebsiteUrl(null));
    store.dispatch(setSelectedAppends([]));
    store.dispatch(setSelectedManifests([]));
    store.dispatch(setSelectedSegments([]));
    store.dispatch(clearLoadingDownloadRequests());
    store.dispatch(clearFailedInput());
    store.dispatch(clearFailedDownloadRequests());
    store.dispatch(setLoadingInput(false));
    store.dispatch(setFocusInput(false));
    store.dispatch(clearExpandedManifestLines());
    store.dispatch(setShowPreferences(false));
    store.dispatch(setSelectedView());
    store.dispatch(setShowAllTimelines(true));
    store.dispatch(setSelectedTimelines([]));
  });

  window.electron.on('open-preferences', (e) => {
    store.dispatch(setShowPreferences(true));
  });
};
