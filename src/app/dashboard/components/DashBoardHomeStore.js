import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

import Promise from 'bluebird';

class DashboardHomeStore extends FluxStore {

    constructor(key, fluxContext, fluxController, initialData) {
        super(key, fluxContext, fluxController);
        this.data = Immutable.fromJS(initialData);
    }

    // initializeData(key, data) {
    //     console.log(`Key Sent -- ${key}`);
    //     // this.keyStr = key;
    //     this.data = this.data.set(key, Immutable.fromJS(data));
    //     console.log(JSON.stringify(this.data.toJS()));
    // }

    setData(data) {
        this.updateData(Immutable.fromJS(data), null, true);
    }

    hitTheServer() {
        console.log('Inside the server call api.');
        const dashBoardHomeData = this.data;

        const key = 'selected_data';
        const dataConcerned = dashBoardHomeData.get(key).toJS();

        return this.hitServerForSearchQueriesVisualization(dataConcerned);
    }

    noSuggestions() {
        console.log('Inside noSuggestion@DashboardHomeStore ');

        const actData = this.data.toJS();
        actData.summary = {};
        actData.real_data = [];

        return this.updateData(Immutable.fromJS(actData));
    }

    hitServerForSearchQueriesVisualization(data) {
        const requestTime = Date.now();
        console.log('We are inside hitServerForSearchQueriesVisualization ');

        const apiURL = '/analytics/api/dashboard/visualizationSearch';
        const postObj = {
            category: data.category,
            percentage: data.percentage,
            time_period: data.time_interval
        };

        const imageStr1 = '/prettySecrets/resources/images/User-agent.jpg';
        const imageStr2 = '/prettySecrets/resources/images/city.jpg';

        let baseURL = this.fluxController.appProperties.get('baseUrl');
        if (!baseURL) {
            baseURL = '';
        }
        return Promise.resolve(this.fluxContext.restClient.post(`${baseURL}${apiURL}`, postObj))
            .then((response) => {
                const totalTimeTaken = (Date.now() - requestTime);

                if (response && response.entity) { //
                    const dt = response.entity;

                    if (dt.code === 0) {
                        const chartData = dt.data;
                        const actData = this.data.toJS();

                        actData.summary.Total_Search_Queries = chartData.queries_count;
                        actData.summary.Average_Response_Time = Math.round(chartData.average_latency * 100) / 100;

                        const timePro = data.time_interval / 60;
                        let timeStr = '';
                        if (timePro < 24) {
                            timeStr = `last ${timePro} hour/s`;
                        } else if (timePro >= 24 && timePro < 168) {
                            const dayStr = timePro / 24;
                            timeStr = `last ${dayStr} day/s`;
                        } else if (timePro >= 168 && timePro < 720) {
                            const weekStr = timePro / (24 * 7);
                            timeStr = `last ${weekStr} week/s`;
                        } else {
                            const monthStr = timePro / (24 * 30);
                            timeStr = `last ${monthStr} week/s`;
                        }

                        actData.summary.Time_Period = timeStr;

                        const dataReal = chartData.bucket.map((dt1) => ({
                            name: dt1.key,
                            count: dt1.count,
                            image_1: imageStr1,
                            image_2: imageStr2

                        }));

                        actData.real_data = dataReal;
                        console.log('Just before call to update state', actData);
                        return this.updateData(Immutable.fromJS(actData));
                    }
                    console.log('Some problem in the server. Contact Admin.');
                    return this.noSuggestions();
                }
                return this.noSuggestions();
            })
            .catch((e) => {
                console.log('Some exception occured --- ', e);
                this.noSuggestions();
            });
    }
}

export default DashboardHomeStore;