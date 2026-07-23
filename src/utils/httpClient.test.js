/* eslint-env jest */

const {
  createHttpClient,
  ErrorType
} = require('./httpClient');

function rejectResponse(client, error) {
  return Promise.resolve().then(() => (
    client.interceptors.response.handlers[0].rejected(error)
  ));
}

describe('HTTP error normalization', () => {
  test('retains nested server error metadata and sanitizes the request URL', async () => {
    const client = createHttpClient();

    await expect(rejectResponse(client, {
      response: {
        status: 404,
        data: JSON.stringify({ error: { code: 100404, message: 'MCP endpoint not found' } })
      },
      config: {
        url: 'https://agent.qcc.com/mcp/company/stream/company/stream?token=secret#debug'
      }
    })).rejects.toMatchObject({
      type: ErrorType.MCP_ERROR,
      message: 'MCP endpoint not found',
      code: 404,
      httpStatus: 404,
      serverCode: 100404,
      serverMessage: 'MCP endpoint not found',
      requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
    });
  });

  test('classifies nested authentication failures and retains the server code', async () => {
    const client = createHttpClient();

    await expect(rejectResponse(client, {
      response: {
        status: 400,
        data: { error: { code: 200001, message: '身份凭证无效' } }
      },
      config: { url: 'https://agent.qcc.com/mcp/company/stream' }
    })).rejects.toMatchObject({
      type: ErrorType.AUTH_FAILED,
      serverCode: 200001,
      serverMessage: '身份凭证无效',
      httpStatus: 400
    });
  });

  test('retains the server message for 5xx responses', async () => {
    const client = createHttpClient();

    await expect(rejectResponse(client, {
      response: {
        status: 503,
        data: { error: { code: 50301, message: 'service temporarily unavailable' } }
      },
      config: { url: 'https://agent.qcc.com/mcp/company/stream' }
    })).rejects.toMatchObject({
      type: ErrorType.SERVER_ERROR,
      message: 'service temporarily unavailable',
      httpStatus: 503,
      serverCode: 50301
    });
  });
});
