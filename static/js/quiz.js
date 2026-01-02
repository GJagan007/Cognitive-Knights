// EduAdapt - Simplified Quiz JavaScript
// Focused on 10 questions and final score out of 100

class QuizManager {
    constructor() {
        this.sessionId = null;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.score = 0;
        this.questionCount = 0;
        this.totalQuestions = 10;
        this.answers = [];
        this.timer = 0;
        this.timerInterval = null;
        this.startTime = null;
        this.questionStartTime = null;
        
        // Initialize event listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.scrollToSection(sectionId);
            });
        });

        // Mobile menu
        document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.querySelector('.nav-menu');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            
            if (navMenu.classList.contains('show') && 
                !navMenu.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                navMenu.classList.remove('show');
            }
        });

        // Quiz buttons
        document.querySelectorAll('.launch-quiz-btn, .btn-large[onclick*="startAdaptiveQuiz"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.startAdaptiveQuiz();
            });
        });

        // Initialize animations
        this.initAnimations();
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
            
            // Close mobile menu if open
            document.querySelector('.nav-menu').classList.remove('show');
        }
    }

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.toggle('show');
    }

    initAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .process-step, .contact-card').forEach(el => {
            observer.observe(el);
        });
    }

    async startAdaptiveQuiz() {
        try {
            // Hide all sections
            document.querySelectorAll('section, footer').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show quiz platform
            const quizPlatform = document.getElementById('quiz-platform');
            quizPlatform.style.display = 'block';
            document.body.classList.add('quiz-active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Initialize quiz
            await this.initializeQuiz();
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to start quiz. Please try again.');
        }
    }

    async initializeQuiz() {
        // Reset state
        this.resetQuizState();
        
        // Reset UI
        this.showQuestionScreen();
        
        // Start timer
        this.startTimer();
        
        // Start quiz session
        await this.startQuizSession();
    }

    resetQuizState() {
        this.sessionId = null;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.score = 0;
        this.questionCount = 0;
        this.answers = [];
        this.timer = 0;
        this.startTime = Date.now();
        
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Update UI
        this.updateScore(0);
        this.updateQuestionCounter(0, this.totalQuestions);
        this.updateProgressBar(0);
        this.updateTimer('00:00');
    }

    showQuestionScreen() {
        document.getElementById('question-screen').style.display = 'block';
        document.getElementById('feedback-screen').style.display = 'none';
        document.getElementById('results-screen').style.display = 'none';
        
        // Reset options selection
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Reset submit button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submit Answer <i class="fas fa-arrow-right"></i>';
        submitBtn.classList.remove('pulse-animation');
    }

    startTimer() {
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            this.updateTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async startQuizSession() {
        try {
            const response = await fetch('/api/quiz/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.session_id;
                await this.loadQuestion();
            } else {
                throw new Error(data.error || 'Failed to start quiz session');
            }
        } catch (error) {
            console.error('Error starting quiz session:', error);
            // Fallback to mock session
            this.sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.loadMockQuestion();
        }
    }

    async loadQuestion() {
        if (!this.sessionId) return;
        
        try {
            const response = await fetch('/api/quiz/question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayQuestion(data.question, data.progress);
            } else {
                throw new Error(data.error || 'Failed to load question');
            }
        } catch (error) {
            console.error('Error loading question:', error);
            this.loadMockQuestion();
        }
    }

    displayQuestion(question, progress) {
        this.currentQuestion = question;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now();
        
        // Update question display
        document.getElementById('question-text').textContent = question.text;
        document.getElementById('question-subject').textContent = question.subject;
        document.getElementById('question-difficulty').textContent = 
            question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard';
        document.getElementById('question-number').textContent = `Question ${question.question_number}`;
        
        // Update counters
        this.updateQuestionCounter(question.question_number, this.totalQuestions);
        document.getElementById('current-level').textContent = 
            question.level.charAt(0).toUpperCase() + question.level.slice(1);
        document.getElementById('current-subject').textContent = question.subject;
        document.getElementById('difficulty-level').textContent = 
            question.difficulty === 1 ? 'Beginner' : question.difficulty === 2 ? 'Intermediate' : 'Advanced';
        
        // Update progress bar
        this.updateProgressBar(progress.percentage);
        
        // Create options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        const optionLetters = ['A', 'B', 'C', 'D'];
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.innerHTML = `
                <div class="option-letter">${optionLetters[index]}</div>
                <div class="option-text">${option}</div>
            `;
            
            // Add click event
            optionDiv.addEventListener('click', () => {
                this.selectAnswer(index, optionDiv);
            });
            
            optionsContainer.appendChild(optionDiv);
        });
        
        // Reset submit button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submit Answer <i class="fas fa-arrow-right"></i>';
        submitBtn.classList.remove('pulse-animation');
        
        // Show question screen with animation
        this.showQuestionScreen();
        
        // Add fade in animation
        setTimeout(() => {
            document.getElementById('question-screen').classList.add('visible');
        }, 10);
    }

    loadMockQuestion() {
        // Mock questions for demonstration
        const mockQuestions = [
            {
                id: 'mock_1',
                text: "What is 15 + 27?",
                options: ["42", "32", "52", "37"],
                subject: "Mathematics",
                level: "beginner",
                difficulty: 1,
                question_number: this.questionCount + 1
            },
            {
                id: 'mock_2',
                text: "Solve for x: 2x + 5 = 15",
                options: ["x = 5", "x = 10", "x = 7.5", "x = 20"],
                subject: "Mathematics",
                level: "intermediate",
                difficulty: 2,
                question_number: this.questionCount + 1
            },
            {
                id: 'mock_3',
                text: "What is the derivative of x²?",
                options: ["x", "2x", "x²", "2"],
                subject: "Mathematics",
                level: "advanced",
                difficulty: 3,
                question_number: this.questionCount + 1
            },
            {
                id: 'mock_4',
                text: "Which planet is closest to the Sun?",
                options: ["Venus", "Mars", "Mercury", "Earth"],
                subject: "Science",
                level: "beginner",
                difficulty: 1,
                question_number: this.questionCount + 1
            }
        ];
        
        const progress = {
            current: this.questionCount + 1,
            total: this.totalQuestions,
            percentage: ((this.questionCount + 1) / this.totalQuestions) * 100
        };
        
        const questionIndex = this.questionCount % mockQuestions.length;
        this.displayQuestion(mockQuestions[questionIndex], progress);
    }

    selectAnswer(index, element) {
        // Remove selection from all options
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to clicked option
        element.classList.add('selected');
        this.selectedAnswer = index;
        
        // Enable submit button with animation
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = false;
        submitBtn.classList.add('pulse-animation');
    }

    async submitAnswer() {
        if (this.selectedAnswer === null) {
            alert('Please select an answer before submitting.');
            return;
        }
        
        // Disable submit button and show processing
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Calculate response time
        const responseTime = Math.floor((Date.now() - this.questionStartTime) / 1000);
        
        // Show feedback immediately (no API call)
        this.showMockFeedback();
    }

    showFeedback(result, isComplete) {
        // Store answer
        this.answers.push({
            question: this.currentQuestion,
            answer: this.selectedAnswer,
            correct: result.correct,
            responseTime: Math.floor((Date.now() - this.questionStartTime) / 1000)
        });
        
        this.questionCount++;
        
        // Update score if correct
        if (result.correct) {
            this.score += 10;
            this.updateScore(this.score);
        }
        
        // Update performance metric
        const accuracy = this.answers.length > 0 ? 
            (this.answers.filter(a => a.correct).length / this.answers.length) * 100 : 0;
        document.getElementById('performance-metric').textContent = `${Math.round(accuracy)}%`;
        
        // Update feedback display
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackText = document.getElementById('feedback-text');
        
        if (result.correct) {
            feedbackIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            feedbackIcon.style.color = '#10b981';
            feedbackTitle.textContent = 'Correct!';
            feedbackText.textContent = 'Great job!';
        } else {
            feedbackIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            feedbackIcon.style.color = '#ef4444';
            feedbackTitle.textContent = 'Incorrect';
            feedbackText.textContent = 'Better luck next time!';
        }
        
        // Update feedback details
        document.getElementById('correct-answer-text').textContent = result.correct_answer;
        document.getElementById('explanation-text').textContent = result.explanation;
        document.getElementById('new-score').textContent = this.score;
        
        // Update next button
        const nextBtn = document.getElementById('next-btn');
        if (isComplete || this.questionCount >= this.totalQuestions) {
            nextBtn.textContent = 'View Results';
            nextBtn.onclick = () => this.completeQuiz();
        } else {
            nextBtn.textContent = 'Continue to Next Question';
            nextBtn.onclick = () => this.loadNextQuestion();
        }
        
        // Show feedback screen with transition
        document.getElementById('question-screen').style.display = 'none';
        document.getElementById('feedback-screen').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('feedback-screen').classList.add('visible');
        }, 10);
    }

    showMockFeedback() {
        // Mock feedback for demonstration
        const isCorrect = this.selectedAnswer === 0; // First option is always correct in mock
        const mockResult = {
            correct: isCorrect,
            correct_answer: this.currentQuestion.options[0],
            explanation: "This is a sample explanation. In a real scenario, the AI would provide detailed feedback.",
            new_score: this.score + (isCorrect ? 10 : 0),
            questions_answered: this.questionCount + 1
        };
        
        // Check if quiz is complete
        const isComplete = (this.questionCount + 1) >= this.totalQuestions;
        
        this.showFeedback(mockResult, isComplete);
    }

    loadNextQuestion() {
        if (this.questionCount >= this.totalQuestions) {
            this.completeQuiz();
        } else {
            this.loadQuestion();
        }
    }

    async completeQuiz() {
        // Use mock results for demo
        const accuracy = Math.min(100, Math.floor((this.score / 100) * 100));
        const mockSummary = {
            total_questions: this.questionCount,
            final_score: this.score,
            accuracy: accuracy,
            level_achieved: this.score >= 80 ? 'Advanced' : this.score >= 60 ? 'Intermediate' : 'Beginner',
            time_spent: this.formatTime(this.timer)
        };
        
        this.showResults(mockSummary);
    }

    showResults(summary) {
        // Stop timer
        this.stopTimer();
        
        // Update results display
        document.getElementById('final-score-percentage').textContent = `${summary.accuracy}%`;
        document.getElementById('score-details').textContent = 
            `Final Score: ${summary.final_score}/100`;
        document.getElementById('level-achieved').textContent = summary.level_achieved;
        document.getElementById('time-spent').textContent = summary.time_spent;
        
        // Show results screen
        document.getElementById('question-screen').style.display = 'none';
        document.getElementById('feedback-screen').style.display = 'none';
        document.getElementById('results-screen').style.display = 'block';
    }

    restartQuiz() {
        this.initializeQuiz();
    }

    returnToHome() {
        // Stop timer
        this.stopTimer();
        
        // Hide quiz platform
        document.getElementById('quiz-platform').style.display = 'none';
        document.body.classList.remove('quiz-active');
        
        // Show all sections
        document.querySelectorAll('section, footer').forEach(el => {
            el.style.display = 'block';
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset navigation
        this.scrollToSection('home');
    }

    // UI Update Methods
    updateScore(score) {
        document.getElementById('current-score').textContent = score;
    }

    updateQuestionCounter(current, total) {
        document.getElementById('question-counter').textContent = `${current}/${total}`;
    }

    updateProgressBar(percentage) {
        document.getElementById('quiz-progress').style.width = `${percentage}%`;
    }

    updateTimer(time) {
        document.getElementById('quiz-timer').textContent = time;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global quiz manager instance
    window.quizManager = new QuizManager();
    
    // Add window resize handler
    window.addEventListener('resize', () => {
        if (document.body.classList.contains('quiz-active')) {
            // Adjust quiz layout on resize
            const quizPlatform = document.getElementById('quiz-platform');
            if (quizPlatform) {
                const viewportHeight = window.innerHeight;
                quizPlatform.style.maxHeight = `${viewportHeight}px`;
            }
        }
    });
});

// Global functions for HTML onclick handlers
function startAdaptiveQuiz() {
    if (window.quizManager) {
        window.quizManager.startAdaptiveQuiz();
    }
}

function scrollToSection(sectionId) {
    if (window.quizManager) {
        window.quizManager.scrollToSection(sectionId);
    }
}

function submitAnswer() {
    if (window.quizManager) {
        window.quizManager.submitAnswer();
    }
}

function loadNextQuestion() {
    if (window.quizManager) {
        window.quizManager.loadNextQuestion();
    }
}

function completeQuiz() {
    if (window.quizManager) {
        window.quizManager.completeQuiz();
    }
}

function restartQuiz() {
    if (window.quizManager) {
        window.quizManager.restartQuiz();
    }
}

function returnToHome() {
    if (window.quizManager) {
        window.quizManager.returnToHome();
    }
}

function toggleMobileMenu() {
    if (window.quizManager) {
        window.quizManager.toggleMobileMenu();
    }
}