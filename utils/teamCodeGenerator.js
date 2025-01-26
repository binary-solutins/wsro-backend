const crypto = require('crypto');

const generateTeamCode = (competitionId) => {
  // Generate 6 random bytes and convert to hex
  const uniqueId = crypto
    .randomBytes(3) // 3 bytes = 6 hex characters
    .toString('hex')
    .toUpperCase();
    
  // Pad competition ID with zeros if needed
  const paddedCompId = String(competitionId).padStart(3, '0');
  
  // Combine to create the final code
  return `${paddedCompId}-${uniqueId}`;
};

// Helper function to validate team code format
const isValidTeamCode = (code) => {
  const pattern = /^\d{5}-[0-9A-F]{6}$/;
  return pattern.test(code);
};

// Helper function to extract competition ID from code
const parseTeamCode = (code) => {
  if (!isValidTeamCode(code)) {
    throw new Error('Invalid team code format');
  }
  
  return {
    competitionId: parseInt(code.substring(0, 3)),
    uniqueId: code.substring(6)
  };
};

module.exports = {
  generateTeamCode,
  isValidTeamCode,
  parseTeamCode
};