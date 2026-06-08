"use client";

import React, { useState } from "react";
import { X, Search, Phone } from "lucide-react";
import Button from "@/components/ui/Button";

const PROBLEM_CATEGORIES = [
  { id: "career", label: "Career & Success" },
  { id: "relationships", label: "Love & Relationships",},
  { id: "health", label: "Health & Wellness" },
  { id: "finance", label: "Money & Finance" },
  { id: "family", label: "Family Issues" },
  { id: "spiritual", label: "Spiritual Guidance",},
  { id: "education", label: "Education & Studies",},
  { id: "other", label: "Other Concerns" },
];

const EXPERTISE_TYPES = [
  { id: "vedic", label: "Vedic Astrology" },
  { id: "numerology", label: "Numerology" },
  { id: "tarot", label: "Tarot Reading" },
  { id: "palmistry", label: "Palmistry" },
  { id: "vastu", label: "Vastu Shastra" },
  { id: "spiritual", label: "Spiritual Healing" },
];

export default function ExpertFinderModal({ isOpen, onClose, pandits, onRequestCall, loadingId }) {
  const [step, setStep] = useState(1); // 1: Problem, 2: Expertise, 3: Results
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedExpertise, setSelectedExpertise] = useState(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [filteredPandits, setFilteredPandits] = useState([]);

  if (!isOpen) return null;

  const handleProblemSelect = (categoryId) => {
    setSelectedProblem(categoryId);
  };

  const handleNext = () => {
    if (step === 1 && selectedProblem) {
      setStep(2);
    } else if (step === 2 && selectedExpertise) {
      // Filter pandits based on selections
      const matches = pandits.filter(pandit => {
        const speciality = pandit.speciality?.toLowerCase() || "";
        const expertiseMatch = selectedExpertise === "vedic" 
          ? speciality.includes("astrology") || speciality.includes("vedic")
          : speciality.includes(selectedExpertise);
        
        return expertiseMatch;
      });

      // If no matches, show all pandits
      setFilteredPandits(matches.length > 0 ? matches : pandits);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedProblem(null);
    setSelectedExpertise(null);
    setProblemDescription("");
    setFilteredPandits([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-s16 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-r32 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9B59B6] to-[#C39BD3] px-s24 py-s24 flex items-center justify-between">
          <div>
            <h2 className="heading-h4 text-white">Find Your Perfect Expert</h2>
            <p className="body-small text-white/80 mt-s4">
              {step === 1 && "Tell us what you need help with"}
              {step === 2 && "Choose your preferred expertise"}
              {step === 3 && `${filteredPandits.length} expert${filteredPandits.length !== 1 ? 's' : ''} matched`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-1">
          <div 
            className="bg-[#5f2fb3] h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-s16">
          
          {/* Step 1: Problem Selection */}
          {step === 1 && (
            <div className="space-y-s24">
              <div>
                <h3 className="heading-h5 text-main mb-s8">What brings you here today?</h3>
                <p className="body-small text-secondary">Select the area where you need guidance</p>
              </div>

              <div className="grid grid-cols-2 gap-s8">
                {PROBLEM_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleProblemSelect(category.id)}
                    className={`p-s16 rounded-r16 border-2 transition-all text-left ${
                      selectedProblem === category.id
                        ? "border-[#9B59B6] bg-[#F9F4FB]"
                        : "border-[#E0D4E3] hover:border-[#C39BD3]"
                    }`}
                  >
                    <p className="body-default font-medium text-main">{category.label}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block body-small font-medium text-main mb-s8">
                  Tell us more (Optional)
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe your situation in a few words..."
                  className="w-full px-s16 py-s16 border border-[#E0D4E3] rounded-r16 focus:outline-none focus:border-[#9B59B6] transition-colors resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Expertise Selection */}
          {step === 2 && (
            <div className="space-y-s24">
              <div>
                <h3 className="heading-h5 text-main mb-s8">What type of expert do you prefer?</h3>
                <p className="body-small text-secondary">Choose the expertise that resonates with you</p>
              </div>

              <div className="space-y-s16">
                {EXPERTISE_TYPES.map((expertise) => (
                  <button
                    key={expertise.id}
                    onClick={() => setSelectedExpertise(expertise.id)}
                    className={`w-full p-s16 rounded-r16 border-2 transition-all text-left flex items-center justify-between ${
                      selectedExpertise === expertise.id
                        ? "border-[#9B59B6] bg-[#F9F4FB]"
                        : "border-[#E0D4E3] hover:border-[#C39BD3]"
                    }`}
                  >
                    <span className="body-default font-medium text-main">{expertise.label}</span>
                    {selectedExpertise === expertise.id && (
                      <div className="w-6 h-6 rounded-full bg-[#9B59B6] flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Show selected problem summary */}
              <div className="bg-[#F9F4FB] rounded-r16 p-s16 border border-[#E0D4E3]">
                <p className="body-small text-secondary mb-s4">Selected concern:</p>
                <p className="body-default font-medium text-main">
                  {PROBLEM_CATEGORIES.find(c => c.id === selectedProblem)?.label}
                </p>
                {problemDescription && (
                  <p className="body-small text-secondary mt-s8 italic">"{problemDescription}"</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Matched Experts */}
          {step === 3 && (
            <div className="space-y-s24">
              <div>
                <h3 className="heading-h5 text-main mb-s8">Your Matched Experts</h3>
                <p className="body-small text-secondary">
                  Based on your needs, here are the best experts for you
                </p>
              </div>

              {/* Selection Summary */}
              <div className="bg-[#F9F4FB] rounded-r16 p-s16 space-y-s8">
                <div className="flex items-center gap-s8">
                  <span className="body-small text-secondary">Problem:</span>
                  <span className="body-small font-medium text-main">
                    {PROBLEM_CATEGORIES.find(c => c.id === selectedProblem)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-s8">
                  <span className="body-small text-secondary">Expertise:</span>
                  <span className="body-small font-medium text-main">
                    {EXPERTISE_TYPES.find(e => e.id === selectedExpertise)?.label}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="body-small text-[#9B59B6] hover:underline"
                >
                  Change preferences
                </button>
              </div>

              {/* Matched Pandits List */}
              <div className="space-y-s16">
                {filteredPandits.length === 0 ? (
                  <div className="text-center py-s32">
                    <div className="w-16 h-16 mx-auto bg-[#F3EAF5] rounded-full flex items-center justify-center mb-s16">
                      <Search size={24} className="text-[#9B59B6]" />
                    </div>
                    <p className="body-default text-secondary">No experts found matching your criteria</p>
                    <button
                      onClick={handleReset}
                      className="body-small text-[#9B59B6] hover:underline mt-s8"
                    >
                      Try different preferences
                    </button>
                  </div>
                ) : (
                  filteredPandits.map((pandit) => (
                    <div
                      key={pandit.id}
                      className="bg-white border border-[#E0D4E3] rounded-r16 p-s16 hover:border-[#9B59B6] transition-all"
                    >
                      <div className="flex items-start gap-s16">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {pandit.profilePic ? (
                            <img 
                              src={pandit.profilePic} 
                              alt={pandit.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-[#9B59B6]">
                              {pandit.name?.charAt(0) || "P"}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-s8 mb-s4">
                            <div>
                              <h4 className="body-default font-semibold text-main">
                                {pandit.name}
                              </h4>
                              <p className="body-small text-secondary">
                                {pandit.speciality}
                              </p>
                            </div>
                            <div className="flex items-center gap-s4 bg-green-50 px-s8 py-s4 rounded-r8">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="body-small text-green-700">Online</span>
                            </div>
                          </div>

                          {/* Rate */}
                          <div className="flex items-center gap-s8 mb-s16">
                            <span className="body-small text-secondary">Rate:</span>
                            <span className="body-small font-medium text-main">
                              ₹{pandit.ratePerMin}/min
                            </span>
                          </div>

                          {/* Call Button */}
                          <Button
                            onClick={() => {
                              onRequestCall(pandit);
                              handleClose();
                            }}
                            disabled={loadingId === pandit.id}
                            variant="primary"
                            className="w-full !py-s8"
                          >
                            {loadingId === pandit.id ? (
                              <span className="flex items-center gap-s8 justify-center">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Connecting...
                              </span>
                            ) : (
                              <span className="flex items-center gap-s8 justify-center">
                                <Phone size={16} />
                                Call Now
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0D4E3] p-s24 flex gap-s16">
          {step > 1 && step < 3 && (
            <Button
              onClick={handleBack}
              variant="secondary"
              className="flex-1"
            >
              Back
            </Button>
          )}
          {step < 3 && (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !selectedProblem) ||
                (step === 2 && !selectedExpertise)
              }
              className="flex-1"
            >
              {step === 2 ? "Find Experts" : "Next"}
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}