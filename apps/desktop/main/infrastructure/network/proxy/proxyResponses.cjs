const getProxyResponseStatus = (error) => {
  const code = error?.code;
  if (
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'UND_ERR_BODY_TIMEOUT' ||
    code === 'ETIMEDOUT'
  ) {
    return 504;
  }

  if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ECONNRESET') {
    return 502;
  }

  if (
    error instanceof SyntaxError ||
    code === 'ERR_INVALID_URL' ||
    String(error?.message ?? '')
      .toLowerCase()
      .includes('unsupported proxy target') ||
    String(error?.message ?? '')
      .toLowerCase()
      .includes('missing a ') ||
    String(error?.message ?? '')
      .toLowerCase()
      .includes('not allowed')
  ) {
    return 400;
  }

  return 502;
};

const writeProxyErrorResponse = (response, corsHeaders, error) => {
  if (response.writableEnded || response.destroyed) {
    return;
  }

  response.writeHead(getProxyResponseStatus(error), {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(
    JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    })
  );
};

module.exports = {
  writeProxyErrorResponse,
};
