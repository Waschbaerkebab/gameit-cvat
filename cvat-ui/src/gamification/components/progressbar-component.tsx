// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import 'gamification/gamif-styles.scss';
import { Progress } from 'antd';

export default function ProgressBar(): JSX.Element {
    return (
        <Progress percent={30} />
    );
}
