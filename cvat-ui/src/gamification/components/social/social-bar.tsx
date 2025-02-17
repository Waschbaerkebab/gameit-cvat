// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT
import React, { useEffect, useState } from 'react';
import '../../gamif-styles.scss';
import { Popover, Button } from 'antd';
import {
    CloseOutlined, LeftOutlined, RightOutlined, UserOutlined,
} from '@ant-design/icons';
import { getCVATStore } from 'cvat-store';
import { getFriendsListAsync, toggleChatVisibility, toggleChatWindow } from 'gamification/actions/social-actions';
import { OnlineStatus, Profile } from 'gamification/gamif-interfaces';
import { addGamifLog } from 'gamification/actions/user-data-actions';
import { connect, useDispatch } from 'react-redux';
import { CombinedState } from 'reducers/interfaces';
import { FriendsList } from './friends-list';
import Chat from './chat-box';

interface StateToProps {
    friends: Profile[],
    friendsOnline: number;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const { social } = state;
    const { userId } = state.gamifuserdata;

    return {
        friends: social.friendListEntries,
        // eslint-disable-next-line max-len
        friendsOnline: social.friendListEntries.filter((p: Profile) => ((p.status !== OnlineStatus.OFFLINE) && (p.userId !== userId))).length,
    };
}

interface SocialBarProps {
    friends: Profile[],
    friendsOnline: number;
}

const chatBar = (friend?: Profile): JSX.Element => {
    const dispatch = useDispatch();
    const { status } = getCVATStore().getState().social;

    if (!friend) {
        return (
            <div className='gamif-chat-bar-bubble placeholder'> &nbsp; </div>
        );
    }

    // FIXME: Disabled eslint (div is not accessible via keyboard, no role assigned to div)
    return (
        <Popover
            placement='top'
            trigger='click'
            content={<Chat userId={friend.userId} messages={[]} />}
            mouseLeaveDelay={10}
            defaultVisible={false}
            visible={friend.chatVisible}
            overlayClassName='gamif-popover'
        >
            {/* eslint-disable-next-line max-len */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                id='gamif-chat-bar-bubble'
                key={friend.userId}
                className={(friend.sentAMessage && status === OnlineStatus.ONLINE) ? 'gamif-chat-bar-bubble unreadMessage' : 'gamif-chat-bar-bubble'}
                onClick={() => {
                    dispatch(toggleChatVisibility(friend.userId, !friend.chatVisible));
                }}
            >
                <span className='gamif-chat-bar-bubble-text'>
                    {friend.username}
                </span>
                <Button
                    icon={<CloseOutlined style={{ color: '#e6e6e6' }} />}
                    onClick={() => {
                        dispatch(toggleChatWindow(friend.userId, false));
                    }}
                    type='text'
                    size='small'
                />
            </div>
        </Popover>
    );
};

function SocialBar(props: SocialBarProps): JSX.Element {
    const dispatch = useDispatch();
    const { friends, friendsOnline } = props;

    useEffect(() => {
        dispatch(getFriendsListAsync());
    }, []);

    const activeChats = friends.filter((profile: Profile) => profile.chatActive);
    const [activeRange, setActiveRange] = useState(0);

    useEffect(() => {
        if (activeChats.length <= 2) {
            setActiveRange(0);
        }
    }, [activeChats]);

    return (
        <div
            className='gamif-social-bar'
            // mode='horizontal'
            style={{ padding: '0', borderBottom: '0' }}
        >
            <div className='gamif-social-bar-friends-menu'>
                {/* <Popover
                    placement='left'
                    trigger='click'
                    content={<StatusMenu />}
                    mouseLeaveDelay={10}
                    onVisibleChange={(visible: boolean) => { if (!visible) { dispatch(saveProfileDataAsync()); } }}
                    overlayClassName='gamif-popover'
                >
                    <div className='gamif-status-menu-trigger'>
                        <InfoCircleFilled />
                    </div>
                </Popover> */}
                <div
                    className='gamif-friends-list-menu'
                    style={{ display: 'flex' }}
                    key='friends_list'
                >
                    <Popover
                        zIndex={100}
                        placement='top'
                        trigger='click'
                        content={<FriendsList profiles={friends} />}
                        mouseLeaveDelay={10}
                    >
                        <Button
                            className='friends-list-popover-trigger-button'
                            onClick={() => {
                                dispatch(getFriendsListAsync());
                                dispatch(addGamifLog('Opened Friends List'));
                            }}
                            icon={<UserOutlined />}
                            ghost
                        >
                            {/* {`Friends (${activeChats.length ?? 0})`} */}
                            {/* {`Friends (${activeRange})`} */}
                            {/* Friends */}
                            {friendsOnline}
                        </Button>
                    </Popover>
                </div>
            </div>
            <div className='gamif-social-bar-chat-boxes-wrapper'>
                {activeChats.length > 2 && (
                    <Button
                        className='gamif-social-bar-chat-arrow'
                        type='text'
                        icon={<LeftOutlined />}
                        disabled={activeRange === 0}
                        onClick={() => setActiveRange(Math.max(activeRange - 1, 0))}
                    />
                )}
                {activeChats[activeRange] ? chatBar(activeChats[activeRange]) : chatBar()}
                {activeChats[activeRange + 1] ? chatBar(activeChats[activeRange + 1]) : chatBar()}
                {activeChats.length > 2 && (
                    <Button
                        className='gamif-social-bar-chat-arrow'
                        type='text'
                        icon={<RightOutlined />}
                        disabled={activeRange === activeChats.length - 2}
                        onClick={() => setActiveRange(Math.min(activeRange + 1, activeChats.length - 2))}
                    />
                )}
            </div>
        </div>
    );
}

export default connect(mapStateToProps)(SocialBar);
