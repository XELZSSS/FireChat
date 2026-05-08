const HTTP_PROTOCOL_HTTP1 = 'http1';
const HTTP_PROTOCOL_HTTP2 = 'http2';

const normalizeHttpProtocol = (value) =>
  value === HTTP_PROTOCOL_HTTP2 ? HTTP_PROTOCOL_HTTP2 : HTTP_PROTOCOL_HTTP1;

module.exports = {
  HTTP_PROTOCOL_HTTP1,
  HTTP_PROTOCOL_HTTP2,
  normalizeHttpProtocol,
};
