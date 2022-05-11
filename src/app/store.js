import { configureStore } from '@reduxjs/toolkit';
import manifestsReducer from '../features/manifests/manifestsSlice';
import segmentsReducer from '../features/segments/segmentsSlice';
import appendsReducer from '../features/appends/appendsSlice';
import sourceBuffersReducer from '../features/sourceBuffers/sourceBuffersSlice';
import sessionInfoReducer from '../features/sessionInfo/sessionInfoSlice';
import capabilitiesReducer from '../features/capabilities/capabilitiesSlice';
import selectionsReducer from '../features/selections/selectionsSlice';
import focusReducer from '../features/focus/focusSlice';
import preferencesReducer from '../features/preferences/preferencesSlice';

export const store = configureStore({
  reducer: {
    manifests: manifestsReducer,
    segments: segmentsReducer,
    appends: appendsReducer,
    sourceBuffers: sourceBuffersReducer,
    sessionInfo: sessionInfoReducer,
    capabilities: capabilitiesReducer,
    selections: selectionsReducer,
    focus: focusReducer,
    preferences: preferencesReducer,
  },
});
