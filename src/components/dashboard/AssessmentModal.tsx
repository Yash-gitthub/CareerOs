import React, { useState } from 'react';
import { X, CheckCircle2, Brain, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { useOnboarding } from '../../context/OnboardingContext';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, onClose }) => {
  const { user } = useOnboarding();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const targetRole = user.career.targetRole || 'Software Engineer';

  const SAMPLE_QUESTIONS = [
    {
      topic: 'Core Fundamentals',
      question: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
      correct: 1
    },
    {
      topic: 'Practical Engineering',
      question: 'When designing a RESTful API, which HTTP status code is most appropriate after successfully creating a new resource?',
      options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
      correct: 1
    },
    {
      topic: 'System & Architecture',
      question: 'Which of the following database techniques is primarily used to prevent race conditions during concurrent write transactions?',
      options: ['Database Indexing', 'ACID Transactions with Isolation Levels', 'Connection Pooling', 'Read Replicas'],
      correct: 1
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 sm:p-8 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!completed ? (
          <>
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                <Brain className="w-3.5 h-3.5" />
                <span>Baseline Skill Diagnostic</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Calibrating for {targetRole}
              </h3>
              <p className="text-xs text-slate-500">
                Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length} • ~5 mins
              </p>
            </div>

            {/* Question Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                {SAMPLE_QUESTIONS[currentQuestion].topic}
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {SAMPLE_QUESTIONS[currentQuestion].question}
              </p>

              <div className="space-y-2 pt-2">
                {SAMPLE_QUESTIONS[currentQuestion].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                      } else {
                        setCompleted(true);
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 text-xs font-medium text-slate-700 transition-colors flex items-center justify-between group"
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Take your time — accuracy helps the Twin calibrate</span>
              <button
                onClick={onClose}
                className="hover:text-slate-600 underline font-medium"
              >
                Resume later
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Diagnostic Completed!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your answers have calibrated your starting baseline. Your personalized daily roadmap is now active.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={onClose}
              className="w-full py-2.5"
            >
              Return to Dashboard
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
