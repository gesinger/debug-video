import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showPageDetails: false,
  showTable: true,
  showDetails: true,
  showTimelineViz: true,
  showAudioStreams: true,
  showVideoStreams: true,
  showManifestDiff: false,
  selectedView: null,
};

export const selectionsSlice = createSlice({
  name: 'selectionsSlice',
  initialState,
  reducers: {
    setShowPageDetails: (state, action) => {
      state.showPageDetails = action.payload;
    },
    setShowTable: (state, action) => {
      state.showTable = action.payload;
    },
    setShowDetails: (state, action) => {
      state.showDetails = action.payload;
    },
    setShowTimelineViz: (state, action) => {
      state.showTimelineViz = action.payload;
    },
    setShowAudioStreams: (state, action) => {
      state.showAudioStreams = action.payload;
    },
    setShowVideoStreams: (state, action) => {
      state.showVideoStreams = action.payload;
    },
    setShowManifestDiff: (state, action) => {
      state.showManifestDiff = action.payload;
    },
    setSelectedView: (state, action) => {
      state.selectedView = action.payload;
    },
  },
})

export const {
  setShowPageDetails,
  setShowTable,
  setShowDetails,
  setShowTimelineViz,
  setShowAudioStreams,
  setShowVideoStreams,
  setShowManifestDiff,
  setSelectedView,
} = selectionsSlice.actions;
export default selectionsSlice.reducer;
