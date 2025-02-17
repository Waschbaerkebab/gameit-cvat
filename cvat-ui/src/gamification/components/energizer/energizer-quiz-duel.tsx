// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import 'gamification/gamif-styles.scss';
import {
    Button,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { CombinedState } from 'reducers/interfaces';
import gamifconsts from 'gamification/gamifconsts';
import { addLeaderboardEntry, setLatestEntry } from 'gamification/actions/energizer-actions';
import { getQuizDuelQuestions } from 'gamification/gamif-items';
import { updateEnergizerBadge } from 'gamification/actions/badge-actions';
import {
    QuizDuelQuestion, EnergizerProps, EnergizerType, LeaderboardEntry,
} from '../../gamif-interfaces';

enum Answer {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    NONE = 'NONE',
}

const mapAnswertoIndex = (answer: Answer): number => {
    switch (answer) {
        case Answer.A: return 1;
        case Answer.B: return 2;
        case Answer.C: return 3;
        case Answer.D: return 4;
        default: return 0;
    }
};

interface QuizDuelUniqueProps {
    startTime: number;
}
type QuizDuelProps = QuizDuelUniqueProps & EnergizerProps;

export default function QuizDuel(props: QuizDuelProps): JSX.Element {
    const { showLeaderboard, startTime } = props;
    const userdata = useSelector((state: CombinedState) => state.gamifuserdata);

    const [divStyle, setDivStyle] = useState([
        'quiz-duel-status-bar-element-empty',
        'quiz-duel-status-bar-element-empty',
        'quiz-duel-status-bar-element-empty',
        'quiz-duel-status-bar-element-empty',
        'quiz-duel-status-bar-element-empty',
    ]);

    const updateStatusBar = (index: number, correct: boolean): void => {
        const newStyles = [...divStyle];
        newStyles[index] = correct ? 'quiz-duel-status-bar-element-correct' : 'quiz-duel-status-bar-element-wrong';
        setDivStyle(newStyles);
    };

    const initialButtonState = [
        'quiz-duel-answer-button',
        'quiz-duel-answer-button',
        'quiz-duel-answer-button',
        'quiz-duel-answer-button',
    ];

    const [answerButtonStyle, setAnswerButtonStyle] = useState(initialButtonState);

    function styleAnswerButtons(givenAnswer: number, correctAnswer: number): void {
        const newStyles = [...answerButtonStyle];
        newStyles[givenAnswer] = 'quiz-duel-answer-button answer-wrong';
        newStyles[correctAnswer] = 'quiz-duel-answer-button answer-correct';
        setAnswerButtonStyle(newStyles);
    }

    const [progress, setProgress] = useState(1);
    const [readyToContinue, setContinue] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState(Answer.NONE);

    const dummyQuestion: QuizDuelQuestion = {
        question: 'What is 2x2',
        answerA: '1',
        answerB: '2',
        answerC: '3',
        answerD: '4',
        correctAnswer: 4,
    };

    const [quizScore, setScore] = useState(0);
    const [questions, setQuestions] = useState([dummyQuestion]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
    const [end, setEnd] = useState(false);
    const [questionPoints, setPoints] = useState(startTime);
    const [timerValue, freezeTimer] = useState(0);
    const [buttonText, setButtonText] = useState('Give Answer');

    const dispatch = useDispatch();

    useEffect(() => {
        const questionsImport = getQuizDuelQuestions(5);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setQuestions(questionsImport);
        setCurrentQuestion(questions[0]);
        setLoading(false);

        const intervalQuiz = setInterval(() => {
            setPoints((currentPoints) => Math.max(0, currentPoints - 1));
        }, 333);
        return () => {
            clearInterval(intervalQuiz);
        };
    }, []);

    useEffect(() => {
        setCurrentQuestion(questions[0]);
    }, [loading]);

    return (
        <div className='gamif-energizer-modal-content-wrapper'>
            <div className='quiz-duel-heading'>
                <h2>{`Question ${progress}`}</h2>
            </div>
            <div className='quiz-duel-status-bar'>
                {divStyle.map((el, index) => <div className={el} key={index}> &nbsp;</div>)}
            </div>

            {loading ?
                <div> Loading </div> : (
                    <>
                        <div className='quiz-duel-question'>
                            <h1>{currentQuestion.question}</h1>
                        </div>
                        <div className='quiz-duel-answer-box'>
                            <div>
                                <Button
                                    className={answerButtonStyle[0]}
                                    onClick={(): void => {
                                        setCurrentAnswer(Answer.A);
                                    }}
                                >
                                    {currentQuestion.answerA}
                                </Button>
                                <Button
                                    className={answerButtonStyle[1]}
                                    onClick={(): void => {
                                        setCurrentAnswer(Answer.B);
                                    }}
                                >
                                    {currentQuestion.answerB}
                                </Button>

                            </div>
                            <div className='quiz-duel-timer-wrapper'>
                                <span className='quiz-duel-timer'>
                                    <span>Points:</span>
                                    &nbsp;
                                    {!readyToContinue ? questionPoints : timerValue}
                                </span>
                            </div>
                            <div>
                                <Button
                                    className={answerButtonStyle[2]}
                                    onClick={(): void => {
                                        setCurrentAnswer(Answer.C);
                                    }}

                                >
                                    {currentQuestion.answerC}
                                </Button>
                                <Button
                                    className={answerButtonStyle[3]}
                                    onClick={(): void => {
                                        setCurrentAnswer(Answer.D);
                                    }}
                                >
                                    {currentQuestion.answerD}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            <Button
                className='gamif-energizer-continue-button'
                // type='primary'
                disabled={currentAnswer === Answer.NONE}
                onClick={(): void => {
                    // first button click: Check Answer + show correct answer + update Status Bar
                    if (currentAnswer !== Answer.NONE && !readyToContinue) {
                        const answerCorrect = mapAnswertoIndex(currentAnswer) === currentQuestion.correctAnswer;
                        if (answerCorrect) {
                            setScore(quizScore + questionPoints);
                        }
                        updateStatusBar(progress - 1, answerCorrect);
                        styleAnswerButtons(mapAnswertoIndex(currentAnswer) - 1, currentQuestion.correctAnswer - 1);
                        setContinue(true);
                        freezeTimer(questionPoints);
                        setButtonText('Continue to Next Question');
                    }

                    // if on last question and answer is checked --> show Leaderboard instead of
                    // continuing to the next question
                    if (progress === gamifconsts.QUIZ_DUEL_ROUNDS && readyToContinue) {
                        if (!end) {
                            const entry: LeaderboardEntry = {
                                userId: userdata.userId,
                                username: userdata.username,
                                energizer: EnergizerType.QUIZ,
                                score: quizScore,
                            };
                            dispatch(setLatestEntry(entry));
                            dispatch(addLeaderboardEntry(entry));
                            setEnd(true);
                            if (quizScore === 0) { dispatch(updateEnergizerBadge(EnergizerType.QUIZ)); }
                        }

                        showLeaderboard(true);

                        // second button click:
                    } else if (readyToContinue) {
                        setContinue(false);
                        setProgress(progress + 1);
                        setCurrentQuestion(questions[progress]);
                        setAnswerButtonStyle(initialButtonState);
                        setCurrentAnswer(Answer.NONE);
                        setPoints(startTime);
                        setButtonText('Give Answer');
                    }
                }}
            >
                {buttonText}
            </Button>
        </div>
    );
}
