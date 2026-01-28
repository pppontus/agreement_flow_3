"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './ContractAdvisor.module.css';

interface ContractAdvisorProps {
  onSelectType: (type: 'FAST' | 'RORLIGT' | 'KVARTS') => void;
  onCancel: () => void;
}

type Answer = 'A' | 'B' | 'C' | null;

interface Question {
  id: number;
  text: string;
  options: { value: 'A' | 'B' | 'C'; label: string }[];
  weighted: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Vilket passar dig bäst?',
    options: [
      { value: 'A', label: 'Stabilt även om det ibland blir dyrare' },
      { value: 'B', label: 'Marknadspris över tid och accepterar variation' },
      { value: 'C', label: 'Aktiv påverkan genom att flytta förbrukning' },
    ],
    weighted: false,
  },
  {
    id: 2,
    text: 'Kan du flytta elförbrukning till billigare tider (natt/helg)?',
    options: [
      { value: 'A', label: 'Ja, mycket' },
      { value: 'B', label: 'Lite grann' },
      { value: 'C', label: 'Nej, nästan inte alls' },
    ],
    weighted: true,
  },
  {
    id: 3,
    text: 'Har du elbil eller annan stor förbrukare som du kan styra i tid?',
    options: [
      { value: 'A', label: 'Ja, och jag kan styra tiderna' },
      { value: 'B', label: 'Ja, men jag styr sällan' },
      { value: 'C', label: 'Nej' },
    ],
    weighted: true,
  },
  {
    id: 4,
    text: 'Hur vill du hantera pristoppar?',
    options: [
      { value: 'A', label: 'Jag vill slippa tänka på det' },
      { value: 'B', label: 'Jag accepterar variation men vill inte optimera' },
      { value: 'C', label: 'Jag kan anpassa mig och flytta förbrukning' },
    ],
    weighted: false,
  },
  {
    id: 5,
    text: 'När används elen mest hemma?',
    options: [
      { value: 'A', label: 'Mest dagtid' },
      { value: 'B', label: 'Jämnt över dygnet' },
      { value: 'C', label: 'Mest kväll eller natt' },
    ],
    weighted: false,
  },
];

const MOTIVATIONS: Record<'FAST' | 'RORLIGT' | 'KVARTS', string> = {
  FAST: 'Du vill ha stabilitet och slippa påverkas av pristoppar.',
  RORLIGT: 'Du accepterar prisvariation men vill inte optimera timme för timme.',
  KVARTS: 'Du kan styra mer av din förbrukning till billigare timmar.',
};

const TYPE_LABELS: Record<'FAST' | 'RORLIGT' | 'KVARTS', string> = {
  FAST: 'Fastpris',
  RORLIGT: 'Rörligt',
  KVARTS: 'Kvartspris',
};

export const ContractAdvisor = ({ onSelectType, onCancel }: ContractAdvisorProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([null, null, null, null, null]);
  const [showResult, setShowResult] = useState(false);

  const question = QUESTIONS[currentQuestion];

  const handleAnswer = (answer: 'A' | 'B' | 'C') => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResult(true);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateRecommendation = (): 'FAST' | 'RORLIGT' | 'KVARTS' => {
    let fastpris = 0;
    let rorligt = 0;
    let kvartspris = 0;

    // Question 1 (weight 1)
    if (answers[0] === 'A') fastpris += 1;
    if (answers[0] === 'B') rorligt += 1;
    if (answers[0] === 'C') kvartspris += 1;

    // Question 2 (weight 2)
    if (answers[1] === 'A') kvartspris += 2;
    if (answers[1] === 'B') rorligt += 2;
    if (answers[1] === 'C') fastpris += 2;

    // Question 3 (weight 2)
    if (answers[2] === 'A') kvartspris += 2;
    if (answers[2] === 'B') rorligt += 2;
    if (answers[2] === 'C') fastpris += 2;

    // Question 4 (weight 1)
    if (answers[3] === 'A') fastpris += 1;
    if (answers[3] === 'B') rorligt += 1;
    if (answers[3] === 'C') kvartspris += 1;

    // Question 5 (weight 1)
    if (answers[4] === 'A') fastpris += 1;
    if (answers[4] === 'B') rorligt += 1;
    if (answers[4] === 'C') kvartspris += 1;

    const max = Math.max(fastpris, rorligt, kvartspris);

    // Tie-breaking rules
    const tied = [fastpris, rorligt, kvartspris].filter(x => x === max).length > 1;

    if (tied) {
      // If Kvartspris is tied for first and user answered A on Q2 or Q3 -> Kvartspris
      if (kvartspris === max && (answers[1] === 'A' || answers[2] === 'A')) {
        return 'KVARTS';
      }
      // Otherwise Rörligt
      if (rorligt === max) {
        return 'RORLIGT';
      }
      // Fastpris only if other rules don't decide
      return 'FAST';
    }

    // Clear winner
    if (kvartspris === max) return 'KVARTS';
    if (rorligt === max) return 'RORLIGT';
    return 'FAST';
  };

  if (showResult) {
    const recommendation = calculateRecommendation();

    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>✨</div>
          <h2 className={styles.resultTitle}>Rekommendation: {TYPE_LABELS[recommendation]}</h2>
          <p className={styles.resultMotivation}>{MOTIVATIONS[recommendation]}</p>

          <div className={styles.resultActions}>
            <Button onClick={() => onSelectType(recommendation)} fullWidth>
              Fortsätt med {TYPE_LABELS[recommendation]}
            </Button>
            <button className={styles.secondaryAction} onClick={onCancel}>
              Se alla avtalsformer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Hjälp mig välja avtalsform</h2>
        <p className={styles.progress}>Fråga {currentQuestion + 1} av {QUESTIONS.length}</p>
      </header>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className={styles.questionCard}>
        <h3 className={styles.questionText}>{question.text}</h3>

        <div className={styles.options}>
          {question.options.map((option) => (
            <button
              key={option.value}
              className={`${styles.optionButton} ${answers[currentQuestion] === option.value ? styles.optionSelected : ''}`}
              onClick={() => handleAnswer(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        {currentQuestion > 0 ? (
          <button className={styles.backLink} onClick={handleBack}>
            ← Föregående fråga
          </button>
        ) : (
          <div />
        )}
        <button className={styles.cancelLink} onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </div>
  );
};
