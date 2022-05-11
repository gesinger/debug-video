import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: [],
  selected: [],
};

export const appendsSlice = createSlice({
  name: 'appends',
  initialState,
  reducers: {
    push: (state, action) => {
      state.value.push(action.payload)
      state.value.sort((a, b) => a.appendEpochTime - b.appendEpochTime);
    },
    clear: (state, action) => {
      state.value.length = 0;
    },
    setSelected: (state, action) => {
      state.selected = action.payload;
    },
  },
})

export const { push, clear, setSelected } = appendsSlice.actions;
export default appendsSlice.reducer;
