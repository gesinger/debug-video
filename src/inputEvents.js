import { store } from './app/store';
import {
  setShowPageDetails,
  setShowTable,
  setShowDetails,
  setShowAudioStreams,
  setShowVideoStreams,
  setSelectedView,
} from './features/selections/selectionsSlice';
import { setSelected as setSelectedAppends } from './features/appends/appendsSlice';
import { setSelected as setSelectedManifests } from './features/manifests/manifestsSlice';
import { setSelected as setSelectedSegments } from './features/segments/segmentsSlice';

const updateSelected = ({ view, number, setSelected }) => {
  const state = store.getState();
  const items = state[view].value;
  const selectedItems = state[view].selected;

  if (!items[number]) {
    return;
  }

  if (selectedItems.includes(items[number])) {
    store.dispatch(setSelected(
      selectedItems.filter((item) => item !== items[number])));
    return;;
  }

  store.dispatch(setSelected(selectedItems.concat(items[number])));
};

export const listenToInputEvents = () => {
  window.addEventListener('keyup', ({ key }) => {
    const state = store.getState();

    if (!state.preferences.useKeyboardShortcuts) {
      return;
    }

    const number = Number.parseInt(key);

    if (!isNaN(number) && !state.preferences.useNumberKeyboardShortcuts) {
      return;
    }

    // If focus is already on an input, don't use key shortcuts
    if (state.focus.input) {
      return;
    }

    const hasManifests = state.manifests.value.length > 0;
    const hasSegments = state.segments.value.length > 0;
    const hasAppends = state.appends.value.length > 0;

    // If there's no data yet, the prompt view should be showing, and keyboard shortcuts
    // should not be used.
    if (!hasManifests && !hasSegments && !hasAppends) {
      return;
    }

    const selectedView = state.selections.selectedView;

    if (!isNaN(number)) {
      switch (selectedView) {
        case 'appends':
          updateSelected({ view: selectedView, number, setSelected: setSelectedAppends });
          break;
        case 'manifests':
          updateSelected({ view: selectedView, number, setSelected: setSelectedManifests });
          break;
        case 'segments':
          updateSelected({ view: selectedView, number, setSelected: setSelectedSegments });
          break;
        default: break;
      }
      return;
    }

    if (key === 'a') {
      if (hasAppends) {
        store.dispatch(setSelectedView('appends'));
      }
      return;
    }
    if (key === 'm') {
      if (hasManifests) {
        store.dispatch(setSelectedView('manifests'));
      }
    }
    if (key === 's') {
      if (hasSegments) {
        store.dispatch(setSelectedView('segments'));
      }
      return;
    }

    if (key === 'c') {
      switch (selectedView) {
        case 'appends':
          store.dispatch(setSelectedAppends([]));
          break;
        case 'manifests':
          store.dispatch(setSelectedManifests([]));
          store.dispatch(setSelectedSegments([]));
          break;
        case 'segments':
          store.dispatch(setSelectedSegments([]));
          break;
        default: break;
      }
      return;
    }

    switch (key) {
      case 'p':
        store.dispatch(setShowPageDetails(!state.selections.showPageDetails));
        break;
      case 't':
        store.dispatch(setShowTable(!state.selections.showTable));
        break;
      case 'v':
        store.dispatch(setShowDetails(!state.selections.showDetails));
        break;
      case 'z':
        store.dispatch(setShowAudioStreams(!state.selections.showAudioStreams));
        break;
      case 'x':
        store.dispatch(setShowVideoStreams(!state.selections.showVideoStreams));
        break;
      default: break;
    };
  });
};
