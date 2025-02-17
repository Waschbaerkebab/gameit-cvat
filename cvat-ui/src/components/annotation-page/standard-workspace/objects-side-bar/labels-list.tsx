// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import message from 'antd/lib/message';

import { CombinedState } from 'reducers/interfaces';
import { rememberObject, updateAnnotationsAsync } from 'actions/annotation-actions';
import LabelItemContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/label-item';
import GlobalHotKeys from 'utils/mousetrap-react';

function LabelsListComponent(): JSX.Element {
    const dispatch = useDispatch();
    const labels = useSelector((state: CombinedState) => state.annotation.job.labels);
    const activatedStateID = useSelector((state: CombinedState) => state.annotation.annotations.activatedStateID);
    const states = useSelector((state: CombinedState) => state.annotation.annotations.states);
    const keyMap = useSelector((state: CombinedState) => state.shortcuts.keyMap);

    const labelIDs = labels.map((label: any): number => label.id);

    const [keyToLabelMapping, setKeyToLabelMapping] = useState<Record<string, number>>(
        Object.fromEntries(labelIDs.slice(0, 10).map((labelID: number, idx: number) => [(idx + 1) % 10, labelID])),
    );

    const updateLabelShortcutKey = useCallback(
        (key: string, labelID: number) => {
            // unassign any keys assigned to the current labels
            const keyToLabelMappingCopy = { ...keyToLabelMapping };
            for (const shortKey of Object.keys(keyToLabelMappingCopy)) {
                if (keyToLabelMappingCopy[shortKey] === labelID) {
                    delete keyToLabelMappingCopy[shortKey];
                }
            }

            if (key === '—') {
                setKeyToLabelMapping(keyToLabelMappingCopy);
                return;
            }

            // check if this key is assigned to another label
            if (key in keyToLabelMappingCopy) {
                // try to find a new key for the other label
                for (let i = 0; i < 10; i++) {
                    const adjustedI = (i + 1) % 10;
                    if (!(adjustedI in keyToLabelMappingCopy)) {
                        keyToLabelMappingCopy[adjustedI] = keyToLabelMappingCopy[key];
                        break;
                    }
                }
                // delete assigning to the other label
                delete keyToLabelMappingCopy[key];
            }

            // assigning to the current label
            keyToLabelMappingCopy[key] = labelID;
            setKeyToLabelMapping(keyToLabelMappingCopy);
        },
        [keyToLabelMapping],
    );

    const subKeyMap = {
        SWITCH_LABEL: keyMap.SWITCH_LABEL,
    };

    const handlers = {
        SWITCH_LABEL: (event: KeyboardEvent | undefined, shortcut: string) => {
            if (event) event.preventDefault();
            const labelID = keyToLabelMapping[shortcut.split('+')[1].trim()];
            const label = labels.filter((_label: any) => _label.id === labelID)[0];
            if (Number.isInteger(labelID) && label) {
                if (Number.isInteger(activatedStateID)) {
                    const activatedState = states.filter((state: any) => state.clientID === activatedStateID)[0];
                    if (activatedState) {
                        activatedState.label = label;
                        dispatch(updateAnnotationsAsync([activatedState]));
                    }
                } else {
                    dispatch(rememberObject({ activeLabelID: labelID }));
                    message.destroy();
                    message.success(`Default label was changed to "${label.name}"`);
                }
            }
        },
    };

    return (
        <div className='cvat-objects-sidebar-labels-list'>
            <GlobalHotKeys keyMap={subKeyMap} handlers={handlers} />
            {labelIDs.map(
                (labelID: number): JSX.Element => (
                    <LabelItemContainer
                        key={labelID}
                        labelID={labelID}
                        keyToLabelMapping={keyToLabelMapping}
                        updateLabelShortcutKey={updateLabelShortcutKey}
                    />
                ),
            )}
        </div>
    );
}

export default React.memo(LabelsListComponent);
