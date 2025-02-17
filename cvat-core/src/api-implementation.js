// Copyright (C) 2019-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

const config = require('./config');

(() => {
    const PluginRegistry = require('./plugins');
    const serverProxy = require('./server-proxy');
    const lambdaManager = require('./lambda-manager');
    const {
        isBoolean,
        isInteger,
        isEnum,
        isString,
        checkFilter,
        checkExclusiveFields,
        camelToSnake,
        checkObjectType,
    } = require('./common');

    const {
        TaskStatus,
        TaskMode,
        DimensionType,
        CloudStorageProviderType,
        CloudStorageCredentialsType,
    } = require('./enums');

    const User = require('./user');
    const { AnnotationFormats } = require('./annotation-formats');
    const { ArgumentError } = require('./exceptions');
    const { Task, Job } = require('./session');
    const { Project } = require('./project');
    const { CloudStorage } = require('./cloud-storage');
    const Organization = require('./organization');

    function implementAPI(cvat) {
        cvat.plugins.list.implementation = PluginRegistry.list;
        cvat.plugins.register.implementation = PluginRegistry.register.bind(cvat);

        cvat.lambda.list.implementation = lambdaManager.list.bind(lambdaManager);
        cvat.lambda.run.implementation = lambdaManager.run.bind(lambdaManager);
        cvat.lambda.call.implementation = lambdaManager.call.bind(lambdaManager);
        cvat.lambda.cancel.implementation = lambdaManager.cancel.bind(lambdaManager);
        cvat.lambda.listen.implementation = lambdaManager.listen.bind(lambdaManager);
        cvat.lambda.requests.implementation = lambdaManager.requests.bind(lambdaManager);

        cvat.server.about.implementation = async () => {
            const result = await serverProxy.server.about();
            return result;
        };

        cvat.server.share.implementation = async (directory) => {
            const result = await serverProxy.server.share(directory);
            return result;
        };

        cvat.server.formats.implementation = async () => {
            const result = await serverProxy.server.formats();
            return new AnnotationFormats(result);
        };

        cvat.server.userAgreements.implementation = async () => {
            const result = await serverProxy.server.userAgreements();
            return result;
        };

        cvat.server.register.implementation = async (
            username,
            firstName,
            lastName,
            email,
            password1,
            password2,
            userConfirmations,
        ) => {
            const user = await serverProxy.server.register(
                username,
                firstName,
                lastName,
                email,
                password1,
                password2,
                userConfirmations,
            );

            return new User(user);
        };

        cvat.server.login.implementation = async (username, password) => {
            await serverProxy.server.login(username, password);
        };

        cvat.server.logout.implementation = async () => {
            await serverProxy.server.logout();
        };

        cvat.server.changePassword.implementation = async (oldPassword, newPassword1, newPassword2) => {
            await serverProxy.server.changePassword(oldPassword, newPassword1, newPassword2);
        };

        cvat.server.requestPasswordReset.implementation = async (email) => {
            await serverProxy.server.requestPasswordReset(email);
        };

        cvat.server.resetPassword.implementation = async (newPassword1, newPassword2, uid, token) => {
            await serverProxy.server.resetPassword(newPassword1, newPassword2, uid, token);
        };

        cvat.server.authorized.implementation = async () => {
            const result = await serverProxy.server.authorized();
            return result;
        };

        cvat.server.request.implementation = async (url, data) => {
            const result = await serverProxy.server.request(url, data);
            return result;
        };

        cvat.server.installedApps.implementation = async () => {
            const result = await serverProxy.server.installedApps();
            return result;
        };

        cvat.users.get.implementation = async (filter) => {
            checkFilter(filter, {
                id: isInteger,
                is_active: isBoolean,
                self: isBoolean,
                search: isString,
                limit: isInteger,
            });

            let users = null;
            if ('self' in filter && filter.self) {
                users = await serverProxy.users.self();
                users = [users];
            } else {
                const searchParams = {};
                for (const key in filter) {
                    if (filter[key] && key !== 'self') {
                        searchParams[key] = filter[key];
                    }
                }
                users = await serverProxy.users.get(searchParams);
            }

            users = users.map((user) => new User(user));
            return users;
        };

        cvat.jobs.get.implementation = async (filter) => {
            checkFilter(filter, {
                page: isInteger,
                stage: isString,
                state: isString,
                assignee: isString,
                taskID: isInteger,
                jobID: isInteger,
            });

            if ('taskID' in filter && 'jobID' in filter) {
                throw new ArgumentError('Filter fields "taskID" and "jobID" are not permitted to be used at the same time');
            }

            if ('taskID' in filter) {
                const [task] = await serverProxy.tasks.get({ id: filter.taskID });
                if (task) {
                    return new Task(task).jobs;
                }

                return [];
            }

            if ('jobID' in filter) {
                const job = await serverProxy.jobs.get({ id: filter.jobID });
                if (job) {
                    return [new Job(job)];
                }
            }

            const jobsData = await serverProxy.jobs.get(filter);
            const jobs = jobsData.results.map((jobData) => new Job(jobData));
            jobs.count = jobsData.count;
            return jobs;
        };

        cvat.tasks.get.implementation = async (filter) => {
            checkFilter(filter, {
                page: isInteger,
                projectId: isInteger,
                name: isString,
                id: isInteger,
                owner: isString,
                assignee: isString,
                search: isString,
                ordering: isString,
                status: isEnum.bind(TaskStatus),
                mode: isEnum.bind(TaskMode),
                dimension: isEnum.bind(DimensionType),
            });

            checkExclusiveFields(filter, ['id', 'search', 'projectId'], ['page']);

            const searchParams = {};
            for (const field of [
                'name',
                'owner',
                'assignee',
                'search',
                'ordering',
                'status',
                'mode',
                'id',
                'page',
                'projectId',
                'dimension',
            ]) {
                if (Object.prototype.hasOwnProperty.call(filter, field)) {
                    searchParams[camelToSnake(field)] = filter[field];
                }
            }

            const tasksData = await serverProxy.tasks.get(searchParams);
            const tasks = tasksData.map((task) => new Task(task));

            tasks.count = tasksData.count;

            return tasks;
        };

        cvat.projects.get.implementation = async (filter) => {
            checkFilter(filter, {
                id: isInteger,
                page: isInteger,
                name: isString,
                assignee: isString,
                owner: isString,
                search: isString,
                status: isEnum.bind(TaskStatus),
            });

            checkExclusiveFields(filter, ['id', 'search'], ['page']);

            const searchParams = {};
            for (const field of ['name', 'assignee', 'owner', 'search', 'status', 'id', 'page']) {
                if (Object.prototype.hasOwnProperty.call(filter, field)) {
                    searchParams[camelToSnake(field)] = filter[field];
                }
            }

            const projectsData = await serverProxy.projects.get(searchParams);
            const projects = projectsData.map((project) => {
                project.task_ids = project.tasks;
                return project;
            }).map((project) => new Project(project));

            projects.count = projectsData.count;

            return projects;
        };

        cvat.projects.searchNames
            .implementation = async (search, limit) => serverProxy.projects.searchNames(search, limit);

        cvat.cloudStorages.get.implementation = async (filter) => {
            checkFilter(filter, {
                page: isInteger,
                displayName: isString,
                resourceName: isString,
                description: isString,
                id: isInteger,
                owner: isString,
                search: isString,
                providerType: isEnum.bind(CloudStorageProviderType),
                credentialsType: isEnum.bind(CloudStorageCredentialsType),
            });

            checkExclusiveFields(filter, ['id', 'search'], ['page']);

            const searchParams = new URLSearchParams();
            for (const field of [
                'displayName',
                'credentialsType',
                'providerType',
                'owner',
                'search',
                'id',
                'page',
                'description',
            ]) {
                if (Object.prototype.hasOwnProperty.call(filter, field)) {
                    searchParams.set(camelToSnake(field), filter[field]);
                }
            }

            if (Object.prototype.hasOwnProperty.call(filter, 'resourceName')) {
                searchParams.set('resource', filter.resourceName);
            }

            const cloudStoragesData = await serverProxy.cloudStorages.get(searchParams.toString());
            const cloudStorages = cloudStoragesData.map((cloudStorage) => new CloudStorage(cloudStorage));
            cloudStorages.count = cloudStoragesData.count;
            return cloudStorages;
        };

        cvat.organizations.get.implementation = async () => {
            const organizationsData = await serverProxy.organizations.get();
            const organizations = organizationsData.map((organizationData) => new Organization(organizationData));
            return organizations;
        };

        cvat.organizations.activate.implementation = (organization) => {
            checkObjectType('organization', organization, null, Organization);
            config.organizationID = organization.slug;
        };

        cvat.organizations.deactivate.implementation = async () => {
            config.organizationID = null;
        };

        // gamification stuff from here
        // user data

        cvat.gamifuserdata.get.implementation = async () => {
            const userdata = await serverProxy.gamifuserdata.get();
            return userdata;
        };

        cvat.gamifuserdata.save.implementation = async (data) => {
            const userdata = await serverProxy.gamifuserdata.save(data);
            return userdata;
        };

        cvat.gamifuserdata.getImageStatus.implementation = async (jobId) => {
            const status = await serverProxy.gamifuserdata.getImageStatus(jobId);
            return status;
        };

        cvat.gamifuserdata.saveImageStatus.implementation = async (userId, jobId, data) => {
            const result = await serverProxy.gamifuserdata.saveImageStatus(userId, jobId, data);
            return result;
        };

        // badges

        cvat.badges.get.implementation = async () => {
            const badges = await serverProxy.badges.get();
            return badges;
        };

        cvat.badges.getStatus.implementation = async () => {
            const badges = await serverProxy.badges.getStatus();
            return badges;
        };

        cvat.badges.save.implementation = async (userId, badgeId, tier) => {
            const badges = await serverProxy.badges.save(userId, badgeId, tier);
            return badges;
        };

        cvat.badges.saveSelected.implementation = async (userId, ids) => {
            const badges = await serverProxy.badges.saveSelected(userId, ids);
            return badges;
        };

        // challenges
        cvat.challenges.get.implementation = async () => {
            const challenges = await serverProxy.challenges.get();
            return challenges;
        };

        cvat.challenges.add.implementation = async () => {
            const challenges = await serverProxy.challenges.add();
            return challenges;
        };

        cvat.challenges.remove.implementation = async (userId, challengeId) => {
            const challenges = await serverProxy.challenges.remove(userId, challengeId);
            return challenges;
        };

        cvat.challenges.save.implementation = async (challenges) => {
            const saved = await serverProxy.challenges.save(challenges);
            return saved;
        };

        // energizer
        cvat.energizer.currentEnergy.implementation = async () => {
            const energy = await serverProxy.energizer.currentEnergy();
            return energy;
        };

        cvat.energizer.setEnergy.implementation = async (userId, newEnergy) => {
            const energy = await serverProxy.energizer.setEnergy(userId, newEnergy);
            return energy;
        };

        cvat.energizer.quizDuelQuestions.implementation = async () => {
            const questions = await serverProxy.energizer.quizDuelQuestions();
            return questions;
        };

        cvat.energizer.leaderboard.implementation = async (energizerName, time) => {
            const leaderboard = await serverProxy.energizer.leaderboard(energizerName, time);
            return leaderboard;
        };

        cvat.energizer.addScore.implementation = async (userId, energizerName, score) => {
            const leaderboard = await serverProxy.energizer.addScore(userId, energizerName, score);
            return leaderboard;
        };

        // shop

        cvat.shop.items.implementation = async () => {
            const items = await serverProxy.shop.items();
            return items;
        };

        cvat.shop.buy.implementation = async (itemId) => {
            const items = await serverProxy.shop.buy(itemId);
            return items;
        };

        cvat.shop.balance.implementation = async () => {
            const items = await serverProxy.shop.balance();
            return items;
        };

        cvat.shop.updateBalance.implementation = async (newBalance) => {
            const items = await serverProxy.shop.updateBalance(newBalance);
            return items;
        };

        // social

        cvat.social.friends.implementation = async () => {
            const friends = await serverProxy.social.friends();
            return friends;
        };

        cvat.social.saveProfileData.implementation = async (userId, data) => {
            const friends = await serverProxy.social.saveProfileData(userId, data);
            return friends;
        };

        cvat.social.chatHistory.implementation = async (user1Id, user2Id) => {
            const items = await serverProxy.social.chatHistory(user1Id, user2Id);
            return items;
        };

        cvat.social.sendMessage.implementation = async (senderId, receiverId, message) => {
            const items = await serverProxy.social.sendMessage(senderId, receiverId, message);
            return items;
        };

        cvat.social.getStatus.implementation = async () => {
            const status = await serverProxy.social.getStatus();
            return status;
        };

        cvat.social.setStatus.implementation = async (status) => {
            const newStatus = await serverProxy.social.setStatus(status);
            return newStatus;
        };

        // statistics

        cvat.statistics.get.implementation = async () => {
            const statistics = await serverProxy.statistics.get();
            return statistics;
        };

        cvat.statistics.set.implementation = async (statisticId, value) => {
            const statistic = await serverProxy.statistics.set(statisticId, value);
            return statistic;
        };

        cvat.statistics.quickStatistics.implementation = async () => {
            const statistic = await serverProxy.statistics.quickStatistics();
            return statistic;
        };

        cvat.statistics.setQuick.implementation = async (statisticId) => {
            const statistic = await serverProxy.statistics.setQuick(statisticId);
            return statistic;
        };

        cvat.gamiflogs.save.implementation = async (userId, event) => {
            const log = await serverProxy.gamiflogs.addLog(userId, event);
            return log;
        };

        return cvat;
    }

    module.exports = implementAPI;
})();
