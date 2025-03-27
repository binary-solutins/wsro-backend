const crypto = require('crypto');

// Simulated storage for tracking unique team IDs
const generatedCodes = new Set();

/**
 * Generate a team code in the format: ws/bom/llfXX
 * Ensures unique competition ID
 * 
 * @param {string} eventName - First three letters of the event name (lowercase)
 * @param {string} competitionName - Competition name (lowercase, extracts first letters of words)
 * @returns {string} Unique generated team code
 */
const generateTeamCode = (eventName, competitionName) => {
  // Format event name (first 3 letters)
  const formattedEventName = eventName.substring(0, 3).toLowerCase();

  // Extract first letter from each word in the competition name
  const formattedCompName = competitionName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toLowerCase();

  // Generate a unique competition ID
  let competitionId = 10;
  let teamCode = `WS/${formattedEventName}/${formattedCompName}${String(competitionId).padStart(2, '0')}`;

  // Ensure uniqueness by incrementing if code already exists
  while (generatedCodes.has(teamCode)) {
    competitionId++;
    teamCode = `WS/${formattedEventName}/${formattedCompName}${String(competitionId).padStart(2, '0')}`;
  }

  // Store the generated code
  generatedCodes.add(teamCode);

  return teamCode;
};

/**
 * Validate the team code format
 * 
 * @param {string} code - Team code to validate
 * @returns {boolean} Whether the code matches the expected format
 */
const isValidTeamCode = (code) => {
  const pattern = /^WS\/[a-z]{3}\/[a-z]{2,}\d{2}$/;
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

  const parts = code.split('/');
  const competitionId = parseInt(parts[2].slice(-2));

  return {
    prefix: parts[0],
    eventName: parts[1],
    competitionName: parts[2].slice(0, -2),
    competitionId
  };
};

module.exports = {
  generateTeamCode,
  isValidTeamCode,
  parseTeamCode
};

// Example usage:
console.log(generateTeamCode('Basketball', 'Lego Line Following')); // WS/bas/llf01
console.log(generateTeamCode('Basketball', 'Lego Line Following')); // WS/bas/llf02 (Ensures uniqueness)
console.log(generateTeamCode('Soccer', 'Freestyle Dribble')); // WS/soc/fd01
