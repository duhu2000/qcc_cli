const chalk = require('chalk');
const { buildParseDocumentPayload, IdpDocumentError } = require('../utils/idpDocument');
const idpService = require('../services/idpService');
const { QccError } = require('../utils/httpClient');

const PARSE_DOCUMENT_PROGRESS_NOTICE_DELAY_MS = 800;
const PARSE_DOCUMENT_SUBMITTING_NOTICE = '正在提交文档解析任务，请稍候...';
const PARSE_DOCUMENT_WAITING_NOTICE = '正在提交文档解析任务并等待文档解析结果，请稍候...';

function printJson(result) {
  console.log(JSON.stringify(result, null, 2));
}

function getParseDocumentProgressNotice(payload) {
  return payload.wait ? PARSE_DOCUMENT_WAITING_NOTICE : PARSE_DOCUMENT_SUBMITTING_NOTICE;
}

function startParseDocumentProgressNotice(payload) {
  const timer = setTimeout(() => {
    console.error(chalk.gray(getParseDocumentProgressNotice(payload)));
  }, PARSE_DOCUMENT_PROGRESS_NOTICE_DELAY_MS);

  return () => clearTimeout(timer);
}

function printError(error) {
  if (error instanceof IdpDocumentError) {
    console.error(chalk.red(`错误: ${error.message}`));
    return;
  }

  if (error instanceof QccError) {
    console.error(chalk.red(`错误: ${error.message}`));
    if (error.suggestion) {
      console.error(chalk.yellow(`建议: ${error.suggestion}`));
    }
    return;
  }

  console.error(chalk.red(`错误: ${error.message}`));
}

async function parseDocument(options = {}) {
  let stopProgressNotice = () => {};

  try {
    const payload = buildParseDocumentPayload(options);
    stopProgressNotice = startParseDocumentProgressNotice(payload);
    const result = await idpService.parseDocument(payload);
    stopProgressNotice();
    printJson(result);
  } catch (error) {
    stopProgressNotice();
    printError(error);
    process.exit(1);
  }
}

async function getParseResult(taskId) {
  try {
    if (!taskId) {
      console.error(chalk.red('错误: 请提供 task_id'));
      process.exit(1);
      return;
    }

    const result = await idpService.getParseResult(taskId);
    printJson(result);
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

module.exports = {
  getParseResult,
  parseDocument
};
