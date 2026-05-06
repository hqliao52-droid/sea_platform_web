// utils/stream-request.js

const baseURL = 'http://192.168.110.218:8000';

export function streamRequest({ url, onChunk, onEnd, onError }) {
  const token = uni.getStorageSync('token');

  const requestTask = uni.request({
    url: baseURL + url, // ✅ 必须拼接 baseURL
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