import express from 'express';
import Feedback  from '../models/Feedback';

const router = express.Router();

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { email, suggestion } = req.body;

    if (!email || !suggestion) {
      return res.status(400).json({ message: 'Email and suggestion are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const feedback = new Feedback({
      email,
      suggestion,
    });

    await feedback.save();

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

export default router; 