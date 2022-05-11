import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: [],
  selected: [],
  expandedManifestLines: {},
};

export const manifestsSlice = createSlice({
  name: 'manifests',
  initialState,
  reducers: {
    push: (state, action) => {
      state.value.push(action.payload);
      state.value.sort((a, b) => a.requestEpochTime - b.requestEpochTime);
    },
    clear: (state, action) => {
      state.value.length = 0;
    },
    setSelected: (state, action) => {
      state.selected = action.payload;
    },
    expandManifestLine: (state, action) => {
      const { manifestUrl, lineIndex } = action.payload;

      state.expandedManifestLines[manifestUrl] =
        state.expandedManifestLines[manifestUrl] || [];
      state.expandedManifestLines[manifestUrl].push(lineIndex);
    },
    collapseManifestLine: (state, action) => {
      const { manifestUrl, lineIndex } = action.payload;

      state.expandedManifestLines[manifestUrl] =
        state.expandedManifestLines[manifestUrl].filter((line) => line !== lineIndex);
    },
    clearExpandedManifestLines: (state, action) => {
      state.expandedManifestLines = {};
    },
  },
})

export const {
  push,
  clear,
  setSelected,
  expandManifestLine,
  collapseManifestLine,
  clearExpandedManifestLines,
} = manifestsSlice.actions;
export default manifestsSlice.reducer;
