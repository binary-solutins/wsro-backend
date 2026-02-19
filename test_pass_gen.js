const EventPassGenerator = require('./src/services/eventPassGenerator');
const fs = require('fs');
const path = require('path');

const testEventPass = async () => {
    try {
        const data = {
            id: "WS/TES/COM-1-P01",
            participant_id: "WS/TES/COM-1-P01",
            name: "John Doe",
            competition_name: "Robotics Championship 2025",
            role: "Participant"
        };

        console.log("Generating event pass...");
        const pdfBuffer = await EventPassGenerator.generateEventPass(data);

        const outputPath = path.join(__dirname, 'test_event_pass.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log(`Event pass generated successfully at: ${outputPath}`);
    } catch (error) {
        console.error("Error generating event pass:", error);
    }
};

testEventPass();
