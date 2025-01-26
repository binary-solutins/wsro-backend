const { validationResult } = require('express-validator');
const db = require('../config/database');

exports.createEvent = async (req, res) => {
    try {
        console.log('📅 Creating new event:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, level } = req.body;

        const [result] = await db.query(
            'INSERT INTO Events (title, level) VALUES (?, ?)',
            [title, level]
        );

        console.log('✅ Event created successfully:', { id: result.insertId, title });
        res.status(201).json({
            message: 'Event created successfully',
            eventId: result.insertId,
        });
    } catch (error) {
        console.error('❌ Error creating event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        console.log('📜 Fetching all events');

        const [events] = await db.query('SELECT * FROM Events');
        res.status(200).json(events);
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getEventsByLevel = async (req, res) => {
    try {
        const { level } = req.params;
        console.log('🔍 Fetching events with level:', level);

        const [events] = await db.query('SELECT * FROM Events WHERE level = ?', [level]);

        if (events.length === 0) {
            console.log('❌ No events found with level:', level);
            return res.status(404).json({ message: 'No events found for the specified level' });
        }

        console.log('✅ Events fetched successfully for level:', level);
        res.status(200).json(events);
    } catch (error) {
        console.error('❌ Error fetching events by level:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, level } = req.body;

        console.log('✏️ Updating event with ID:', id);

        const [result] = await db.query(
            'UPDATE Events SET title = ?, level = ? WHERE id = ?',
            [title, level, id]
        );

        if (result.affectedRows === 0) {
            console.log('❌ Event not found for update with ID:', id);
            return res.status(404).json({ message: 'Event not found' });
        }

        console.log('✅ Event updated successfully:', { id, title });
        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('❌ Error updating event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting event with ID:', id);

        const [result] = await db.query('DELETE FROM Events WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            console.log('❌ Event not found for deletion with ID:', id);
            return res.status(404).json({ message: 'Event not found' });
        }

        console.log('✅ Event deleted successfully with ID:', id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
