// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import 'gamification/gamif-styles.scss';
import React from 'react';
import { Row } from 'antd';
import { Challenge } from 'gamification/gamif-interfaces';
import { connect } from 'react-redux';
import { CombinedState } from 'reducers/interfaces';
// import { initializeUserData } from 'gamification/actions/user-data-actions';
// import { addChallenge, } from 'gamification/actions/challenge-actions';
// import { UndoOutlined } from '@ant-design/icons';
// import { AnnotationCoinIcon } from 'icons';
import ChallengePane from './challenge-component';

interface ChallengeListProps {
    challenges: Challenge[],
}
interface StateToProps {
    challenges: Challenge[],
}

function mapStateToProps(state: CombinedState): StateToProps {
    return {
        challenges: state.challenges.availableChallenges,
    };
}

const showPlaceholder = (): JSX.Element => (
    <div className='gamif-challenge-placeholder'>
        Check back tomorrow for a new challenge!
    </div>
);

export function ChallengeList(props: ChallengeListProps): JSX.Element {
    // const dispatch = useDispatch();
    // const { availableChallenges } = useSelector((state: CombinedState) => state.challenges);
    const { challenges } = props;

    return (
        <>
            <div className='gamif-challenge-list'>
                <div>
                    {challenges.map((_challenge: Challenge, index: number) => (
                        <Row key={index}>
                            <ChallengePane
                                id={index}
                                key={index}
                                challenge={_challenge}
                                initProgress={_challenge.progress}
                            />
                        </Row>
                    ))}
                </div>
                {challenges.length === 0 ? showPlaceholder() : <></>}
            </div>

            {/* <Button className='gamif-debug-button'
            onClick={() => dispatch(getChallengesAsync())}> Get Challenges </Button> */}
            {/* <Button className='gamif-debug-button'
            onClick={() => dispatch(addChallenge())}> Add Challenge </Button> */}
            {/* <Button className='gamif-de
            bug-button' onClick={() => dispatch(getChallengesAsync(true))}> New Day Chal </Button> */}
            {/* <Button className='gamif-de
            bug-button' onClick={() => dispatch(initializeUserData(true))}> Init New Day </Button> */}
            {/* <Button className='gamif-debug-button'
            onClick={() => dispatch(saveChallenges())}> Save Challenges </Button>
            <Button
                className='gamif-debug-button'
                onClick={() => dispatch(updateChallenges())}
            >
                Update Challenges
            </Button> */}
        </>
    );
}

export default connect(mapStateToProps)(ChallengeList);
