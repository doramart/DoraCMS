/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: LogFormatter - 日志格式化工具
 * 用于格式化日志输出，支持多种输出格式
 */

'use strict';

const moment = require('moment');
const SYSTEM_CONSTANTS = require('../../constants/SystemConstants');

class LogFormatter {
  /**
   * 格式化为简单文本
   * @param {Object} log 日志对象
   * @return {String} 格式化后的文本
   */
  static formatSimple(log) {
    const time = moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss');
    const type = log.type || 'unknown';
    const logs = log.logs || '';
    const user = log.user_name || log.user_id || 'anonymous';

    return `[${time}] [${type}] [${user}] ${logs}`;
  }

  /**
   * 格式化为详细文本
   * @param {Object} log 日志对象
   * @return {String} 格式化后的文本
   */
  static formatDetailed(log) {
    const lines = [];

    lines.push('='.repeat(80));
    lines.push(`Time:     ${moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}`);
    lines.push(`Type:     ${log.type} (${this._getTypeText(log.type)})`);
    lines.push(`Severity: ${log.severity} (${this._getSeverityText(log.severity)})`);
    lines.push(`Message:  ${log.logs}`);

    if (log.user_name || log.user_id) {
      lines.push('-'.repeat(80));
      lines.push('User Information:');
      if (log.user_id) lines.push(`  ID:   ${log.user_id}`);
      if (log.user_name) lines.push(`  Name: ${log.user_name}`);
      if (log.user_type) lines.push(`  Type: ${log.user_type}`);
    }

    if (log.request_path || log.request_method) {
      lines.push('-'.repeat(80));
      lines.push('Request Information:');
      if (log.request_method) lines.push(`  Method: ${log.request_method}`);
      if (log.request_path) lines.push(`  Path:   ${log.request_path}`);
      if (log.ip_address) lines.push(`  IP:     ${log.ip_address}`);
    }

    if (log.response_status || log.response_time) {
      lines.push('-'.repeat(80));
      lines.push('Response Information:');
      if (log.response_status) lines.push(`  Status: ${log.response_status}`);
      if (log.response_time) lines.push(`  Time:   ${log.response_time}ms`);
      if (log.response_size) lines.push(`  Size:   ${this._formatBytes(log.response_size)}`);
    }

    if (log.module || log.action) {
      lines.push('-'.repeat(80));
      lines.push('Business Information:');
      if (log.module) lines.push(`  Module:   ${log.module}`);
      if (log.action) lines.push(`  Action:   ${log.action}`);
      if (log.resource_type) lines.push(`  Resource: ${log.resource_type}`);
      if (log.resource_id) lines.push(`  ID:       ${log.resource_id}`);
    }

    if (log.error_message || log.error_code) {
      lines.push('-'.repeat(80));
      lines.push('Error Information:');
      if (log.error_code) lines.push(`  Code:    ${log.error_code}`);
      if (log.error_message) lines.push(`  Message: ${log.error_message}`);
      if (log.error_stack && process.env.NODE_ENV !== 'production') {
        lines.push(`  Stack:\n${log.error_stack}`);
      }
    }

    if (log.tags && log.tags.length > 0) {
      lines.push('-'.repeat(80));
      lines.push(`Tags: ${log.tags.join(', ')}`);
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * 格式化为JSON
   * @param {Object} log 日志对象
   * @param {Boolean} pretty 是否美化输出
   * @return {String} JSON字符串
   */
  static formatJson(log, pretty = false) {
    if (pretty) {
      return JSON.stringify(log, null, 2);
    }
    return JSON.stringify(log);
  }

  /**
   * 格式化为CSV行
   * @param {Object} log 日志对象
   * @return {String} CSV行
   */
  static formatCsv(log) {
    const fields = [
      log.id || '',
      moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      log.type || '',
      log.severity || '',
      this._escapeCsv(log.logs || ''),
      log.user_id || '',
      log.user_name || '',
      log.request_method || '',
      log.request_path || '',
      log.ip_address || '',
      log.response_status || '',
      log.response_time || '',
      log.module || '',
      log.action || '',
      log.error_code || '',
      this._escapeCsv(log.error_message || ''),
      (log.tags || []).join(';'),
    ];

    return fields.join(',');
  }

  /**
   * 获取CSV表头
   * @return {String} CSV表头
   */
  static getCsvHeader() {
    const headers = [
      'ID',
      'Created At',
      'Type',
      'Severity',
      'Message',
      'User ID',
      'User Name',
      'Request Method',
      'Request Path',
      'IP Address',
      'Response Status',
      'Response Time (ms)',
      'Module',
      'Action',
      'Error Code',
      'Error Message',
      'Tags',
    ];

    return headers.join(',');
  }

  /**
   * 格式化为Markdown表格行
   * @param {Object} log 日志对象
   * @return {String} Markdown表格行
   */
  static formatMarkdownRow(log) {
    return [
      `| ${log.id || '-'} `,
      `| ${moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss')} `,
      `| ${log.type || '-'} `,
      `| ${log.severity || '-'} `,
      `| ${this._escapeMarkdown(log.logs || '')} `,
      `| ${log.user_name || '-'} `,
      `| ${log.module || '-'} `,
      `| ${log.action || '-'} `,
      `| ${log.response_status || '-'} |`,
    ].join('');
  }

  /**
   * 获取Markdown表头
   * @return {String} Markdown表头
   */
  static getMarkdownHeader() {
    const header = '| ID | Time | Type | Severity | Message | User | Module | Action | Status |';
    const separator = '|----|------|------|----------|---------|------|--------|--------|--------|';
    return `${header}\n${separator}`;
  }

  /**
   * 格式化为HTML表格行
   * @param {Object} log 日志对象
   * @return {String} HTML表格行
   */
  static formatHtmlRow(log) {
    const severityClass = this._getSeverityClass(log.severity);
    const typeClass = this._getTypeClass(log.type);

    return `
      <tr class="${severityClass}">
        <td>${log.id || '-'}</td>
        <td>${moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td>
        <td><span class="badge ${typeClass}">${log.type || '-'}</span></td>
        <td><span class="badge ${severityClass}">${log.severity || '-'}</span></td>
        <td>${this._escapeHtml(log.logs || '')}</td>
        <td>${log.user_name || '-'}</td>
        <td>${log.module || '-'}</td>
        <td>${log.action || '-'}</td>
        <td>${log.response_status || '-'}</td>
      </tr>
    `;
  }

  /**
   * 格式化日志列表为统计摘要
   * @param {Array} logs 日志列表
   * @return {Object} 统计摘要
   */
  static formatSummary(logs) {
    const summary = {
      total: logs.length,
      byType: {},
      bySeverity: {},
      timeRange: {},
      topUsers: {},
      topModules: {},
      errorRate: 0,
      avgResponseTime: 0,
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let errorCount = 0;

    logs.forEach(log => {
      // 按类型统计
      summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;

      // 按严重程度统计
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;

      // 按用户统计
      if (log.user_name) {
        summary.topUsers[log.user_name] = (summary.topUsers[log.user_name] || 0) + 1;
      }

      // 按模块统计
      if (log.module) {
        summary.topModules[log.module] = (summary.topModules[log.module] || 0) + 1;
      }

      // 响应时间统计
      if (log.response_time) {
        totalResponseTime += log.response_time;
        responseTimeCount++;
      }

      // 错误统计
      if (log.type === 'error' || log.type === 'exception') {
        errorCount++;
      }

      // 时间范围
      const time = new Date(log.createdAt).getTime();
      if (!summary.timeRange.start || time < summary.timeRange.start) {
        summary.timeRange.start = log.createdAt;
      }
      if (!summary.timeRange.end || time > summary.timeRange.end) {
        summary.timeRange.end = log.createdAt;
      }
    });

    // 计算平均响应时间
    if (responseTimeCount > 0) {
      summary.avgResponseTime = Math.round(totalResponseTime / responseTimeCount);
    }

    // 计算错误率
    if (summary.total > 0) {
      summary.errorRate = ((errorCount / summary.total) * 100).toFixed(2) + '%';
    }

    return summary;
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取类型文本
   * @param {String} type 类型代码
   * @return {String} 类型文本
   * @private
   */
  static _getTypeText(type) {
    return SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.TYPE_TEXT[type] || type;
  }

  /**
   * 获取严重程度文本
   * @param {String} severity 严重程度代码
   * @return {String} 严重程度文本
   * @private
   */
  static _getSeverityText(severity) {
    return SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.SEVERITY_TEXT[severity] || severity;
  }

  /**
   * 获取严重程度CSS类
   * @param {String} severity 严重程度
   * @return {String} CSS类名
   * @private
   */
  static _getSeverityClass(severity) {
    const classMap = {
      low: 'severity-low',
      medium: 'severity-medium',
      high: 'severity-high',
      critical: 'severity-critical',
    };
    return classMap[severity] || 'severity-default';
  }

  /**
   * 获取类型CSS类
   * @param {String} type 类型
   * @return {String} CSS类名
   * @private
   */
  static _getTypeClass(type) {
    const classMap = {
      login: 'type-success',
      logout: 'type-info',
      exception: 'type-danger',
      error: 'type-danger',
      warning: 'type-warning',
      operation: 'type-primary',
      access: 'type-secondary',
      info: 'type-info',
      debug: 'type-muted',
    };
    return classMap[type] || 'type-default';
  }

  /**
   * 格式化字节大小
   * @param {Number} bytes 字节数
   * @return {String} 格式化后的大小
   * @private
   */
  static _formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * 转义CSV字段
   * @param {String} str 字符串
   * @return {String} 转义后的字符串
   * @private
   */
  static _escapeCsv(str) {
    if (!str) return '';
    // 如果包含逗号、引号或换行，用引号包裹并转义内部引号
    if (/[,"\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * 转义Markdown
   * @param {String} str 字符串
   * @return {String} 转义后的字符串
   * @private
   */
  static _escapeMarkdown(str) {
    if (!str) return '';
    return str.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  }

  /**
   * 转义HTML
   * @param {String} str 字符串
   * @return {String} 转义后的字符串
   * @private
   */
  static _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = LogFormatter;
