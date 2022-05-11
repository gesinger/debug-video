import { createSlice } from '@reduxjs/toolkit';

const initialState = { value: [] };

export const sourceBuffersSlice = createSlice({
  name: 'sourceBuffers',
  initialState,
  reducers: {
    push: (state, action) => {
      state.value.push(action.payload);
    },
    clear: (state, action) => {
      state.value.length = 0;
    },
  },
})

export const { push, clear } = sourceBuffersSlice.actions;
export default sourceBuffersSlice.reducer;
