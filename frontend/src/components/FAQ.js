// src/components/FAQ.js
import React from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// You can add more questions and answers to this array
const faqData = [
    {
        question: 'What is the purpose of the Grievance Redressal System?',
        answer: 'This system provides a mechanism for students to raise grievances related to academic, administrative, and other campus issues in a confidential and timely manner.'
    },
    {
        question: 'How do I submit a new grievance?',
        answer: 'Navigate to the "Home" or "Dashboard" page after logging in. You will find a form to submit a new grievance. Please provide all the necessary details for a prompt resolution.'
    },
    {
        question: 'How can I check the status of my submitted grievance?',
        answer: 'Click on the "Grievance Status" link in the navigation bar. This page will display a list of all your submitted grievances and their current status (e.g., Submitted, In Review, Resolved).'
    },
    {
        question: 'Is my identity kept confidential?',
        answer: 'Yes, the system is designed to maintain the confidentiality of the student who submits a grievance. Your details are only visible to the authorized members of the Grievance Cell.'
    }
];

const FAQ = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Frequently Asked Questions (FAQ)
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    Find answers to common questions about the grievance redressal process.
                </Typography>
                
                {faqData.map((item, index) => (
                    <Accordion key={index} sx={{ mb: 2 }}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`panel${index}-content`}
                            id={`panel${index}-header`}
                        >
                            <Typography variant="h6">{item.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                {item.answer}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Container>
    );
};

export default FAQ;