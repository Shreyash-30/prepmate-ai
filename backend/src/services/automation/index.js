/**
 * Automation Services Index
 * Centralizes all automation service exports
 */

const submissionAutomationService = require('./submissionAutomationService');
const plannerAutomationService = require('./plannerAutomationService');
const retentionAutomationService = require('./retentionAutomationService');
const readinessAutomationService = require('./readinessAutomationService');
const complianceService = require('./complianceService');

module.exports = {
  submissionAutomationService,
  plannerAutomationService,
  retentionAutomationService,
  readinessAutomationService,
  complianceService,
};
