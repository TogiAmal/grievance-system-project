// src/components/Chatbot.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ... (keep PhoneIcon and faqs constants)
const PhoneIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.74-.25 1.02l-2.2 2.2z"/></svg>;
const faqs = {
    "how to submit": "You can submit a grievance right here in this chat! Just type 'submit grievance' to start.",
    "status": "You can check the status of your submitted grievances on the 'Grievance Status' page.",
    "time": "The resolution time varies, but we aim to address all issues as quickly as possible.",
};


const Chatbot = () => {
    // ... (keep existing state)
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [step, setStep] = useState(0);
    const [grievanceData, setGrievanceData] = useState({ title: '', description: '' });
    const [isHovered, setIsHovered] = useState(false);
    
    // **** NEW: State for the login pop-up ****
    const [showPopup, setShowPopup] = useState(false);

    // **** NEW: useEffect to listen for the login event ****
    useEffect(() => {
        const handleLogin = () => {
            setShowPopup(true);
            // Hide the pop-up after 5 seconds
            setTimeout(() => {
                setShowPopup(false);
            }, 5000);
        };

        window.addEventListener('userLoggedIn', handleLogin);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('userLoggedIn', handleLogin);
        };
    }, []);
    
    // ... (keep all other functions and the styles object the same)
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            addBotMessage("Hello from St. Joseph's! How can I help you? You can ask a question or type 'submit grievance'.");
        }
    }, [isOpen]);

    const addBotMessage = (text) => setMessages(prev => [...prev, { text, sender: 'bot' }]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input.toLowerCase();
        const originalCaseInput = input;
        setInput('');

        setTimeout(() => {
            if (step === 0) {
                if (currentInput.includes('submit grievance')) {
                    addBotMessage("Sure, I can help with that. What is the title of your grievance?");
                    setStep(1);
                } else {
                    const faqAnswer = Object.keys(faqs).find(key => currentInput.includes(key));
                    addBotMessage(faqAnswer ? faqs[faqAnswer] : "Sorry, I don't understand. Try asking about 'status' or 'how to submit'.");
                }
            } else if (step === 1) {
                setGrievanceData({ ...grievanceData, title: originalCaseInput });
                addBotMessage("Got it. Now, please describe the issue in detail.");
                setStep(2);
            } else if (step === 2) {
                setGrievanceData(prev => ({ ...prev, description: originalCaseInput }));
                addBotMessage(`Confirm submission:\nTitle: ${grievanceData.title}\nDescription: ${originalCaseInput}\nIs this correct? (yes/no)`);
                setStep(3);
            } else if (step === 3) {
                if (currentInput === 'yes') submitGrievance();
                else {
                    addBotMessage("Okay, let's start over. Type 'submit grievance' to begin again.");
                    setStep(0);
                }
            }
        }, 500);
    };

    const submitGrievance = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            addBotMessage("You must be logged in to submit a grievance.");
            return;
        }
        try {
            await axios.post('http://127.0.0.1:8000/api/grievances/', grievanceData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addBotMessage("Your grievance has been successfully submitted!");
        } catch (error) {
            addBotMessage("Sorry, there was an error submitting your grievance.");
        } finally {
            setStep(0);
        }
    };


    const styles = {
        chatIcon: {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: '#007bff',
            borderRadius: '50%',
            padding: '15px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease-in-out',
            transform: isHovered ? 'scale(1.1)' : 'scale(1.0)',
        },
        // **** NEW: Style for the pop-up bubble ****
        popupBubble: {
            position: 'absolute',
            bottom: '80px', // Position it above the icon
            right: '10px',
            backgroundColor: 'white',
            padding: '10px 15px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            opacity: showPopup ? 1 : 0,
            transform: showPopup ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.3s, transform 0.3s',
            whiteSpace: 'nowrap',
        },
        // ... (keep all other styles the same)
        overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 998, display: isOpen ? 'block' : 'none' },
        chatWindow: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '350px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden'
        },
        chatHeader: { padding: '15px', backgroundColor: '#007bff', color: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        closeButton: { cursor: 'pointer', background: 'none', border: 'none', color: 'white', fontSize: '20px' },
        messagesContainer: { flex: 1, padding: '10px', overflowY: 'auto', backgroundColor: '#f4f4f8' },
        message: { display: 'flex', flexDirection: 'column' },
        bubble: { padding: '8px 12px', borderRadius: '15px', maxWidth: '75%', marginBottom: '10px', wordWrap: 'break-word' },
        botBubble: { backgroundColor: '#e9e9eb', alignSelf: 'flex-start' },
        userBubble: { backgroundColor: '#007bff', color: 'white', alignSelf: 'flex-end' },
        inputContainer: { display: 'flex', padding: '10px', borderTop: '1px solid #ddd' },
        input: { flex: 1, border: '1px solid #ccc', borderRadius: '20px', padding: '8px 12px', marginRight: '10px' },
        sendButton: { background: '#007bff', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }
    };

    return (
        <div>
            <div 
                style={styles.chatIcon} 
                onClick={() => setIsOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <PhoneIcon />
                {/* **** NEW: Conditionally render the pop-up bubble **** */}
                {showPopup && (
                    <div style={styles.popupBubble}>
                        Chat your grievance with SJCET BOT
                    </div>
                )}
            </div>
            
            <div style={styles.overlay} onClick={() => setIsOpen(false)}></div>
            
            {/* ... (rest of the JSX is the same) ... */}
            <div style={styles.chatWindow}>
                <div style={styles.chatHeader}>
                    <strong>SJCET Help Bot</strong>
                    <button style={styles.closeButton} onClick={() => setIsOpen(false)}>×</button>
                </div>
                <div style={styles.messagesContainer}>
                    <div style={styles.message}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ ...styles.bubble, ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble) }}>
                                {msg.text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={styles.inputContainer}>
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} style={styles.input} placeholder="Type a message..." />
                    <button style={styles.sendButton} onClick={handleSend}>➤</button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;