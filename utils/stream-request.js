// utils/stream-request.js
import config from './config.js';

export function streamRequest({ url, onChunk, onEnd, onError }) {
  const token = uni.getStorageSync('token');

  const requestTask = uni.request({
    url: config.baseURL + url,
    method: 'GET',
    enableChunkedResponse: true,
    responseType: 'text',
    header: {
      'Accept': 'text/event-stream',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },

    onChunkReceived: (res) => {
      try {
        let chunk = res.data;

        // ✅ 兼容不同端
        if (typeof chunk !== 'string') {
          chunk = String(chunk);
        }

        console.log('chunk:', chunk);
        onChunk && onChunk(chunk);

      } catch (e) {
        console.error('chunk parse error', e);
      }
    },

    success: (res) => {
      console.log('stream success');
      onEnd && onEnd(res);
    },

    fail: (err) => {
      console.error('stream fail:', err);
      onError && onError(err);
    }
  });

  return requestTask;
}