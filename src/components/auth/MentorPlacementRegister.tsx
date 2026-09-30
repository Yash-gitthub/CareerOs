import React, { useState } from 'react';
import { ArrowLeft, Building2, Users, Mail, User, Phone, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { FormField } from '../common/FormField';
import { Button } from '../common/Button';
import { SearchableSelect } from '../common/SearchableSelect';
import { POPULAR_COLLEGES } from '../../data/colleges';
import { submitMentorRegistration } from '../../lib/supabase';

export const MentorPlacementRegister: React.FC = () => {
  const { user, setCurrentScreen } = useOnboarding();
  const isMentor = user.role === 'mentor';
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await submitMentorRegistration({
      name,
      email,
      role: isMentor ? 'mentor' : 'placement_officer',
      institution,
      designation,
      phone,
    });
    setIsSubmitting(false);
    setSubmitted(true);
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card space-y-6">
        
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
            {isMentor ? <Users className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{isMentor ? 'Faculty / Mentor Registration' : 'Placement Cell Registration'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isMentor ? 'Guide your engineering cohorts' : 'Power your college placements'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {isMentor
              ? 'Connect with student Career Twins, monitor milestone benchmarks, and provide directed feedback.'
              : 'Track aggregate batch readiness scores, verify placement eligibility, and organize targeted company drives.'}
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Registration Received!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you, <strong>{name || 'Professor'}</strong>. The {isMentor ? 'Faculty Advisor' : 'Placement Cell'} portal is currently in private pilot. We have queued your institution (<strong>{institution || 'University'}</strong>) for priority activation.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => setCurrentScreen('welcome')}
              >
                Back to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentScreen('step-1-profile')}
              >
                Try Student Experience
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Full Name & Title"
              placeholder={isMentor ? 'e.g. Dr. Ramesh Kulkarni' : 'e.g. Prof. Priya Sharma (TPO)'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <FormField
              label="Official Institutional Email"
              type="email"
              placeholder="name@college.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              helperText="Please use your official university or college domain email."
            />

            <SearchableSelect
              label="College / Institution"
              options={POPULAR_COLLEGES}
              value={institution}
              onChange={setInstitution}
              placeholder="Search or type college name..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Designation / Role"
                placeholder={isMentor ? 'e.g. HOD Computer Dept' : 'e.g. Head Placement Officer'}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />

              <FormField
                label="Contact Phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentScreen('role-selection')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-xs text-slate-600"
              >
                Back
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="px-6 py-2.5"
              >
                Request Portal Access
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
