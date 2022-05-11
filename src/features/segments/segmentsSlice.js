import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: [],
  selected: [],
  showAllTimelines: true,
  selectedTimelines: [],
};

export const segmentsSlice = createSlice({
  name: 'segments',
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
    setShowAllTimelines: (state, action) => {
      state.showAllTimelines = action.payload;
    },
    setSelectedTimelines: (state, action) => {
      state.selectedTimelines = action.payload;
    },
  },
})

export const {
  push,
  clear,
  setSelected,
  setShowAllTimelines,
  setSelectedTimelines,
} = segmentsSlice.actions;
export default segmentsSlice.reducer;
