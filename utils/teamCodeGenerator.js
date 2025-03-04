const crypto = require('crypto');

/**
 * Generate a team code in the format: ws/bom/lf01
 * 
 * @param {string} eventName - First three letters of the event name (lowercase)
 * @param {string} competitionName - First two letters of the competition name (lowercase)
 * @param {number} competitionId - Unique identifier for the specific competition entry
 * @returns {string} Generated team code
 */
const generateTeamCode = (eventName, competitionName, competitionId) => {
  // Validate and format inputs
  const formattedEventName = eventName.substring(0, 3);
  const formattedCompName = competitionName.substring(0, 2);
  
  // Pad competition ID with zeros to ensure two digits
  const paddedCompId = String(competitionId).padStart(2, '0');
  
  // Combine to create the final code
  return `WS/${formattedEventName}/${formattedCompName}${paddedCompId}`;
};

/**
 * Validate the team code format
 * 
 * @param {string} code - Team code to validate
 * @returns {boolean} Whether the code matches the expected format
 */
const isValidTeamCode = (code) => {
  const pattern = /^ws\/[a-z]{3}\/[a-z]{2}\d{2}$/;
  return pattern.test(code);
};

/**
 * Parse a team code to extract its components
 * 
 * @param {string} code - Team code to parse
 * @returns {Object} Parsed team code components
 */
const parseTeamCode = (code) => {
  if (!isValidTeamCode(code)) {
    throw new Error('Invalid team code format');
  }
  
  return {
    prefix: 'ws',
    eventName: code.substring(3, 6),
    competitionName: code.substring(7, 9),
    competitionId: parseInt(code.substring(9))
  };
};

module.exports = {
  generateTeamCode,
  isValidTeamCode,
  parseTeamCode
};

// Example usage:
// const teamCode = generateTeamCode('Basketball', 'Local', 1);
// console.log(teamCode); // Outputs: ws/bas/lo01