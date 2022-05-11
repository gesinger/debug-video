import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  sessionDir: '',
  isDebugVideoArchive: false,
  websiteUrl: null,
  loadingInput: false,
  failedInput: null,
  loadingDownloadRequests: [],
  failedDownloadRequests: {},
};

export const sessionInfoSlice = createSlice({
  name: 'sessionInfo',
  initialState,
  reducers: {
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    setSessionDir: (state, action) => {
      state.sessionDir = action.payload;
    },
    setIsDebugVideoArchive: (state, action) => {
      state.isDebugVideoArchive = action.payload;
    },
    setWebsiteUrl: (state, action) => {
      state.websiteUrl = action.payload;
    },
    pushLoadingDownloadRequest: (state, action) => {
      state.loadingDownloadRequests.push(action.payload);
    },
    removeLoadingDownloadRequest: (state, action) => {
      const key = action.payload.key;

      state.loadingDownloadRequests = state.loadingDownloadRequests.filter(
        ({ key: k }) => k !== key);

      if (action.payload.error) {
        state.failedDownloadRequests[key] = action.payload.error;
      } else {
        delete state.failedDownloadRequests[key];
      }
    },
    clearFailedDownloadRequests: (state, action) => {
      state.failedDownloadRequests = {};
    },
    clearLoadingDownloadRequests: (state, action) => {
      state.loadingDownloadRequests = [];
    },
    setLoadingInput: (state, action) => {
      state.loadingInput = action.payload;
    },
    setFailedInput: (state, action) => {
      state.failedInput = action.payload;
    },
    clearFailedInput: (state, action) => {
      state.failedInput = null;
    },
  },
})

export const {
  setSessionId,
  setSessionDir,
  setIsDebugVideoArchive,
  setWebsiteUrl,
  pushLoadingDownloadRequest,
  removeLoadingDownloadRequest,
  clearLoadingDownloadRequests,
  setLoadingInput,
  setFailedInput,
  clearFailedInput,
  clearFailedDownloadRequests,
} = sessionInfoSlice.actions;
export default sessionInfoSlice.reducer;
