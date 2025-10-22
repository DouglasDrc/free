import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Video, ArrowLeft } from 'lucide-react';

const FAQ = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I start a session with a therapist?",
      answer: "Simply browse our list of verified therapists, recharge your wallet with coins, and click either 'Chat' or 'Call' button on a therapist's profile. Make sure you have sufficient coins in your wallet before starting a session."
    },
    {
      question: "How does the coin system work?",
      answer: "Our platform uses a coin-based payment system. You can recharge coins through subscription packages (Starter, Silver, Gold). Chat sessions cost 100 coins per minute, and video calls cost 150 coins per minute. Therapists earn 30 coins per minute from your sessions."
    },
    {
      question: "What are the subscription packages?",
      answer: "We offer three packages: Starter Plan (₹49 = 600 coins), Silver (₹99 = 1500 coins), and Gold (₹199 = 3300 coins). All packages include bonus coins!"
    },
    {
      question: "How do I recharge my wallet?",
      answer: "Click on 'Recharge Wallet' in your dashboard, select a subscription package, and complete the mock payment. Your coins will be added instantly to your account."
    },
    {
      question: "Can I choose between chat and video call?",
      answer: "Yes! Each therapist profile has two buttons - 'Chat' for text-based sessions (100 coins/min) and 'Call' for video sessions (150 coins/min). Choose based on your preference and comfort level."
    },
    {
      question: "How do I know if a therapist is available?",
      answer: "Therapist profiles show their current status: 'Online' (available now), 'Busy' (in a session), or 'Offline' (not available). You can only start sessions with therapists who are 'Online'."
    },
    {
      question: "Are my sessions confidential?",
      answer: "Absolutely! All sessions are end-to-end encrypted and completely confidential. We follow strict privacy protocols to ensure your conversations remain private."
    },
    {
      question: "Can I rate and review therapists?",
      answer: "Yes, after completing a session, you can rate your therapist (1-5 stars) and leave a review to help other users make informed decisions."
    },
    {
      question: "What if I run out of coins during a session?",
      answer: "If your coin balance falls below the required amount during an active session, you'll receive a notification to recharge. Make sure to maintain sufficient balance for uninterrupted sessions."
    },
    {
      question: "How do I become a therapist on this platform?",
      answer: "Therapist accounts are created by our administrators only. If you're a licensed therapist interested in joining our platform, please contact our admin team through the support page."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">MindConnect</span>
          </div>
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 text-lg">Find answers to common questions about MindConnect</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Button onClick={() => navigate('/support')} className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;