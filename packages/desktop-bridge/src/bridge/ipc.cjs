const invoke =
  (ipcRenderer, channel) =>
  (...args) =>
    ipcRenderer.invoke(channel, ...args);

const invokeSync =
  (ipcRenderer, channel) =>
  (...args) =>
    ipcRenderer.sendSync(channel, ...args);

const subscribe =
  (ipcRenderer, channel, mapPayload = (...args) => args[0]) =>
  (callback) => {
    const handler = (_event, ...args) => callback(mapPayload(...args));
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  };

module.exports = {
  invoke,
  invokeSync,
  subscribe,
};
