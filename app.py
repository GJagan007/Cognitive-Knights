"""
EduAdapt - AI-Powered Personalized Learning Platform
Simplified Backend with Mixed Subject Quiz
"""

from flask import Flask, jsonify, send_file, request, send_from_directory
import json
import random
from datetime import datetime
import time
import os

app = Flask(__name__, static_folder='static')

# Create static directories if they don't exist
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

# Mixed Question Database (20 questions total)
QUESTIONS_DATABASE = [
    # Mathematics Questions (8)
    {
        "id": "math_1",
        "question": "What is 15 + 27?",
        "options": ["42", "32", "52", "37"],
        "correct": 0,
        "explanation": "15 + 27 = 42. Start by adding ones: 5 + 7 = 12 (write 2, carry 1), then tens: 1 + 2 + 1 = 4",
        "subject": "Mathematics",
        "difficulty": 1
    },
    {
        "id": "math_2",
        "question": "Solve for x: 2x + 5 = 15",
        "options": ["x = 5", "x = 10", "x = 7.5", "x = 20"],
        "correct": 0,
        "explanation": "2x + 5 = 15 → 2x = 15 - 5 → 2x = 10 → x = 10 ÷ 2 → x = 5",
        "subject": "Mathematics",
        "difficulty": 2
    },
    {
        "id": "math_3",
        "question": "What is the derivative of x²?",
        "options": ["x", "2x", "x²", "2"],
        "correct": 1,
        "explanation": "Using power rule: d/dx(xⁿ) = n*xⁿ⁻¹. So d/dx(x²) = 2x¹ = 2x",
        "subject": "Mathematics",
        "difficulty": 2
    },
    {
        "id": "math_4",
        "question": "What is 75% of 200?",
        "options": ["150", "175", "125", "100"],
        "correct": 0,
        "explanation": "75% of 200 = 0.75 × 200 = 150. Alternatively: 25% is 50, so 75% is 3 × 50 = 150",
        "subject": "Mathematics",
        "difficulty": 1
    },
    {
        "id": "math_5",
        "question": "What is the area of a rectangle with length 8 and width 5?",
        "options": ["40", "13", "45", "35"],
        "correct": 0,
        "explanation": "Area of rectangle = length × width = 8 × 5 = 40",
        "subject": "Mathematics",
        "difficulty": 1
    },
    {
        "id": "math_6",
        "question": "What is 12 × 7?",
        "options": ["84", "72", "96", "78"],
        "correct": 0,
        "explanation": "12 × 7 = 84. 10 × 7 = 70, 2 × 7 = 14, 70 + 14 = 84",
        "subject": "Mathematics",
        "difficulty": 1
    },
    {
        "id": "math_7",
        "question": "What is the square root of 64?",
        "options": ["8", "6", "7", "9"],
        "correct": 0,
        "explanation": "8 × 8 = 64, so the square root of 64 is 8",
        "subject": "Mathematics",
        "difficulty": 1
    },
    {
        "id": "math_8",
        "question": "What is 144 ÷ 12?",
        "options": ["12", "10", "14", "11"],
        "correct": 0,
        "explanation": "144 ÷ 12 = 12. 12 × 12 = 144",
        "subject": "Mathematics",
        "difficulty": 1
    },
    
    # Science Questions (8)
    {
        "id": "sci_1",
        "question": "Which planet is closest to the Sun?",
        "options": ["Venus", "Mars", "Mercury", "Earth"],
        "correct": 2,
        "explanation": "Mercury is the smallest and closest planet to the Sun in our solar system",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_2",
        "question": "What is the chemical symbol for water?",
        "options": ["H₂O", "CO₂", "O₂", "NaCl"],
        "correct": 0,
        "explanation": "Water consists of two hydrogen atoms and one oxygen atom: H₂O",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_3",
        "question": "Which organ pumps blood throughout the body?",
        "options": ["Liver", "Heart", "Brain", "Lungs"],
        "correct": 1,
        "explanation": "The heart is a muscular organ that pumps blood through the circulatory system",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_4",
        "question": "What force keeps us on the ground?",
        "options": ["Magnetism", "Gravity", "Friction", "Inertia"],
        "correct": 1,
        "explanation": "Gravity is the force that attracts objects with mass toward each other",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_5",
        "question": "What is the atomic number of Oxygen?",
        "options": ["8", "6", "16", "10"],
        "correct": 0,
        "explanation": "Oxygen has atomic number 8, meaning it has 8 protons in its nucleus",
        "subject": "Science",
        "difficulty": 2
    },
    {
        "id": "sci_6",
        "question": "Which gas do plants absorb during photosynthesis?",
        "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        "correct": 1,
        "explanation": "Plants absorb carbon dioxide (CO₂) during photosynthesis and release oxygen",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_7",
        "question": "What is the largest planet in our solar system?",
        "options": ["Earth", "Saturn", "Jupiter", "Neptune"],
        "correct": 2,
        "explanation": "Jupiter is the largest planet in our solar system",
        "subject": "Science",
        "difficulty": 1
    },
    {
        "id": "sci_8",
        "question": "What is the main component of air?",
        "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        "correct": 2,
        "explanation": "Nitrogen makes up about 78% of Earth's atmosphere",
        "subject": "Science",
        "difficulty": 1
    },
    
    # GK Questions (4)
    {
        "id": "gk_1",
        "question": "Who wrote 'Romeo and Juliet'?",
        "options": ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        "correct": 1,
        "explanation": "'Romeo and Juliet' was written by William Shakespeare in the late 16th century",
        "subject": "General Knowledge",
        "difficulty": 1
    },
    {
        "id": "gk_2",
        "question": "What is the capital of France?",
        "options": ["London", "Berlin", "Madrid", "Paris"],
        "correct": 3,
        "explanation": "Paris is the capital and most populous city of France",
        "subject": "General Knowledge",
        "difficulty": 1
    },
    {
        "id": "gk_3",
        "question": "Who painted the Mona Lisa?",
        "options": ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        "correct": 2,
        "explanation": "The Mona Lisa was painted by Leonardo da Vinci in the 16th century",
        "subject": "General Knowledge",
        "difficulty": 1
    },
    {
        "id": "gk_4",
        "question": "What is the largest ocean on Earth?",
        "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        "correct": 3,
        "explanation": "The Pacific Ocean is the largest and deepest ocean on Earth",
        "subject": "General Knowledge",
        "difficulty": 1
    }
]

# Simple quiz session storage
quiz_sessions = {}

@app.route('/')
def home():
    """Serve the main application"""
    return send_file('index.html')

# Serve static files
@app.route('/static/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/api/quiz/start', methods=['POST'])
def start_quiz():
    """Start a new mixed subject quiz session"""
    try:
        student_id = f"student_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # Randomly select 10 unique questions
        selected_questions = random.sample(QUESTIONS_DATABASE, 10)
        
        # Store session with selected questions
        quiz_sessions[student_id] = {
            "questions": selected_questions,
            "current_question": 0,
            "score": 0,
            "start_time": datetime.now(),
            "answers": []
        }
        
        return jsonify({
            "success": True,
            "session_id": student_id,
            "message": "Mixed subject quiz session started",
            "total_questions": 10,
            "subject_mix": "Mathematics, Science & General Knowledge"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/quiz/question', methods=['POST'])
def get_question():
    """Get next question"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id or session_id not in quiz_sessions:
            return jsonify({
                "success": False,
                "error": "Invalid or expired session"
            }), 400
        
        session = quiz_sessions[session_id]
        
        # Check if quiz is complete
        if session["current_question"] >= 10:
            return jsonify({
                "success": False,
                "error": "Quiz already completed",
                "is_complete": True
            }), 400
        
        # Get current question
        question_index = session["current_question"]
        question_data = session["questions"][question_index]
        
        return jsonify({
            "success": True,
            "question": {
                "id": question_data["id"],
                "text": question_data["question"],
                "options": question_data["options"],
                "subject": question_data["subject"],
                "difficulty": question_data["difficulty"],
                "question_number": question_index + 1
            },
            "progress": {
                "current": question_index + 1,
                "total": 10,
                "percentage": ((question_index + 1) / 10) * 100
            }
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/quiz/answer', methods=['POST'])
def submit_answer():
    """Submit answer and get feedback"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        answer_index = data.get('answer_index')
        
        if not session_id or session_id not in quiz_sessions:
            return jsonify({
                "success": False,
                "error": "Invalid or expired session"
            }), 400
        
        session = quiz_sessions[session_id]
        
        # Find the current question
        current_q_index = session["current_question"]
        if current_q_index >= 10:
            return jsonify({
                "success": False,
                "error": "Quiz already completed"
            }), 400
        
        question_data = session["questions"][current_q_index]
        
        # Verify question ID matches
        if question_data["id"] != question_id:
            return jsonify({
                "success": False,
                "error": "Question ID mismatch"
            }), 400
        
        # Check answer
        is_correct = answer_index == question_data["correct"]
        
        # Update score
        if is_correct:
            session["score"] += 10
        
        # Store answer
        session["answers"].append({
            "question_id": question_id,
            "answer_index": answer_index,
            "correct": is_correct
        })
        
        # Move to next question
        session["current_question"] += 1
        
        # Check if quiz is complete
        is_complete = session["current_question"] >= 10
        
        return jsonify({
            "success": True,
            "result": {
                "correct": is_correct,
                "correct_answer": question_data["options"][question_data["correct"]],
                "explanation": question_data["explanation"],
                "new_score": session["score"],
                "questions_answered": session["current_question"]
            },
            "is_complete": is_complete,
            "next_question_available": not is_complete,
            "current_score": session["score"]
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/quiz/complete', methods=['POST'])
def complete_quiz():
    """Complete quiz and get final results"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id or session_id not in quiz_sessions:
            return jsonify({
                "success": False,
                "error": "Invalid or expired session"
            }), 400
        
        session = quiz_sessions[session_id]
        
        # Calculate accuracy
        total_questions = len(session["answers"])
        if total_questions == 0:
            accuracy = 0
        else:
            correct_answers = sum(1 for ans in session["answers"] if ans["correct"])
            accuracy = (correct_answers / total_questions) * 100
        
        final_score = session["score"]
        
        # Determine level
        if final_score >= 80:
            level = "Excellent"
        elif final_score >= 60:
            level = "Good"
        elif final_score >= 40:
            level = "Average"
        else:
            level = "Beginner"
        
        # Calculate time spent
        time_spent = str(datetime.now() - session["start_time"]).split('.')[0]
        
        summary = {
            "total_questions": total_questions,
            "final_score": final_score,
            "accuracy": round(accuracy, 1),
            "level_achieved": level,
            "time_spent": time_spent
        }
        
        # Clean up session
        if session_id in quiz_sessions:
            del quiz_sessions[session_id]
        
        return jsonify({
            "success": True,
            "summary": summary
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/system/health')
def health_check():
    """System health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(quiz_sessions),
        "total_questions": len(QUESTIONS_DATABASE),
        "questions_per_quiz": 10,
        "question_selection": "Random 10 from 20"
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 EduAdapt Platform Starting")
    print("="*60)
    print("✨ Features:")
    print("  • 10 Random Questions from 20 Question Pool")
    print("  • Mixed Subjects: Math, Science, GK")
    print("  • Simple Scoring: 10 points per question")
    print("\n✅ System Status: READY")
    print("📊 Questions in Pool:", len(QUESTIONS_DATABASE))
    print("🎯 Questions per Quiz: 10 (random selection)")
    print("\n🌐 Server: http://localhost:5000")
    print("="*60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)